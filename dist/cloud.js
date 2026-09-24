
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=x=>JSON.parse(JSON.stringify(x));
export const newId=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export async function connectCloud(){
 if(window.PLANET_RUNTIME?.mode!=='cloud')return null;
 const gate=document.createElement('section');gate.className='cloud-gate';gate.setAttribute('aria-label','账号登录');document.body.append(gate);
 const status=document.createElement('button');status.className='cloud-status';status.textContent='正在连接云端…';status.setAttribute('aria-live','polite');document.body.append(status);
 let session;
 async function api(url,data,csrf){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const res=await fetch(url,{method:data===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:data===undefined?{}:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});
   const value=await res.json();if(!res.ok){const error=new Error(value.error||'请求失败');error.status=res.status;throw error}return value;
  }finally{clearTimeout(timeout)}
 }
 try{session=await api('/api/session')}catch{
  gate.innerHTML='<div class="cloud-card"><h1>暂时连接不到小星球</h1><p>请检查网络或服务器，然后重新载入。云端模式不会切换为本地存档。</p><button class="pill primary" id="cloud-reload">重新载入</button></div>';
  gate.querySelector('button').onclick=()=>location.reload();await new Promise(()=>{});
 }
 if(!session.authenticated)session=await new Promise(resolve=>{
  let register=false;
  const render=()=>{
   gate.innerHTML='<div class="cloud-card"><div class="eyebrow">OUR LITTLE SKIES</div><h1>'+ (register?'为自己留一颗星球':'回到你的小星球')+'</h1><p class="subtle">两个账号，两颗星球。用邀请码连接彼此。</p>'+(!session.secure?'<p class="cloud-warning">当前是 HTTP 试玩连接。请只用临时测试密码和测试手账；正式使用请先配置 HTTPS。</p>':'')+'<form id="cloud-auth"><label>账号名<input name="username" autocomplete="username" pattern="[a-zA-Z0-9_-]{3,24}" minlength="3" maxlength="24" placeholder="3–24 位字母、数字或下划线" required></label><label>密码<input type="password" name="password" autocomplete="'+(register?'new-password':'current-password')+'" minlength="10" maxlength="128" required></label>'+(register?'<label>注册口令<input type="password" name="code" autocomplete="off" required><small>由服务器主人从 .env 文件中取得。</small></label><label>你的形象<select name="actor"><option value="0">白熊 · 小禾 · 慢慢星</option><option value="1">棕熊 · 阿远 · 晚风星</option></select></label><p class="subtle">每个形象只属于一个账号。注册后不会自动配对。</p>':'')+'<p id="cloud-error" role="alert"></p><button type="submit" class="pill primary">'+(register?'创建账号':'登录')+'</button></form><button class="cloud-link" id="cloud-toggle">'+(register?'已有账号，去登录':'第一次来？创建账号')+'</button><small>忘记密码时，请联系服务器主人重置。</small></div>';
   gate.querySelector('#cloud-toggle').onclick=()=>{register=!register;render()};
   gate.querySelector('form').onsubmit=async e=>{
    e.preventDefault();const form=e.target,b=form.querySelector('button'),d=Object.fromEntries(new FormData(form));if(register)d.actor=Number(d.actor);
    b.disabled=true;gate.querySelector('#cloud-error').textContent='';
    try{resolve(await api(register?'/api/register':'/api/login',d))}
    catch(err){gate.querySelector('#cloud-error').textContent=err.message||'网络异常，请重试';b.disabled=false}
   };
  };render();
 });
 let current;
 try{current=session.state?session:await api('/api/state')}catch{
  gate.innerHTML='<div class="cloud-card"><h1>存档暂时没有载入成功</h1><button class="pill primary">重新载入</button></div>';gate.querySelector('button').onclick=()=>location.reload();await new Promise(()=>{});
 }
 gate.remove();
 let revision=current.revision,paired=current.paired,hooks=null,timer=null,flight=null,pending=null,blocked=false,polling=false;
 let base=JSON.stringify(current.state);
 status.textContent='☁ 已载入云端存档';
 function showFailure(error){
  blocked=true;document.querySelectorAll('dialog[open]').forEach(d=>d.close());status.textContent=error.status===409?'⚠ 存档有更新':'⚠ 尚未保存';document.body.append(gate);
  gate.innerHTML='<div class="cloud-card"><h1>这次修改尚未确认保存</h1><p>'+escapeHTML(error.status?error.message:'网络连接中断。服务器可能已收到修改，重试不会重复赠送物品。')+'</p><p class="subtle">请先导出未提交副本。重新载入会放弃当前页面尚未提交的修改。</p><div class="cloud-buttons"><button id="cloud-draft" class="pill">导出未提交副本</button>'+(!error.status||error.status>=500?'<button id="cloud-retry" class="pill primary">重试保存</button>':'')+'<button id="cloud-reload" class="pill">放弃未提交修改，重新载入</button></div></div>';
  gate.querySelector('#cloud-draft').onclick=()=>download(hooks.getState(),'little-planet-unsaved.json');
  gate.querySelector('#cloud-reload').onclick=()=>location.reload();
  const retry=gate.querySelector('#cloud-retry');if(retry)retry.onclick=()=>{blocked=false;gate.remove();flush()};
 }
 async function flush(){
  clearTimeout(timer);timer=null;if(blocked)return false;if(flight)return flight;
  const state=copy(hooks.getState()),serialized=JSON.stringify(state);
  if(!pending&&serialized===base)return true;
  const request=pending||{state,revision,command:newId()};pending=request;status.textContent='☁ 正在保存…';
  flight=(async()=>{
   try{
    const ack=await api('/api/state',request,session.csrf);
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
 function schedule(){if(blocked)return;status.textContent='☁ 等待保存…';clearTimeout(timer);timer=setTimeout(flush,120)}
 async function refresh(){
  if(blocked||flight||pending||polling||!hooks.canRefresh()||JSON.stringify(hooks.getState())!==base)return;
  polling=true;try{
   const next=await api('/api/state');
   // Do not replace changes made while the request was travelling.
   if(blocked||flight||pending||!hooks.canRefresh()||JSON.stringify(hooks.getState())!==base)return;
   if(next.revision!==revision){revision=next.revision;paired=next.paired;base=JSON.stringify(next.state);hooks.apply(next.state,true);status.textContent='☁ 已同步最新存档'}
  }catch(e){if(e.status===401)showFailure(e);else status.textContent='☁ 暂时离线 · 等待连接'}finally{polling=false}
 }
 async function action(url,data={}){
  do{if(!(await flush()))return null;}while(pending||JSON.stringify(hooks.getState())!==base);
  try{const result=await api(url,data,session.csrf);return result}catch(e){hooks.toast(e.message||'连接失败，请重试');return null}
 }
 window.addEventListener('beforeunload',e=>{if(hooks&&(flight||pending||JSON.stringify(hooks.getState())!==base)){e.preventDefault();e.returnValue=''}});
 window.addEventListener('online',()=>{if(!blocked)refresh()});
 return {
  state:current.state,session,get paired(){return paired},
  save:schedule,flush,refresh,
  attach(h){hooks=h;status.onclick=()=>h.settings();setInterval(refresh,5000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();else if(!blocked)flush()})},
  async invite(){return action('/api/invite')},
  async pair(code){const r=await action('/api/pair',{code});if(r)location.reload()},
  async unpair(){const r=await action('/api/unpair');if(r)location.reload()},
  async logout(){const r=await action('/api/logout');if(r)location.reload()},
  exportDraft(){download(hooks.getState(),'little-planet-save.json')}
 };
}
