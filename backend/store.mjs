
import {DatabaseSync} from 'node:sqlite';
import {randomUUID, randomBytes, createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export class AppError extends Error { constructor(status,message){super(message);this.status=status;} }
export const fail=(ok,message='数据格式不正确',status=400)=>{if(!ok)throw new AppError(status,message)};
const clone=v=>JSON.parse(JSON.stringify(v));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,min=0,max=1000000)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const text=(v,max)=>typeof v==='string'&&v.length<=max;
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(v);
const keys=(v,allowed)=>isObj(v)&&Object.keys(v).every(k=>allowed.includes(k));
const foods=['milk','pudding','cookie','rice','egg','tomato'];
const baseWorld=i=>({weather:i?'rain':'sun',deco:false,camp:false,pet:{feeds:0,games:0,walks:0},fridge:['milk','pudding','rice','egg','tomato'].map(food=>({id:randomUUID(),food,qty:3})),meals:[]});
const emptyWorld=()=>({weather:'sun',deco:false,camp:false,pet:{feeds:0,games:0,walks:0},fridge:[],meals:[]});
const initial=()=>({version:1,worlds:[baseWorld(0),baseWorld(1)],bags:[{cookie:3,pudding:2,milk:2},{cookie:3,pudding:2,milk:2}],events:[],notes:[],favorites:[[],[]]});
export const hash=v=>createHash('sha256').update(v).digest('hex');

export function openStore(filename){
 fs.mkdirSync(path.dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename,{timeout:5000});
 db.exec(`
 PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA cache_size=-4096;
 CREATE TABLE IF NOT EXISTS users (slot INTEGER PRIMARY KEY CHECK(slot IN (0,1)), username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL, created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, slot INTEGER NOT NULL REFERENCES users(slot), csrf TEXT NOT NULL, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS invitations (token TEXT PRIMARY KEY, slot INTEGER NOT NULL REFERENCES users(slot), expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS saves (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, paired INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS receipts (slot INTEGER NOT NULL, command TEXT NOT NULL, digest TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(slot,command));
 PRAGMA user_version=1;`);
 db.prepare('INSERT OR IGNORE INTO saves(id,revision,paired,state) VALUES(1,0,0,?)').run(JSON.stringify(initial()));
 const read=()=>{const r=db.prepare('SELECT * FROM saves WHERE id=1').get();return {...r,state:JSON.parse(r.state)}};
 const visible=(e,slot,paired)=>e.actor===slot || (paired && (e.shared || e.target===slot));
 function project(row,slot){
  const s=clone(row.state);
  s.actor=slot;
  s.bags[1-slot]={};s.favorites[1-slot]=[];
  if(!row.paired)s.worlds[1-slot]=emptyWorld();
  s.events=s.events.filter(e=>visible(e,slot,row.paired));
  s.notes=s.notes.filter(e=>e.actor===slot||(row.paired&&e.shared));
  return {state:s,revision:row.revision,paired:!!row.paired,actor:slot};
 }
 const get=slot=>project(read(),slot);
 function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v}catch(e){db.exec('ROLLBACK');throw e}}

 function validateRecord(e,note){
  fail(keys(e,note?['id','actor','world','title','body','date','kind','shared','repeat','created','weather','comments']:['id','title','body','actor','world','target','shared','pending','kind','created','weather','steps','comments']));
  fail(id(e.id)&&[0,1].includes(e.actor)&&[0,1].includes(e.world)&&text(e.title,160)&&e.title.trim().length>0&&text(e.body,2000)&&text(e.weather,200));
  fail(typeof e.shared==='boolean'&&integer(e.created,0,9000000000000000));
  if(note)fail(['memory','anniversary'].includes(e.kind)&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&typeof e.repeat==='boolean');
  else {
   fail([null,0,1].includes(e.target)&&typeof e.pending==='boolean'&&e.kind==='life');
   fail(Array.isArray(e.steps)&&e.steps.length<=500&&e.steps.every(s=>keys(s,['text','at'])&&text(s.text,500)&&integer(s.at,0,9000000000000000)));
  }
  fail(Array.isArray(e.comments)&&e.comments.length<=500&&e.comments.every(c=>keys(c,['actor','text','at'])&&[0,1].includes(c.actor)&&text(c.text,500)&&integer(c.at,0,9000000000000000)));
 }
 function appendOnly(before,after,slot,comments=false){
  fail(after.length>=before.length&&before.every((v,i)=>same(v,after[i])),'只能追加自己的留言或互动记录',403);
  if(comments)fail(after.slice(before.length).every(c=>c.actor===slot),'不能冒充对方留言',403);
 }
 function reconcileRecords(current,proposed,slot,paired,note){
  fail(Array.isArray(proposed)&&proposed.every(isObj)&&proposed.length<=5000,'手账最多保存 5000 条，请先导出整理');
  fail(new Set(proposed.map(e=>e.id)).size===proposed.length);
  const beforeVisible=current.filter(e=>note?(e.actor===slot||(paired&&e.shared)):visible(e,slot,paired));
  const allowed=new Map(beforeVisible.map(e=>[e.id,e]));
  const all=new Map(current.map(e=>[e.id,e]));
  for(const next of proposed){
   validateRecord(next,note);
   const prev=allowed.get(next.id);
   if(!prev){
    fail(!all.has(next.id)&&next.actor===slot,'不能创建或覆盖对方的记录',403);
    fail(paired||(!next.shared&&next.world===slot&&(note||next.target===null||next.target===slot)),'请先邀请对方配对',403);
    fail(next.comments.every(c=>c.actor===slot),'不能冒充对方留言',403);
   } else {
    fail(next.actor===prev.actor&&next.world===prev.world&&next.created===prev.created,'记录身份不能修改',403);
    appendOnly(prev.comments,next.comments,slot,true);
    if(!note)appendOnly(prev.steps,next.steps,slot);
    if(prev.actor!==slot){
     const a=clone(prev),b=clone(next);delete a.comments;delete b.comments;
     if(!note){
      delete a.steps;delete b.steps;
      if(prev.pending&&!next.pending)fail(prev.target===slot,'只有收件人可以发现礼物',403);
      else fail(prev.pending===next.pending,'不能重置礼物状态',403);
      delete a.pending;delete b.pending;
     }
     fail(same(a,b),'不能改写对方的手账',403);
    }else if(!note){
     fail(next.target===prev.target,'不能更改礼物的接收人',403);
     fail(next.pending===prev.pending||(!next.pending&&prev.target===slot),'只有收件人可以发现礼物',403);
    }
   }
  }
  const wanted=new Map(proposed.map(e=>[e.id,e]));
  for(const prev of beforeVisible)if(!wanted.has(prev.id))fail(prev.actor===slot,'不能删除对方记录',403);
  return [...current.filter(e=>!allowed.has(e.id)),...proposed];
 }
 function validateWorld(w){
  fail(keys(w,['weather','deco','camp','pet','fridge','meals'])&&['sun','rain','snow','night'].includes(w.weather)&&typeof w.deco==='boolean'&&typeof w.camp==='boolean');
  fail(keys(w.pet,['feeds','games','walks'])&&['feeds','games','walks'].every(k=>integer(w.pet[k])));
  fail(Array.isArray(w.fridge)&&w.fridge.every(isObj)&&w.fridge.length<=500&&new Set(w.fridge.map(i=>i.id)).size===w.fridge.length,'冰箱最多存放 500 组食物');
  fail(w.fridge.every(i=>keys(i,['id','food','qty','event'])&&id(i.id)&&foods.includes(i.food)&&integer(i.qty,1,999)&&(!i.event||id(i.event))));
  fail(Array.isArray(w.meals)&&w.meals.every(isObj)&&w.meals.length<=500&&new Set(w.meals.map(i=>i.id)).size===w.meals.length,'餐桌最多存放 500 份饭菜');
  fail(w.meals.every(i=>keys(i,['id','recipe','owner','event','together'])&&id(i.id)&&['omelet','toast','milk'].includes(i.recipe)&&[0,1].includes(i.owner)&&id(i.event)&&i.together===false));
 }
 function validateWorldChange(prev,next,slot,owner,events,priorEvents){
  validateWorld(next);
  const visitor=slot!==owner;
  if(visitor){
   for(const k of ['weather','deco','camp'])fail(same(prev[k],next[k]),'只有主人可以调整天气和装扮',403);
   for(const k of ['feeds','games','walks'])fail(next.pet[k]>=prev.pet[k]&&next.pet[k]-prev.pet[k]<=10,'宠物互动次数不正确');
  }
  const oldFood=new Map(prev.fridge.map(i=>[i.id,i]));
  for(const item of next.fridge){
   const old=oldFood.get(item.id);
   if(old){
    fail(same({...old,qty:item.qty},item),'已有食物只能改变数量',403);
    if(visitor)fail(item.qty<=old.qty,'请从自己的随身包赠送食物',403);
   }else if(visitor){
    const gift=events.find(e=>e.id===item.event);
    fail(gift?.actor===slot&&gift.target===owner&&gift.shared&&item.qty===1,'新食物需要属于自己的赠礼记录',403);
   }
  }
  for(const old of prev.fridge){
   const n=next.fridge.find(i=>i.id===old.id);
   if(!n||n.qty<old.qty){
    const event=priorEvents.find(e=>e.id===old.event);
    fail(!event?.pending||event.target===slot,'这份礼物正在等待收件人',403);
   }
  }
  const oldMeals=new Map(prev.meals.map(i=>[i.id,i]));
  for(const m of next.meals){
   if(oldMeals.has(m.id))fail(same(m,oldMeals.get(m.id)),'不能更改已做好饭菜的归属',403);
   else {const e=events.find(e=>e.id===m.event);fail(e?.actor===slot&&e.target===m.owner,'饭菜必须对应自己的做饭记录',403)}
  }
  for(const old of prev.meals)if(!next.meals.some(m=>m.id===old.id))fail(old.owner===slot,'只能吃留给自己的饭',403);
 }

 function save(slot,input){
  fail(keys(input,['state','revision','command'])&&integer(input.revision)&&id(input.command));
  return transaction(()=>{
   const digest=hash(JSON.stringify(input));
   const receipt=db.prepare('SELECT digest FROM receipts WHERE slot=? AND command=?').get(slot,input.command);
   if(receipt){fail(receipt.digest===digest,'重复请求内容不同',409);return get(slot)}
   const row=read(),view=project(row,slot).state,s=input.state;
   fail(input.revision===row.revision,'另一台设备刚更新了存档，请重新载入后再操作。未提交的内容可以导出。',409);
   fail(keys(s,['version','actor','worlds','bags','events','notes','favorites'])&&s.version===1&&s.actor===slot,'账号身份不匹配',403);
   for(const k of ['worlds','bags','favorites'])fail(Array.isArray(s[k])&&s[k].length===2);
   fail(same(s.bags[1-slot],view.bags[1-slot])&&same(s.favorites[1-slot],view.favorites[1-slot]),'不能修改对方的随身包或珍藏',403);
   if(!row.paired)fail(same(s.worlds[1-slot],view.worlds[1-slot]),'请先配对再访问对方',403);
   fail(keys(s.bags[slot],foods)&&Object.values(s.bags[slot]).every(n=>integer(n,0,999)),'每种随身食物最多 999 份');
   fail(Array.isArray(s.favorites[slot])&&s.favorites[slot].length<=5000&&s.favorites[slot].every(id));
   s.worlds.forEach(validateWorld);
   const events=reconcileRecords(row.state.events,s.events,slot,row.paired,false);
   const notes=reconcileRecords(row.state.notes,s.notes,slot,row.paired,true);
   fail(new Set([...events,...notes].map(e=>e.id)).size===events.length+notes.length,'记录编号重复');
   // Keep gift records while items still reference them. Deleting the journal entry cannot unlock a reserved gift.
   const referenced=new Set(s.worlds.flatMap(w=>[...w.fridge,...w.meals].map(i=>i.event)).filter(Boolean));
   for(const e of row.state.events)if(referenced.has(e.id))fail(events.some(n=>n.id===e.id),'请先吃完关联的礼物，再删除这条记录。',409);
   for(const i of [0,1])if(i===slot||row.paired){
    validateWorldChange(row.state.worlds[i],s.worlds[i],slot,i,events,row.state.events);
    row.state.worlds[i]=s.worlds[i];
   }
   row.state.events=events;row.state.notes=notes;row.state.bags[slot]=s.bags[slot];row.state.favorites[slot]=s.favorites[slot];
   db.prepare('UPDATE saves SET revision=revision+1,state=? WHERE id=1').run(JSON.stringify(row.state));
   db.prepare('INSERT INTO receipts(slot,command,digest,created) VALUES(?,?,?,?)').run(slot,input.command,digest,Date.now());
   db.prepare('DELETE FROM receipts WHERE created<?').run(Date.now()-7*86400000);
   return get(slot);
  });
 }
 function invite(slot){
  return transaction(()=>{
   fail(!read().paired,'已经配对，无需再次邀请',409);
   const token=randomBytes(18).toString('hex'),expires=Date.now()+86400000;
   db.prepare('DELETE FROM invitations WHERE slot=? OR expires<?').run(slot,Date.now());
   db.prepare('INSERT INTO invitations(token,slot,expires) VALUES(?,?,?)').run(hash(token),slot,expires);
   return {code:token,expires};
  });
 }
 function accept(slot,code){
  fail(typeof code==='string'&&/^[a-f0-9]{36}$/.test(code),'邀请码格式不正确');
  return transaction(()=>{
   const i=db.prepare('SELECT * FROM invitations WHERE token=?').get(hash(code));
   fail(i&&i.expires>Date.now()&&i.slot!==slot,'邀请码无效、已使用或已过期');
   fail(!read().paired,'已经配对',409);
   db.prepare('UPDATE saves SET paired=1,revision=revision+1 WHERE id=1').run();
   db.exec('DELETE FROM invitations');
   return get(slot);
  });
 }
 function unlink(){return transaction(()=>{db.exec('UPDATE saves SET paired=0,revision=revision+1 WHERE id=1; DELETE FROM invitations;');});}
 return {db,read,get,save,invite,accept,unlink,transaction};
}
