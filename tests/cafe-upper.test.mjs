import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createCafe} from '../backend/cafe.mjs';
import {STAIR_BOTTOM,UPPER_Y,upperSeats} from '../dist/cafe-upper-layout.js';
import {cafeRouteWalkable,cafeGroundY} from '../dist/cafe-navigation.js';
test('stairs and landing connect with continuous elevation to every upper seat',()=>{
 let last=cafeGroundY(STAIR_BOTTOM.x,STAIR_BOTTOM.z,1);
 for(let z=4.2;z>=-1.8;z-=.03){assert.ok(cafeRouteWalkable(-7.65,z,1));const y=cafeGroundY(-7.65,z,1);assert.ok(Math.abs(y-last)<.05);last=y}
 assert.ok(Math.abs(last-UPPER_Y)<.04);
 for(let x=-7.65;x<-5;x+=.05)assert.ok(cafeRouteWalkable(x,-1.8,1));
 for(const s of upperSeats)assert.ok(cafeRouteWalkable(s.approachX,s.approachZ,1));
 assert.equal(cafeRouteWalkable(0,9,1),false);
});
test('floor changes require staircase; upper guests cannot order downstairs or occupy ground seats',()=>{
 const db=new DatabaseSync(':memory:');try{const cafe=createCafe(db),u={id:1,username:'test',avatar:0};cafe.update(u,{action:'join'});
 assert.throws(()=>cafe.update(u,{action:'floor',floor:1}));
 assert.throws(()=>cafe.update(u,{action:'seat',seat:'upper-0'}));
 cafe.update(u,{action:'sync',...STAIR_BOTTOM,yaw:0});assert.equal(cafe.update(u,{action:'floor',floor:1}).guests[0].floor,1);
 cafe.update(u,{action:'sync',x:.35,z:-1.55,yaw:0,floor:0});assert.equal(cafe.view(u).guests[0].floor,1);
 assert.throws(()=>cafe.update(u,{action:'order',items:['cafe_latte'],mode:'here',command:'upstairs-order'}));
 assert.throws(()=>cafe.update(u,{action:'seat',seat:'t0-0'}));
 cafe.update(u,{action:'seat',seat:'upper-2'});assert.equal(cafe.view(u).guests[0].floor,1);
 cafe.update(u,{action:'stand'});cafe.update(u,{action:'sync',...STAIR_BOTTOM,yaw:0});assert.equal(cafe.update(u,{action:'floor',floor:0}).guests[0].floor,0);
 }finally{db.close()}
});
