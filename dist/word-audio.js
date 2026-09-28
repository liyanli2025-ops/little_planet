// Decode pronunciation into a separate Web Audio source; never take over music playback.
export function createWordAudio({onStatus=()=>{}}={}){
 let context,source,request,epoch=0;const cache=new Map();
 function stop(){epoch++;request?.abort();request=null;if(source){source.stop();source.disconnect();source=null}onStatus('')}
 async function speak(word){
  stop();const token=epoch;request=new AbortController();const signal=AbortSignal.any([request.signal,AbortSignal.timeout(12000)]);
  try{
   const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error();
   context??=new Context();await context.resume();if(token!==epoch)return;onStatus('正在获取读音…');
   let entry=cache.get(word);
   if(!entry){
    const r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word),{signal});if(!r.ok)throw Error();
    const records=await r.json(),sounds=records.flatMap(x=>x.phonetics||[]).filter(x=>x.audio);
    const clip=sounds.find(x=>x.audio.includes('-us.'))||sounds[0];if(!clip)throw Error();
    const url=new URL(clip.audio,'https://api.dictionaryapi.dev');if(url.protocol!=='https:')throw Error();
    const audio=await fetch(url,{signal});if(!audio.ok)throw Error();
    const buffer=await context.decodeAudioData(await audio.arrayBuffer());entry={buffer,credit:clip.sourceUrl||url.href};
    cache.set(word,entry);if(cache.size>64)cache.delete(cache.keys().next().value);
   }
   if(token!==epoch)return;
   source=context.createBufferSource();source.buffer=entry.buffer;source.connect(context.destination);const playing=source;
   source.onended=()=>{playing.disconnect();if(source===playing)source=null};source.start();onStatus('',entry.credit);
  }catch(e){if(token===epoch)onStatus('读音暂不可用，请再试一次')}
 }
 return {speak,stop};
}
