import test from 'node:test';
import assert from 'node:assert/strict';
import {waterEdge,waterSurface,waterRadius,detailBeachY} from '../dist/cafe-water-surface.js';
import {coastEdge} from '../dist/cafe-marine.js';
test('detail coast meets a level sea at every longitude without a basin',()=>{
 for(let i=0;i<720;i++){const a=i*Math.PI/360,e=coastEdge(a),r=Math.sin(e)*17.8;assert.equal(waterEdge(a),e);assert.ok(Math.abs(detailBeachY(Math.cos(a)*r,Math.sin(a)*r)+1.8)<1e-8);for(const d of [0,1,5,40,800])assert.equal(waterSurface(a,r+d),-1.8)}
});
test('radial mesh is ordered and dry sand remains above the water',()=>{
 for(let i=0;i<180;i++){const a=i*Math.PI/90;let previous=-1;for(let j=0;j<=112;j++){const r=waterRadius(a,j/112);assert.ok(r>previous);assert.ok(Number.isFinite(waterSurface(a,r)));previous=r}const r=Math.sin(waterEdge(a))*17.8;for(let j=0;j<20;j++)assert.ok(detailBeachY(Math.cos(a)*r*j/20,Math.sin(a)*r*j/20)>-1.8)}
});

test('dolphin routes and splash rings stay offshore throughout the leap',()=>{for(const a of [.75,2.05,3.75]){const r=Math.sin(coastEdge(a))*17.8+5.5;for(let z=-4;z<=4;z+=.1){const x=Math.cos(a)*r,y=Math.sin(a)*r+z,edge=Math.sin(coastEdge(Math.atan2(y,x)))*17.8;assert.ok(Math.hypot(x,y)>edge+1)}}});
