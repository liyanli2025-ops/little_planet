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
 const combined=s.wardrobePreview(1,{key:catalog.find(i=>i.name==='小帽子').key,version:2,preview:preview.id});assert.equal(combined.values.garment,'cream');assert.equal(combined.values.tailoring,null);assert.throws(()=>s.wardrobePreview(2,{key:'base:cream',version:0,preview:preview.id}));s.accept(1,{id:combined.id,version:2});assert.equal(s.current(1).design.outfit.garment,'cream');assert.equal(s.current(1).design.outfit.headwear.name,'小帽子');db.close();
});

test('unequipped saved clothing survives repeated changes and restart without relying on history',()=>{
 const db=new DatabaseSync(':memory:');let s=createDesignService(db);
 const p=s.make(1,'outfit',{...defaultDesign().outfit,tailoring:skirt},0,'ai');s.accept(1,{id:p.id,version:0});
 for(let i=0;i<25;i++)s.baseOutfit(1,i%2?'cream':'navy');
 s=createDesignService(db);const row=s.view(1).wardrobe.find(x=>x.name===skirt.name);assert.ok(row);const version=s.current(1).version;
 const preview=s.wardrobePreview(1,{key:row.key,version});assert.deepEqual(preview.values.tailoring,skirt);s.accept(1,{id:preview.id,version});assert.deepEqual(s.current(1).design.outfit.tailoring,skirt);assert.equal(s.view(1).wardrobe.filter(x=>x.name===skirt.name).length,1);db.close();
});
test('older saved outfits in retained history are recovered into wardrobe, unsaved previews are excluded',()=>{
 const db=new DatabaseSync(':memory:'),s=createDesignService(db);
 const old={...defaultDesign(),outfit:{...defaultDesign().outfit,tailoring:skirt}};
 db.prepare('INSERT INTO design_history VALUES(?,?,?,?,?)').run(1,1,JSON.stringify(old),'旧衣服',1);
 s.make(1,'outfit',{...defaultDesign().outfit,tailoring:{...skirt,name:'未保存'}},0,'ai');
 assert.ok(s.view(1).wardrobe.some(x=>x.name===skirt.name));assert.ok(!s.view(1).wardrobe.some(x=>x.name==='未保存'));assert.ok(!s.view(2).wardrobe.some(x=>x.name===skirt.name));db.close();
});
