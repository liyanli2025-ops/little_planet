import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createDesignService} from '../backend/design.mjs';
import {defaultDesign} from '../dist/design-schema.js';
const skirt={kind:'skirt',name:'蓝色裙子',pattern:'stripe',color:'#7799aa',accent:'#ffffff',length:.22,flare:.07,pleats:12,patternScale:.07};
test('saved garments and gifted headwear appear by category; preview is private and not an equip',()=>{
 const db=new DatabaseSync(':memory:'),s=createDesignService(db,{partner:()=>({id:2})});
 let p=s.make(1,'outfit',{...defaultDesign().outfit,tailoring:skirt},0,'ai');s.accept(1,{id:p.id,version:0});
 const hat={...skirt,kind:'hat',name:'小帽子'};p=s.make(1,'outfit',{...s.current(1).design.outfit,headwear:hat},1,'ai');s.accept(1,{id:p.id,version:1});s.gift(1,{id:p.id,partnerId:2});
 const catalog=s.view(1).wardrobe;assert.equal(catalog.filter(i=>i.name==='蓝色裙子').length,1);assert.equal(catalog.find(i=>i.name==='蓝色裙子').category,'dress');assert.equal(catalog.find(i=>i.name==='小帽子').category,'accessory');assert.ok(s.view(2).wardrobe.some(i=>i.name==='小帽子'));
 const chosen=catalog.find(i=>i.key==='base:cream'),preview=s.wardrobePreview(1,{key:chosen.key,version:2});assert.equal(s.current(1).design.outfit.tailoring.name,'蓝色裙子');assert.equal(preview.values.headwear.name,'小帽子');assert.equal(preview.values.tailoring,null);
 assert.throws(()=>s.wardrobePreview(3,{key:catalog.find(i=>i.name==='蓝色裙子').key,version:0}),/衣柜/);
 s.accept(1,{id:preview.id,version:2});assert.equal(s.current(1).design.outfit.garment,'cream');assert.equal(s.current(1).design.outfit.headwear.name,'小帽子');db.close();
});
