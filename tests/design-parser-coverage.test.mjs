import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createDesignService} from '../backend/design.mjs';
import {parseStudioReply} from '../backend/studio-reply.mjs';
import {designExamples} from '../dist/design-schema.js';
import {creationExamples} from '../dist/creation-schema.js';
const id='11111111-1111-4111-8111-111111111111';
const wearable={name:'云朵背包',slot:'back',width:0.3,height:0.4,depth:0.15,x:0,y:0.28,z:-0.33,yaw:0,tint:'#ffffff'};
const object={name:'蘑菇灯',kind:'decor',floor:0,x:-2.5,z:0.9,yaw:0,width:0.35,height:0.8,depth:0.35,seat:0.5,tint:'#ffffff'};
const tailoring={kind:'top',name:'海边上衣',pattern:'stripe',color:'#6677aa',accent:'#ffffff',length:0.28,flare:0.07,pleats:12,patternScale:0.05};
const cases=[
 ['outfit',{operation:'asset_create',description:'云朵背包',wearable}],
 ['outfit',{operation:'asset_regenerate',target:id,description:'花朵背包',wearable:{width:0.4}}],
 ['outfit',{operation:'asset_fit',target:id,wearable:{width:0.3,y:0.24,z:-0.2}}],
 ['outfit',{operation:'asset_remove',target:id}],
 ['outfit',{operation:'tailor',tailoring}],
 ['outfit',{operation:'style',outfit:{hat:'beanie',accessoryColors:{hat:'#ff0000'}}}],
 ['outfit',{operation:'explain',reply:'先做裙子还是帽子？'}],
 ['home',{operation:'create',description:'温馨蘑菇灯',object}],
 ['home',{operation:'regenerate',target:id,description:'圆润台灯',object:{height:0.6}}],
 ['home',{operation:'move',target:id,object:{x:-0.5,z:0.6}}],
 ['home',{operation:'remove',target:id}],
 ['home',{operation:'explain',reply:'放在哪层？'}]
];
const wrap=(message,finish_reason='stop')=>JSON.stringify({choices:[{finish_reason,message}]});
for(const [scope,fields] of cases)test(scope+' '+fields.operation+' supports tool/content JSON without changing meaning',()=>{
 const plan={reply:'预览',...fields},json=JSON.stringify(plan);
 const variants=[json,'```json\n'+json+'\n```',json.replace(/:(-?)0\.(\d+)/g,':$10,$2'),json.replace(/:(-?)0\.(\d+)/g,':$1.$2'),json.slice(0,-1)+',}'];
 for(const args of variants){
  assert.deepEqual(parseStudioReply(wrap({tool_calls:[{function:{name:'edit_object',arguments:args}}]}),scope),plan);
  assert.deepEqual(parseStudioReply(wrap({content:args}),scope),plan);
 }
 assert.throws(()=>parseStudioReply(wrap({content:json},'length'),scope),e=>e.planCode==='truncated');
 assert.throws(()=>parseStudioReply(wrap({tool_calls:[{function:{name:'wrong',arguments:json}}]}),scope),e=>e.planCode==='wrong_tool');
});
const env={AI_DESIGN_ENABLED:'true',AI_API_KEY:'test',AI_BASE_URL:'https://test.example',AI_MODEL:'test'};
for(const scope of ['outfit','home','planet'])test('legacy '+scope+' accepts shared formats but never saves before acceptance',async()=>{
 const values={...designExamples[scope],...(creationExamples[scope]?{creation:creationExamples[scope]}:{})};
 const json=JSON.stringify(values),db=new DatabaseSync(':memory:');let args,calls=0;
 const service=createDesignService(db,{env,fetcher:async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{tool_calls:[{function:{name:'propose_design',arguments:args}}]}}]})}});
 try{for(const [i,value]of [json,'```json\n'+json+'\n```',json.replace(/:(-?)0\.(\d+)/g,':$10,$2'),values].entries()){
  args=value;const request={scope,version:0,prompt:'改成温馨风格',requestId:'format-check-'+scope+'-'+i};
  const result=await service.generate(1,request);assert.deepEqual(result.values,values);
  assert.equal((await service.generate(1,request)).id,result.id);assert.equal(service.current(1).version,0);
 }assert.equal(calls,4)}finally{db.close()}
});
test('legacy truncated or invalid numeric output cannot create proposals or change saved design',async()=>{
 for(const finish of ['length','stop']){const db=new DatabaseSync(':memory:');
 const values={...designExamples.home,creation:{...creationExamples.home,width:99}};
 const service=createDesignService(db,{env,fetcher:async()=>Response.json({choices:[{finish_reason:finish,message:{tool_calls:[{function:{name:'propose_design',arguments:JSON.stringify(values)}}]}}]})});
 try{await assert.rejects(service.generate(1,{scope:'home',version:0,prompt:'沙发',requestId:'invalid-number-check'}));assert.equal(db.prepare('SELECT COUNT(*) n FROM design_proposals').get().n,0);assert.equal(service.current(1).version,0);assert.equal(db.prepare('SELECT status FROM design_requests').get().status,'failed')}finally{db.close()}
 }
});
