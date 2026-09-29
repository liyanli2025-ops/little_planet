import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {homeLayouts,homeRoute,homeFree} from '../dist/home-layout.js';
import {createDesignedHome} from '../dist/designed-home.js';

test('each home has reachable furniture, collision-free serving routes and floor landings',()=>{
 for(const layout of homeLayouts)for(const floor of [0,1]){
  const layer=layout[floor?'upper':'lower'];
  for(const [name,target]of Object.entries(layer.stops)){
   assert(homeFree(layout,floor,...target),`${layout.name}/${floor}/${name} is obstructed`);
   const from=floor?layer.stops.stairs:layout.entry;
   const path=homeRoute(layout,floor,new T.Vector3(from[0],floor*2.7+.022,from[1]),...target);
   assert(path.length,`${layout.name}/${name} is unreachable`);
   assert(path.at(-1).distanceTo(new T.Vector3(target[0],floor*2.7+.022,target[1]))<.001);
   for(const p of path)assert(homeFree(layout,floor,p.x,p.z));
  }
  if(!floor)for(const destination of ['table','fridge']){
   const start=layer.stops.cook,path=homeRoute(layout,0,new T.Vector3(start[0],.022,start[1]),...layer.stops[destination]);
   assert(path.length);for(const p of path)assert(homeFree(layout,0,p.x,p.z));
  }
 }
});
test('changing homes retains shared food anchors while relocating furniture and covers',()=>{
 const root=new T.Group(),home=createDesignedHome(root),fridge=home.fridge,table=home.table;
 for(const [i,layout]of homeLayouts.entries()){
  home.select(i);home.show(0);assert.equal(home.fridge,fridge);assert.equal(home.table,table);
  assert.deepEqual([table.position.x,table.position.z],layout.lower.table);
  assert.deepEqual([fridge.position.x,fridge.position.z],layout.lower.fridge);
  assert.equal(root.scale.x,1);home.show(1);assert.equal(home.upper.visible,true);
  home.sleep(true);home.sleep(false);home.wardrobe(true);home.tick(.1);home.wash();home.tick(.1);
 }
 const actions=new Set();root.traverse(o=>{if(o.userData.action)actions.add(o.userData.action);if(o.isMesh){o.geometry.computeBoundingBox();assert(Number.isFinite(o.geometry.boundingBox.min.x))}});
 for(const a of ['stairs','bed','cook','fridge','table','sit','bookshelf','music','journal','bathroom','wardrobe','travel'])assert(actions.has(a),a);
 let covers=0,hinges=0;root.traverse(o=>{if(!o.userData.dynamic)return;o.traverse(m=>{if(m.isMesh&&m.userData.action==='bed')covers++;if(m.isMesh&&m.userData.action==='wardrobe')hinges++})});assert(covers>=4);assert(hinges>=4);
 home.dispose();
});

test('bathroom wash stop is inside the room and connected through its entrance to stairs',()=>{
 for(const L of homeLayouts){const [bx,bz]=L.upper.bath,inside=L.upper.stops.bathroom;assert(Math.abs(inside[0]-bx)<.7);assert(Math.abs(inside[1]-bz)<.6);const entrance=[bx-.32,bz+.84];assert(homeFree(L,1,...entrance));for(const [start,end]of [[entrance,inside],[inside,L.upper.stops.stairs]]){const path=homeRoute(L,1,new T.Vector3(start[0],2.722,start[1]),...end);assert(path.length);for(const q of path)assert(homeFree(L,1,q.x,q.z));assert(path.at(-1).distanceTo(new T.Vector3(end[0],2.722,end[1]))<.001)}}
});
