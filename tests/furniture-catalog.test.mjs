import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import * as T from '../dist/vendor/three.module.js';
import {furnitureCatalog,standardKind} from '../dist/furniture-catalog.js';
import {buildStandardFurniture} from '../dist/standard-furniture.js';
import {validateObjects} from '../dist/studio-schema.js';
import {resolveFurnitureSupport} from '../dist/furniture-placement.js';
import {studioLayout,placeNewFurniture} from '../dist/studio-layout.js';
import {homeLayouts} from '../dist/home-layout.js';
import {standardHomeTool} from '../backend/studio-contract.mjs';
const spec=(type,variant)=>{const c=furnitureCatalog[type],[width,height,depth]=c.size;return {id:randomUUID(),standard:type,kind:standardKind(type),name:c.label,variant:variant||c.variants[0],mount:c.mounts[0],width,height,depth,seat:type==='stool'?height:.55,tint:'#aab8a1',accent:'#e2c6a6',shape:'round',pattern:'check',floor:0,x:-2.4,z:.9,yaw:0}};
for(const [type,c]of Object.entries(furnitureCatalog))test('catalogue '+type+' has validated geometry and matching text contract',()=>{
 for(const variant of c.variants){let o=spec(type,variant);if(type==='sofa')Object.assign(o,{x:2.8,z:.95,yaw:-Math.PI/2});o=resolveFurnitureSupport(homeLayouts[0],o);validateObjects([o]);const g=buildStandardFurniture(o),b=new T.Box3().setFromObject(g),size=b.getSize(new T.Vector3());assert.ok([size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0));if(!['sofa','lamp','rug','curtain'].includes(type)){for(const [key,want]of [['x',o.width],['y',o.height],['z',o.depth]])assert.ok(Math.abs(size[key]-want)<.001,type+key);}if(type==='stool')g.traverse(q=>{if(q.isMesh)assert.equal(q.userData.action,'sit-ai-'+o.id)});}
 const props=standardHomeTool(type).function.parameters.properties.object.properties;assert.deepEqual(props.kind.enum,[standardKind(type)]);assert.deepEqual(props.variant.enum,c.variants);
});
test('supported pieces are anchored in both rooms; duplicates and floating pieces are rejected',()=>{
 for(const base of homeLayouts)for(const type of ['vase','cushion','blanket','curtain','wallArt','hangingPlant']){const o=resolveFurnitureSupport(base,spec(type));assert.doesNotThrow(()=>studioLayout(base,[o],true));assert.throws(()=>studioLayout(base,[{...o,y:7}],true));assert.throws(()=>studioLayout(base,[o,{...o,id:randomUUID()}],true));}
});
test('new floor furniture finds a safe spot while retaining every activity route',()=>{
 for(const base of homeLayouts)for(const type of ['table','sideTable','nightstand','stool','floorPlant']){const before=JSON.stringify(base),o=placeNewFurniture(base,[],resolveFurnitureSupport(base,spec(type)));assert.doesNotThrow(()=>studioLayout(base,[o],true));assert.equal(JSON.stringify(base),before);}
});
test('oversize support and invalid structural parameters fail before rendering',()=>{
 assert.throws(()=>resolveFurnitureSupport(homeLayouts[0],{...spec('vase'),width:2}));assert.throws(()=>validateObjects([{...spec('stool'),seat:.9}]));assert.throws(()=>validateObjects([{...spec('vase'),variant:'untrusted'}]));
});
