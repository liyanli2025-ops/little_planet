import test from 'node:test';
import assert from 'node:assert/strict';
import {coastEdge,coastPoint} from '../dist/cafe-marine.js';
import fs from 'node:fs';
import path from 'node:path';
test('coastline joins the ocean sphere at every angle, without a flat cap edge',()=>{
 for(let i=0;i<360;i++){const a=i*Math.PI/180,p=coastPoint(a,coastEdge(a));assert.ok(Math.abs(Math.hypot(p.x,p.y+18.25,p.z)-17.8)<1e-8);const near=coastPoint(a,coastEdge(a)-.0001);assert.ok(p.distanceTo(near)<.003)}
});
test('cafe foundation stays level and sandy land continues far down the sphere',()=>{
 for(let i=0;i<72;i++){const a=i*Math.PI/36;assert.equal(coastPoint(a,.3).y,-.15);assert.ok(coastPoint(a,coastEdge(a)).y<-6)}
});
test('all selected nature model dependencies are shipped locally',()=>{
 const dir=new URL('../dist/assets/coast/',import.meta.url);
 for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.gltf'))){const g=JSON.parse(fs.readFileSync(new URL(f,dir)));for(const x of [...g.buffers,...g.images||[]]){assert.ok(fs.existsSync(new URL(x.uri,dir)),`${f}: ${x.uri}`)}}
});
test('extracted palm geometry buffers stay within the shipped GLB',()=>{
 const b=fs.readFileSync(new URL('../dist/assets/coast/palm.glb',import.meta.url));assert.equal(b.readUInt32LE(8),b.length);assert.ok(b.length<200000);const n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n).toString());assert.equal(g.meshes.length,2);for(const v of g.bufferViews)assert.ok(v.byteOffset+v.byteLength<=g.buffers[0].byteLength);
});
