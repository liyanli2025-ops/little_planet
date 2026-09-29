import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createDesignService} from '../backend/design.mjs';
import {defaultDesign,designExamples,validateDesignPart,validateDesign} from '../dist/design-schema.js';
const setup=(options={})=>{const db=new DatabaseSync(':memory:');return {db,s:createDesignService(db,options)}};
const example=(s,account=1,scope='home',version=s.current(account).version)=>s.generate(account,{scope,version,example:true});
const env={AI_DESIGN_ENABLED:'true',AI_API_KEY:'server-secret',AI_BASE_URL:'https://provider.example/v1',AI_MODEL:'test',AI_DESIGN_DAILY_LIMIT:'2',AI_DESIGN_GLOBAL_DAILY_LIMIT:'3'};
const result=values=>new Response(JSON.stringify({choices:[{message:{tool_calls:[{function:{name:'propose_design',arguments:JSON.stringify(values)}}]}}]}));
const request=(id,scope='home')=>({scope,version:0,prompt:'温馨奶油色',requestId:id.padEnd(16,'x')});
test('strict enum design cannot change topology, inject URLs or omit fields',()=>{
 assert.deepEqual(validateDesign(defaultDesign()),defaultDesign());
 for(const v of [{...designExamples.home,layout:'new'}, {...designExamples.home,wall:'https://evil'}, {wall:'cream'},null])assert.throws(()=>validateDesignPart('home',v));
 assert.throws(()=>validateDesign({...defaultDesign(),planet:{}}));
});
test('preview is read-only; accept is account scoped, versioned and idempotent; rollback creates revision',async()=>{
 const {db,s}=setup();db.exec('CREATE TABLE unrelated(content TEXT);INSERT INTO unrelated VALUES(\'food and journal\')');
 const p=await example(s);assert.equal(s.current(1).version,0);
 assert.throws(()=>s.accept(2,{id:p.id,version:0}),/不属于/);
 const first=s.accept(1,{id:p.id,version:0});assert.equal(first.version,1);assert.deepEqual(first.design.home,designExamples.home);
 assert.equal(s.accept(1,{id:p.id,version:0}).version,1);
 const p2=await example(s,1,'planet');s.accept(1,{id:p2.id,version:1});
 const back=s.rollback(1,{version:2,target:1});assert.equal(back.version,3);assert.deepEqual(back.design,first.design);
 assert.equal(s.current(2).version,0);assert.equal(db.prepare('SELECT content FROM unrelated').get().content,'food and journal');
 assert.deepEqual(s.rollback(1,{version:3,target:0}).design,defaultDesign());db.close();
});
test('two tabs cannot overwrite each other; proposal expiry and history retention',async()=>{
 let now=1000;const {db,s}=setup({clock:()=>now});const p=await example(s),old=await example(s,1,'planet');s.accept(1,{id:p.id,version:0});assert.throws(()=>s.accept(1,{id:old.id,version:0}),/别处更新/);
 const expired=await example(s);now+=86400001;assert.throws(()=>s.accept(1,{id:expired.id,version:1}),/过期/);
 for(let i=0;i<23;i++){const p=await example(s);s.accept(1,{id:p.id,version:p.base})}
 assert.equal(s.view(1).history.length,20);assert.throws(()=>s.rollback(1,{version:24,target:1}),/不可用/);assert.equal(s.rollback(1,{version:24,target:0}).version,25);db.close();
});
test('AI credential stays server-side; retries do not double charge; daily limits removed',async()=>{
 let calls=0;const {db,s}=setup({env,fetcher:async(url,opts)=>{calls++;assert.equal(opts.headers.Authorization,'Bearer server-secret');const b=JSON.parse(opts.body);assert.equal(b.tools[0].function.parameters.additionalProperties,false);return result(designExamples.home)}});
 const p=await s.generate(1,request('a'));assert.equal(p.source,'ai');assert.equal((await s.generate(1,request('a'))).id,p.id);assert.equal(calls,1);
 for(let i=0;i<55;i++)await s.generate(1,request('unlimited'+i));
 await s.generate(2,request('d'));await s.generate(3,request('e'));assert.equal(s.view(1).remaining,null);
 assert.ok(!JSON.stringify(s.view(1)).includes('server-secret'));db.close();
});
test('unconfigured provider offers explicitly marked example; invalid AI output never saves',async()=>{
 const offline=setup();await assert.rejects(offline.s.generate(1,request('a')),/尚未开启/);assert.equal((await example(offline.s)).source,'example');offline.db.close();
 for(const fetcher of [async()=>result({...designExamples.home,wall:'execute-code'}),async()=>new Response('{oops'),async()=>{throw Error('provider server-secret')},async()=>new Response('{}',{status:500})]){
 const {db,s}=setup({env,fetcher});await assert.rejects(s.generate(1,request('a')),e=>!e.message.includes('server-secret'));assert.equal(s.current(1).version,0);assert.equal(s.view(1).remaining,null);db.close();
 }
});
import * as T from '../dist/vendor/three.module.js';
import {createClothing} from '../dist/clothing.js';
import {createDesignedHome} from '../dist/designed-home.js';
test('designing either house preserves geometry, action anchors, and restores material colors',()=>{
 const root=new T.Group(),home=createDesignedHome(root);for(const identity of [0,1]){home.select(identity);home.design(defaultDesign().home);const before=[];root.traverse(o=>before.push({o,position:o.position.toArray(),rotation:o.rotation.toArray(),scale:o.scale.toArray(),geometry:o.geometry,action:o.userData.action,color:o.material?.color?.getHex()}));
 home.design(designExamples.home);assert.ok(before.some(v=>v.color!==undefined&&v.o.material.color.getHex()!==v.color));for(const v of before){assert.deepEqual(v.o.position.toArray(),v.position);assert.deepEqual(v.o.rotation.toArray(),v.rotation);assert.deepEqual(v.o.scale.toArray(),v.scale);assert.equal(v.o.geometry,v.geometry);assert.equal(v.o.userData.action,v.action)}
 home.lighting(true,'rain');home.design(defaultDesign().home);for(const v of before)if(v.color!==undefined)assert.equal(v.o.material.color.getHex(),v.color);
 }home.dispose();
});
test('every supported garment keeps connected sleeves and finite geometry under all motifs',()=>{
 const body=new T.Group(),arms=[new T.Group(),new T.Group()];arms.forEach(a=>body.add(a));const clothes=createClothing(body,arms);
 for(const id of ['cream','navy','rose','sage','denim','mint','plain'])for(const motif of ['flower','star','heart','none']){clothes.set(id);clothes.design({...designExamples.outfit,motif});body.traverse(o=>{const p=o.geometry?.attributes.position;if(p)for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]))});assert.ok(arms.every(a=>a.children.length<=1))}clothes.dispose();assert.ok(arms.every(a=>a.children.length===0));
});
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openAccounts} from '../backend/accounts.mjs';
test('design follows account across pairing, unlink and database restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'echoo-design-')),file=path.join(dir,'state.sqlite');let hub=openAccounts(file);
 try{let s=createDesignService(hub.db);const a=hub.register('designalice','s','p',0),b=hub.register('designbobby','s','p',0);const p=await example(s,a.id);s.accept(a.id,{id:p.id,version:0});hub.accept(b.id,hub.invite(a.id).code,a.id);assert.deepEqual(s.current(a.id).design.home,designExamples.home);assert.equal(s.current(b.id).version,0);
 hub.unlink(a.id);assert.equal(s.current(a.id).version,1);assert.equal(s.current(b.id).version,0);hub.db.close();hub=openAccounts(file);s=createDesignService(hub.db);assert.deepEqual(s.current(a.id).design.home,designExamples.home);assert.equal(s.view(a.id).history.length,1);
 }finally{hub.db.close();fs.rmSync(dir,{recursive:true,force:true})}
});

test('BigModel Flash disables thinking without sending provider flags to other endpoints',async()=>{
 for(const base of ['https://open.bigmodel.cn/api/paas/v4','https://other.example/v1']){
 const {db,s}=setup({env:{...env,AI_BASE_URL:base,AI_MODEL:'glm-4.7-flash'},fetcher:async(url,options)=>{const b=JSON.parse(options.body);assert.equal(url.pathname.endsWith('/chat/completions'),true);if(url.hostname==='open.bigmodel.cn')assert.deepEqual(b.thinking,{type:'disabled'});else assert.equal(b.thinking,undefined);return result(designExamples.home)}});
 assert.equal((await s.generate(1,request('glm'))).source,'ai');db.close();
 }
});


test('gift belongs to recipient, never auto-equips, is idempotent and survives unlink',async()=>{
 let paired=true,events=0;const {db,s}=setup({partner:id=>paired?{id:id===1?2:1}:null,onGift:()=>events++});
 const p=await example(s,1,'outfit');s.gift(1,{id:p.id,partnerId:2});s.gift(1,{id:p.id,partnerId:2});assert.equal(events,1);assert.equal(s.view(2).gifts.length,1);assert.equal(s.current(2).version,0);assert.equal(s.current(1).version,0);
 const id=s.view(2).gifts[0].id;assert.throws(()=>s.wearGift(1,{id,version:0}),/没有/);paired=false;assert.throws(()=>s.gift(1,{id:p.id,partnerId:2}),/配对/);assert.equal(s.view(2).gifts.length,1);
 s.wearGift(2,{id,version:0});assert.deepEqual(s.current(2).design.outfit,designExamples.outfit);assert.deepEqual(s.rollback(2,{version:1,target:0}).design,defaultDesign());db.close();
});
test('gift event failure rolls back delivery, legacy designs acquire defaults',async()=>{
 const {db,s}=setup({partner:()=>({id:2}),onGift:()=>{throw Error('event failed')}});const p=await example(s,1,'outfit');assert.throws(()=>s.gift(1,{id:p.id,partnerId:2}),/event failed/);assert.equal(s.view(2).gifts.length,0);
 const d=defaultDesign();for(const k of ['garment','hat','shoes','accessory'])delete d.outfit[k];delete d.home.layout;db.prepare('INSERT INTO account_designs VALUES(?,?,?)').run(1,1,JSON.stringify(d));assert.deepEqual(s.current(1).design,defaultDesign());db.close();
});
test('one in-flight generation per account releases after failure',async()=>{
 let finish;const {db,s}=setup({env,fetcher:()=>new Promise(r=>finish=r)});const pending=s.generate(1,request('first'));await assert.rejects(s.generate(1,request('second')),/仍在生成/);finish(result(designExamples.home));await pending;assert.equal(db.prepare("SELECT count(*) n FROM design_requests WHERE status='pending'").get().n,0);db.close();
});
