// Local, generated English pronunciation sprites. No system TTS or music transport calls.
export function createWordAudio({onStatus=()=>{}}={}){
 let context,source,gain,request,epoch=0,manifest;const cache=new Map();
 const base=new URL('./assets/words/audio/',import.meta.url);
 function stop(){epoch++;request?.abort();request=null;if(source){source.onended=null;source.stop();source.disconnect();source=null}gain?.disconnect();gain=null;onStatus('')}
 async function speak(word){
  stop();const token=epoch;request=new AbortController();const controller=request;
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
   const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error();
   context??=new Context({sampleRate:22050});await context.resume();if(token!==epoch)return;onStatus('正在获取读音…');
   if(!manifest){const r=await fetch(new URL('index.json',base),{signal:controller.signal});if(!r.ok)throw Error();manifest=await r.json()}
   const clip=manifest.words?.[word];if(!Array.isArray(clip))throw Error();
   const [file,offset,duration]=clip;if(!/^en-\d{3}\.mp3$/.test(file)||!Number.isFinite(offset)||!Number.isFinite(duration)||duration<=0)throw Error();
   let buffer=cache.get(file);
   if(!buffer){const r=await fetch(new URL(file,base),{signal:controller.signal});if(!r.ok)throw Error();buffer=await context.decodeAudioData(await r.arrayBuffer());if(token!==epoch)return;cache.set(file,buffer);if(cache.size>2)cache.delete(cache.keys().next().value)}
   if(token!==epoch)return;
   source=context.createBufferSource();source.buffer=buffer;gain=context.createGain();source.connect(gain);gain.connect(context.destination);
   const playing=source,volume=gain,now=context.currentTime;
   volume.gain.setValueAtTime(0,now);volume.gain.linearRampToValueAtTime(1,now+.008);volume.gain.setValueAtTime(1,now+Math.max(.008,duration-.008));volume.gain.linearRampToValueAtTime(0,now+duration);
   source.onended=()=>{playing.disconnect();volume.disconnect();if(source===playing){source=null;gain=null}};source.start(0,offset,duration);onStatus('');
  }catch(e){if(token===epoch)onStatus('读音暂不可用，请再试一次')}
  finally{clearTimeout(timer);if(request===controller)request=null}
 }
 return {speak,stop};
}
