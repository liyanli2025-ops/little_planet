import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStudioReply,repairInstruction} from '../backend/studio-reply.mjs';
const p={operation:'asset_create',reply:'预览头纱',description:'白色薄纱头纱，有小花装饰，无人物',wearable:{name:'小花头纱',slot:'hat',width:.4,height:.5,depth:.32,x:0,y:.24,z:0,yaw:0,tint:'#ffffff'}};
const wrap=(message,finish_reason='stop')=>JSON.stringify({choices:[{finish_reason,message}]});
test('flower veil parses from one tool call or complete JSON content, no fabrication',()=>{for(const argumentsValue of [JSON.stringify(p),p])assert.deepEqual(parseStudioReply(wrap({tool_calls:[{function:{name:'edit_object',arguments:argumentsValue}}]}),'outfit'),p);for(const content of [JSON.stringify(p),'```json\n'+JSON.stringify(p)+'\n```'])assert.deepEqual(parseStudioReply(wrap({content}),'outfit'),p)});
test('reports truncated, prose-only, multiple-tool and missing-field outputs separately',()=>{for(const [raw,code]of [[wrap({content:JSON.stringify(p)},'length'),'truncated'],[wrap({content:'用户的私密描述'}),'no_plan'],[wrap({tool_calls:[{},{}]}),'multiple_tools'],[wrap({content:JSON.stringify({...p,wearable:{name:'小花头纱'}})}),'invalid_plan']]){assert.throws(()=>parseStudioReply(raw,'outfit'),e=>{assert.equal(e.planCode,code);assert.ok(!JSON.stringify(e.diagnostic).includes('私密'));return true})}});
test('repair instructions route veil to independent model rather than basic skirt',()=>{const s=repairInstruction('outfit','no_plan');assert.match(s,/asset_create/);assert.match(s,/头纱/);assert.match(s,/只提交一次/);assert.match(repairInstruction('home','truncated'),/被截断/)});

const tool=argumentsValue=>wrap({tool_calls:[{function:{name:'edit_object',arguments:argumentsValue}}]});
test('repairs fenced arguments, leading decimals and trailing commas without changing strings',()=>{
 const design={...p,description:'保留 .4、逗号,}、引号"和反斜线\\',wearable:{...p.wearable,x:-0.2}};
 const json=JSON.stringify(design);
 for(const a of ['```json\n'+json+'\n```',json.replace('"width":0.4','"width":.4').replace('"x":-0.2','"x":-.2').replace('"y":0.24','"y":.24').replace(/}}$/,',},}')])assert.deepEqual(parseStudioReply(tool(a),'outfit'),design);
});
test('malformed values are not invented; failed arguments available only to repair, not diagnostics',()=>{
 for(const a of ['{"operation":"asset_create","description":"私密设计","wearable":',JSON.stringify(p).slice(0,-1),'not JSON','{"operation":"explain","reply":undefined}'])assert.throws(()=>parseStudioReply(tool(a),'outfit'),e=>{
  assert.equal(e.planCode,'arguments_json');assert.equal(e.repairArguments,a);assert.ok(e.diagnostic.syntax);assert.ok(!JSON.stringify(e.diagnostic).includes('私密'));return true;
 });
 assert.throws(()=>parseStudioReply(tool(JSON.stringify(p).replace('"width":0.4','"width":-.99')),'outfit'),e=>e.planCode==='invalid_plan');
});

test('replays actual Tencent veil response with comma decimal coordinates',()=>{
 const raw=readFileSync(new URL('./fixtures/studio-veil-decimal-comma.txt',import.meta.url),'utf8');
 assert.throws(()=>JSON.parse(raw));
 const actual=parseStudioReply(tool(raw),'outfit');
 assert.deepEqual(actual,JSON.parse(raw.replace('"x": 0,5','"x": 0.5').replace('"z": 0,6','"z": 0.6')));
 assert.throws(()=>parseStudioReply(tool(raw.replace('"x": 0,5','"x": 0,9')),'outfit'),e=>e.planCode==='invalid_plan');
});
test('comma decimal compatibility preserves text and arrays and rejects ambiguous values',()=>{
 const raw=JSON.stringify({...p,description:'原文 0,5 和 : 0,6, 都保留'}).replace('"x":0','"x":-0,25');
 const actual=parseStudioReply(tool(raw),'outfit');assert.equal(actual.wearable.x,-0.25);assert.equal(actual.description,'原文 0,5 和 : 0,6, 都保留');
 const array=JSON.stringify({...p,wearable:{...p.wearable,x:[0,5]}}).replace('"height":0.5','"height":.5');
 assert.throws(()=>parseStudioReply(tool(array),'outfit'),e=>{assert.equal(e.planCode,'invalid_plan');assert.deepEqual(JSON.parse(e.repairArguments).wearable.x,[0,5]);return true});
 for(const value of ['1,000','0,5,6','0, 5'])assert.throws(()=>parseStudioReply(tool(JSON.stringify(p).replace('"x":0','"x":'+value)),'outfit'),e=>e.planCode==='arguments_json');
});
