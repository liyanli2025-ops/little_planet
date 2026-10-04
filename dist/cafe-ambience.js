// Independent ambience bus: never changes the music player or media session.
export function createCafeAmbience({host=window,doc=document,load=fetch}={}){
 let context,gain,buffer,loading,source,active=false,indoor=false;
 const url=new URL('./assets/audio/cafe-waves.mp3',import.meta.url);
 function level(){if(!gain)return;const t=context.currentTime;gain.gain.cancelScheduledValues(t);gain.gain.setTargetAtTime(active&&!doc.hidden?(indoor?.22:.32):0,t,.45)}
 function start(){if(!active||doc.hidden||!buffer||source)return;source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(gain);source.start();level()}
 function unlock(){
  if(!context){const Audio=host.AudioContext||host.webkitAudioContext;if(!Audio)return;context=new Audio();gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);context.onstatechange=()=>{if(active&&!doc.hidden&&context.state==='interrupted')void context.resume().catch(()=>{})}}
  // Called directly from the visit click, before network awaits (mobile autoplay).
  if(context.state!=='running')void context.resume().catch(()=>{});
  if(!buffer&&!loading)loading=(async()=>{const r=await load(url);if(!r.ok)throw Error('Wave audio unavailable');buffer=await context.decodeAudioData(await r.arrayBuffer());start()})().catch(()=>{}).finally(()=>{loading=null});
  start();
 }
 function stop(){active=false;if(source){source.stop();source.disconnect();source=null}level()}
 function visibility(){if(doc.hidden){if(context)void context.suspend().catch(()=>{})}else if(active){unlock();level()}}
 function gesture(){if(active)unlock()}
 function pageHide(){if(context)void context.suspend().catch(()=>{})}
 function pageShow(){if(active){unlock();level()}}
 doc.addEventListener('pointerdown',gesture,{passive:true});doc.addEventListener('keydown',gesture);doc.addEventListener('visibilitychange',visibility);host.addEventListener('pagehide',pageHide);host.addEventListener('pageshow',pageShow);
 return {unlock,play(){active=true;unlock();level()},room(value){indoor=!!value;level()},stop,dispose(){stop();doc.removeEventListener('pointerdown',gesture);doc.removeEventListener('keydown',gesture);doc.removeEventListener('visibilitychange',visibility);host.removeEventListener('pagehide',pageHide);host.removeEventListener('pageshow',pageShow);if(context)void context.close().catch(()=>{})}};
}
