import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {makeSippingDrink,sipAmount,sippingMouth} from '../dist/sipping-drink.js';
import {drinkFoods} from '../dist/food-catalog.js';

// A conservative envelope around the pear torso (including its small breathing motion).
const profile=[[.16,0],[.17,.19],[.23,.28],[.34,.325],[.46,.337],[.58,.312],[.70,.279],[.82,.282],[.92,.268],[1.005,.207],[1.047,.11],[1.06,0]];
function radius(y){if(y<.16||y>1.06)return 0;for(let i=1;i<profile.length;i++)if(y<=profile[i][0]){const[a,r]=profile[i-1],[b,s]=profile[i];return r+(s-r)*(y-a)/(b-a)+.008}return 0}
test('every drink stays outside the torso and muzzle throughout a complete sip; wrist never stretches',()=>{
 for(const id of drinkFoods){
  const avatar=new T.Group(),body=new T.Group(),arm=new T.Group();avatar.add(body);body.add(arm);arm.position.set(-.27,.61,0);avatar.rotation.set(-1.05,0,1.36);
  const drink=makeSippingDrink(body,arm,avatar,id);
  for(let t=0;t<=14;t+=.2){
   drink.tick(t);avatar.updateMatrixWorld(true);const state=drink.state();assert(Math.abs(new T.Vector3(...state.wrist).distanceTo(arm.position)-.31)<1e-6,id+' wrist');
   if(sipAmount(t)===1)assert(state.mouthGap<1e-6,id+' mouth contact');
   body.getObjectByName('held-drink').traverse(o=>{if(!o.isMesh)return;const vertices=o.geometry.attributes.position;for(let k=0;k<vertices.count;k+=2){const p=new T.Vector3().fromBufferAttribute(vertices,k);body.worldToLocal(o.localToWorld(p));assert(Math.hypot(p.x,p.z/.81)>radius(p.y),id+' torso t='+t);assert((p.x/.095)**2+((p.y-.791)/.092)**2+((p.z-.228)/.065)**2>1.05,id+' muzzle t='+t)}});
  }
  drink.dispose();assert.equal(body.getObjectByName('held-drink'),undefined);
 }
});
test('sip animation pauses at the mouth and returns to the same resting pose without a loop jump',()=>{
 assert.equal(sipAmount(0),0);assert.equal(sipAmount(6),1);assert.equal(sipAmount(7.5),1);assert.equal(sipAmount(10),0);assert.equal(sipAmount(14),0);assert.equal(sipAmount(28),0);
 assert.equal(sippingMouth.z,.304);
});
