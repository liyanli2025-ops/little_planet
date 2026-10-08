import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createSleighRide} from '../dist/aurora-sleigh.js';
import {snowRadius} from '../dist/aurora-terrain.js';
test('sleigh lands on nearby snow standing, and can resume without returning to a chair',async()=>{
 const world=new T.Group(),chair=new T.Group(),mount=new T.Group(),body=new T.Group();world.add(chair,mount);mount.add(body);
 const avatar=new T.Group();chair.add(avatar);chair.position.set(0,10,0);
 let seated=true,land=null,traffic=null;const bear={avatar,arms:[new T.Group(),new T.Group()],legs:[new T.Group(),new T.Group()],seatTick:value=>seated=value};
 const actor={kind:'sleigh',mount,body,deerRigs:[]},wildlife={ready:Promise.resolve(),actors:[actor],setTraffic:value=>traffic=value};
 const ride=createSleighRide(world,wildlife,bear,{onDisembark:p=>land=p});await wildlife.ready;
 const advance=s=>{for(let i=0;i<s*30;i++)ride.tick(1/30)};
 assert.equal(ride.start(),true);advance(20);assert.equal(seated,true);assert.ok(traffic);const progress=ride.state().progress;
 assert.equal(ride.stop(),true);assert.equal(ride.stop(),false);advance(6);
 assert.equal(ride.state().phase,'idle');assert.equal(seated,false);assert.notEqual(avatar.parent,chair);assert.equal(traffic,null);
 const n=land.clone().normalize();assert.ok(Math.abs(land.length()-snowRadius(Math.acos(n.y),Math.atan2(n.z,n.x))-.025)<1e-6);
 const parked=mount.position.clone();assert.equal(ride.start(),true);for(let i=0;i<1200&&ride.state().phase==='boarding';i++)ride.tick(1/30);assert.equal(ride.state().phase,'riding');assert.ok(mount.position.distanceTo(parked)<.03);assert.ok(ride.state().progress>=progress);
 advance(110);assert.equal(ride.state().phase,'idle');assert.equal(seated,false);assert.notEqual(avatar.parent,chair);
});
