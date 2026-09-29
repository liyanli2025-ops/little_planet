import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createTeddy} from '../dist/teddy.js';
import {hammockLocation} from '../dist/hammock.js';
import {normal,distance} from '../dist/surface-nav.js';
test('continuous arms keep their rounded root inside the torso through carrying, sitting and cooking',()=>{
 const previous=globalThis.document;globalThis.document={createElement(){return {getContext(){return {fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}}}};
 try{for(const identity of [0,1]){const root=new T.Group(),teddy=createTeddy(root,identity);for(let phase=0;phase<Math.PI*2;phase+=.04){teddy.arms.forEach((arm,i)=>{arm.rotation.set(-1.9*(.5-.5*Math.cos(phase)),0,(i?1:-1)*.35*Math.sin(phase));root.updateMatrixWorld(true);const mesh=arm.getObjectByName('continuous-arm'),v=mesh.geometry.attributes.position;assert.equal(arm.children.filter(x=>x.isMesh).length,1);for(let j=0;j<v.count;j++){const p=new T.Vector3().fromBufferAttribute(v,j);assert(p.toArray().every(Number.isFinite));if(p.y>.094){teddy.body.worldToLocal(mesh.localToWorld(p));assert(Math.hypot(p.x,p.z/.81)<.28,'rounded root must stay inside torso')}}assert.equal(arm.position.y,.61)})}const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(x=>x.dispose());ms.forEach(x=>{x.bumpMap?.dispose();x.dispose()})}}finally{globalThis.document=previous}
});
test('hammock occupies its own part of the planet, away from the garden, house and camp',()=>{const n=normal(hammockLocation.theta,hammockLocation.latitude);for(const [t,l]of [[1.6,-.55],[-.21,-.1],[-1.35,.02]])assert(distance(n,normal(t,l))>4)});
