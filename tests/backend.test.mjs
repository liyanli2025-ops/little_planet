
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {DatabaseSync,backup} from 'node:sqlite';
import {openStore} from '../backend/store.mjs';
const dirs=[];
function setup(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'little-planet-test-'));dirs.push(dir);
 const s=openStore(path.join(dir,'planet.sqlite'));
 for(const slot of [0,1])s.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(slot,'user'+slot,'salt','password',Date.now());
 return s;
}
function commit(s,actor,change){const v=s.get(actor);change(v.state);return s.save(actor,{state:v.state,revision:v.revision,command:randomUUID()})}
function pair(s){s.accept(1,s.invite(0).code)}
function note(actor,shared=false){return {id:randomUUID(),actor,world:actor,title:'今日手账',body:'私人内容',date:'2026-09-24',kind:'memory',shared,repeat:false,created:Date.now(),weather:'晴',comments:[]}}
function event(actor,target,world=target){return {id:randomUUID(),actor,world,target,title:'留一份甜',body:'慢慢吃',kind:'life',shared:true,pending:true,created:Date.now(),weather:'雨',steps:[],comments:[]}}
test('unpaired accounts cannot see the other world, bag or private diary',()=>{
 const s=setup();commit(s,0,x=>x.notes.push(note(0)));
 assert.equal(s.get(1).state.notes.length,0);assert.deepEqual(s.get(1).state.worlds[0].fridge,[]);assert.deepEqual(s.get(1).state.bags[0],{});
 assert.throws(()=>commit(s,1,x=>x.worlds[0].deco=true),/先配对/);s.db.close();
});
test('pairing requires a distinct account, one-time code and unexpired invitation',()=>{
 const s=setup(),i=s.invite(0);assert.throws(()=>s.accept(0,i.code),/无效/);
 const expired=s.invite(0);assert.throws(()=>s.accept(1,i.code),/无效/);
 s.db.prepare('UPDATE invitations SET expires=0').run();assert.throws(()=>s.accept(1,expired.code),/无效/);
 pair(s);assert.equal(s.get(0).paired,true);assert.throws(()=>s.accept(1,expired.code),/无效/);s.db.close();
});
test('private notes stay private; shared comments cannot impersonate the other person',()=>{
 const s=setup();pair(s);const a=note(0),b=note(0,true);commit(s,0,x=>x.notes.push(a,b));
 assert.deepEqual(s.get(1).state.notes.map(n=>n.id),[b.id]);
 assert.throws(()=>commit(s,1,x=>x.notes[0].body='改写'),/不能改写/);
 assert.throws(()=>commit(s,1,x=>x.notes=[]),/不能删除/);
 assert.throws(()=>commit(s,1,x=>x.notes[0].comments.push({actor:0,text:'冒充',at:Date.now()})),/不能冒充/);
 commit(s,1,x=>x.notes[0].comments.push({actor:1,text:'收到啦',at:Date.now()}));
 assert.equal(s.get(0).state.notes.find(n=>n.id===b.id).comments[0].actor,1);
 assert.equal(s.get(0).state.notes.find(n=>n.id===a.id).body,'私人内容');
 s.unlink();assert.equal(s.get(1).state.notes.length,0);
 assert.throws(()=>commit(s,1,x=>x.notes.push({...b,actor:1})),/不能创建/);s.db.close();
});
test('real asynchronous gifts can be discovered and eaten by the recipient',()=>{
 const s=setup();pair(s);const e=event(0,1),gift={id:randomUUID(),food:'cookie',qty:1,event:e.id};
 commit(s,0,x=>{x.bags[0].cookie--;x.events.unshift(e);x.worlds[1].fridge.push(gift)});
 assert.equal(s.get(1).state.events[0].pending,true);
 assert.throws(()=>commit(s,0,x=>x.worlds[1].fridge=x.worlds[1].fridge.filter(i=>i.id!==gift.id)),/等待收件人/);
 assert.throws(()=>commit(s,0,x=>{x.events=[];x.worlds[1].fridge=x.worlds[1].fridge.filter(i=>i.id!==gift.id)}),/等待收件人/);
 commit(s,1,x=>{x.events[0].pending=false;x.events[0].steps.push({text:'发现了礼物',at:Date.now()})});
 commit(s,1,x=>{x.worlds[1].fridge=x.worlds[1].fridge.filter(i=>i.id!==gift.id);x.events[0].steps.push({text:'吃完啦',at:Date.now()})});
 assert.equal(s.get(0).state.events[0].steps.length,2);assert.ok(!s.get(0).state.worlds[1].fridge.some(i=>i.id===gift.id));s.db.close();
});
test('meal ownership and role, decoration, bag permissions are enforced',()=>{
 const s=setup();pair(s);const e=event(0,1,0),meal={id:randomUUID(),recipe:'milk',owner:1,event:e.id,together:false};
 commit(s,0,x=>{x.events.push(e);x.worlds[0].meals.push(meal)});
 assert.throws(()=>commit(s,0,x=>x.worlds[0].meals=[]),/只能吃/);
 assert.throws(()=>commit(s,1,x=>x.worlds[0].meals[0].owner=0),/归属/);
 assert.throws(()=>commit(s,0,x=>x.actor=1),/身份/);
 assert.throws(()=>commit(s,0,x=>x.worlds[1].weather='snow'),/只有主人/);
 assert.throws(()=>commit(s,0,x=>x.worlds[1].camp=true),/只有主人/);
 assert.throws(()=>commit(s,0,x=>x.bags[1].cookie=90),/对方/);
 assert.throws(()=>commit(s,0,x=>x.notes.push(note(1))),/不能创建/);
 assert.throws(()=>commit(s,0,x=>x.worlds[0].fridge[0].id='"><script>'),/格式/);
 commit(s,1,x=>{x.events[0].pending=false;x.worlds[0].meals=[]});assert.equal(s.get(0).state.worlds[0].meals.length,0);s.db.close();
});
test('stale writes rejected, retries idempotent, failed transactions atomic',()=>{
 const s=setup();pair(s);const v=s.get(0);v.state.bags[0].cookie--;
 const cmd={state:v.state,revision:v.revision,command:randomUUID()},ack=s.save(0,cmd);
 assert.equal(ack.state.bags[0].cookie,2);assert.equal(s.save(0,cmd).revision,ack.revision);
 assert.throws(()=>s.save(0,{...cmd,command:randomUUID()}),/更新了存档/);
 const before=JSON.stringify(s.read());assert.throws(()=>commit(s,1,x=>{x.notes.push(note(1));x.worlds[0].deco=true}),/只有主人/);
 assert.equal(JSON.stringify(s.read()),before);s.db.close();
});
test('restart and verified online SQLite backup retain data and accounts',async()=>{
 const s=setup(),filename=s.db.location();pair(s);commit(s,0,x=>x.notes.push(note(0)));
 const output=path.join(path.dirname(filename),'copy.sqlite');await backup(s.db,output);s.db.close();
 const reopened=openStore(filename);assert.equal(reopened.get(0).state.notes.length,1);reopened.db.close();
 const b=new DatabaseSync(output);assert.equal(b.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(b.prepare('SELECT count(*) n FROM users').get().n,2);b.close();
});
test('HTTP registration, sessions, CSRF, origin, pairing, privacy and logout',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'little-planet-http-'));dirs.push(dir);
 const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const origin='http://127.0.0.1:'+port,code='echoo123';
 const child=spawn(process.execPath,['backend/server.mjs'],{env:{...process.env,PORT:String(port),PUBLIC_ORIGIN:origin,REGISTRATION_CODE:code,DATABASE_PATH:path.join(dir,'planet.sqlite')},stdio:['ignore','pipe','pipe']});
 let log='';child.stderr.on('data',c=>log+=c);child.stdout.on('data',c=>log+=c);
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,50))}assert.ok(ready,log);
  async function request(route,data,auth={}){
   const res=await fetch(origin+route,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json',Origin:auth.origin||origin}),...(auth.cookie?{Cookie:auth.cookie}:{}),...(auth.csrf?{'X-CSRF-Token':auth.csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});
   return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0],headers:res.headers};
  }
  assert.equal((await request('/api/state')).status,401);
  assert.equal((await request('/api/register',{username:'alice',password:'test-password-123',actor:0,code:'short',setup:true})).status,400);
  const a=await request('/api/register',{username:'alice',password:'test-password-123',actor:0,code,setup:true});assert.equal(a.status,201);assert.match(a.headers.get('set-cookie'),/HttpOnly/);
  const auth={cookie:a.cookie,csrf:a.body.csrf};
  const b=await request('/api/register',{username:'bobby',password:'test-password-456',actor:1,code,setup:false});assert.equal(b.status,201);
  assert.equal((await request('/api/register',{username:'third',password:'test-password-789',actor:1,code})).status,409);
  assert.equal((await request('/api/invite',{}, {cookie:a.cookie})).status,403);
  assert.equal((await request('/api/invite',{}, {...auth,origin:'https://evil.example'})).status,403);
  const invitation=await request('/api/invite',{},auth);assert.equal(invitation.status,200);
  assert.equal((await request('/api/pair',{code:invitation.body.code},{cookie:b.cookie,csrf:b.body.csrf})).status,200);
  let life=(await request('/api/state',undefined,auth)).body;const lifeCmd={world:0,type:'plant',plot:0,crop:'carrot',revision:life.revision,command:randomUUID()};
  assert.equal((await request('/api/life',lifeCmd,{cookie:a.cookie})).status,403);
  assert.equal((await request('/api/life',lifeCmd,{...auth,origin:'https://evil.example'})).status,403);
  const planted=await request('/api/life',lifeCmd,auth);assert.equal(planted.status,200);assert.equal(planted.body.state.worlds[0].life.plots[0].crop,'carrot');assert.equal((await request('/api/life',lifeCmd,auth)).body.revision,planted.body.revision);
  const v=(await request('/api/state',undefined,auth)).body;v.state.notes.push(note(0));
  assert.equal((await request('/api/state',{state:v.state,revision:v.revision,command:randomUUID()},auth)).status,200);
  assert.equal((await request('/api/state',undefined,{cookie:b.cookie})).body.state.notes.length,0);
  assert.equal((await fetch(origin+'/data/planet.sqlite')).status,404);assert.equal((await fetch(origin+'/.env')).status,404);
  assert.match(await (await fetch(origin+'/runtime.js')).text(),/cloud/);
  assert.equal((await request('/api/logout',{},auth)).status,200);assert.equal((await request('/api/state',undefined,auth)).status,401);
  const login=await request('/api/login',{username:'alice',password:'test-password-123'});assert.equal(login.status,200);assert.equal(login.body.state.notes.length,1);
  assert.equal((await request('/api/login',{username:'alice',password:'incorrect-password'})).status,401);
 }finally{const exited=new Promise(r=>child.once('exit',r));child.kill();await exited}
});
test.after(()=>{for(const dir of dirs)fs.rmSync(dir,{recursive:true,force:true})});
