import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createClothing} from '../dist/clothing.js';
test('overalls include two leg-bound trousers and remove them on outfit change',()=>{
 const body=new T.Group(),legs=[new T.Group(),new T.Group()];legs.forEach((leg,i)=>{leg.position.set(i?.145:-.145,.25,0);body.add(leg)});
 const clothing=createClothing(body,[],legs);clothing.set('denim');body.updateMatrixWorld(true);
 for(const leg of legs){const trousers=leg.getObjectByName('overall-trouser-leg');assert.ok(trousers);assert.equal(trousers.parent,leg);const box=new T.Box3().setFromObject(trousers);assert.ok(box.min.y<.09);assert.ok(box.max.y>.30);leg.rotation.x=-1.15;body.updateMatrixWorld(true);assert.ok(trousers.getWorldQuaternion(new T.Quaternion()).angleTo(leg.getWorldQuaternion(new T.Quaternion()))<1e-6);}
 clothing.set('cream');for(const leg of legs)assert.equal(leg.getObjectByName('overall-trouser-leg'),undefined);clothing.dispose();
});
