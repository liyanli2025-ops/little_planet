// Account identities are global. Each active pair has an isolated two-world space;
// the existing life/media validators operate only within that space.
import {openStore,fail,hash} from './store.mjs';
import {createMediaService} from './media.mjs';
import {createMusicService} from './music.mjs';
import {createWeatherService} from './weather.mjs';
import {randomBytes} from 'node:crypto';
const tables=['settings','users','sessions','invitations','saves','receipts','media_items','weread_bindings','fm_tracks','fm_hearts','fm_gifts'];
const clone=v=>JSON.parse(JSON.stringify(v));
export function openAccounts(filename){
 const legacy=openStore(filename),db=legacy.db,cache=new Map();
 db.exec(`CREATE TABLE IF NOT EXISTS account_spaces(id INTEGER PRIMARY KEY, active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password TEXT NOT NULL,created INTEGER NOT NULL,avatar INTEGER NOT NULL CHECK(avatar IN(0,1)),space INTEGER NOT NULL REFERENCES account_spaces(id),slot INTEGER NOT NULL CHECK(slot IN(0,1)),UNIQUE(space,slot));
 CREATE TABLE IF NOT EXISTS account_sessions(token TEXT PRIMARY KEY,account INTEGER NOT NULL REFERENCES accounts(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS account_invites(token TEXT PRIMARY KEY,account INTEGER NOT NULL UNIQUE REFERENCES accounts(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS account_archives(account INTEGER NOT NULL REFERENCES accounts(id),space INTEGER NOT NULL,created INTEGER NOT NULL,value TEXT NOT NULL,PRIMARY KEY(account,space));`);
 function transaction(fn){db.exec('BEGIN IMMEDIATE');try{let v=fn();db.exec('COMMIT');return v}catch(e){db.exec('ROLLBACK');for(const k of cache.keys())if(k!==0)cache.delete(k);throw e}}
 function space(id){
  if(cache.has(id))return cache.get(id);
  const prefix=id===0?'':`s${Number(id)}_`;
  const sql=q=>q.replace(/'[^']*(?:''[^']*)*'|\b[a-z_]+\b/g,t=>tables.includes(t)?prefix+t:t);
  let depth=0;
  const adapter={prepare(q){return db.prepare(sql(q))},exec(q){
   if(/^\s*PRAGMA journal_mode/.test(q))q=q.replace(/PRAGMA[^;]+;/g,'');
   if(q==='BEGIN IMMEDIATE'){fail(db.prepare('SELECT active FROM account_spaces WHERE id=?').get(id)?.active,'配对状态已更新，请刷新后重试',409);if(db.isTransaction){depth++;return}}
   if((q==='COMMIT'||q==='ROLLBACK')&&depth){depth--;return}
   return db.exec(sql(q));
  }};
  const store=id===0?legacy:openStore(filename,adapter);
  // Guard mutations from upstream requests which finish after unlink/re-pair.
  const original=store.transaction;store.transaction=fn=>{fail(db.prepare('SELECT active FROM account_spaces WHERE id=?').get(id)?.active,'配对状态已更新，请刷新后重试',409);return original(fn)};
  const value={store,mediaService:createMediaService(store),musicService:createMusicService(store),weatherService:createWeatherService(store.db)};cache.set(id,value);return value;
 }
 transaction(()=>{
  if(!db.prepare('SELECT id FROM account_spaces WHERE id=0').get()){
   db.prepare('INSERT INTO account_spaces(id) VALUES(0)').run();
   for(const u of db.prepare('SELECT * FROM users').all())db.prepare('INSERT INTO accounts(id,username,salt,password,created,avatar,space,slot) VALUES(?,?,?,?,?,?,0,?)').run(u.slot+1,u.username,u.salt,u.password,u.created,u.slot,u.slot);
   db.exec('INSERT INTO account_sessions SELECT token,slot+1,csrf,expires FROM sessions');
   // Legacy invitations are invalidated once, because identity semantics changed.
   db.exec('DELETE FROM invitations');
  }
 });space(0);
 const account=id=>db.prepare('SELECT * FROM accounts WHERE id=?').get(id);
 const partner=u=>db.prepare('SELECT id,username,avatar FROM accounts WHERE space=? AND id<>?').get(u.space,u.id)||null;
 function makeSpace(){const id=Number(db.prepare('INSERT INTO account_spaces DEFAULT VALUES').run().lastInsertRowid);return {id,...space(id)}}
 function localUser(dest,u,slot){dest.store.db.prepare('INSERT INTO users(slot,username,salt,password,created) VALUES(?,?,?,?,?)').run(slot,u.username,u.salt,u.password,u.created)}
 function register(username,salt,password,avatar){return transaction(()=>{
  fail(!db.prepare('SELECT id FROM accounts WHERE username=?').get(username),'这个账号名已被使用',409);
  const dest=makeSpace(),created=Date.now();const id=Number(db.prepare('INSERT INTO accounts(username,salt,password,created,avatar,space,slot) VALUES(?,?,?,?,?,?,?)').run(username,salt,password,created,avatar,dest.id,avatar).lastInsertRowid);
  localUser(dest,{username,salt,password,created},avatar);return account(id);
 })}
 function snapshot(u){const src=space(u.space),v=src.store.get(u.slot);return {state:v.state,media:src.mediaService.view(u.slot).items,music:src.musicService.view(u.slot),username:u.username,slot:u.slot}}
 // Keep relationship history readable/exportable by its original owner. It is
 // never inserted into a future partner's shared journal.
 function archive(u){db.prepare('INSERT OR IGNORE INTO account_archives VALUES(?,?,?,?)').run(u.id,u.space,Date.now(),JSON.stringify(snapshot(u)))}
 function copyPersonal(u,dest,slot){
  localUser(dest,u,slot);
  const src=space(u.space),old=src.store.read().state,own=u.slot,other=1-own,newOther=1-slot;
  const map=v=>v===own?slot:v===other?newOther:v;
  function remap(v){if(Array.isArray(v))return v.map(remap);if(!v||typeof v!=='object')return v;return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,['actor','world','target','owner','addedBy','sender','recipient'].includes(k)&&[0,1].includes(x)?map(x):remap(x)]))}
  const row=dest.store.read(),state=row.state;
  state.worlds[slot]=remap(clone(old.worlds[own]));state.bags[slot]=clone(old.bags[own]);state.favorites[slot]=clone(old.favorites[own]);
  // Only solo records continue into a new relationship. All other personal and
  // shared records remain intact in the owner-specific archive.
  for(const key of ['events','notes'])state[key].push(...old[key].filter(x=>x.actor===own&&x.world===own&&!x.shared&&(x.target==null||x.target===own)&&x.comments.every(c=>c.actor===own)).map(remap));
  // Gifts from an earlier relationship become ordinary food owned by the holder.
  for(const f of state.worlds[slot].fridge)delete f.event;
  for(const m of state.worlds[slot].meals)m.owner=slot;
  dest.store.db.prepare('UPDATE saves SET state=? WHERE id=1').run(JSON.stringify(state));
  for(const r of src.store.db.prepare('SELECT value FROM media_items').all()){
   const item=JSON.parse(r.value);if(item.owner!==own)continue;const next=remap(item);next.shared=false;next.shareProgress=false;next.addedBy=slot;dest.store.db.prepare('INSERT OR IGNORE INTO media_items VALUES(?,?)').run(next.id,JSON.stringify(next));
  }
  const binding=src.store.db.prepare('SELECT * FROM weread_bindings WHERE slot=?').get(own);if(binding)dest.store.db.prepare('INSERT INTO weread_bindings VALUES(?,?,?)').run(slot,binding.credential,binding.synced);
  const env=src.store.db.prepare('SELECT value FROM settings WHERE key=?').get('environment:'+own);if(env)dest.store.db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('environment:'+slot,env.value);
  for(const t of src.store.db.prepare('SELECT * FROM fm_tracks').all())dest.store.db.prepare('INSERT OR IGNORE INTO fm_tracks VALUES(?,?,?)').run(t.id,t.value,t.updated);
  for(const h of src.store.db.prepare('SELECT * FROM fm_hearts WHERE slot=?').all(own))dest.store.db.prepare('INSERT INTO fm_hearts VALUES(?,?,?)').run(slot,h.track,h.created);
  db.prepare('UPDATE accounts SET space=?,slot=? WHERE id=?').run(dest.id,slot,u.id);
 }
 function invite(id){return transaction(()=>{const u=account(id);fail(!partner(u),'请先解除现有绑定',409);const code=randomBytes(18).toString('hex'),expires=Date.now()+86400000;db.prepare('DELETE FROM account_invites WHERE account=? OR expires<?').run(id,Date.now());db.prepare('INSERT INTO account_invites VALUES(?,?,?)').run(hash(code),id,expires);return {code,expires}})}
 function invitation(id,code){
  code=typeof code==='string'?code.trim().toLowerCase():'';fail(/^[a-f0-9]{36}$/.test(code),'请粘贴对方生成的 36 位配对码');
  const inv=db.prepare('SELECT * FROM account_invites WHERE token=?').get(hash(code));fail(inv,'配对码无效、已使用或已被新码替换');fail(inv.expires>Date.now(),'配对码已过期，请让对方重新生成');fail(inv.account!==id,'这是你自己的配对码，请交给对方输入');
  const a=account(id),b=account(inv.account);fail(!partner(a),'你已经绑定了另一位住户，请先解绑',409);fail(!partner(b),'对方已经绑定了另一位住户',409);return {a,b};
 }
 function preview(id,code){const {b}=invitation(id,code);return {id:b.id,username:b.username,avatar:b.avatar}}
 function accept(id,code,expected){return transaction(()=>{const {a,b}=invitation(id,code);fail(b.id===expected,'请先确认要连接的账号',409);archive(a);archive(b);const dest=makeSpace();copyPersonal(a,dest,a.avatar);copyPersonal(b,dest,1-a.avatar);dest.store.db.exec('UPDATE saves SET paired=1,revision=revision+1 WHERE id=1');for(const u of [a,b]){db.prepare('DELETE FROM account_invites WHERE account=?').run(u.id);retire(u.space)}return account(id)})}
 function retire(id){if(!db.prepare('SELECT id FROM accounts WHERE space=?').get(id))db.prepare('UPDATE account_spaces SET active=0 WHERE id=?').run(id)}
 function unlink(id){return transaction(()=>{const a=account(id),p=partner(a);fail(p,'当前没有绑定',409);const b=account(p.id);archive(a);archive(b);for(const u of [a,b]){const dest=makeSpace();copyPersonal(u,dest,u.avatar);db.prepare('DELETE FROM account_invites WHERE account=?').run(u.id)}retire(a.space);return account(id)})}
 function archives(id){return db.prepare('SELECT space,created,value FROM account_archives WHERE account=? ORDER BY created DESC').all(id).map(x=>({space:x.space,created:x.created,...JSON.parse(x.value)}))}
 function expireMeals(){for(const r of db.prepare('SELECT id FROM account_spaces WHERE active=1').all())space(r.id).store.expireMeals()}
 // Split legacy unpaired residents before serving requests; no implicit binding.
 if(!legacy.read().paired){const old=db.prepare('SELECT * FROM accounts WHERE space=0').all();if(old.length>1)transaction(()=>{for(const u of old){archive(u);const dest=makeSpace();copyPersonal(u,dest,u.avatar)}retire(0)})}
 db.exec('PRAGMA user_version=3');
 return {db,account,partner,space,register,invite,preview,accept,unlink,archives,expireMeals};
}
