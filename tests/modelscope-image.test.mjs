import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {randomUUID} from 'node:crypto';
import {createModelScopeImage,imageTextureRequest} from '../backend/modelscope-image.mjs';
import {createStudio} from '../backend/studio.mjs';import {createDesignService} from '../backend/design.mjs';
import {validateTailoring} from '../dist/studio-schema.js';
const spec={kind:'top',name:'Botanical print',pattern:'plain',color:'#eee2ca',accent:'#aa8899',length:.3,flare:.05,pleats:0,patternScale:.09,fabric:'cotton',artwork:{layout:'repeat',layers:[{type:'ellipse',x:.5,y:.5,w:.2,h:.2,fill:'#aa8899'}]}};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
function fixture(){const db=new DatabaseSync(':memory:'),design=createDesignService(db);let submissions=0,queries=0,lastImagePrompt='',lastPlannerPrompt='',failDownload=false,status='RUNNING',verdict={pass:true,issues:[],correction:''},reviewHTTP=200,plan={operation:'tailor',tailoring:spec,imageBrief:{description:'Detailed botanical flower print with connected stems, petals and natural variations.',lettering:[]}};const fetcher=async(url,options)=>{
 const u=String(url);if(u.includes('modelscope.cn/v1/chat/completions'))return Response.json({choices:[{message:{content:JSON.stringify(verdict)}}]},{status:reviewHTTP});if(u.includes('chat/completions')){lastPlannerPrompt=JSON.parse(options.body).messages[0].content;return Response.json({choices:[{message:{tool_calls:[{function:{name:'edit_object',arguments:JSON.stringify(plan)}}]}}]});}
 assert.ok(!u.includes('tencent'),'must never call 3D provider');
 if(u.endsWith('/images/generations')){submissions++;const body=JSON.parse(options.body);lastImagePrompt=body.prompt;assert.equal(body.model,'Qwen/Qwen-Image-Edit');assert.match(body.image_url,/^data:image\/png;base64,/);return Response.json({task_id:'test-task'});}
 if(u.includes('/tasks/')){queries++;return Response.json({task_status:status,output_images:['https://results.oss-cn-beijing.aliyuncs.com/texture.png']});}if(failDownload){failDownload=false;throw Error('transient download interruption');}
 return new Response(png,{headers:{'Content-Type':'image/png'}});
 };const env={AI_DESIGN_ENABLED:'true',AI_API_KEY:'qa',AI_BASE_URL:'https://llm.example',AI_MODEL:'qa',MODELSCOPE_TOKEN:'secret',MODELSCOPE_IMAGE_REVIEW:'true'};
 const studio=()=>createStudio(db,{design,env,fetcher,theme:()=>0});return {db,design,studio,setStatus:v=>status=v,setPlan:v=>plan={imageBrief:{description:'Detailed textile artwork with a complete recognizable subject and clean composition.',lettering:[]},...v},setReview:v=>verdict=v,setReviewHTTP:v=>reviewHTTP=v,count:()=>submissions,queries:()=>queries,imagePrompt:()=>lastImagePrompt,plannerPrompt:()=>lastPlannerPrompt,failDownload:()=>failDownload=true};}
test('complex designs route to images; color-only edits and source logos stay fast',()=>{
 assert.ok(imageTextureRequest({operation:'tailor',tailoring:spec},'flowers'));
 assert.equal(imageTextureRequest({operation:'tailor',tailoring:spec,changedFields:['color']},'orange'),null);
 assert.equal(imageTextureRequest({operation:'tailor',tailoring:{...spec,artwork:{...spec.artwork,reference:'arcteryx'}}},'logo'),null);
 assert.equal(imageTextureRequest({operation:'style'},'flowers'),null);
});
test('image jobs survive restart, preview before saving, retain wardrobe texture after unequip',async()=>{
 const f=fixture();try{let s=f.studio();const b={scope:'outfit',outfitType:'top',version:0,prompt:'botanical flowers',requestId:randomUUID()},j=await s.start(1,b);
 assert.equal(s.get(1,j.job).status,'queued');assert.equal(s.get(1,j.job).provider,'modelscope-image');assert.equal((await s.start(1,b)).job,j.job);assert.equal(f.count(),1);
 s=f.studio();await s.tick();assert.equal(s.get(1,j.job).status,'in_progress');f.setStatus('SUCCEED');await s.tick();const ready=s.get(1,j.job);assert.equal(ready.status,'ready');assert.equal(f.design.current(1).version,0);
 const texture=ready.result.values.tailoring.texture;assert.equal(texture.layout,'repeat');assert.deepEqual(Buffer.from(s.texture(1,texture.id).image),png);
 const saved=f.design.accept(1,{id:ready.result.id,version:0});assert.equal(saved.design.outfit.tailoring.texture.id,texture.id);
 f.design.unequip(1,{slot:'garment',version:1});assert.ok(f.design.wardrobeView(1).wardrobe.some(x=>JSON.stringify(x).includes(texture.id)));assert.equal(f.count(),1);
 }finally{f.db.close();}
});
test('failed image task retains previous clothing and never retries submission',async()=>{
 const f=fixture();try{const s=f.studio(),j=await s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'flowers',requestId:randomUUID()});f.setStatus('FAILED');await s.tick();await s.tick();assert.equal(s.get(1,j.job).status,'failed');assert.equal(f.design.current(1).version,0);assert.equal(f.count(),1);}finally{f.db.close();}
});
test('saved image clothing supports color-only edits without a second image task',async()=>{
 const f=fixture();try{const s=f.studio();const j=await s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'flowers',requestId:randomUUID()});f.setStatus('SUCCEED');await s.tick();const ready=s.get(1,j.job);f.design.accept(1,{id:ready.result.id,version:0});const id=ready.result.values.tailoring.texture.id;
 f.setPlan({operation:'tailor',tailoring:{kind:'top',color:'#a0bdb0'},changedFields:['color']});const edit=await s.start(1,{scope:'outfit',outfitType:'top',version:1,prompt:'only change color',requestId:randomUUID()});const result=s.get(1,edit.job);assert.equal(result.status,'ready');assert.equal(result.result.values.tailoring.color,'#a0bdb0');assert.equal(result.result.values.tailoring.texture.id,id);assert.equal(f.count(),1);
 }finally{f.db.close();}
});
test('image hats occupy headwear and preserve existing body clothes',async()=>{
 const f=fixture();try{f.setPlan({operation:'tailor',tailoring:{...spec,kind:'hat',name:'floral bucket hat'}});const s=f.studio(),j=await s.start(1,{scope:'outfit',outfitType:'hat',version:0,prompt:'flowers',requestId:randomUUID()});f.setStatus('SUCCEED');await s.tick();const result=s.get(1,j.job).result.values;assert.equal(result.headwear.kind,'hat');assert.ok(result.headwear.texture.id);assert.equal(result.garment,'original');assert.equal(result.tailoring,undefined);}finally{f.db.close();}
});
test('texture schema excludes arbitrary URLs, download excludes arbitrary hosts and non-images',async()=>{
 assert.throws(()=>validateTailoring({...spec,texture:{id:randomUUID(),layout:'repeat',url:'https://evil'}}));
 const c=createModelScopeImage({fetcher:async()=>new Response('not an image')});await assert.rejects(c.download('https://localhost/secret'));await assert.rejects(c.download('https://x.aliyuncs.com/result'),/支持的图片/);
});

test('completed result metadata survives download interruption without querying task again',async()=>{
 const f=fixture();try{let s=f.studio();const j=await s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'flowers',requestId:randomUUID()});f.setStatus('SUCCEED');f.failDownload();await s.tick();assert.equal(f.queries(),1);assert.notEqual(s.get(1,j.job).status,'ready');f.setStatus('FAILED');s=f.studio();await s.tick();assert.equal(s.get(1,j.job).status,'ready');assert.equal(f.queries(),1);assert.equal(f.count(),1);}finally{f.db.close();}
});

test('Ralph Lauren exact hat prompt uses the official reference without an image submission',async()=>{
 const f=fixture();try{f.setPlan({operation:'tailor',tailoring:{...spec,kind:'hat',name:'Polo hat',artwork:null}});const s=f.studio(),j=await s.start(1,{scope:'outfit',outfitType:'hat',version:0,prompt:'\u62c9\u592b\u52b3\u4f26\u7684logo',requestId:randomUUID()});const r=s.get(1,j.job);assert.equal(r.status,'ready');assert.equal(r.result.values.headwear.artwork.reference,'ralphLauren');assert.equal(f.count(),0);}finally{f.db.close();}
});

test('failed visual review corrects once, then rejects without changing the wardrobe',async()=>{
 const f=fixture();try{f.setReview({pass:false,issues:['Unwanted misspelled lettering'],correction:'Remove all letters'});const s=f.studio(),j=await s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'flowers',requestId:randomUUID()});f.setStatus('SUCCEED');await s.tick();assert.equal(s.get(1,j.job).status,'queued');assert.equal(f.count(),2);await s.tick();assert.equal(s.get(1,j.job).status,'failed');assert.equal(f.count(),2);assert.equal(f.design.current(1).version,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM studio_textures').get().n,0);}finally{f.db.close();}
});
test('visual review authorization errors never become successful previews or repeat submissions',async()=>{
 const f=fixture();try{f.setReviewHTTP(401);const s=f.studio(),j=await s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'flowers',requestId:randomUUID()});f.setStatus('SUCCEED');await s.tick();await s.tick();assert.equal(s.get(1,j.job).status,'failed');assert.equal(f.count(),1);assert.equal(f.design.current(1).version,0);}finally{f.db.close();}
});

test('semantic visual brief reaches the image artist without stale 3D routing instructions',async()=>{
 const f=fixture();try{f.setPlan({operation:'tailor',tailoring:spec,imageBrief:{description:'A fox with pointed connected ears, orange forehead, two white cheeks, two eyes and one black nose, coherent embroidered contour.',lettering:[]}});const s=f.studio();await s.start(1,{scope:'outfit',outfitType:'top',version:0,prompt:'fox',requestId:randomUUID()});assert.match(f.imagePrompt(),/pointed connected ears/);assert.match(f.imagePrompt(),/ZERO letters/);assert.doesNotMatch(f.plannerPrompt(),/use asset_create|其他帽型用3D|自动路由规则优先/);assert.equal(f.count(),1);}finally{f.db.close();}
});

test('generic brand reference resolves the brand name and bypasses image generation',async()=>{
 const f=fixture();try{f.setPlan({operation:'tailor',tailoring:{...spec,kind:'hat',artwork:null},imageBrief:{brand:'Nike',description:'Nike swoosh symbol centered on the front, no additional letters.',lettering:[]}});const s=f.studio(),j=await s.start(1,{scope:'outfit',outfitType:'hat',version:0,prompt:'Nike logo',requestId:randomUUID()});const r=s.get(1,j.job);assert.equal(r.status,'ready');assert.equal(r.result.values.headwear.artwork.brand,'nike');assert.equal(f.count(),0);assert.equal(imageTextureRequest({operation:'tailor',tailoring:r.result.values.headwear},'Nike logo'),null);}finally{f.db.close();}
});
test('exact short lettering does not route through image generation',()=>{assert.equal(imageTextureRequest({operation:'tailor',tailoring:{...spec,artwork:{layout:'front',layers:[{type:'text',x:.5,y:.5,text:'HELLO',size:.1,fill:'#111111'}]}}},'HELLO print'),null);});
