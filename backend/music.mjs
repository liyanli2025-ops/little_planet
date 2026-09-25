import {randomUUID} from 'node:crypto';
import {fail,hash} from './store.mjs';
const safeURL=(value,host)=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname===host||u.hostname.endsWith('.'+host))?u.href:''}catch{return ''}};
export function createMusicService(store,{fetcher=fetch}={}){
 const db=store.db;
 db.exec(`CREATE TABLE IF NOT EXISTS fm_tracks(id TEXT PRIMARY KEY,value TEXT NOT NULL,updated INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS fm_hearts(slot INTEGER NOT NULL REFERENCES users(slot),track TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(slot,track));
 CREATE TABLE IF NOT EXISTS fm_gifts(id TEXT PRIMARY KEY,sender INTEGER NOT NULL,recipient INTEGER NOT NULL,track TEXT NOT NULL,message TEXT NOT NULL,created INTEGER NOT NULL);`);
 const key=()=>db.prepare("SELECT value FROM settings WHERE key='jamendo_client_id'").get()?.value||process.env.JAMENDO_CLIENT_ID||'';
 const manager=slot=>db.prepare('SELECT slot FROM users ORDER BY created,slot LIMIT 1').get()?.slot===slot;
 const saved=id=>{const r=db.prepare('SELECT value,updated FROM fm_tracks WHERE id=?').get(id);return r?{...JSON.parse(r.value),updated:r.updated}:null};
 const publicTrack=t=>{if(!t)return null;const {audio,updated,...rest}=t;return rest};
 function view(slot){return {configured:!!key(),canConfigure:manager(slot),hearts:db.prepare('SELECT track FROM fm_hearts WHERE slot=? ORDER BY created DESC').all(slot).map(x=>x.track),gifts:store.get(slot).paired?db.prepare('SELECT * FROM fm_gifts WHERE recipient=? ORDER BY created DESC LIMIT 100').all(slot).map(x=>({...x,song:publicTrack(saved(x.track))})):[]}}
 function normal(x){const id=String(x.id);if(!/^\d{1,16}$/.test(id))return null;const audio=safeURL(x.audio,'jamendo.com');if(!audio)return null;return {id,title:String(x.name||'未命名歌曲').slice(0,160),artist:String(x.artist_name||'未知音乐人').slice(0,160),cover:safeURL(x.image||x.album_image,'jamendo.com'),url:'https://www.jamendo.com/track/'+id,license:safeURL(x.license_ccurl,'creativecommons.org'),duration:Number.isFinite(Number(x.duration))?Math.max(0,Number(x.duration)):0,audio}}
 const remember=tracks=>store.transaction(()=>{const put=db.prepare('INSERT INTO fm_tracks VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated=excluded.updated');for(const t of tracks)put.run(t.id,JSON.stringify(t),Date.now());db.exec("DELETE FROM fm_tracks WHERE id NOT IN (SELECT track FROM fm_hearts UNION SELECT track FROM fm_gifts) AND id NOT IN (SELECT id FROM fm_tracks ORDER BY updated DESC LIMIT 500)");});
 async function query(client,params){
  fail(client,'请先在音乐设置中填写阿球的 Jamendo Client ID',503);
  const url=new URL('https://api.jamendo.com/v3.0/tracks/');url.search=new URLSearchParams({client_id:client,format:'json',audioformat:'mp31',imagesize:'400',include:'licenses',...params});
  try{const r=await fetcher(url.href,{redirect:'error',signal:AbortSignal.timeout(10000)});fail(r.ok,'暂时连接不到 Jamendo，请稍后重试',502);let n=0,chunks=[];for await(const c of r.body){n+=c.length;fail(n<2000000,'音乐服务返回数据过大',502);chunks.push(c)}const data=JSON.parse(Buffer.concat(chunks));fail(data.headers?.status==='success'&&Array.isArray(data.results),'Jamendo 凭证不可用或服务暂时异常，请检查音乐设置',502);return data.results.map(normal).filter(Boolean)}catch(e){if(e.status)throw e;fail(false,'暂时连接不到 Jamendo，请稍后重试',502)}
 }
 let discovery=null,inflight=null;
 async function list(slot,mode='discover'){
  fail(['discover','hearts','gifts'].includes(mode),'频道不存在');const v=view(slot);
  if(mode==='hearts')return {...v,tracks:v.hearts.map(id=>publicTrack(saved(id))).filter(Boolean)};
  if(mode==='gifts')return {...v,tracks:v.gifts.map(x=>x.song).filter(Boolean)};
  if(!v.configured)return {...v,tracks:[]};
  if(!discovery||Date.now()-discovery.at>600000){if(!inflight){const client=key();inflight=query(client,{limit:'50',order:'popularity_month',offset:String(Math.floor(Math.random()*4)*50)}).then(tracks=>{fail(client===key(),'音乐设置已改变，请重试',409);fail(tracks.length,'暂时没有可播放歌曲',502);remember(tracks);discovery={at:Date.now(),tracks};}).finally(()=>inflight=null)}await inflight;}
  return {...view(slot),tracks:discovery.tracks.map(publicTrack)};
 }
 async function track(slot,id){fail(/^\d{1,16}$/.test(id),'歌曲编号不正确');let t=saved(id);if(!t||Date.now()-t.updated>300000){const client=key(),tracks=await query(client,{id,limit:'1'});fail(client===key(),'音乐设置已改变，请重试',409);t=tracks.find(x=>x.id===id);fail(t,'这首歌暂时无法播放，试试下一首',404);remember([t]);}return {track:t}}
 async function configure(slot,b){fail(manager(slot),'只有第一位住户可以设置音乐来源',403);fail(typeof b.clientId==='string'&&/^[a-zA-Z0-9_-]{6,128}$/.test(b.clientId.trim()),'请填写应用的 Client ID');const client=b.clientId.trim();const tracks=await query(client,{limit:'1'});fail(tracks.length,'这个应用暂时未返回可播放歌曲',502);db.prepare("INSERT INTO settings VALUES('jamendo_client_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(client);remember(tracks);discovery=null;return {...store.get(slot),...view(slot)}}
 function mutate(slot,b){return store.transaction(()=>{
  fail(b&&typeof b.command==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(b.command),'互动请求不正确');const digest=hash(JSON.stringify(b)),receipt=db.prepare('SELECT digest FROM receipts WHERE slot=? AND command=?').get(slot,b.command);if(receipt){fail(receipt.digest===digest,'重复请求内容不同',409);return {...store.get(slot),...view(slot)}};
  const row=store.read();fail(b.revision===row.revision,'存档刚更新，请重试',409);const t=saved(b.id);fail(t,'请重新载入这首歌',404);
  if(b.action==='heart'){fail(typeof b.liked==='boolean','请选择收藏状态');if(b.liked){fail(db.prepare('SELECT COUNT(*) AS n FROM fm_hearts WHERE slot=?').get(slot).n<1500,'红心收藏已满');db.prepare('INSERT OR IGNORE INTO fm_hearts VALUES(?,?,?)').run(slot,t.id,Date.now())}else db.prepare('DELETE FROM fm_hearts WHERE slot=? AND track=?').run(slot,t.id);}
  else if(b.action==='gift'){
   fail(row.paired,'请先配对，再把这首歌留给对方',403);fail(typeof b.message==='string'&&b.message.length<=500,'留言最多 500 字');fail(row.state.events.length<5000,'手账已满，请先整理');fail(db.prepare('SELECT COUNT(*) AS n FROM fm_gifts').get().n<3000,'留歌唱片已满');const now=Date.now();db.prepare('INSERT INTO fm_gifts VALUES(?,?,?,?,?,?)').run(randomUUID(),slot,1-slot,t.id,b.message.trim(),now);
   row.state.events.unshift({id:randomUUID(),actor:slot,world:1-slot,target:1-slot,title:'留了一首《'+t.title.slice(0,120)+'》',body:b.message.trim()||'这首歌，想让你也听见。',shared:true,pending:false,kind:'life',created:now,weather:'阿球 FM · Jamendo',steps:[],comments:[]});
  }else fail(false,'操作不存在');
  db.prepare('UPDATE saves SET revision=revision+1,state=? WHERE id=1').run(JSON.stringify(row.state));db.prepare('INSERT INTO receipts VALUES(?,?,?,?)').run(slot,b.command,digest,Date.now());return {...store.get(slot),...view(slot)};
 })}
 return {view,list,track,configure,mutate};
}
