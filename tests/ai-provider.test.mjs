import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveDesignEnv,designThinking} from '../backend/ai-provider.mjs';
test('Tencent migration uses existing key and replaces all stale GLM fields without mutating env',()=>{
 const old={AI_API_KEY:'glm-secret',AI_BASE_URL:'https://open.bigmodel.cn/api/paas/v4',AI_MODEL:'glm-4.7-flash',TENCENT_3D_API_KEY:'tc-secret'};
 const e=resolveDesignEnv(old);assert.equal(e.AI_API_KEY,'tc-secret');assert.equal(e.AI_MODEL,'hy3');assert.equal(e.AI_BASE_URL,'https://tokenhub.tencentmaas.com/v1');assert.equal(old.AI_API_KEY,'glm-secret');
 assert.deepEqual(designThinking(e.AI_BASE_URL,e.AI_MODEL),{thinking:{type:'disabled'}});
 assert.equal(resolveDesignEnv({...old,TENCENT_TEXT_MODEL:'hy4-preview'}).AI_MODEL,'hy4-preview');
});
test('explicit custom is retained, missing Tencent key never falls back silently',()=>{
 const e={AI_API_KEY:'other',AI_BASE_URL:'https://other.example',AI_MODEL:'other',TENCENT_3D_API_KEY:'tc'};
 assert.equal(resolveDesignEnv({...e,AI_TEXT_PROVIDER:'custom'}).AI_API_KEY,'other');
 assert.equal(resolveDesignEnv({...e,TENCENT_3D_API_KEY:'',AI_TEXT_PROVIDER:'tencent'}).AI_API_KEY,'');
 assert.deepEqual(designThinking('https://other.example','hy3'),{});
 assert.throws(()=>resolveDesignEnv({AI_TEXT_PROVIDER:'typo'}));
});
