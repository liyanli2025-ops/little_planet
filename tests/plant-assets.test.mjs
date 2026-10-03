import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir=new URL('../dist/assets/tiny-plants/',import.meta.url);
test('curated plant GLBs are self-contained, finite and within the mobile asset budget',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',dir),'utf8'));let total=0;
 for(const asset of manifest.assets){const bytes=fs.readFileSync(new URL(asset.file,dir));total+=bytes.length;assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.length,asset.bytes);const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));assert.ok(json.buffers.every(b=>!b.uri));assert.ok(json.images.every(i=>Number.isInteger(i.bufferView)));for(const mesh of json.meshes)for(const primitive of mesh.primitives){const a=json.accessors[primitive.attributes.POSITION];assert.ok(a.min.every(Number.isFinite));assert.ok(a.max.every(Number.isFinite));assert.ok(a.count>0)}assert.ok(asset.triangles<10000);}
 assert.equal(manifest.assets.length,14);assert.ok(total<2*1024*1024);assert.equal(manifest.license,'CC0-1.0');
});
