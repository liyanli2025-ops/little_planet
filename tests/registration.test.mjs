
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {scryptSync,randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {openStore} from '../backend/store.mjs';
async function start(file,legacy=''){
 const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));
 const port=socket.address().port;await new Promise(r=>socket.close(r));
 const origin='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,['backend/server.mjs'],{env:{...process.env,PORT:String(port),PUBLIC_ORIGIN:origin,REGISTRATION_CODE:legacy,DATABASE_PATH:file},stdio:['ignore','pipe','pipe']});
 let logs='';child.stderr.on('data',c=>logs+=c);child.stdout.on('data',c=>logs+=c);
 async function close(){if(child.exitCode!==null)return;const p=new Promise(r=>child.once('exit',r));child.kill();await p}
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,50))}assert.ok(ready,logs);
 }catch(e){await close();throw e}
 async function request(route,data,auth={}){
  const res=await fetch(origin+route,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json',Origin:origin}),...(auth.cookie?{Cookie:auth.cookie}:{}),...(auth.csrf?{'X-CSRF-Token':auth.csrf,'X-Planet-Space':String(auth.space)}:{})},body:data===undefined?undefined:JSON.stringify(data)});
  const body=await res.json();return {status:res.status,body,cookie:res.headers.get('set-cookie')?.split(';')[0],csrf:body.csrf,space:body.space};
 }
 return {request,close};
}
const signup=(username,actor,code,setup)=>({username,password:'test-password-123',actor,code,setup});
test('many accounts can register with either avatar; pairing confirmation, rotation, isolation and stale writes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-multi-')),server=await start(path.join(dir,'state.sqlite'));
 try{
 const users=[];for(const username of ['alice','bobby','carol','david']){const r=await server.request('/api/register',signup(username,0));assert.equal(r.status,201,JSON.stringify(r.body));users.push(r)}
 const [a,b,c,d]=users;
 assert.equal((await server.request('/api/register',signup('alice',1))).status,409);
 assert.equal((await server.request('/api/login',{username:'alice',password:'wrong-password-123'})).status,401);
 const old=await server.request('/api/invite',{},a),next=await server.request('/api/invite',{},a);
 assert.equal((await server.request('/api/pair/preview',{code:old.body.code},b)).status,400);
 assert.equal((await server.request('/api/pair/preview',{code:next.body.code},a)).status,400);
 const preview=await server.request('/api/pair/preview',{code:' '+next.body.code.toUpperCase()+'\n'},b);assert.equal(preview.body.username,'alice');
 assert.equal((await server.request('/api/pair',{code:next.body.code},b)).status,409);
 const results=await Promise.all([b,c].map(u=>server.request('/api/pair',{code:next.body.code,partnerId:a.body.accountId},u)));
 assert.equal(results.filter(r=>r.status===200).length,1);
 const winner=results[0].status===200?b:c,loser=winner===b?c:b;
 const info=await server.request('/api/session',undefined,a);assert.equal(info.body.partner,winner.body.username);assert.deepEqual(info.body.avatars,[0,0]);
 assert.equal((await server.request('/api/session',undefined,loser)).body.paired,false);
 assert.equal((await server.request('/api/invite',{},a)).status,409); // stale space header
 a.space=info.body.space;winner.space=a.space;
 assert.equal((await server.request('/api/invite',{},a)).status,409); // already bound
 const v=(await server.request('/api/state',undefined,a)).body;
 v.state.notes.push({id:randomUUID(),actor:v.actor,world:v.actor,title:'只给这段关系',body:'私密共同内容',date:'2026-09-28',kind:'memory',shared:true,repeat:false,created:Date.now(),weather:'晴',comments:[]});
 assert.equal((await server.request('/api/state',{state:v.state,revision:v.revision,command:randomUUID()},a)).status,200);
 assert.equal((await server.request('/api/state',undefined,winner)).body.state.notes.length,1);
 assert.equal((await server.request('/api/state',undefined,d)).body.state.notes.length,0);
 assert.equal((await server.request('/api/unpair',{},a)).status,200);
 assert.equal((await server.request('/api/state',{state:v.state,revision:v.revision,command:randomUUID()},winner)).status,409);
 for(const u of [a,winner]){const i=(await server.request('/api/session',undefined,u)).body;assert.equal(i.paired,false);u.space=i.space}
 const archive=(await server.request('/api/account/history',undefined,a)).body;assert.ok(archive.archives.some(x=>x.state.notes.some(n=>n.body==='私密共同内容')));
 assert.equal((await server.request('/api/account/history',undefined,d)).body.archives.length,0);
 const invite=(await server.request('/api/invite',{},a)).body;
 assert.equal((await server.request('/api/pair',{code:invite.code,partnerId:a.body.accountId},d)).status,200);
 assert.equal((await server.request('/api/state',undefined,d)).body.state.notes.length,0);
 assert.equal((await server.request('/api/session',undefined,winner)).body.paired,false);
 }finally{await server.close();fs.rmSync(dir,{recursive:true,force:true})}
});

test('legacy paired accounts, password, personal world and relationship survive upgrade and restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-migrate-')),file=path.join(dir,'state.sqlite'),old=openStore(file),salt='old-salt';
 for(const slot of [0,1])old.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(slot,'legacy'+slot,salt,scryptSync('test-password-123',salt,64).toString('hex'),123);
 old.accept(1,old.invite(0).code);const v=old.get(0);v.state.worlds[0].deco=true;old.save(0,{state:v.state,revision:v.revision,command:randomUUID()});old.db.close();
 let server=await start(file);
 try{for(let i=0;i<2;i++){const a=await server.request('/api/login',{username:'legacy0',password:'test-password-123'});assert.equal(a.status,200);assert.equal(a.body.paired,true);assert.equal(a.body.partner,'legacy1');assert.equal(a.body.state.worlds[0].deco,true);if(i===0){await server.close();server=await start(file)}}
 const db=new DatabaseSync(file);assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(db.prepare('PRAGMA user_version').get().user_version,3);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n,2);db.close();
 }finally{await server.close();fs.rmSync(dir,{recursive:true,force:true})}
});

test('legacy unpaired users are not silently bound during migration',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-unpaired-')),file=path.join(dir,'state.sqlite'),old=openStore(file),salt='old-salt';for(const slot of [0,1])old.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(slot,'legacy'+slot,salt,scryptSync('test-password-123',salt,64).toString('hex'),123);old.db.close();const server=await start(file);
 try{const a=await server.request('/api/login',{username:'legacy0',password:'test-password-123'}),b=await server.request('/api/login',{username:'legacy1',password:'test-password-123'});assert.equal(a.body.paired,false);assert.equal(b.body.paired,false);assert.notEqual(a.space,b.space)}finally{await server.close();fs.rmSync(dir,{recursive:true,force:true})}
});

test('live presence requires authentication, CSRF and current pairing, and cannot impersonate a peer',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-live-api-')),s=await start(path.join(dir,'state.sqlite'));
 try{let a=await s.request('/api/register',signup('livealice',0)),b=await s.request('/api/register',signup('livebobby',1)),c=await s.request('/api/register',signup('livecarol',0));
 const invitation=await s.request('/api/invite',{},a);await s.request('/api/pair',{code:invitation.body.code,partnerId:a.body.accountId},b);
 for(const u of [a,b]){const v=await s.request('/api/session',undefined,u);u.space=v.body.space;u.csrf=v.body.csrf}
 const pose={world:0,room:false,floor:0,position:[0,6,0],quaternion:[0,0,0,1],bodyPosition:[0,0,0],bodyRotation:[0,0,0],arms:[[0,0,0],[0,0,0]],legs:[[0,0,0],[0,0,0]]};
 assert.equal((await s.request('/api/presence',pose)).status,401);
 assert.equal((await s.request('/api/presence',pose,{...a,csrf:'bad'})).status,403);
 assert.equal((await s.request('/api/presence',{...pose,world:1},c)).status,403);
 assert.equal((await s.request('/api/presence',{...pose,accountId:a.body.accountId,identity:0},b)).status,200);
 let v=await s.request('/api/presence',pose,a);assert.equal(v.body.peer.identity,1);assert.equal(v.body.peer.actor,1);
 assert.equal((await s.request('/api/presence',pose,c)).body.peer,null);
 await s.request('/api/travel',{action:'depart'},b);assert.equal((await s.request('/api/presence',pose,a)).body.peer,null);
 await s.request('/api/unpair',{},a);assert.equal((await s.request('/api/presence',pose,b)).status,409);
 }finally{await s.close();fs.rmSync(dir,{recursive:true,force:true})}
});
