import test from 'node:test';
import assert from 'node:assert/strict';
import {createCafeAmbience} from '../dist/cafe-ambience.js';
test('arrival starts looping waves without video interaction; touchend resumes interrupted audio',async()=>{
 const doc=new EventTarget();doc.hidden=false;const host=new EventTarget();let context;
 class Audio {constructor(){context=this;this.state='suspended';this.currentTime=0;this.sampleRate=48000;this.sources=[];this.levels=[]}createGain(){return {connect(){},gain:{value:0,cancelScheduledValues(){},setTargetAtTime:v=>this.levels.push(v)}}}createBuffer(){return {length:1}}createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=true},stop(){this.stopped=true}};this.sources.push(s);return s}async resume(){this.state='running'}async suspend(){this.state='suspended'}async close(){this.state='closed'}async decodeAudioData(){return {length:48000}}}
 host.AudioContext=Audio;let deliver;const ambience=createCafeAmbience({host,doc,load:()=>new Promise(r=>deliver=r)});
 ambience.unlock();ambience.play();deliver({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});await new Promise(r=>setTimeout(r,0));
 const wave=context.sources.find(s=>s.buffer.length>1);assert.ok(wave.started);assert.equal(wave.loop,true);assert.equal(context.levels.at(-1),.32);
 ambience.room(true);assert.equal(context.levels.at(-1),.22);ambience.cinema(true);assert.equal(context.levels.at(-1),.10);ambience.cinema(false);assert.equal(context.levels.at(-1),.22);
 context.state='suspended';doc.dispatchEvent(new Event('touchend'));await Promise.resolve();assert.equal(context.state,'running');
 ambience.stop();assert.ok(wave.stopped);assert.equal(context.levels.at(-1),0);ambience.dispose();
});
