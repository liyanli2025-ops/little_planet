import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createWordAudio} from '../dist/word-audio.js';
const folder=new URL('../dist/assets/words/audio/',import.meta.url);
const index=JSON.parse(readFileSync(new URL('index.json',folder),'utf8').replace(/^\uFEFF/,''));
test('all four word decks have bundled pronunciation, with non-overlapping valid sprite ranges',()=>{
 const groups=new Map();
 for(const deck of ['everyday','ky','ielts','toefl'])for(const [word] of JSON.parse(readFileSync(new URL('../dist/assets/words/'+deck+'.json',import.meta.url))))assert(index.words[word],word);
 for(const [word,[file,offset,duration]] of Object.entries(index.words)){
  assert.match(file,/^en-\d{3}\.mp3$/);assert(offset>=0&&duration>.05&&duration<15,word);
  if(!groups.has(file)){assert(statSync(new URL(file,folder)).size>1000);groups.set(file,[])}groups.get(file).push([offset,duration]);
 }
 for(const spans of groups.values()){spans.sort((a,b)=>a[0]-b[0]);for(let i=1;i<spans.length;i++)assert(spans[i][0]>=spans[i-1][0]+spans[i-1][1]-.00002)}
 assert.equal(Object.keys(index.words).length,9704);
});
test('late decoding never speaks after close; retry, repeat and stopping only own audio work',async()=>{
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;let finishDecode,decodeSlow=true,starts=0,stops=0,fail=false;const status=[];
 class Context{currentTime=0;destination={};async resume(){}async decodeAudioData(){if(decodeSlow)return new Promise(r=>finishDecode=r);return {}}createGain(){return {connect(){},disconnect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}}}createBufferSource(){return {connect(){},disconnect(){},start(){starts++},stop(){stops++}}}}
 globalThis.window={AudioContext:Context};globalThis.fetch=async url=>{if(fail)throw Error('offline');return {ok:true,json:async()=>({words:{hello:['en-000.mp3',0,1]}}),arrayBuffer:async()=>new ArrayBuffer(10)}};
 try{const voice=createWordAudio({onStatus:s=>status.push(s)});const late=voice.speak('hello');while(!finishDecode)await new Promise(r=>setImmediate(r));voice.stop();finishDecode({});await late;assert.equal(starts,0);
 decodeSlow=false;fail=true;await voice.speak('hello');assert.match(status.at(-1),/暂不可用/);
 fail=false;await voice.speak('hello');assert.equal(starts,1);await voice.speak('hello');assert.equal(starts,2);assert.equal(stops,1);voice.stop();assert.equal(stops,2);
 }finally{globalThis.window=oldWindow;globalThis.fetch=oldFetch}
});
