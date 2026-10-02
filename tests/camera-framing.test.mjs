import test from 'node:test';
import assert from 'node:assert/strict';
import {framingDistance,roomPolar,createFramingMemory} from '../dist/camera-framing.js';
test('room elevation never permits underside, including extreme photo drags',()=>{for(const x of [-100,0,1,Math.PI,100]){const p=roomPolar(x);assert.ok(p>0&&p<Math.PI/2);}});
test('function framing restores independent global and detail zoom',()=>{const m=createFramingMemory();assert.equal(m.select('room',1),1);assert.equal(m.select('wardrobe',2),1);assert.equal(m.select('wardrobe',1.3),1.3);assert.equal(m.select('room',1.3),2);assert.equal(m.select('wardrobe',2),1.3);m.reset();assert.equal(m.select('room',4),1);});
test('wardrobe and garden fit portrait screens and are closer than global views',()=>{for(const aspect of [.46,1.5])for(const kind of ['wardrobe','garden','seat']){const d=framingDistance(kind,40,aspect,40);assert.ok(d>2&&d<15);}assert.equal(framingDistance('global',40,.46,40),40);});
