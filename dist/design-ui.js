import {defaultDesign,designLabels} from './design-schema.js';
import {newId} from './cloud.js?v=6';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createDesignUI({cloud,context,closePanel,handlers,toast,onScope,onWardrobe}){
 let data=null,worlds=[defaultDesign(),defaultDesign()],scope='home',proposal=null,original=false,busy=false,open=false,epoch=0,prompt='',screen='edit',error='';
 const el=document.createElement('section');el.id='design-studio';el.hidden=true;el.setAttribute('aria-label','设计角');document.body.append(el);
 const css=document.createElement('link');css.rel='stylesheet';css.href='/design.css';document.head.append(css);
 const button=(action,text,extra='')=>'<button type="button" data-design="'+action+'" '+extra+'>'+text+'</button>';
 function apply(){const ds=structuredClone(worlds);if(proposal&&!original)ds[context().actor][proposal.scope]=proposal.values;context().visual?.designs(ds)}
 async function load(){if(!cloud)return;const next=await cloud.design();data=next;worlds=next.worlds.map(x=>x?.design||defaultDesign());apply()}
 function hide(){epoch++;busy=false;open=false;proposal=null;original=false;el.hidden=true;apply()}
 function draw(){if(!open)return;const needsClothes=scope==='outfit'&&context().visual?.readState().outfit==='plain';el.innerHTML='<header><h2>设计角</h2>'+button('close','×','aria-label="关闭设计角"')+'</header>'+(screen==='history'?'<div class="design-history"><h3>设计记录</h3><p>只恢复外观，生活记录不受影响。</p>'+button('restore','初始设计','data-version="0"')+(data?.history||[]).map(h=>button('restore',esc(h.label)+' · '+new Date(h.created).toLocaleDateString('zh-CN'), 'data-version="'+h.version+'" '+(h.version===data.version?'disabled':''))).join('')+'</div>'+button('back','返回'):proposal?'<p class="design-caption">'+(proposal.source==='example'?'示例预览':'方案预览')+' · 尚未保存</p><div class="design-swatches">'+Object.entries(proposal.values).map(([k,v])=>'<span>'+designLabels[k]+' · '+designLabels[v]+'</span>').join('')+'</div><div class="design-actions">'+button('compare',original?'看方案':'看原样')+button('save','保存','class="primary"')+button('cancel','取消')+'</div>':'<nav aria-label="设计范围">'+Object.entries({outfit:'衣服',planet:'星球',home:'小屋'}).map(([id,label])=>button('scope',label,'data-scope="'+id+'" aria-pressed="'+(scope===id)+'"')).join('')+'</nav><label for="design-prompt" class="design-caption">'+({outfit:'为身上的衣服换一套配色',planet:'草地、水面与屋顶',home:'墙面、软装与灯光'})[scope]+'</label><textarea id="design-prompt" maxlength="400" placeholder="比如：奶油色搭配鼠尾草绿，温暖一点">'+esc(prompt)+'</textarea><div class="design-actions">'+button('generate','生成方案','class="primary" '+(!data?.enabled||data.remaining===0||needsClothes?'disabled':''))+(needsClothes?button('wardrobe','先去衣柜选一件'):button('example','试试示例'))+'</div><footer>'+(data?.enabled?'<small>今日剩余 '+data.remaining+' 次</small>':'<small>AI 尚未开启，示例可以先体验</small>')+button('history','历史与恢复')+'</footer><details><summary>可以改什么</summary><p>修改配色、衣服图案与灯光；房型、家具位置和功能保持原样。图案用于上衣，先在衣柜换上喜欢的款式。每次先预览，保存后对方才能看到。保留最近 20 次设计，也能恢复初始外观。</p></details>')+'<p class="design-message" role="status">'+esc(error|| (busy?'正在处理…':''))+'</p>';
 el.querySelectorAll('button,textarea').forEach(b=>{if(busy)b.disabled=true});el.querySelector('[data-design=close]').disabled=false;el.querySelector('textarea')?.addEventListener('input',e=>prompt=e.target.value);
 }
 async function show(){closePanel();if(!cloud)return toast('请登录后使用设计角');if(context().world!==context().actor)return toast('回到自己的星球后再设计吧');open=true;el.hidden=false;onScope(scope);screen='edit';proposal=null;error='';const token=++epoch;busy=true;draw();try{await load()}catch(e){error=e.message}finally{if(token===epoch){busy=false;draw()}}}
 async function run(fn){if(busy)return;busy=true;error='';const token=epoch;draw();try{const result=await fn();if(token!==epoch)return;if(result.id){proposal=result;if(result.source==='ai')data.remaining=Math.max(0,data.remaining-1);original=false;apply()}else{data=result;worlds[context().actor]=result.design;proposal=null;original=false;screen='edit';apply();toast('设计已保存')}}catch(e){if(token===epoch){error=e.message;if(e.status===409){proposal=null;original=false}try{await load()}catch{}}}finally{if(token===epoch){busy=false;draw()}}}
 el.onclick=e=>{const b=e.target.closest('[data-design]');if(!b)return;const a=b.dataset.design;if(a==='close')return hide();if(busy)return;
 if(a==='wardrobe'){hide();onWardrobe();return}if(a==='scope'){scope=b.dataset.scope;onScope(scope);error='';draw()}if(a==='history'){screen='history';draw()}if(a==='back'){screen='edit';draw()}
 if(a==='compare'){original=!original;apply();draw()}if(a==='cancel'){proposal=null;original=false;apply();draw()}
 if(a==='example'||a==='generate'){if(!data)return;run(()=>cloud.design({action:'generate',scope,version:data.version,prompt,example:a==='example',requestId:newId()}))}
 if(a==='save'&&proposal)run(()=>cloud.design({action:'accept',id:proposal.id,version:proposal.base}));
 if(a==='restore'&&confirm('恢复这份外观设计？食物、手账和其他生活记录不会改变。'))run(()=>cloud.design({action:'rollback',version:data.version,target:Number(b.dataset.version)}));
 };
 handlers['design-open']=show;
 document.querySelector('#activity-dock')?.addEventListener('click',e=>{if(e.target.closest('[data-do=design-open]'))void show()});
 document.addEventListener('keydown',e=>{if(open&&e.key==='Escape'){e.preventDefault();hide()}});
 let polling=false;async function poll(){if(!cloud||document.hidden||busy||open||polling)return;polling=true;try{await load()}catch{}finally{polling=false}}
 setInterval(poll,10000);document.addEventListener('visibilitychange',poll);void poll();
 return {open:show,close:hide,refresh(){if(open&&context().world!==context().actor)hide();apply()},state:()=>({open,proposal,version:data?.version})};
}
