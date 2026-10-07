import test from 'node:test';
import assert from 'node:assert/strict';
import {beachWalkable,cafeRouteWalkable} from '../dist/cafe-navigation.js';
import {STAIR_BOTTOM} from '../dist/cafe-upper-layout.js';
import {waterEdge} from '../dist/cafe-water-surface.js';
test('all sides of dry beach connect to downstairs landing without entering water',()=>{
 const step=.3,start=[Math.round(STAIR_BOTTOM.x/step),Math.round(STAIR_BOTTOM.z/step)],queue=[start],seen=new Set([start.join(',')]);
 for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,k=a+','+b;if(!seen.has(k)&&beachWalkable(a*step,b*step)){seen.add(k);queue.push([a,b])}}}
 for(const [x,z]of [[-9,4.2],[-10,-3],[-8,-8],[0,-10],[10,-4],[10,6],[0,12],[-12,8]]){assert.ok(beachWalkable(x,z));assert.ok(seen.has([Math.round(x/step),Math.round(z/step)].join(',')),`unreachable ${x},${z}`)}
 assert.ok(cafeRouteWalkable(STAIR_BOTTOM.x,STAIR_BOTTOM.z,0));
 for(let a=0;a<Math.PI*2;a+=.05){const r=Math.sin(waterEdge(a))*17.8;assert.equal(beachWalkable(Math.cos(a)*r,Math.sin(a)*r),false)}
 for(const p of [[0,0],[6,0],[NaN,10],[0,Infinity]])assert.equal(beachWalkable(...p),false);
});
