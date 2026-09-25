import test from 'node:test';
import assert from 'node:assert/strict';
import {createQQAudio} from '../dist/qq-audio.js';
test('global QQ audio ignores late play/end after explicit stop and can resume',async()=>{
 const previous=globalThis.window;let sdk;
 class Player{constructor(){sdk=this;this.data={};this.events={};this.pauses=0}on(k,fn){this.events[k]=fn}play(mid){this.data.song={mid};this.events.play()}pause(){this.pauses++;this.events.pause()} }
 globalThis.window={QMplayer:Player};
 try{const a=createQQAudio();let endings=0;a.addEventListener('ended',()=>endings++);a.src='003IPDsn4ZWb5H';await a.play();assert.equal(a.paused,false);a.pause();assert.equal(a.paused,true);sdk.events.play();assert.equal(a.paused,true);sdk.events.ended();assert.equal(endings,0);await a.play();assert.equal(a.paused,false);sdk.events.ended();assert.equal(endings,1);a.removeAttribute('src');sdk.events.play();assert.equal(a.paused,true)}finally{globalThis.window=previous}
});
