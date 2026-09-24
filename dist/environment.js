import {weatherKind,skyTime} from './sky-state.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createEnvironment({cloud,context,modal,toast,cities,planets}){
 let worlds=[null,null],lastScene='',serial=0,busy=false;
 let locationNotice='',locating=false,locationAttempted=false,locationToken=0;
 const clock=document.createElement('div');clock.id='world-clock';clock.setAttribute('aria-label','所在地时间');$('.scene-wrap').append(clock);
 const controls=document.createElement('div');controls.className='live-weather-controls';
 controls.innerHTML='<div class="weather-live-actions"><button id="location-settings" class="pill">设置所在地</button><button id="sync-weather" class="pill">刷新天气</button></div><p id="weather-status" class="subtle" role="status"></p><small>天气数据：<a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a><br>下方按钮可切换为手动天气</small>';
 $('.weather-switch').before(controls);
 async function api(route,data){
  const r=await fetch(route,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':cloud.session.csrf},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
  const b=await r.json();if(!r.ok)throw Error(b.error||'暂时连接不上天气服务');return b;
 }
 function paint(){
  const {world,actor,state,visual}=context(),w=worlds[world],s=w?.snapshot,t=skyTime(s),manual=w?.mode==='manual'||!cloud;
  const fallback=state.worlds[world].weather;
  const k=manual?{mode:fallback,icon:({sun:'☀',rain:'☂',snow:'❄',night:'☾'})[fallback],label:'手动天气'}:s?weatherKind(s.code):{mode:'sun',icon:'◌',label:'等待天气'};
  const night=manual&&fallback==='night'||t.night;
  clock.textContent=t.text+' · '+(w?.location?.label.split(' · ')[0]||'设备时间');
  $('#date-stamp').textContent=t.date.slice(5).replace('-',' / ');
  $('#place').textContent=planets[world]+' · '+(w?.location?.label||'尚未设置所在地');
  $('#weather-icon').textContent=k.mode==='sun'&&night&&!k.cloudy?'☾':k.icon;
  $('#temperature').textContent=!manual&&s?Math.round(s.temperature)+'°':'—';
  $('.weather-tag').textContent=manual?'手动天气':s?'真实天气':'尚未同步';
  $('#weather-description').textContent=k.label+(night?' · 夜晚':' · 白天');
  $('#location-settings').textContent=world===actor?'所在地与定位':'对方的所在地';$('#location-settings').disabled=world!==actor;
  let status=!cloud?'单机演示：真实天气请在服务器版本中使用。':w?.mode==='manual'?'当前为手动天气，可在所在地设置中恢复自动同步。':!w?.location?'尚未同步所在地天气。':!s?'天气暂时没有获取成功，请稍后刷新。':(w.stale?'更新暂时失败，显示上次数据 · ':'自动同步 · ')+new Date(s.observedAt).toLocaleString('zh-CN',{timeZone:s.timezone,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})+' · '+s.timezone;
  $('#weather-status').textContent=(world===actor&&locationNotice?locationNotice+' ':'')+status;
  document.querySelectorAll('[data-weather]').forEach(b=>b.classList.toggle('active',manual&&b.dataset.weather===fallback));
  const signature=[world,k.mode,night,!!k.cloudy].join(':');if(visual&&signature!==lastScene){visual.weather(k.mode,night,!!k.cloudy);lastScene=signature}
 }
 async function locateDevice(){
  if(!cloud||locating)return false;
  locationAttempted=true;
  if(!window.isSecureContext){locationNotice='当前地址需要启用 HTTPS 才能自动定位。';paint();return false}
  if(!navigator.geolocation){locationNotice='此浏览器无法定位，可展开备用城市选择。';paint();return false}
  locating=true;const token=++locationToken;locationNotice='正在获取手机所在地，请允许系统定位请求…';paint();
  try{
   const p=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:300000}));
   if(token!==locationToken)return false;
   locationNotice='已获取大致位置，正在同步天气…';paint();
   const ok=await configure({mode:'auto',location:{label:'设备所在地',latitude:Math.round(p.coords.latitude*10)/10,longitude:Math.round(p.coords.longitude*10)/10}});
   locationNotice=ok?'已自动同步手机所在地。':'位置已获取，但未确认保存成功，请重试。';return ok;
  }catch(e){
   if(token===locationToken)locationNotice=e.code===1?'定位未获允许；可在浏览器设置中允许后重试。':e.code===3?'定位超时，请点击重新定位，或使用备用城市选择。':'暂时无法获取位置，请点击重新定位，或使用备用城市选择。';
   return false;
  }finally{locating=false;paint()}
 }
 async function load(){
  if(!cloud){paint();return}if(busy)return;busy=true;const token=++serial;
  $('#sync-weather').disabled=true;
  try{const r=await api('/api/environment');if(token===serial){worlds=r.worlds;worlds.forEach((w,i)=>cities[i]=w?.location?.label.split(' · ')[0]||'未设置所在地');paint()}}
  catch{if(token===serial){paint();$('#weather-status').textContent='天气连接暂时中断，请稍后重试。'}}
  finally{busy=false;$('#sync-weather').disabled=false}
  const own=worlds[context().actor];if(!locationAttempted&&own){locationAttempted=true;if(own.mode==='auto')void locateDevice()}
 }
 async function configure(data){
  if(!cloud){toast('请在服务器版本中设置真实天气。');return false}
  ++serial;
  try{const r=await api('/api/environment',data);worlds=r.worlds;worlds.forEach((w,i)=>cities[i]=w?.location?.label.split(' · ')[0]||'未设置所在地');lastScene='';paint();return true}
  catch(e){toast(e.name==='TimeoutError'?'天气查询超时，请稍后重试。':e.message);return false}
 }
 function settings(){
  if(context().world!==context().actor)return;
  const w=worlds[context().actor];
  modal('location','YOUR LOCAL SKY','让天空，跟着你生活',
   '<p class="subtle">进入星球时自动获取手机所在地，允许系统定位后即可同步天气。配对后，对方可看到大致地点的天气，不展示精确坐标。</p><div class="form-actions"><button id="locate-me" class="pill primary">重新定位并同步</button>'+(w?.location?'<button id="restore-auto" class="pill">沿用已存地点天气</button>':'')+'</div><p id="location-message" class="subtle" role="status">'+escape(locationNotice)+'</p><p class="subtle">'+(window.isSecureContext?'若之前拒绝过定位，请在浏览器的网站权限中允许位置访问。':'当前为 HTTP 地址，浏览器不允许定位。启用 HTTPS 后即可自动定位，暂时可使用下方备用选择。')+'</p><details id="city-fallback"'+(!window.isSecureContext||locationNotice.includes('未获允许')||locationNotice.includes('超时')?' open':'')+'><summary>无法定位？手动选择城市</summary><form id="city-search"><label>城市名称<input name="city" placeholder="例如：北京、杭州、London" minlength="2" maxlength="60" required autocomplete="off"></label><button class="pill">搜索城市</button></form><div id="city-results"></div></details><p class="subtle">只在进入页面或点击重新定位时获取位置，不持续追踪。天气约每 15 分钟更新。</p>');
  const message=$('#location-message'),results=$('#city-results');
  async function choose(location){
   ++locationToken;locationNotice='';
   results.querySelectorAll('button').forEach(b=>b.disabled=true);message.textContent='正在保存所在地、获取天气…';
   const ok=await configure({mode:'auto',location});if(ok)message.textContent='所在地已保存。'+(worlds[context().actor]?.snapshot?'天空已更新。':'天气服务暂时未响应，稍后会自动重试。');else message.textContent='没有确认保存成功，请重试。';
   results.querySelectorAll('button').forEach(b=>b.disabled=false);
  }
  $('#city-search').onsubmit=async e=>{
   e.preventDefault();if(!cloud){message.textContent='请在服务器版本中使用城市天气。';return}
   const button=e.target.querySelector('button');button.disabled=true;results.replaceChildren();message.textContent='正在寻找城市…';
   try{const r=await api('/api/cities?q='+encodeURIComponent(new FormData(e.target).get('city')));message.textContent=r.cities.length?'选择你的所在地：':'没有找到，试试城市全名或拼音。';
    for(const city of r.cities){const b=document.createElement('button');b.className='city-choice';b.textContent=city.label;b.onclick=()=>choose(city);results.append(b)}
   }catch(e){message.textContent=e.message||'城市查询失败，请稍后重试。'}finally{button.disabled=false}
  };
  const locate=$('#locate-me');locate.disabled=!window.isSecureContext||!navigator.geolocation||!cloud;
  locate.onclick=async()=>{
   locate.disabled=true;message.textContent='正在获取手机所在地…';
   await locateDevice();message.textContent=locationNotice;locate.disabled=false;
   if(!worlds[context().actor]?.location||locationNotice.includes('未获允许')||locationNotice.includes('超时'))$('#city-fallback')?.setAttribute('open','');
  };
  if($('#restore-auto'))$('#restore-auto').onclick=async()=>{++locationToken;locationNotice='';message.textContent=await configure({mode:'auto'})?'已恢复自动天气。':'恢复失败，请重试。'};
 }
 $('#location-settings').onclick=settings;
 $('#sync-weather').onclick=load;
 setInterval(()=>{if(!document.hidden)paint()},1000);
 setInterval(()=>{if(!document.hidden)load()},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){paint();load()}});
 window.addEventListener('online',load);
 load();
 return {paint,async manual(){++locationToken;locationNotice='';return !cloud||await configure({mode:'manual'})},stamp(){
  const {actor,state}=context();
  return worlds.map((w,i)=>{
   if(cloud&&!cloud.paired&&i!==actor)return null;
   const city=w?.location?.label.split(' · ')[0]||'未设置所在地';
   if(!cloud||w?.mode==='manual')return city+' · 手动'+({sun:'晴天',rain:'下雨',snow:'下雪',night:'夜晚'})[state.worlds[i].weather];
   return city+' · '+(w?.snapshot?weatherKind(w.snapshot.code).label+(w.stale?'（上次天气）':''):'天气未同步');
  }).filter(Boolean).join(' / ');
 }};
}
