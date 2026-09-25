export function compactUI(){
 const $=s=>document.querySelector(s),brand=$('.brand');
 const menu=document.createElement('dialog');menu.id='world-menu';menu.setAttribute('aria-label','星球菜单');menu.innerHTML='<div class="menu-heading"><strong>阿球</strong><button type="button" aria-label="关闭菜单" data-menu-close>×</button></div><div class="menu-worlds"></div><div class="menu-items"></div><details><summary>探索工具</summary><label><input type="checkbox" id="show-walk-tools">显示方向与缩放按钮</label><div class="menu-tools"></div></details>';document.body.append(menu);
 const worlds=$('#world-tabs');menu.querySelector('.menu-worlds').append(worlds);
 for(const key of ['planet','decorate','bag'])menu.querySelector('.menu-items').append($('[data-nav='+key+']'));
 const settings=$('#settings');settings.textContent='账号与设置';menu.querySelector('.menu-items').append(settings);
 for(const id of ['view-mode','tour-world']){const item=$('#'+id);if(item)menu.querySelector('.menu-tools').append(item)}
 brand.setAttribute('aria-haspopup','dialog');brand.setAttribute('aria-expanded','false');brand.setAttribute('aria-label','打开星球菜单');brand.onclick=e=>{e.preventDefault();if(!menu.open){menu.showModal();brand.setAttribute('aria-expanded','true')}};
 menu.addEventListener('click',e=>{if(e.target===menu||e.target.closest('[data-menu-close],[data-nav],[data-world],#settings,#view-mode,#tour-world'))menu.close()},true);
 menu.addEventListener('close',()=>{brand.setAttribute('aria-expanded','false');brand.focus()});$('#show-walk-tools').onchange=e=>document.body.classList.toggle('walk-tools',e.target.checked);
 const weather=$('.weather-switch');if(weather){const help=document.createElement('details');help.className='help-details';help.innerHTML='<summary>手动天气</summary>';weather.before(help);help.append(weather)}
 const status=$('.cloud-status');if(status){let timer;const update=()=>{clearTimeout(timer);const text=status.textContent;status.hidden=!/离线|尚未|更新|正在|等待|失败|连接/.test(text);if(/已同步最新/.test(text))status.hidden=true;if(/已保存|已载入|已同步|互动已保存/.test(text))status.hidden=true;};new MutationObserver(update).observe(status,{childList:true,subtree:true,characterData:true});update()}
}
