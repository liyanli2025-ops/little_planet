import test from 'node:test';
import assert from 'node:assert/strict';
import {fridgeLayout} from '../dist/fridge-layout.js';
import {foodCatalog} from '../dist/food-catalog.js';
test('all food types fit in one fridge without losing inventory or paging',()=>{
 const items=Object.keys(foodCatalog).flatMap(food=>[0,1,2].map(n=>({id:food+n,food,qty:20})));
 const before=JSON.stringify(items),layout=fridgeLayout(items);
 assert.equal(layout.length,Object.keys(foodCatalog).length);
 assert.equal(layout.flatMap(x=>x.item.members).length,items.length);
 assert.equal(JSON.stringify(items),before);
 for(const e of layout){assert(e.position.every(Number.isFinite));assert(e.scale>0&&e.scale<=1.1);assert(e.position[1]<3.9);assert(e.single||e.scale>=.95)}
 for(const area of ['shelf','rack','freezer']){const points=layout.filter(x=>x.area===area).map(x=>x.position.join(','));assert.equal(new Set(points).size,points.length)}
});
test('repeated food display preserves gift restrictions and selected inventory ID',()=>{
 const items=[{id:'a',food:'milk',qty:1},{id:'b',food:'milk',qty:3},{id:'gift',food:'milk',qty:1,gift:true},{id:'reserved',food:'milk',qty:1,gift:true,reserved:true}];
 const layout=fridgeLayout(items,'b');assert.equal(layout.length,3);
 assert.equal(layout.find(x=>!x.item.gift).item.id,'b');assert.equal(layout.find(x=>!x.item.gift).item.qty,4);
 assert.equal(layout.find(x=>x.item.reserved).item.id,'reserved');
 assert.equal(fridgeLayout(items.filter(x=>x.id!=='b'),'b').find(x=>!x.item.gift).item.id,'a');
});
