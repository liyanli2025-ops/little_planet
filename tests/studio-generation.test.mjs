import test from 'node:test';
import assert from 'node:assert/strict';
import {generationPrompt,initialPlacement} from '../backend/studio-generation.mjs';
test('provider prompt always includes object-only constraints and preserves creative request',()=>{
 for(const scope of ['home','outfit']){const p=generationPrompt({description:'白色薄纱头纱，散布小花',wearable:{slot:'hat'}},scope);assert.ok(p.startsWith('白色薄纱头纱，散布小花'));assert.match(p,/禁止人物/)}
 assert.match(generationPrompt({description:'头纱',wearable:{slot:'hat'}},'outfit'),/底部留出佩戴空间/);
 assert.throws(()=>generationPrompt({description:'纱'.repeat(340)},'outfit'),/过长/);
});
test('new headwear starts centered; explicit fitting and other slots stay unchanged',()=>{
 const p={operation:'asset_create',wearable:{slot:'hat',x:0.5,y:1.2,z:0.6,width:0.4}};
 assert.deepEqual(initialPlacement(p).wearable,{...p.wearable,x:0,y:0.24,z:0});assert.equal(p.wearable.x,0.5);
 for(const operation of ['asset_fit','asset_regenerate']){const edit={...p,operation};assert.equal(initialPlacement(edit),edit)}
 const back={...p,wearable:{...p.wearable,slot:'back'}};assert.equal(initialPlacement(back),back);
});
