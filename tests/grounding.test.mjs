import test from 'node:test';
import assert from 'node:assert/strict';
import {footBottom,groundedBody} from '../dist/grounding.js';
test('both identities keep the supporting foot on the floor throughout a walking cycle',()=>{
 for(let phase=0;phase<Math.PI*2;phase+=.025){const angles=[Math.sin(phase)*.48,Math.sin(phase+Math.PI)*.48];const body=groundedBody(angles);const feet=angles.map(a=>footBottom(a)+body);assert.ok(Math.min(...feet)>-1e-9);assert.ok(Math.abs(Math.min(...feet))<1e-9)}
 assert.ok(Math.abs(footBottom(0)+groundedBody([0,0]))<1e-9);
});
