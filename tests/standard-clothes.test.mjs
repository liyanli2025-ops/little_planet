import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createTeddy} from '../dist/teddy.js';
import {defaultDesign} from '../dist/design-schema.js';
import {standardOutfitTool} from '../backend/studio-contract.mjs';
test('standard tool restricts kind and requires both pieces; skirt has two lengths',()=>{
 const set=standardOutfitTool('set').function.parameters;assert.deepEqual(set.properties.operation.enum,['tailor','explain']);assert.ok(set.properties.tailoring.required.includes('pantsColor'));
 assert.deepEqual(standardOutfitTool('dress').function.parameters.properties.tailoring.properties.length.enum,[.22,.38]);
});
test('two-piece sleeves and trouser legs stay parented during poses; head veil leaves face clear',()=>{
 const old=globalThis.document;globalThis.document={createElement(){return {getContext(){return new Proxy({createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}}},{get:(o,k)=>o[k]||(()=>{})})}}}};
 try{for(const identity of [0,1]){const scene=new T.Group(),bear=createTeddy(scene,identity),spec={kind:'set',name:'套装',pattern:'flower',color:'#ffffff',accent:'#bb9988',length:.22,flare:.06,pleats:8,patternScale:.06,pantsColor:'#526e5c'};
 bear.design({...defaultDesign().outfit,garment:'plain',tailoring:spec,headwear:{...spec,kind:'veil'}});
 for(const leg of bear.legs)assert.ok(leg.getObjectByName('tailored-trouser-leg'));for(const arm of bear.arms)assert.ok(arm.getObjectByName('tailored-sleeve'));
 for(const pose of [0,.5,1.15]){bear.legs.forEach(l=>l.rotation.x=-pose);bear.arms.forEach(a=>a.rotation.x=pose);bear.rainTick(0);scene.updateMatrixWorld(true);scene.traverse(o=>{const pos=o.geometry?.attributes.position;if(pos)for(const n of pos.array)assert.ok(Number.isFinite(n))})}
 const veil=scene.getObjectByName('standard-headwear').children.find(m=>m.material.transparent);assert.ok(veil);const pos=veil.geometry.attributes.position;for(let i=0;i<pos.count;i++)assert.ok(pos.getZ(i)<.001);
 bear.sleep(true);assert.equal(scene.getObjectByName('standard-headwear').visible,false);assert.equal(bear.legs[0].getObjectByName('tailored-trouser-leg').visible,false);
 bear.design(defaultDesign().outfit);assert.equal(bear.legs[0].getObjectByName('tailored-trouser-leg'),undefined);
 }}finally{globalThis.document=old}
});
