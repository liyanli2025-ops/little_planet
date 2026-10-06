import test from 'node:test';
import assert from 'node:assert/strict';
import {buildingGroundY,entranceStepTop} from '../dist/cafe-grounding.js';
import {cafeSeats} from '../dist/cafe-catalog.js';
import {beachSeats} from '../dist/beach-seats.js';
import {cafeRouteWalkable} from '../dist/cafe-navigation.js';
import {marineLeap} from '../dist/cafe-marine-motion.js';
test('entrance bottom lands on the beach in both views and steps descend continuously',()=>{
 for(const globe of [false,true]){let previous=.21;for(let i=0;i<16;i++){const top=entranceStepTop(i,globe);assert.ok(top<previous);previous=top}assert.ok(Math.abs(entranceStepTop(15,globe)-buildingGroundY(0,9.2,globe))<.021)}
 for(const [x,z] of [[7,7.2],[-6,-2],[0,9.2]]){const y=buildingGroundY(x,z,true)*.65;assert.ok(Math.abs(Math.hypot(x*.65,y+18.25,z*.65)-17.845)<1e-8)}
});
test('shore chairs and approaches stay accessible on dry beach',()=>{
 const queue=[[0,32]],seen=new Set(['0,32']);for(let i=0;i<queue.length&&i<6000;i++){const [x,z]=queue[i];for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,key=a+','+b;if(!seen.has(key)&&cafeRouteWalkable(a*.3,b*.3)){seen.add(key);queue.push([a,b])}}}
 for(const s of beachSeats){assert.ok(cafeSeats.some(c=>c.id===s.id));assert.ok(cafeRouteWalkable(s.x,s.z));assert.ok(cafeRouteWalkable(s.approachX,s.approachZ));assert.ok(queue.some(([x,z])=>Math.hypot(x*.3-s.approachX,z*.3-s.approachZ)<.38))}
});
test('larger slower whale keeps its nose tangent to the leap',()=>{const options={duration:4.6,height:3.3,depth:1.8,travel:7};for(let t=.1;t<4.5;t+=.1){const a=marineLeap(t,25,options),b=marineLeap(t+.001,25,options);assert.ok(Math.abs(Math.atan2(b.y-a.y,b.z-a.z)+a.pitch)<.003)}assert.equal(marineLeap(6,25,options).visible,false)});
