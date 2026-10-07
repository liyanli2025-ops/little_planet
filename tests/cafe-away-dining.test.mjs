import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createCafe} from '../backend/cafe.mjs';
import {cafeSeats} from '../dist/cafe-catalog.js';
import {STAIR_BOTTOM} from '../dist/cafe-upper-layout.js';
import {CAFE_COUNTER} from '../dist/cafe-service-state.js';

for(const seat of cafeSeats.filter(s=>['cinema','beach','loft','roof'].includes(s.zone))){
 test('drink and dessert travel to '+seat.id+', loop until standing, then clear',()=>{
  const db=new DatabaseSync(':memory:');let time=100000;
  try{
   const cafe=createCafe(db,{now:()=>time}),u={id:1,username:'diner',avatar:0};
   const act=b=>cafe.update(u,b).guests[0],items=['cafe_latte','cafe_cupcake'];
   act({action:'join'});act({action:'sync',...CAFE_COUNTER});
   act({action:'order',items,mode:'here',command:'trip-'+seat.id});
   time+=17000;act({action:'sync',...CAFE_COUNTER});
   act({action:'pickup',command:'trip-'+seat.id});
   if(seat.floor){act({action:'sync',...STAIR_BOTTOM,yaw:0});assert.deepEqual(act({action:'floor',floor:1}).held.items,items)}
   const walking=act({action:'sync',x:seat.approachX??seat.x,z:seat.approachZ??seat.z+.58,yaw:seat.yaw});
   assert.deepEqual(walking.held.items,items);assert.ok(!walking.dining);
   const seated=act({action:'seat',seat:seat.id}),start=seated.dining.startedAt;
   assert.deepEqual(seated.dining.items,items);
   for(let cycle=0;cycle<4;cycle++){time+=5200;const g=act({action:'sync'});assert.equal(g.dining.startedAt,start);assert.deepEqual(g.held.items,items)}
   const standing=act({action:'stand'});assert.equal(standing.held,null);assert.equal(standing.dining,null);assert.equal(standing.seat,null);
   if(seat.floor){act({action:'sync',...STAIR_BOTTOM,yaw:0});assert.equal(act({action:'floor',floor:0}).held,null)}
  }finally{db.close()}
 });
}
