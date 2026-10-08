import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSurface,surfaceFields,drawArtwork,fabricKinds} from '../dist/garment-surface.js';
import {validateTailoring} from '../dist/studio-schema.js';
const base={kind:'dress',name:'自由纹样',pattern:'plain',color:'#6677aa',accent:'#ffffff',length:.3,flare:.07,pleats:0,patternScale:.05};
const shape={type:'path',points:[[.1,.1],[.9,.1],[.5,.9]],fill:'#cc7722'};
test('arbitrary themed illustration is data, not a keyword allowlist',()=>{for(const fabric of fabricKinds)assert.equal(validateTailoring({...base,fabric,artwork:{layout:'front',layers:[shape]}}).fabric,fabric);assert.ok(surfaceFields.artwork);});
test('reject unsafe or unbounded illustration data and unsupported materials',()=>{for(const layer of [{...shape,code:'alert(1)'},{...shape,points:[[Infinity,0],[0,1],[1,1]]},{type:'text',x:.5,y:.5,size:.2,text:'x'.repeat(25),fill:'#ffffff'},{type:'ellipse',x:.5,y:.5,w:-1,h:.3,fill:'#ffffff'}])assert.throws(()=>validateSurface({artwork:{layout:'front',layers:[layer]}}));assert.throws(()=>validateSurface({fabric:'unrecognized'}));assert.throws(()=>validateSurface({artwork:{layout:'repeat',layers:Array(49).fill(shape)}}));});
test('drawing uses bounded canvas primitives without executing text',()=>{let lines=0,text='';const ctx={save(){},restore(){},scale(){},translate(){},rotate(){},beginPath(){},moveTo(){},lineTo(){lines++},closePath(){},fill(){},stroke(){},fillText(v){text=v}};drawArtwork(ctx,{layers:[shape,{type:'text',x:.5,y:.5,text:'品牌风格',size:.1,fill:'#ffffff'}]},512);assert.equal(lines,2);assert.equal(text,'品牌风格');});
