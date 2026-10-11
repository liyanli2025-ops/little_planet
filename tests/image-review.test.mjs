import test from 'node:test';import assert from 'node:assert/strict';
import {parseImageVerdict} from '../backend/image-review.mjs';
test('reads one actual structured verdict even when surrounded by explanation',()=>{
 assert.deepEqual(parseImageVerdict('Explanation\n```json\n{"pass":false,"issues":["Missing logo"],"correction":"Draw the complete symbol"}\n```'),{pass:false,issues:['Missing logo'],correction:'Draw the complete symbol'});
});
test('never infers approval from prose, malformed fields or competing verdicts',()=>{
 for(const text of ['Looks fine','{"pass":"true","issues":[],"correction":""}','```json\n{"pass":true,"issues":[],"correction":""}\n```\n```json\n{"pass":false,"issues":[],"correction":""}\n```'])assert.equal(parseImageVerdict(text),null);
});
