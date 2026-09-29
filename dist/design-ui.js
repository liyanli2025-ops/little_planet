import {defaultDesign,designLabels} from './design-schema.js';
import {newId} from './cloud.js?v=6';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createDesignUI({cloud,context,closePanel,handlers,toast,onScope,onPreviewCreation}){
 let data=null,worlds=[defaultDesign(),defaultDesign()],scope='home',proposal=null,original=false,busy=false,open=false,epoch=0,prompt='',screen='edit',error='';
 const el=document.createElement('section');el.id='design-studio';el.hidden=true;el.setAttribute('aria-label','设计角');document.body.append(el);
 const css=document.createElement('link');css.rel='stylesheet';css.href='/design.css';document.head.append(css);
 const button=(action,text,extra='')=>'<button type="button" data-design="'+action+'" '+extra+'>'+text+'</button>';
 function apply(){const ds=structuredClone(worlds);if(proposal&&!original)ds[context().actor][proposal.scope]=proposal.values;context().visual?.designs(ds)}
 async function load(){if(!cloud)return;const next=await cloud.design();data=next;context().visual?.gifts(next.gifts?.length||0);worlds=next.worlds.map(x=>x?.design||defaultDesign());apply()}
 function hide(){epoch++;busy=false;open=false;proposal=null;original=false;el.hidden=true;apply()}
 function draw(){if(!open)return;
 let content='';
 if(screen==='gifts'&&!proposal)content='<div class="design-history">'+(data?.gifts?.length?data.gifts.map(g=>button('try',esc(g.label),'data-id="'+g.id+'"')).join(''):'<p>收到的装扮会放在这里。</p>')+'</div>';
 else if(screen==='items')content='<div class="design-history">'+(data?.items?.length?data.items.map(i=>button('item',esc(i.name),'data-id="'+i.id+'"')).join(''):'<p>保存后的作品会留在这里。</p>')+'</div>'+button('back','返回');
 else if(screen==='history')content='<div class="design-history">'+button('restore','初始设计','data-version="0"')+(data?.history||[]).map(h=>button('restore',esc(h.label)+' · '+new Date(h.created).toLocaleDateString('zh-CN'),'data-version="'+h.version+'" '+(h.version===data.version?'disabled':''))).join('')+'</div>'+button('back','返回');
 else if(proposal)content='<p class="design-caption">'+(proposal.values.creation?esc(proposal.values.creation.name)+' · ':'')+(proposal.gift?'试穿':proposal.source==='example'?'示例预览':'方案预览')+'</p><div class="design-swatches">'+Object.entries(proposal.values).filter(([k,v])=>v!=='none'&&k!=='creation').map(([k,v])=>'<span>'+designLabels[k]+' · '+esc(k==='garment'?({cream:'针织衫',sage:'连帽衫',rose:'开衫'}[v]||designLabels[v]):designLabels[v])+'</span>').join('')+'</div><div class="design-actions">'+button('compare',original?'看方案':'看原样')+button('save',proposal.gift?'穿上':'保存','class="primary"')+button('cancel','取消')+'</div>'+(!proposal.gift&&proposal.scope==='outfit'&&data.partnerId?'<div class="design-actions">'+button('gift','送给对方')+'</div>':'');
 else content='<nav aria-label="设计范围">'+Object.entries({outfit:'装扮',planet:'星球',home:'小屋'}).map(([id,label])=>button('scope',label,'data-scope="'+id+'" aria-pressed="'+(scope===id)+'"')).join('')+'</nav><textarea id="design-prompt" aria-label="设计想法" maxlength="400" placeholder="'+({outfit:'做一条绿色格子裙，裙摆宽一点',home:'做一张奶油色双人沙发，放在窗边',planet:'鼠尾草绿的草地，浅蓝色水面'})[scope]+'">'+esc(prompt)+'</textarea><div class="design-actions">'+button('generate','生成方案','class="primary" '+(!data?.enabled?'disabled':''))+button('example','试试示例')+'</div><footer>'+(data?.enabled?'':'<small>AI 尚未开启</small>')+button('items','我的作品')+button('history','历史与恢复')+'</footer><details><summary>可以改什么</summary><p>可创作格子裙和沙发，调整形状、尺寸与配色。沙发安放在窗边，替换原座位。其他款式仍使用现有部件；保存前可预览，也能恢复。</p></details>';
 el.innerHTML='<header><h2>'+(screen==='gifts'?'收到的装扮':screen==='history'?'设计记录':'设计角')+'</h2>'+button('close','×','aria-label="关闭设计角"')+'</header>'+content+'<p class="design-message" role="status">'+esc(error||(busy?'正在处理…':''))+'</p>';
 el.querySelectorAll('button,textarea').forEach(b=>{if(busy)b.disabled=true});el.querySelector('[data-design=close]').disabled=false;el.querySelector('textarea')?.addEventListener('input',e=>prompt=e.target.value);
 }
 async function show(gifts=false){if(!cloud)return toast('请登录后使用设计角');if(context().world!==context().actor)return toast('回到自己的星球后再设计吧');closePanel();open=true;el.hidden=false;if(!gifts)onScope(scope);screen=gifts?'gifts':'edit';proposal=null;error='';const token=++epoch;busy=true;draw();try{await load()}catch(e){error=e.message}finally{if(token===epoch){busy=false;draw()}}}
 async function run(fn){if(busy)return;busy=true;error='';const token=epoch;draw();try{const result=await fn();if(token!==epoch)return;if(result.id){screen='edit';proposal=result;original=false;if(proposal.values.creation)onPreviewCreation?.();apply()}else{data=result;worlds[context().actor]=result.design;proposal=null;original=false;apply();toast(result.sent?'已放进对方衣柜':'设计已保存')}}catch(e){if(token===epoch){error=e.message;if(e.status===409){proposal=null;original=false}try{await load()}catch{}}}finally{if(token===epoch){busy=false;draw()}}}
 el.onclick=e=>{const b=e.target.closest('[data-design]');if(!b)return;const a=b.dataset.design;if(a==='close')return hide();if(busy)return;
 if(a==='items'){screen='items';draw()}if(a==='item'){const id=b.dataset.id;run(()=>cloud.design({action:'previewItem',id,version:data.version}));return}
 if(a==='scope'){scope=b.dataset.scope;onScope(scope);error='';draw()}if(a==='history'){screen='history';draw()}if(a==='back'){screen='edit';draw()}
 if(a==='compare'){original=!original;apply();draw()}if(a==='cancel'){proposal=null;original=false;apply();draw()}
 if(a==='try'){const g=data.gifts.find(g=>g.id===b.dataset.id);if(g){proposal={...g,scope:'outfit',gift:true};original=false;apply();draw()}}
 if(a==='example'||a==='generate'){if(!data)return;run(()=>cloud.design({action:'generate',scope,version:data.version,prompt,example:a==='example',creationExample:true,requestId:newId()}))}
 if(a==='save'&&proposal)run(()=>cloud.design({action:proposal.gift?'wearGift':'accept',id:proposal.id,version:proposal.gift?data.version:proposal.base}));
 if(a==='gift'&&proposal)run(()=>cloud.design({action:'gift',id:proposal.id,partnerId:data.partnerId}));
 if(a==='restore'&&confirm('恢复这份设计？生活记录不会改变。'))run(()=>cloud.design({action:'rollback',version:data.version,target:Number(b.dataset.version)}));
 };
 handlers['design-items']=async()=>{await show();if(open){screen='items';draw()}};handlers['design-open']=()=>show();handlers['design-gifts']=()=>show(true);
 document.querySelector('#activity-dock')?.addEventListener('click',e=>{if(e.target.closest('[data-do=design-items]'))void handlers['design-items']();if(e.target.closest('[data-do=design-open]'))void show();if(e.target.closest('[data-do=design-gifts]'))void show(true)});
 document.addEventListener('keydown',e=>{if(open&&e.key==='Escape'){e.preventDefault();hide()}});
 let polling=false;async function poll(){if(!cloud||document.hidden||busy||open||polling)return;polling=true;try{await load()}catch{}finally{polling=false}}
 setInterval(poll,10000);document.addEventListener('visibilitychange',poll);void poll();
 return {open:()=>show(),close:hide,reload:load,refresh(){if(open&&context().world!==context().actor)hide();apply()},state:()=>({open,proposal,version:data?.version})};
}
