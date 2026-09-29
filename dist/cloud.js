import {authenticate} from './auth-ui.js';
import {reconcileState} from './state-reconcile.js?v=2';

const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=x=>JSON.parse(JSON.stringify(x));
export const newId=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export async function connectCloud(){
 if(window.PLANET_RUNTIME?.mode!=='cloud')return null;
 const gate=document.createElement('section');gate.className='cloud-gate';gate.hidden=true;gate.setAttribute('aria-label','账号登录');document.body.append(gate);
 const status=document.createElement('button');status.className='cloud-status';status.textContent='正在连接云端…';status.setAttribute('aria-live','polite');document.body.append(status);
 let session;
 async function api(url,data,csrf){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const res=await fetch(url,{method:data===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:data===undefined?{}:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf,'X-Planet-Space':String(session.space)}:{})},body:data===undefined?undefined:JSON.stringify(data)});
   const value=await res.json();if(!res.ok){const error=new Error(value.error||'请求失败');error.status=res.status;throw error}return value;
  }finally{clearTimeout(timeout)}
 }
 try{session=await api('/api/session')}catch{
  gate.hidden=false;gate.innerHTML='<div class="cloud-card"><h1>暂时连接不到阿球</h1><p>请检查网络或服务器，然后重新载入。云端模式不会切换为本地存档。</p><button class="pill primary" id="cloud-reload">重新载入</button></div>';
  gate.querySelector('button').onclick=()=>location.reload();await new Promise(()=>{});
 }
 if(!session.authenticated){gate.hidden=false;session=await authenticate(gate,session,api);window.planetArrival?.start();gate.hidden=true;}
 let current;
 try{current=session.state?session:await api('/api/state')}catch{
  gate.hidden=false;gate.innerHTML='<div class="cloud-card"><h1>存档暂时没有载入成功</h1><button class="pill primary">重新载入</button></div>';gate.querySelector('button').onclick=()=>location.reload();await new Promise(()=>{});
 }
 // Preserve browser-local word progress for the two migrated residents without
 // letting new accounts share the old positional keys.
 if([0,1].includes(session.legacyActor))try{const marker='echoo-account-storage-v1-'+session.accountId;if(!localStorage.getItem(marker)){const old=String(session.legacyActor),next='account-'+session.accountId;for(const prefix of ['echoo-word-deck-','echoo-words-v1-','echoo-away-v1-']){const value=localStorage.getItem(prefix+old);if(value!==null&&localStorage.getItem(prefix+next)===null)localStorage.setItem(prefix+next,value)}for(const deck of ['ky','ielts','toefl']){const prefix='echoo-words-v2-',value=localStorage.getItem(prefix+old+'-'+deck);if(value!==null&&localStorage.getItem(prefix+next+'-'+deck)===null)localStorage.setItem(prefix+next+'-'+deck,value)}localStorage.setItem(marker,'done')}}catch{}
 gate.remove();
 let revision=current.revision,paired=current.paired,hooks=null,timer=null,flight=null,pending=null,blocked=false,polling=false,lifeBusy=false,lifeRequest=false,lastActionError='';
 let base=JSON.stringify(current.state);
 status.textContent='☁ 已载入云端存档';
 function showFailure(error){
  blocked=true;document.querySelectorAll('dialog[open]').forEach(d=>d.close());status.textContent=error.status===409?'⚠ 存档有更新':'⚠ 尚未保存';document.body.append(gate);gate.hidden=false;
  gate.innerHTML='<div class="cloud-card"><h1>这次修改尚未确认保存</h1><p>'+escapeHTML(error.status?error.message:'网络连接中断。服务器可能已收到修改，重试不会重复赠送物品。')+'</p><p class="subtle">请先导出未提交副本。重新载入会放弃当前页面尚未提交的修改。</p><div class="cloud-buttons"><button id="cloud-draft" class="pill">导出未提交副本</button>'+(!error.status||error.status>=500?'<button id="cloud-retry" class="pill primary">重试保存</button>':'')+'<button id="cloud-reload" class="pill">放弃未提交修改，重新载入</button></div></div>';
  gate.querySelector('#cloud-draft').onclick=()=>download(hooks.getState(),'echoo-unsaved.json');
  gate.querySelector('#cloud-reload').onclick=()=>location.reload();
  const retry=gate.querySelector('#cloud-retry');if(retry)retry.onclick=()=>{blocked=false;gate.remove();flush()};
 }
 async function flush(){
  clearTimeout(timer);timer=null;if(blocked||lifeRequest)return false;if(flight)return flight;
  const state=copy(hooks.getState()),serialized=JSON.stringify(state);
  if(!pending&&serialized===base)return true;
  let request=pending||{state,revision,command:newId()};pending=request;status.textContent='☁ 正在保存…';
  flight=(async()=>{
   try{
    let ack;
    for(let attempt=0;attempt<3;attempt++){try{ack=await api('/api/state',request,session.csrf);break}catch(e){
     if(e.status!==409||attempt===2)throw e;const next=await api('/api/state');if(next.space!==session.space)throw e;
     const merged=reconcileState(JSON.parse(base),request.state,next.state);if(merged.conflicts.length)throw e;
     const live=reconcileState(request.state,hooks.getState(),merged.state);if(live.conflicts.length)throw e;
     revision=next.revision;paired=next.paired;base=JSON.stringify(next.state);hooks.apply(live.state,true);
     request={state:merged.state,revision,command:newId()};pending=request;
    }}
    const changed=JSON.stringify(hooks.getState())!==JSON.stringify(request.state);
    // A retried request may return a newer revision. Never place a stale local draft on top of it.
    if(changed&&ack.revision!==request.revision+1){const e=new Error('云端已经有新的修改，请导出当前副本后重新载入。');e.status=409;throw e}
    revision=ack.revision;paired=ack.paired;pending=null;base=JSON.stringify(ack.state);
    if(!changed)hooks.apply(ack.state,false);
    status.textContent='☁ 已保存 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    return true;
   }catch(error){showFailure(error);return false}
   finally{flight=null;if(!blocked&&JSON.stringify(hooks.getState())!==base)timer=setTimeout(flush,120)}
  })();
  return flight;
 }
 function schedule(){if(blocked)return;if(lifeRequest)return;status.textContent='☁ 等待保存…';clearTimeout(timer);timer=setTimeout(flush,120)}
 async function refresh(){
  if(lifeBusy||blocked||flight||pending||polling||!hooks.canRefresh()||JSON.stringify(hooks.getState())!==base)return;
  polling=true;try{
   const next=await api('/api/state');if(next.space!==session.space){location.reload();return false}
   // Do not replace changes made while the request was travelling.
   if(lifeBusy||blocked||flight||pending||!hooks.canRefresh()||JSON.stringify(hooks.getState())!==base)return;
   if(next.displayNames&&JSON.stringify(next.displayNames)!==JSON.stringify(session.displayNames)){session.displayNames=next.displayNames;hooks.identity?.()}
   if(next.revision!==revision){revision=next.revision;paired=next.paired;base=JSON.stringify(next.state);hooks.apply(next.state,true);status.textContent='☁ 已同步最新存档'}
   return true;
  }catch(e){if(e.status===401)showFailure(e);else status.textContent='☁ 暂时离线 · 等待连接'}finally{polling=false}
 }
 async function action(url,data={}){
  lastActionError='';
  do{if(!(await flush()))return null;}while(pending||JSON.stringify(hooks.getState())!==base);
  try{const result=await api(url,data,session.csrf);return result}catch(e){lastActionError=e.message||'连接失败，请重试';hooks.toast(lastActionError);return null}
 }
 window.addEventListener('beforeunload',e=>{if(hooks&&(flight||pending||JSON.stringify(hooks.getState())!==base)){e.preventDefault();e.returnValue=''}});
 window.addEventListener('online',()=>{if(!blocked)refresh()});
 return {
  state:current.state,session,get lastActionError(){return lastActionError},get paired(){return paired},
  save:schedule,flush,refresh,
  get canAutoSync(){return !!hooks&&!lifeBusy&&!blocked&&!flight&&!pending&&!polling&&JSON.stringify(hooks.getState())===base},
  attach(h){hooks=h;status.onclick=()=>h.settings();setInterval(refresh,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();else if(!blocked)flush()})},
  async radioView(mode='discover'){return api('/api/fm?mode='+encodeURIComponent(mode))},
  async radioTrack(id){return api('/api/fm/track?id='+encodeURIComponent(id))},
  async radio(data){return this.life(data,'/api/fm')},
  async mediaView(){return api('/api/media')},
  async media(data){return this.life(data,'/api/media')},
  async weread(data){return this.life(data,'/api/weread')},
  async life(data,url='/api/life'){
   if(lifeBusy){lastActionError='另一项互动正在保存，请稍后重试。';return null}lifeBusy=true;lastActionError='';
   try{
    do{if(!(await flush())){lastActionError='存档尚未保存，请先处理存档提示。';return null}}while(pending||JSON.stringify(hooks.getState())!==base);
    let before=copy(hooks.getState());lifeRequest=true;let r;
    for(let attempt=0;attempt<3;attempt++){try{r=await api(url,{...data,revision,command:newId()},session.csrf);break}catch(e){
     if(e.status!==409||attempt===2)throw e;const next=await api('/api/state');if(next.space!==session.space)throw e;
     const merged=reconcileState(before,hooks.getState(),next.state);if(merged.conflicts.length)throw e;
     revision=next.revision;paired=next.paired;base=JSON.stringify(next.state);hooks.apply(merged.state,true);before=copy(next.state);
    }}
    const merged=reconcileState(before,hooks.getState(),r.state);
    if(merged.conflicts.length){const e=new Error('互动已保存，但同一份内容还有未保存的修改。请先导出副本，再重新载入。');e.status=409;lastActionError=e.message;showFailure(e);return null}
    revision=r.revision;paired=r.paired;base=JSON.stringify(r.state);hooks.apply(merged.state,true);status.textContent='☁ 生活互动已保存';return r;
    }catch(e){lastActionError=e.status?e.message:'连接中断，请刷新确认本次互动是否已保存。';if(e.status===409&&!blocked&&!flight&&!pending&&JSON.stringify(hooks.getState())===base){try{const next=await api('/api/state');if(next.space!==session.space){location.reload();return false}if(!flight&&!pending&&JSON.stringify(hooks.getState())===base){revision=next.revision;paired=next.paired;base=JSON.stringify(next.state);hooks.apply(next.state,true)}}catch{}}if(!data.automatic)hooks.toast(e.message||'连接中断，请刷新确认本次互动是否已保存');return null}finally{lifeRequest=false;lifeBusy=false;if(!blocked&&JSON.stringify(hooks.getState())!==base)schedule()}
  },
  async updateProfile(nickname){const r=await action('/api/account/profile',{nickname});if(r){Object.assign(session,r);hooks.identity?.()}return r},
  async accountInfo(){const next=await api('/api/session');if(!next.authenticated)throw Error('登录已过期，请刷新后重新登录');if(next.space!==session.space||next.paired!==paired){location.reload();return null}Object.assign(session,next);hooks.identity?.();return next},
  async invite(){return action('/api/invite')},
  async previewPair(code){return action('/api/pair/preview',{code})},
  async history(){return api('/api/account/history')},
  async pair(code,partnerId){const r=await action('/api/pair',{code,partnerId});if(r)location.reload();return r},
  async unpair(){const r=await action('/api/unpair');if(r)location.reload();return r},
  async logout(){const r=await action('/api/logout');if(r)location.reload();return r},
  exportDraft(){download(hooks.getState(),'echoo-save.json')}
 };
}
