import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createTeddy} from '../dist/teddy.js';
import {hammockLocation} from '../dist/hammock.js';
import {normal,distance} from '../dist/surface-nav.js';
test('rotating cooking arms remain embedded in the soft shoulder roots for both bears',()=>{
 const previous=globalThis.document;globalThis.document={createElement(){return {getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}}}};
 try{for(const identity of [0,1]){const root=new T.Group(),teddy=createTeddy(root,identity);for(let phase=0;phase<Math.PI*2;phase+=.04){teddy.arms.forEach((arm,i)=>{arm.rotation.set(-1.65,0,(i?1:-1)*(.22+.32*(.5-.5*Math.cos(phase))));root.updateMatrixWorld(true);const joint=arm.getObjectByName('shoulder-joint'),socket=teddy.body.getObjectByName('shoulder-root-'+i),center=joint.getWorldPosition(new T.Vector3());socket.worldToLocal(center);assert(center.length()<.3,'joint center stays deeply inside shoulder surface');assert.equal(arm.position.y,.61)})}const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(x=>x.dispose());ms.forEach(x=>{x.bumpMap?.dispose();x.dispose()})}}finally{globalThis.document=previous}
});
test('hammock occupies its own part of the planet, away from the garden, house and camp',()=>{const n=normal(hammockLocation.theta,hammockLocation.latitude);for(const [t,l]of [[1.6,-.55],[-.21,-.1],[-1.35,.02]])assert(distance(n,normal(t,l))>4)});
