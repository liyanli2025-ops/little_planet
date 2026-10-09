import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {createStudio} from '../backend/studio.mjs';
import {createDesignService} from '../backend/design.mjs';
import {studioLayout} from '../dist/studio-layout.js';
import {homeLayouts} from '../dist/home-layout.js';
const sofa={name:'绿抱枕沙发',kind:'sofa',floor:0,x:2.8,z:.95,yaw:-Math.PI/2,width:1.95,height:1,depth:.88,seat:.70,tint:'#ffffff'};
function glb(){let s=JSON.stringify({asset:{version:'2.0'},meshes:[{primitives:[{attributes:{POSITION:0}}]}],accessors:[{count:3}]});s+=' '.repeat((-s.length%4+4)%4);const b=Buffer.alloc(20+s.length);b.writeUInt32LE(0x46546c67);b.writeUInt32LE(2,4);b.writeUInt32LE(b.length,8);b.writeUInt32LE(s.length,12);b.writeUInt32LE(0x4e4f534a,16);b.write(s,20);return b}
function setup(){const db=new DatabaseSync(':memory:');let partner=2,plan={operation:'create',object:sofa,description:'奶油沙发',reply:'预览'},submits=0;const design=createDesignService(db,{partner:()=>({id:partner})});const env={AI_DESIGN_ENABLED:'true',AI_API_KEY:'secret',AI_BASE_URL:'https://llm.example',AI_MODEL:'x',TENCENT_3D_API_KEY:'tencent'};const opts={design,theme:()=>0,partner:id=>partner?{id:id===1?2:id===2?1:0}:null,env,fetcher:async(url,o)=>{if(String(url).includes('chat/completions'))return Response.json({choices:[{message:{tool_calls:[{function:{name:'edit_object',arguments:JSON.stringify(plan)}}]}}]});if(String(url).endsWith('/submit')){submits++;return Response.json({id:'123456'})}if(String(url).endsWith('/query'))return Response.json({status:'completed',data:[{type:'glb',url:'https://test.cos.ap-guangzhou.tencentcos.cn/a.glb'}]});return new Response(glb())}};return {db,design,opts,s:createStudio(db,opts),set:p=>plan=p,unpair:()=>partner=0,submits:()=>submits}}
test('real-generation contract: idempotent task, private asset, preview/save/reload/rollback',async()=>{const t=setup(),b={scope:'home',version:0,prompt:'奶油沙发',requestId:randomUUID()},job=await t.s.start(1,b);assert.deepEqual(await t.s.start(1,b),job);assert.equal(t.submits(),1);await t.s.tick();const p=t.s.get(1,job.job).result;assert.equal(t.design.current(1).design.home.objects,undefined);assert.equal(p.source,'tencent-3d');assert.equal(p.values.objects.length,1);assert.throws(()=>t.s.get(2,job.job));const id=p.values.objects[0].asset;assert.ok(t.s.asset(1,id));assert.ok(t.s.asset(2,id));t.unpair();assert.throws(()=>t.s.asset(2,id));assert.throws(()=>t.s.asset(3,id));t.design.accept(1,{id:p.id,version:0});assert.equal(t.s.list(1).jobs.length,0);assert.equal(t.design.current(1).design.home.objects[0].asset,id);const restarted=createStudio(t.db,t.opts);assert.equal(restarted.get(1,job.job).result.id,p.id);t.design.rollback(1,{version:1,target:0});assert.equal(t.design.current(1).design.home.objects,undefined);t.db.close()});
test('move and continued editing reuse asset, never submit a second 3D task',async()=>{const t=setup(),j=await t.s.start(1,{scope:'home',version:0,prompt:'沙发',requestId:randomUUID()});await t.s.tick();const p=t.s.get(1,j.job).result,o=p.values.objects[0];t.set({operation:'move',target:o.id,object:{...o,width:1.8,tint:'#99aa99'},reply:'调小'});const next=await t.s.start(1,{scope:'home',version:0,draft:p.id,prompt:'小一点',requestId:randomUUID()}),p2=t.s.get(1,next.job).result;assert.equal(p2.values.objects[0].width,1.8);assert.equal(p2.values.objects[0].asset,o.asset);assert.equal(t.submits(),1);t.db.close()});
test('blocks overlapping furniture before submitting any paid task',async()=>{const t=setup();t.set({operation:'create',object:{...sofa,kind:'decor',x:-.35,z:.35,width:1,depth:1},description:'柜子'});await assert.rejects(t.s.start(1,{scope:'home',version:0,prompt:'柜子',requestId:randomUUID()}),/重叠/);assert.equal(t.submits(),0);t.db.close()});
test('tailored garment uses actual language output, independent account and gifted design',async()=>{const t=setup(),tailoring={kind:'dress',name:'蓝色圆点裙',pattern:'dots',color:'#6677aa',accent:'#ffffff',length:.28,flare:.07,pleats:12,patternScale:.05};t.set({operation:'tailor',tailoring,reply:'预览'});const j=await t.s.start(1,{scope:'outfit',version:0,prompt:'蓝色圆点裙',requestId:randomUUID()}),p=t.s.get(1,j.job).result;t.design.accept(1,{id:p.id,version:0});assert.deepEqual(t.design.current(1).design.outfit.tailoring,tailoring);t.design.gift(1,{id:p.id,partnerId:2});const gift=t.design.view(2).gifts[0];assert.equal(gift.label,tailoring.name);t.design.wearGift(2,{id:gift.id,version:0});assert.deepEqual(t.design.current(2).design.outfit.tailoring,tailoring);assert.equal(t.submits(),0);t.db.close()});
test('both original layouts retain routes; invalid furniture never changes originals',()=>{for(const l of homeLayouts){assert.doesNotThrow(()=>studioLayout(l,[],true));const before=JSON.stringify(l);assert.throws(()=>studioLayout(l,[{...sofa,kind:'decor',x:0,z:0,width:8,depth:8}],true));assert.equal(JSON.stringify(l),before)}});

test('new independent furniture moves between floors and can be removed without more generation',async()=>{const t=setup();t.set({operation:'create',object:{...sofa,name:'小灯',kind:'decor',x:-2.5,z:.9,yaw:0,width:.35,height:.8,depth:.35},description:'暖色小灯'});const j=await t.s.start(1,{scope:'home',version:0,prompt:'新增灯',requestId:randomUUID()});await t.s.tick();const p=t.s.get(1,j.job).result,o=p.values.objects[0];assert.equal(o.description,'暖色小灯');t.set({operation:'move',target:o.id,object:{floor:1,x:1,z:1.5}});const j2=await t.s.start(1,{scope:'home',version:0,draft:p.id,prompt:'移到二层',requestId:randomUUID()}),p2=t.s.get(1,j2.job).result;assert.equal(p2.values.objects[0].floor,1);t.set({operation:'remove',target:o.id});const j3=await t.s.start(1,{scope:'home',version:0,draft:p2.id,prompt:'收起来',requestId:randomUUID()});assert.equal(t.s.get(1,j3.job).result.values.objects.length,0);assert.equal(t.submits(),1);t.db.close()});

test('missing clothing arguments are repaired once through language service, not fabricated',async()=>{
 const t=setup(),calls=[],tailoring={kind:'skirt',name:'绿裙',pattern:'plain',color:'#667766',accent:'#ffffff',length:.3,flare:.08,pleats:8,patternScale:.05};
 t.opts.fetcher=async(url,o)=>{const b=JSON.parse(o.body);calls.push(b);return Response.json({choices:[{message:{tool_calls:[{function:{name:'edit_object',arguments:JSON.stringify(calls.length===1?{operation:'tailor',reply:'预览'}:{operation:'tailor',tailoring,reply:'预览'})}}]}}]})};
 const s=createStudio(t.db,t.opts),j=await s.start(1,{scope:'outfit',version:0,prompt:'绿裙',requestId:randomUUID()});
 assert.equal(calls.length,2);assert.deepEqual(s.get(1,j.job).result.values.tailoring,tailoring);assert.equal(t.submits(),0);
 assert.equal(calls[0].model,'hy3');assert.deepEqual(calls[0].thinking,{type:'disabled'});const fn=calls[0].tools[0].function;assert.deepEqual(fn.parameters.properties.operation.enum,['asset_create','asset_regenerate','asset_fit','asset_remove','tailor','style','explain']);assert.ok(fn.parameters.properties.tailoring.required.includes('patternScale'));assert.equal(calls[0].tool_choice.function.name,'edit_object');
 assert.equal(t.design.current(1).version,0);t.db.close();
});

test('unsupported design explains limitation without retry, proposal or paid generation',async()=>{
 const t=setup();let calls=0;
 t.opts.fetcher=async()=>{calls++;return Response.json({choices:[{message:{tool_calls:[{function:{name:'edit_object',arguments:JSON.stringify({operation:'explain',reply:'暂不支持镂空蕾丝，要试试圆点裙吗？'})}}]}}]})};
 const s=createStudio(t.db,t.opts);const j=await s.start(1,{scope:'outfit',version:0,prompt:'蕾丝裙',requestId:randomUUID()});assert.equal(s.get(1,j.job).status,'awaiting_input');assert.match(s.get(1,j.job).reply,/不支持镂空蕾丝/);
 assert.equal(calls,1);assert.equal(t.submits(),0);assert.equal(t.db.prepare('SELECT count(*) n FROM design_proposals').get().n,0);assert.equal(t.design.current(1).version,0);t.db.close();
});

test('repeated incomplete output terminates with a clear error and leaves design untouched',async()=>{
 const t=setup();let calls=0;t.opts.fetcher=async()=>{calls++;return Response.json({choices:[{message:{tool_calls:[{function:{name:'edit_object',arguments:'{"operation":"tailor","tailoring":null}'}}]}}]})};
 const s=createStudio(t.db,t.opts);await assert.rejects(s.start(1,{scope:'outfit',version:0,prompt:'裙子',requestId:randomUUID()}),/设计未完成/);
 assert.equal(calls,2);const diagnostics=t.db.prepare('SELECT data FROM studio_diagnostics').all();assert.equal(diagnostics.length,2);assert.equal(JSON.parse(diagnostics[0].data).reason,'invalid_plan');assert.equal(s.list(1).jobs[0].status,'failed');assert.equal(t.design.current(1).version,0);assert.equal(t.submits(),0);t.db.close();
});

test('natural-language hat styling preserves dress and independently colors accessories',async()=>{const t=setup();t.set({operation:'style',outfit:{hat:'beanie',accessoryColors:{hat:'#b83737'}},reply:'红帽'});const j=await t.s.start(1,{scope:'outfit',version:0,prompt:'红帽子',requestId:randomUUID()}),p=t.s.get(1,j.job).result;assert.equal(p.values.hat,'beanie');assert.equal(p.values.accessoryColors.hat,'#b83737');assert.equal(p.values.garment,'original');t.design.accept(1,{id:p.id,version:0});assert.equal(t.design.current(1).design.outfit.accessoryColors.hat,'#b83737');assert.equal(t.submits(),0);t.db.close()});

const wearable={name:'花瓣草帽',slot:'hat',width:.45,height:.2,depth:.35,x:0,y:.24,z:0,yaw:0,tint:'#ffffff'};
test('free-form accessory uses a real 3D task; fitting reuses asset; saves, gifts and rolls back',async()=>{const t=setup();t.set({operation:'asset_create',wearable,description:'一顶花瓣形草帽，蓝色丝带，帽底敞开，无人物',reply:'预览'});const j=await t.s.start(1,{scope:'outfit',version:0,prompt:'花瓣草帽',requestId:randomUUID()});assert.equal(t.submits(),1);await t.s.tick();const p=t.s.get(1,j.job).result;assert.equal(p.source,'tencent-3d');const o=p.values.wearables[0];assert.ok(t.s.asset(1,o.asset));t.set({operation:'asset_fit',target:o.id,wearable:{y:.22,width:.42},reply:'调低'});const j2=await t.s.start(1,{scope:'outfit',version:0,draft:p.id,prompt:'低一点',requestId:randomUUID()}),p2=t.s.get(1,j2.job).result;assert.equal(p2.values.wearables[0].asset,o.asset);assert.equal(t.submits(),1);t.design.accept(1,{id:p2.id,version:0});t.design.gift(1,{id:p2.id,partnerId:2});t.design.wearGift(2,{id:t.design.view(2).gifts[0].id,version:0});assert.equal(t.design.current(2).design.outfit.wearables[0].asset,o.asset);t.design.rollback(1,{version:1,target:0});assert.equal(t.design.current(1).design.outfit.wearables,undefined);t.db.close()});
test('complex clothing is generated as a concept instead of rejected or substituted',async()=>{const t=setup();t.set({operation:'asset_create',wearable:{...wearable,name:'蕾丝裙',slot:'garment',width:.7,height:.8,depth:.5},description:'蕾丝连衣裙，无人物',reply:'待适配'});const j=await t.s.start(1,{scope:'outfit',version:0,prompt:'蕾丝裙',requestId:randomUUID()});await t.s.tick();const p=t.s.get(1,j.job).result;assert.equal(p.values.wearables[0].slot,'garment');assert.equal(p.values.tailoring,undefined);assert.equal(t.submits(),1);t.design.accept(1,{id:p.id,version:0});assert.equal(t.design.view(1).items[0].name,'蕾丝裙');t.set({operation:'asset_remove',target:p.values.wearables[0].id,reply:'收起'});const remove=await t.s.start(1,{scope:'outfit',version:1,prompt:'收起来',requestId:randomUUID()});assert.equal(t.s.get(1,remove.job).result.values.wearables.length,0);assert.equal(t.submits(),1);t.db.close()});
test('invalid accessory fit is blocked before a paid generation',async()=>{const t=setup();t.set({operation:'asset_create',wearable:{...wearable,width:900},description:'帽子',reply:'预览'});await assert.rejects(t.s.start(1,{scope:'outfit',version:0,prompt:'帽子',requestId:randomUUID()}),/参数/);assert.equal(t.submits(),0);t.db.close()});

test('clarification persists and short reply carries original request, private and version bound',async()=>{const t=setup(),requests=[];let answer={operation:'explain',reply:'先做头纱，还是先做裙子？'};t.opts.fetcher=async(url,o)=>{requests.push(JSON.parse(o.body));return Response.json({choices:[{message:{tool_calls:[{function:{name:'edit_object',arguments:JSON.stringify(answer)}}]}}]})};const s=createStudio(t.db,t.opts),j=await s.start(1,{scope:'outfit',version:0,prompt:'加头纱和蕾丝裙',requestId:randomUUID()});assert.equal(s.get(1,j.job).reply,'先做头纱，还是先做裙子？');assert.equal(t.submits(),0);await assert.rejects(s.start(2,{scope:'outfit',version:0,prompt:'先裙子',replyTo:j.job,requestId:randomUUID()}),/过期/);answer={operation:'style',outfit:{hat:'beanie'},reply:'预览'};const resumed=createStudio(t.db,t.opts);const next=await resumed.start(1,{scope:'outfit',version:0,prompt:'改成针织帽吧',replyTo:j.job,requestId:randomUUID()});const messages=requests.at(-1).messages;assert.equal(messages[1].content,'加头纱和蕾丝裙');assert.equal(messages[2].content,'先做头纱，还是先做裙子？');assert.equal(messages[3].content,'改成针织帽吧');t.design.accept(1,{id:resumed.get(1,next.job).result.id,version:0});assert.ok(!resumed.list(1).jobs.some(x=>x.id===j.job));await assert.rejects(resumed.start(1,{scope:'outfit',version:1,prompt:'好的',replyTo:j.job,requestId:randomUUID()}),/过期/);t.db.close()});

test('malformed tool arguments are supplied to the single text repair with no 3D submission',async()=>{
 const t=setup(),calls=[],bad='{"operation":"explain","reply":"先做头纱",BROKEN}';
 t.opts.fetcher=async(url,o)=>{const b=JSON.parse(o.body);calls.push(b);return Response.json({choices:[{finish_reason:'stop',message:{tool_calls:[{function:{name:'edit_object',arguments:calls.length===1?bad:JSON.stringify({operation:'explain',reply:'先做头纱吗？'})}}]}}]})};
 const s=createStudio(t.db,t.opts),j=await s.start(1,{scope:'outfit',version:0,prompt:'头纱和裙子',requestId:randomUUID()});
 assert.equal(calls.length,2);assert.ok(calls[1].messages.some(m=>m.role==='assistant'&&m.content.includes(bad)));
 assert.equal(s.get(1,j.job).status,'awaiting_input');assert.equal(t.submits(),0);
 const data=JSON.parse(t.db.prepare('SELECT data FROM studio_diagnostics').get().data);
 assert.equal(data.reason,'arguments_json');assert.equal(data.syntax,'invalid_token');assert.ok(!JSON.stringify(data).includes('头纱'));t.db.close();
});

test('production veil response reaches one mocked 3D task without text retry and preserves dress',async()=>{
 const t=setup(),original=t.opts.fetcher;let textCalls=0;
 const raw=readFileSync(new URL('./fixtures/studio-veil-decimal-comma.txt',import.meta.url),'utf8');
 t.opts.fetcher=async(url,o)=>{if(String(url).includes('chat/completions')){textCalls++;return Response.json({choices:[{finish_reason:'stop',message:{tool_calls:[{function:{name:'edit_object',arguments:raw}}]}}]})}return original(url,o)};
 const s=createStudio(t.db,t.opts),tailoring={kind:'dress',name:'白色婚纱',pattern:'plain',color:'#ffffff',accent:'#ffffff',length:.3,flare:.08,pleats:8,patternScale:.05};
 const draft=t.design.make(1,'outfit',{...t.design.current(1).design.outfit,tailoring},0,'test');
 const request={scope:'outfit',version:0,draft:draft.id,prompt:'增加一个头纱，用小花装饰',requestId:randomUUID()};
 const j=await s.start(1,request);await s.start(1,request);
 assert.equal(textCalls,1);assert.equal(t.submits(),1);
 await s.tick();const result=s.get(1,j.job).result;
 assert.deepEqual(result.values.tailoring,tailoring);assert.equal(result.values.wearables[0].x,0);assert.equal(result.values.wearables[0].z,0);
 assert.equal(t.design.current(1).version,0);t.db.close();
});

test('queued generation resumes after service restart with no resubmit',async()=>{
 const t=setup(),j=await t.s.start(1,{scope:'home',version:0,prompt:'沙发',requestId:randomUUID()});
 const restarted=createStudio(t.db,t.opts);assert.equal(restarted.list(1).jobs[0].status,'queued');
 await restarted.tick();assert.ok(restarted.get(1,j.job).result);assert.equal(t.submits(),1);t.db.close();
});

for(const kind of ['skirt','dress','top','set','hat','veil'])test('standard '+kind+' uses language parameters, saves and gifts without 3D',async()=>{
 const t=setup(),tailoring={kind,name:'标准样式',pattern:'flower',color:'#fff4ec',accent:'#bd9091',length:.34,flare:.07,pleats:12,patternScale:.06,...(kind==='set'?{pantsColor:'#526e5c'}:{})};
 t.set({operation:'tailor',tailoring,reply:'试穿'});
 const j=await t.s.start(1,{scope:'outfit',outfitType:kind,version:0,prompt:'温馨小花风格',requestId:randomUUID()});
 const p=t.s.get(1,j.job).result,head=['hat','veil'].includes(kind);assert.equal((head?p.values.headwear:p.values.tailoring).kind,kind);
 if(['skirt','dress'].includes(kind))assert.equal(p.values.tailoring.length,.34);
 t.design.accept(1,{id:p.id,version:0});t.design.gift(1,{id:p.id,partnerId:2});assert.equal(t.design.view(2).gifts.length,1);assert.equal(t.submits(),0);t.db.close();
});
test('selected category permits a new 3D hat while invalid pants still block a set',async()=>{
 const t=setup();t.set({operation:'asset_create',description:'帽子',wearable});
 const j=await t.s.start(1,{scope:'outfit',outfitType:'hat',version:0,prompt:'生成鸭舌帽',requestId:randomUUID()});assert.equal(t.submits(),1);await t.s.tick();assert.equal(t.s.get(1,j.job).result.source,'tencent-3d');
 t.set({operation:'tailor',tailoring:{kind:'set',name:'套装',pattern:'plain',color:'#ffffff',accent:'#ffffff',length:.22,flare:.05,pleats:8,patternScale:.05}});
 await assert.rejects(t.s.start(1,{scope:'outfit',outfitType:'set',version:0,prompt:'套装',requestId:randomUUID()}),/设计未完成/);assert.equal(t.submits(),1);t.db.close();
});

for(const type of ['sofa','lamp','rug'])test('standard '+type+' uses text, persists and rolls back without 3D',async()=>{
 const t=setup(),o={...sofa,standard:type,kind:type,accent:'#f4d8a2',shape:'round',pattern:'stripe',...(type==='lamp'?{x:-2.5,z:.9,width:.35,depth:.35,height:1.5}:type==='rug'?{x:0,z:0,width:2,depth:1.2,height:.035}:{})};
 t.set({operation:'create',object:o,reply:'预览'});
 const j=await t.s.start(1,{scope:'home',homeType:type,version:0,prompt:'温暖条纹',requestId:randomUUID()}),p=t.s.get(1,j.job).result;
 assert.equal(t.submits(),0);assert.equal(p.values.objects[0].standard,type);assert.equal(p.values.objects[0].asset,undefined);
 t.design.accept(1,{id:p.id,version:0});assert.equal(t.design.current(1).design.home.objects[0].standard,type);
 t.set({operation:'move',target:p.values.objects[0].id,object:{...o,tint:'#b9aa86'},reply:'改色'});
 const j2=await t.s.start(1,{scope:'home',homeType:type,version:1,prompt:'改成米色',requestId:randomUUID()}),p2=t.s.get(1,j2.job).result;
 assert.equal(p2.values.objects.length,1);assert.equal(p2.values.objects[0].id,p.values.objects[0].id);assert.equal(t.submits(),0);
 t.design.accept(1,{id:p2.id,version:1});t.design.rollback(1,{version:2,target:0});assert.equal(t.design.current(1).design.home.objects,undefined);t.db.close();
});
test('standard choice rejects accidental external generation and wrong type',async()=>{
 const t=setup();t.set({operation:'regenerate',description:'new sofa',object:sofa});
 await assert.rejects(t.s.start(1,{scope:'home',homeType:'sofa',version:0,prompt:'沙发',requestId:randomUUID()}));
 assert.equal(t.submits(),0);assert.equal(t.design.current(1).version,0);t.db.close();
});

// Exercise every exposed home category through the same backend used by the webpage.
for(const type of ['sofa','lamp','rug','table','sideTable','nightstand','stool','cushion','blanket','curtain','vase','tray','frame','sculpture','wallArt','clock','plant','floorPlant','hangingPlant'])test('expanded home '+type+' previews, saves and restores without 3D calls',async()=>{
 const {furnitureCatalog,standardKind}=await import('../dist/furniture-catalog.js');const t=setup(),c=furnitureCatalog[type],[width,height,depth]=c.size;
 const object={name:c.label,standard:type,kind:standardKind(type),variant:c.variants[0],mount:c.mounts[0],width,height,depth,seat:type==='stool'?height:.55,tint:'#b4bda6',accent:'#788c69',shape:'round',pattern:'plain',floor:0,x:-2.4,z:.9,yaw:0};if(type==='sofa')Object.assign(object,{x:2.8,z:.95,yaw:-Math.PI/2});
 t.set({operation:'create',reply:'预览',object});const j=await t.s.start(1,{scope:'home',homeType:type,homeMount:c.mounts[0],version:0,prompt:'自然风格的'+c.label,requestId:randomUUID()});const p=t.s.get(1,j.job).result;assert.equal(p.values.objects[0].standard,type);assert.equal(t.submits(),0);assert.equal(t.design.current(1).version,0);t.design.accept(1,{id:p.id,version:0});assert.equal(t.design.current(1).design.home.objects[0].standard,type);
 t.set({operation:'move',target:p.values.objects[0].id,object:{...p.values.objects[0],tint:'#ccddee'},reply:'改色'});const edit=await t.s.start(1,{scope:'home',homeType:type,version:1,prompt:'改成蓝色',requestId:randomUUID()});assert.equal(t.s.get(1,edit.job).result.values.objects[0].tint,'#ccddee');assert.equal(t.submits(),0);
 t.design.rollback(1,{version:1,target:0});assert.equal(t.design.current(1).design.home.objects,undefined);t.db.close();
});

test('moving a supported plant to the floor removes its previous tabletop elevation',async()=>{
 const t=setup(),object={name:'盆栽',standard:'plant',kind:'decor',variant:'leaf',mount:'table',width:.22,height:.45,depth:.22,seat:.55,tint:'#b4bda6',accent:'#788c69',shape:'round',pattern:'plain',floor:0,x:0,z:0,yaw:0};t.set({operation:'create',object});const j=await t.s.start(1,{scope:'home',homeType:'plant',version:0,prompt:'桌上盆栽',requestId:randomUUID()}),p=t.s.get(1,j.job).result;
 t.set({operation:'move',target:p.values.objects[0].id,object:{...p.values.objects[0],mount:'floor',x:-2.5,z:.9}});const moved=await t.s.start(1,{scope:'home',homeType:'plant',homeMount:'floor',version:0,draft:p.id,prompt:'放地上',requestId:randomUUID()});assert.equal(t.s.get(1,moved.job).result.values.objects[0].y,undefined);t.db.close();
});

for(const variant of ['monstera','pothos','sansevieria','yucca','zzplant','cactus','succulent'])test('real plant '+variant+' persists and changes species without paid 3D',async()=>{
 const t=setup(),object={name:variant,standard:'plant',kind:'decor',variant,mount:'table',width:.28,height:.45,depth:.28,seat:.55,tint:'#ffffff',accent:'#ffffff',shape:'round',pattern:'plain',floor:0,x:0,z:0,yaw:0};
 t.set({operation:'create',object});const j=await t.s.start(1,{scope:'home',homeType:'plant',version:0,prompt:'放一盆'+variant,requestId:randomUUID()}),p=t.s.get(1,j.job).result;
 t.design.accept(1,{id:p.id,version:0});assert.equal(t.design.current(1).design.home.objects[0].variant,variant);
 t.set({operation:'move',target:p.values.objects[0].id,object:{...object,variant:'sansevieria',planter:'ceramic'}});
 const edit=await t.s.start(1,{scope:'home',homeType:'plant',version:1,prompt:'换成灰色素盆虎尾兰',requestId:randomUUID()}),q=t.s.get(1,edit.job).result;
 assert.equal(q.values.objects[0].id,p.values.objects[0].id);assert.equal(q.values.objects[0].variant,'sansevieria');assert.equal(q.values.objects[0].planter,'ceramic');assert.equal(t.submits(),0);t.db.close();
});
for(const theme of [0,1])test('reply directly replaces built-in sofa in theme '+theme+' and survives save/restart/rollback',async()=>{
 const t=setup();t.opts.theme=()=>theme;const calls=[],fetcher=t.opts.fetcher;t.opts.fetcher=async(url,o)=>{if(String(url).includes('chat/completions'))calls.push(JSON.parse(o.body));return fetcher(url,o)};const s=createStudio(t.db,t.opts);
 t.set({operation:'explain',reply:'把窗边原沙发换成带蓝色靠枕的吗？'});
 const question=await s.start(1,{scope:'home',homeType:'sofa',version:0,prompt:'奶油沙发配蓝色靠枕',requestId:randomUUID()});
 const object={...sofa,standard:'sofa',variant:'classic',mount:'floor',shape:'round',pattern:'plain',accent:'#5075ad',floor:1,x:0,z:0,yaw:0};
 t.set({operation:'move',target:'lower.sofa',object,reply:'替换预览'});
 const reply=await s.start(1,{scope:'home',homeType:'sofa',version:0,replyTo:question.job,prompt:'直接换',requestId:randomUUID()}),p=s.get(1,reply.job).result,o=p.values.objects[0],base=homeLayouts[theme];
 assert.equal(o.floor,0);assert.equal(o.x,base.lower.sofa[0]);assert.equal(o.z,base.lower.sofa[1]);assert.equal(o.yaw,base.sit[3]);assert.equal(o.accent,'#5075ad');assert.equal(p.values.objects.length,1);assert.equal(t.design.current(1).version,0);assert.ok(calls[1].messages.some(m=>m.content==='奶油沙发配蓝色靠枕'));assert.equal(calls[1].messages.at(-1).content,'直接换');assert.match(calls[1].messages[0].content,/首次替换用create/);
 t.design.accept(1,{id:p.id,version:0});const restarted=createStudio(t.db,t.opts);assert.equal(restarted.get(1,reply.job).result.values.objects[0].id,o.id);
 t.set({operation:'move',target:'builtin:sofa',object:{...object,accent:'#c28391'}});const edit=await restarted.start(1,{scope:'home',homeType:'sofa',version:1,prompt:'靠枕换成粉色',requestId:randomUUID()}),q=restarted.get(1,edit.job).result;
 assert.equal(q.values.objects.length,1);assert.equal(q.values.objects[0].id,o.id);assert.equal(q.values.objects[0].accent,'#c28391');t.design.accept(1,{id:q.id,version:1});t.design.rollback(1,{version:2,target:0});assert.equal(t.design.current(1).design.home.objects,undefined);assert.equal(t.submits(),0);t.db.close();
});

test('sofa create ignores spurious target; unknown move ids never redirect to the built-in sofa',async()=>{
 const t=setup(),object={...sofa,standard:'sofa',variant:'classic',mount:'floor',shape:'round',pattern:'plain',accent:'#5075ad'};
 t.set({operation:'move',target:randomUUID(),object});await assert.rejects(t.s.start(1,{scope:'home',homeType:'sofa',version:0,prompt:'直接换',requestId:randomUUID()}),/没有找到要修改的家具/);assert.equal(t.design.current(1).version,0);
 t.set({operation:'create',target:'original-sofa',object});const j=await t.s.start(1,{scope:'home',homeType:'sofa',version:0,prompt:'替换窗边沙发',requestId:randomUUID()});assert.equal(t.s.get(1,j.job).result.values.objects.length,1);assert.equal(t.submits(),0);t.db.close();
});
const standardSofa=()=>({...sofa,standard:'sofa',variant:'classic',mount:'floor',shape:'round',pattern:'plain',accent:'#5075ad'});
test('successful preview carries history, limits edits to declared fields, and restores clarification draft',async()=>{
 const t=setup(),calls=[],f=t.opts.fetcher;t.opts.fetcher=async(u,o)=>{if(String(u).includes('chat/completions'))calls.push(JSON.parse(o.body));return f(u,o)};const s=createStudio(t.db,t.opts);
 t.set({operation:'create',object:standardSofa()});const first=await s.start(1,{scope:'home',homeType:'sofa',version:0,prompt:'奶油色沙发配蓝色靠枕',requestId:randomUUID()}),p=s.get(1,first.job).result;
 t.set({operation:'move',target:p.values.objects[0].id,changedFields:['width'],object:{...standardSofa(),width:1.8,tint:'#ff0000',accent:'#000000'}});
 const second=await s.start(1,{scope:'home',homeType:'sofa',version:0,draft:p.id,prompt:'只窄一点',requestId:randomUUID()}),q=s.get(1,second.job).result;
 assert.equal(q.values.objects[0].width,1.8);assert.equal(q.values.objects[0].tint,sofa.tint);assert.equal(q.values.objects[0].accent,'#5075ad');assert.ok(calls[1].messages.some(m=>m.content==='奶油色沙发配蓝色靠枕'));assert.ok(!s.list(1).jobs.some(j=>j.id===first.job));
 t.set({operation:'explain',reply:'靠枕想改成什么颜色？'});const question=await s.start(1,{scope:'home',homeType:'sofa',version:0,draft:q.id,prompt:'换个靠枕颜色',requestId:randomUUID()});const restarted=createStudio(t.db,t.opts),j=restarted.get(1,question.job);assert.deepEqual(j.draftResult.values,q.values);assert.equal(j.selection.homeType,'sofa');assert.equal(j.selection.requestKey,undefined);
 await assert.rejects(restarted.start(1,{scope:'home',homeType:'lamp',version:0,replyTo:question.job,prompt:'蓝色',requestId:randomUUID()}),/切换设计类型/);
 await restarted.start(1,{action:'dismiss',job:question.job});assert.ok(!restarted.list(1).jobs.some(j=>['ready','awaiting_input'].includes(j.status)));assert.equal(t.design.current(1).version,0);assert.equal(t.submits(),0);t.db.close();
});
for(const kind of ['skirt','dress','top','set','hat','veil'])test('narrow '+kind+' edit preserves all other clothing properties',async()=>{
 const t=setup(),tailoring={kind,name:'蓝色小花',pattern:'flower',color:'#6688aa',accent:'#eeccaa',length:.22,flare:.07,pleats:8,patternScale:.06,...(kind==='set'?{pantsColor:'#777777'}:{})};t.set({operation:'tailor',tailoring});const b={scope:'outfit',outfitType:kind,version:0,requestId:randomUUID(),prompt:'蓝色小花'},a=await t.s.start(1,b),p=t.s.get(1,a.job).result;
 t.set({operation:'tailor',changedFields:['color'],tailoring:{...tailoring,color:'#dd8899',pattern:'plain',accent:'#000000',pleats:0}});const j=await t.s.start(1,{...b,requestId:randomUUID(),draft:p.id,prompt:'只换成粉色'}),q=t.s.get(1,j.job).result,v=['hat','veil'].includes(kind)?q.values.headwear:q.values.tailoring;assert.equal(v.color,'#dd8899');assert.equal(v.pattern,'flower');assert.equal(v.accent,'#eeccaa');assert.equal(v.pleats,8);assert.equal(t.submits(),0);t.db.close();
});
test('request id is bound to content and cannot replay another request or account',async()=>{
 const t=setup();t.set({operation:'create',object:standardSofa()});const b={scope:'home',homeType:'sofa',version:0,prompt:'沙发',requestId:randomUUID()},j=await t.s.start(1,b);assert.deepEqual(await t.s.start(1,b),j);await assert.rejects(t.s.start(1,{...b,prompt:'灯'}),/内容已改变/);await assert.rejects(t.s.start(2,{action:'dismiss',job:j.job}),/任务不存在/);assert.equal(t.s.list(1).jobs[0].request,b.requestId);t.db.close();
});
test('pending request excludes a concurrent second submission and returns same task on retry',async()=>{
 const t=setup();let release,count=0;const wait=new Promise(r=>release=r);t.opts.fetcher=async()=>{count++;await wait;return Response.json({choices:[{message:{tool_calls:[{function:{name:'edit_object',arguments:JSON.stringify({operation:'create',object:standardSofa()})}}]}}]})};const s=createStudio(t.db,t.opts),b={scope:'home',homeType:'sofa',version:0,prompt:'沙发',requestId:randomUUID()},first=s.start(1,b);const duplicate=await s.start(1,b);await assert.rejects(s.start(1,{...b,requestId:randomUUID()}),/已有任务/);await assert.rejects(s.start(1,{action:'dismiss',job:duplicate.job}),/仍在处理中/);release();assert.deepEqual(await first,duplicate);assert.equal(count,1);t.db.close();
});
test('invalid edit mask never mutates the preview or saved design',async()=>{
 const t=setup();t.set({operation:'create',object:standardSofa()});const j=await t.s.start(1,{scope:'home',homeType:'sofa',version:0,prompt:'沙发',requestId:randomUUID()}),p=t.s.get(1,j.job).result;
 for(const changedFields of [[],['asset'],['tint','tint'],['missing']]){t.set({operation:'move',target:p.values.objects[0].id,object:standardSofa(),changedFields});await assert.rejects(t.s.start(1,{scope:'home',homeType:'sofa',version:0,draft:p.id,prompt:'改一点',requestId:randomUUID()}),/修改内容不完整/)}assert.equal(t.design.current(1).version,0);assert.deepEqual(t.s.get(1,j.job).result,p);t.db.close();
});
test('standard tool cannot silently change other outfit pieces or promise unrendered furniture patterns',async()=>{
 const t=setup(),tailoring={kind:'top',name:'上衣',pattern:'plain',color:'#6688aa',accent:'#ffffff',length:.22,flare:.06,pleats:8,patternScale:.06};
 t.set({operation:'tailor',tailoring,outfit:{hat:'beanie'}});await assert.rejects(t.s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'蓝色上衣',requestId:randomUUID()}),/超出当前类型/);
 t.set({operation:'create',object:{...standardSofa(),standard:'plant',kind:'decor',variant:'monstera',pattern:'check'}});await assert.rejects(t.s.start(1,{scope:'home',homeType:'plant',version:0,prompt:'植物',requestId:randomUUID()}),/超出当前类型/);assert.equal(t.design.current(1).version,0);assert.equal(t.submits(),0);t.db.close();
});
test('natural language can move a plant off the table despite the old UI mount selection',async()=>{
 const t=setup(),object={name:'盆栽',standard:'plant',kind:'decor',variant:'monstera',mount:'table',width:.22,height:.45,depth:.22,seat:.55,tint:'#ffffff',accent:'#ffffff',shape:'round',pattern:'plain',floor:0,x:0,z:0,yaw:0};t.set({operation:'create',object});const b={scope:'home',homeType:'plant',homeMount:'table',version:0,prompt:'桌上盆栽',requestId:randomUUID()},j=await t.s.start(1,b),p=t.s.get(1,j.job).result;
 t.set({operation:'move',target:p.values.objects[0].id,changedFields:['mount','x','z'],object:{...object,mount:'floor',x:-2.5,z:.9}});const q=await t.s.start(1,{...b,draft:p.id,prompt:'放到地上',requestId:randomUUID()}),o=t.s.get(1,q.job).result.values.objects[0];assert.equal(o.mount,'floor');assert.equal(o.y,undefined);assert.equal(o.variant,'monstera');t.db.close();
});

for(const kind of ['skirt','dress','top','set','hat','veil'])test(`partial ${kind} edit preserves unspecified properties and continuous length`,async()=>{
 const t=setup(),tailoring={kind,name:'原款',pattern:'dots',color:'#6677aa',accent:'#ffffff',length:.34,flare:.07,pleats:12,patternScale:.05,...(kind==='set'?{pantsColor:'#112233'}:{})};
 t.set({operation:'tailor',tailoring,reply:'预览'});const b={scope:'outfit',outfitType:kind,version:0,requestId:randomUUID(),prompt:'做一款蓝色圆点'};
 const j=await t.s.start(1,b),p=t.s.get(1,j.job).result;
 t.set({operation:'tailor',tailoring:{kind,color:'#e9aabb'},changedFields:['color'],reply:'改成粉色，其余不变'});
 const j2=await t.s.start(1,{...b,requestId:randomUUID(),draft:p.id,prompt:'只改成粉色'}),p2=t.s.get(1,j2.job).result;
 assert.deepEqual(p2.values[['hat','veil'].includes(kind)?'headwear':'tailoring'],{...tailoring,color:'#e9aabb'});
 assert.equal(t.submits(),0);assert.equal(t.design.current(1).version,0);t.db.close();
});
test('partial first creation fails without inventing absent clothing parameters',async()=>{const t=setup();t.set({operation:'tailor',tailoring:{kind:'skirt',color:'#e9aabb'},changedFields:['color'],reply:'预览'});await assert.rejects(t.s.start(1,{scope:'outfit',outfitType:'skirt',version:0,requestId:randomUUID(),prompt:'粉色裙子'}));assert.equal(t.design.current(1).version,0);assert.equal(t.submits(),0);t.db.close()});

test('free illustrated fabric survives preview, partial edit, save, gift and reload',async()=>{
 const t=setup(),artwork={layout:'front',layers:[{type:'path',points:[[.2,.2],[.3,.05],[.5,.2],[.7,.05],[.8,.2],[.7,.7],[.5,.9],[.3,.7]],fill:'#cc7722'},{type:'ellipse',x:.37,y:.5,w:.05,h:.08,fill:'#111111'},{type:'ellipse',x:.63,y:.5,w:.05,h:.08,fill:'#111111'},{type:'text',x:.5,y:.95,size:.07,text:'FOX',fill:'#111111'}]},tailoring={kind:'top',name:'狐狸丝绒上衣',pattern:'plain',color:'#6677aa',accent:'#ffffff',length:.3,flare:.07,pleats:0,patternScale:.05,fabric:'velvet',artwork};
 t.set({operation:'tailor',tailoring,reply:'狐狸丝绒上衣预览'});const b={scope:'outfit',outfitType:'top',version:0,requestId:randomUUID(),prompt:'丝绒上衣，画一只狐狸'};
 const j=await t.s.start(1,b),p=t.s.get(1,j.job).result;t.set({operation:'tailor',tailoring:{kind:'top',color:'#e9aabb'},changedFields:['color'],reply:'只改粉色'});
 const j2=await t.s.start(1,{...b,requestId:randomUUID(),draft:p.id,prompt:'只改粉色'}),p2=t.s.get(1,j2.job).result;assert.deepEqual(p2.values.tailoring.artwork,artwork);assert.equal(p2.values.tailoring.fabric,'velvet');
 t.design.accept(1,{id:p2.id,version:0});t.design.gift(1,{id:p2.id,partnerId:2});t.design.wearGift(2,{id:t.design.view(2).gifts[0].id,version:0});assert.deepEqual(t.design.current(2).design.outfit.tailoring.artwork,artwork);assert.equal(createStudio(t.db,t.opts).get(1,j2.job).result.values.tailoring.fabric,'velvet');assert.equal(t.submits(),0);t.db.close();
});

test('illustration review preserves first proposal clothing fields even if reviewer changes them',async()=>{const t=setup(),calls=[],base={kind:'top',name:'狐纹',pattern:'plain',color:'#228844',accent:'#ffffff',length:.3,flare:.06,pleats:0,patternScale:.06,fabric:'velvet',artwork:{layout:'front',layers:[{type:'ellipse',x:.5,y:.5,w:.4,h:.4,fill:'#cc7722'}]}};t.opts.fetcher=async(u,o)=>{calls.push(JSON.parse(o.body));return Response.json({choices:[{message:{tool_calls:[{function:{name:'edit_object',arguments:JSON.stringify({operation:'tailor',tailoring:calls.length===1?base:{...base,color:'#ff0000',fabric:'silk',artwork:{...base.artwork,layers:[...base.artwork.layers,{type:'ellipse',x:.4,y:.4,w:.03,h:.03,fill:'#000000'}]}},reply:'预览'})}}]}}]});};const s=createStudio(t.db,t.opts),j=await s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'狐狸丝绒上衣',requestId:randomUUID()}),v=s.get(1,j.job).result.values.tailoring;assert.equal(calls.length,2);assert.equal(v.color,base.color);assert.equal(v.fabric,base.fabric);assert.equal(v.artwork.layers.length,2);assert.ok(!calls[0].messages[0].content.includes('装扮自由创作优先'));assert.equal(t.design.current(1).version,0);t.db.close();});

test('known brand uses sourced reference while preserving model choices and editable preview',async()=>{const t=setup(),tailoring={kind:'top',name:'户外上衣',pattern:'plain',color:'#223344',accent:'#ffffff',length:.25,flare:.04,pleats:0,patternScale:.06,fabric:'cotton',artwork:{layout:'front',layers:[{type:'ellipse',x:.5,y:.5,w:.2,h:.2,fill:'#ffffff'}]}};t.set({operation:'tailor',tailoring,reply:'预览'});const j=await t.s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'始祖鸟',requestId:randomUUID()}),v=t.s.get(1,j.job).result.values.tailoring;assert.equal(v.artwork.reference,'arcteryx');assert.equal(v.color,tailoring.color);assert.equal(v.fabric,tailoring.fabric);assert.equal(t.design.current(1).version,0);assert.equal(t.submits(),0);t.db.close();});

test('automatic route blocks a paid task for a color-only edit',async()=>{const t=setup();t.set({operation:'asset_create',description:'帽子',wearable});await assert.rejects(t.s.start(1,{scope:'outfit',outfitType:'hat',version:0,prompt:'只改颜色为绿色',requestId:randomUUID()}),/快速预览/);assert.equal(t.submits(),0);t.db.close()});
test('accessory wrist anchor is generated while preserving the outfit',async()=>{const t=setup();t.set({operation:'asset_create',description:'独立手表',wearable:{...wearable,name:'手表',slot:'wrist',width:.16,height:.08,depth:.18,x:-.035,y:-.28,z:0}});const j=await t.s.start(1,{scope:'outfit',outfitType:'accessory',version:0,prompt:'一块手表',requestId:randomUUID()});await t.s.tick();assert.equal(t.s.get(1,j.job).result.values.wearables[0].slot,'wrist');assert.equal(t.submits(),1);t.db.close()});
