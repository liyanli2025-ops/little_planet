export const sleepTracks=[{id:'rain',name:'窗外细雨',icon:'☂'},{id:'stream',name:'林间溪流',icon:'≈'},{id:'insects',name:'夏夜虫鸣',icon:'☾'},{id:'sea',name:'轻柔海浪',icon:'〜'}];
export function createSleepSound(){
 const popup=document.createElement('dialog');popup.id='sleep-sound';popup.setAttribute('aria-labelledby','sleep-sound-title');
 popup.innerHTML='<header><h2 id="sleep-sound-title">听助眠</h2><button type="button" data-sleep-close aria-label="关闭助眠声音">×</button></header><div class="sleep-choices" aria-label="选择助眠声音">'+sleepTracks.map(t=>'<button type="button" data-sleep-track="'+t.id+'" aria-pressed="false"><span aria-hidden="true">'+t.icon+'</span>'+t.name+'<i aria-hidden="true">▷</i></button>').join('')+'</div><footer><button type="button" data-sleep-timer aria-label="定时关闭：30分钟">30 分钟</button><span role="status"></span></footer>';
 document.body.append(popup);let ctx=null,selected=null,sleeping=false,minutes=30,deadline=0,serial=0;const nodes=new Map();
 const launch=document.createElement('button');launch.id='sleep-reopen';launch.type='button';launch.textContent='☾';launch.setAttribute('aria-label','听助眠');launch.hidden=true;document.body.append(launch);
 function node(id){if(nodes.has(id))return nodes.get(id);const audio=new Audio(new URL('./assets/sleep/'+id+'.mp3',import.meta.url));audio.loop=true;audio.preload='none';const gain=ctx.createGain();gain.gain.value=0;ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);const n={audio,gain,id,version:0};nodes.set(id,n);audio.addEventListener('error',()=>{if(selected===n){stop();popup.querySelector('[role=status]').textContent='暂时播不了，换一种试试'}});return n}
 function fade(n,value,seconds){const p=n.gain.gain,t=ctx.currentTime;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t)}p.linearRampToValueAtTime(value,t+seconds)}
 function retire(n){const version=++n.version;fade(n,0,1.2);setTimeout(()=>{if(n.version===version)n.audio.pause()},1250)}
 function paint(){popup.querySelectorAll('[data-sleep-track]').forEach(b=>{const yes=selected?.id===b.dataset.sleepTrack;b.setAttribute('aria-pressed',String(yes));b.querySelector('i').textContent=yes?'Ⅱ':'▷'});popup.querySelector('[data-sleep-timer]').textContent=minutes?minutes+' 分钟':'不定时';popup.querySelector('[data-sleep-timer]').setAttribute('aria-label','定时关闭：'+(minutes?minutes+'分钟':'不定时'))}
 function stop(){serial++;deadline=0;selected=null;nodes.forEach(retire);paint()}
 async function select(id){if(selected?.id===id){stop();return}ctx??=new AudioContext();const resume=ctx.resume(),n=node(id),token=++serial;selected=n;n.version++;nodes.forEach(other=>{if(other!==n)retire(other)});deadline=minutes?Date.now()+minutes*60000:0;popup.querySelector('[role=status]').textContent='';paint();try{const playing=n.audio.play();await Promise.all([resume,playing]);if(token!==serial)return;window.dispatchEvent(new Event('echoo-sleep-play'));fade(n,.35,2)}catch{if(token!==serial)return;stop();popup.querySelector('[role=status]').textContent='再点一下试试'}}
 function hide(){if(popup.open)popup.close();launch.hidden=!sleeping}
 popup.querySelector('[data-sleep-close]').onclick=()=>{stop();hide()};popup.addEventListener('cancel',()=>{stop();launch.hidden=!sleeping});
 popup.querySelector('.sleep-choices').onclick=e=>{const b=e.target.closest('[data-sleep-track]');if(b)select(b.dataset.sleepTrack)};
 popup.querySelector('[data-sleep-timer]').onclick=()=>{const values=[30,60,0,15];minutes=values[(values.indexOf(minutes)+1)%values.length];deadline=selected&&minutes?Date.now()+minutes*60000:0;paint()};
 launch.onclick=()=>{popup.show();launch.hidden=true};
 function checkTimer(){if(deadline&&Date.now()>=deadline){stop();hide()}}
 setInterval(checkTimer,1000);document.addEventListener('visibilitychange',checkTimer);window.addEventListener('echoo-music-play',()=>{stop()});
 return {open(){sleeping=true;stop();launch.hidden=true;if(!popup.open)popup.show()},end(){sleeping=false;stop();hide()},state:()=>({selected:selected?.id||null,sleeping,open:popup.open,minutes,deadline})};
}
