
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
  const res=await fetch(origin+route,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json',Origin:origin}),...(auth.cookie?{Cookie:auth.cookie}:{}),...(auth.csrf?{'X-CSRF-Token':auth.csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});
  const body=await res.json();return {status:res.status,body,cookie:res.headers.get('set-cookie')?.split(';')[0],csrf:body.csrf};
 }
 return {request,close};
}
const signup=(username,actor,code,setup)=>({username,password:'test-password-123',actor,code,setup});
test('first resident chooses the code; restart preserves it and wrong codes cannot join',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-code-')),file=path.join(dir,'state.sqlite');
 let server=await start(file);
 try{
  assert.equal((await server.request('/api/session')).body.registration.first,true);
  assert.equal((await server.request('/api/register',signup('first',1,'abc',true))).status,400);
  const a=await server.request('/api/register',signup('first',1,'SweetTea8',true));
  assert.equal(a.status,201);assert.equal(a.body.registration.canManage,true);assert.equal(a.body.actor,1);
  assert.equal((await server.request('/api/join-code',{code:'NewTea8'})).status,401);
  assert.equal((await server.request('/api/join-code',{code:'NewTea8'},{cookie:a.cookie})).status,403);
  assert.equal((await server.request('/api/join-code',{code:'NewTea8'},a)).status,200);
  await server.close();server=await start(file);
  assert.equal((await server.request('/api/session')).body.registration.first,false);
  assert.equal((await server.request('/api/register',signup('second',0,'SweetTea8',false))).status,403);
  assert.equal((await server.request('/api/register',signup('second',0,'NewTea8',true))).status,409);
  const b=await server.request('/api/register',signup('second',0,'NewTea8',false));
  assert.equal(b.status,201);assert.equal(b.body.registration.canManage,false);assert.equal(b.body.registration.full,true);
  assert.equal((await server.request('/api/join-code',{code:'Hacked8'},b)).status,403);
  assert.equal((await server.request('/api/register',signup('third',0,'NewTea8',false))).status,409);
  const db=new DatabaseSync(file);const encoded=db.prepare("SELECT value FROM settings WHERE key='join_code'").get().value;
  assert.ok(!encoded.includes('NewTea8'));assert.equal(JSON.parse(encoded).digest.length,128);db.close();
 }finally{await server.close();fs.rmSync(dir,{recursive:true,force:true})}
});
test('concurrent first registrations commit only one owner and never replace the chosen code',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-race-')),server=await start(path.join(dir,'state.sqlite'));
 try{
  const codes=['FirstCode8','SecondCode9'];
  const requests=[signup('alice',0,codes[0],true),signup('bobby',1,codes[1],true)];
  const results=await Promise.all(requests.map(b=>server.request('/api/register',b)));
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  const winner=results.findIndex(r=>r.status===201),loser=1-winner;
  assert.equal((await server.request('/api/register',signup('joined',loser,codes[loser],false))).status,403);
  assert.equal((await server.request('/api/register',signup('joined',loser,codes[winner],false))).status,201);
 }finally{await server.close();fs.rmSync(dir,{recursive:true,force:true})}
});
test('legacy first account can replace the old environment code without losing any save',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-upgrade-')),file=path.join(dir,'state.sqlite');
 const old=openStore(file),salt='legacy-test-salt';
 old.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(1,'existing',salt,scryptSync('test-password-123',salt,64).toString('hex'),123);
 const v=old.get(1);v.state.worlds[1].deco=true;v.state.notes.push({id:randomUUID(),actor:1,world:1,title:'升级前的手账',body:'仍然保留',date:'2026-09-24',kind:'memory',shared:false,repeat:false,created:123,weather:'晴',comments:[]});
 old.save(1,{state:v.state,revision:v.revision,command:randomUUID()});
 old.db.exec('DROP TABLE settings; PRAGMA user_version=1;');old.db.close();
 const legacy='old-server-generated-code-123456789',server=await start(file,legacy);
 try{
  const login=await server.request('/api/login',{username:'existing',password:'test-password-123'});
  assert.equal(login.status,200);assert.equal(login.body.registration.canManage,true);assert.equal(login.body.registration.legacy,true);
  assert.equal(login.body.state.notes[0].title,'升级前的手账');
  assert.equal(login.body.state.worlds[1].deco,true);
  assert.equal((await server.request('/api/join-code',{code:'Memory9'},login)).status,200);
  assert.equal((await server.request('/api/register',signup('partner',0,legacy,false))).status,403);
  assert.equal((await server.request('/api/register',signup('partner',0,'Memory9',false))).status,201);
  const current=(await server.request('/api/state',undefined,login)).body;
  assert.equal(current.state.notes[0].body,'仍然保留');assert.equal(current.state.worlds[1].deco,true);
  const db=new DatabaseSync(file);assert.equal(db.prepare('PRAGMA user_version').get().user_version,2);db.close();
 }finally{await server.close();fs.rmSync(dir,{recursive:true,force:true})}
});
