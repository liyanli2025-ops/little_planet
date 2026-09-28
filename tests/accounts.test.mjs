import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';import {backup,DatabaseSync} from 'node:sqlite';import {openAccounts} from '../backend/accounts.mjs';
function setup(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-accounts-')),file=path.join(dir,'state.sqlite'),h=openAccounts(file);return {h,file,close(){h.db.close();fs.rmSync(dir,{recursive:true,force:true})}}}
function pair(h,a,b){return h.accept(b.id,h.invite(a.id).code,a.id)}
test('pairing and unlink move books, credentials, weather and hearts with the owner, not the slot',async()=>{
 const f=setup(),h=f.h;try{
 let a=h.register('alice','s','p',0),b=h.register('bobby','s','p',0),c=h.register('carol','s','p',1),s=h.space(a.space),id=randomUUID();
 s.store.db.prepare('INSERT INTO media_items VALUES(?,?)').run(id,JSON.stringify({id,owner:a.slot,addedBy:a.slot,kind:'book',title:'Private Book',shared:false,source:'weread',shareProgress:false}));
 s.store.db.prepare('INSERT INTO weread_bindings VALUES(?,?,?)').run(a.slot,'wrk-secret-alice',123);
 s.store.db.prepare('INSERT INTO fm_tracks VALUES(?,?,?)').run('qq:test',JSON.stringify({id:'qq:test',title:'Heart',provider:'qq'}),123);
 s.store.db.prepare('INSERT INTO fm_hearts VALUES(?,?,?)').run(a.slot,'qq:test',123);
 s.weatherService.configure(a.slot,{mode:'manual',location:{label:'北京',latitude:39.9,longitude:116.4}});
 const meal={id:randomUUID(),recipe:'omelet',owner:0,event:randomUUID(),together:false,servedAt:Date.now()};let row=s.store.read();row.state.worlds[0].meals.push(meal);s.store.db.prepare('UPDATE saves SET state=? WHERE id=1').run(JSON.stringify(row.state));
 pair(h,a,b);a=h.account(a.id);b=h.account(b.id);assert.equal(a.slot,1);s=h.space(a.space);assert.equal(s.store.get(a.slot).state.worlds[a.slot].theme,0);const planted=s.store.get(a.slot);s.store.life(a.slot,{type:'plant',world:a.slot,plot:0,crop:'rose',revision:planted.revision,command:randomUUID()});
 assert.equal(s.mediaService.view(a.slot).binding.connected,true);assert.equal(s.mediaService.view(b.slot).binding.connected,false);assert.equal(s.mediaService.view(b.slot).items.length,0);
 assert.deepEqual(s.musicService.view(a.slot).hearts,['qq:test']);assert.deepEqual(s.musicService.view(b.slot).hearts,[]);
 assert.equal((await s.weatherService.get(a.slot,true)).worlds[a.slot].location.label,'北京');assert.equal(s.store.get(a.slot).state.worlds[a.slot].meals[0].servedAt,meal.servedAt);
 h.unlink(a.id);a=h.account(a.id);b=h.account(b.id);pair(h,a,c);a=h.account(a.id);c=h.account(c.id);s=h.space(a.space);
 assert.equal(s.mediaService.view(a.slot).binding.connected,true);assert.equal(s.mediaService.view(c.slot).binding.connected,false);assert.equal(s.mediaService.view(c.slot).items.length,0);assert.equal(h.space(b.space).mediaService.view(b.slot).binding.connected,false);
 assert.equal(h.db.prepare('PRAGMA foreign_key_check').all().length,0);
 const copy=path.join(path.dirname(f.file),'backup.sqlite');await backup(h.db,copy);const db=new DatabaseSync(copy);assert.equal(db.prepare('SELECT COUNT(*) n FROM accounts').get().n,3);assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');db.close();
 }finally{f.close()}
});
test('expired and rotated invitations fail; interrupted migrations roll back both accounts',()=>{const f=setup(),h=f.h;try{
 const a=h.register('alice','s','p',0),b=h.register('bobby','s','p',1),code=h.invite(a.id).code;h.db.prepare('UPDATE account_invites SET expires=0').run();assert.throws(()=>h.preview(b.id,code),/过期/);
 const next=h.invite(a.id).code,s=h.space(b.space);s.store.db.prepare('INSERT INTO media_items VALUES(?,?)').run('broken','{bad');assert.throws(()=>h.accept(b.id,next,a.id));assert.equal(h.account(a.id).space,a.space);assert.equal(h.account(b.id).space,b.space);assert.equal(h.partner(a),null);assert.equal(h.preview(b.id,next).username,'alice');
 s.store.db.prepare('DELETE FROM media_items WHERE id=?').run('broken');pair(h,a,b);assert.ok(h.partner(h.account(a.id)));
 }finally{f.close()}});

test('Chinese nicknames are validated and follow accounts through pairing, unlink and restart',()=>{const f=setup(),h=f.h;try{let a=h.register('alice','salt','hash',0,'小满'),b=h.register('bobby','salt','hash',0,'晚风');assert.equal(a.nickname,'小满');for(const bad of ['', '   ', '<img src=x>', 'a'.repeat(17)])assert.throws(()=>h.profile(a.id,bad),/昵称/);h.profile(a.id,'阿球 · 小满');assert.equal(h.account(a.id).username,'alice');assert.equal(h.preview(b.id,h.invite(a.id).code).nickname,'阿球 · 小满');pair(h,a,b);a=h.account(a.id);assert.equal(h.displayNames(a)[a.slot],'阿球 · 小满');assert.equal(h.space(a.space).store.displayName(a.slot),'阿球 · 小满');h.unlink(a.id);a=h.account(a.id);assert.equal(a.nickname,'阿球 · 小满');h.db.close();const reopened=openAccounts(f.file);assert.equal(reopened.account(a.id).nickname,'阿球 · 小满');assert.equal(reopened.account(b.id).nickname,'晚风');reopened.db.close()}finally{try{f.close()}catch{fs.rmSync(path.dirname(f.file),{recursive:true,force:true})}}});
