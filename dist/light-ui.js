export function createLightUI({context,change}){
 const panel=document.createElement('dialog');panel.className='light-picker';panel.setAttribute('aria-label','夜间灯光');document.body.append(panel);
 const css=document.createElement('link');css.rel='stylesheet';css.href='/light-picker.css';document.head.append(css);
 let busy=false;function draw(){const level=context().state.worlds[context().world].life?.nightLight??0;panel.innerHTML='<div role="group" aria-label="夜间亮度">'+['微光','暖光','明亮'].map((label,i)=>'<button data-level="'+i+'" aria-pressed="'+(i===level)+'">'+label+'</button>').join('')+'</div>';}
 panel.onclick=async e=>{const b=e.target.closest('[data-level]');if(!b){if(e.target===panel)panel.close();return}if(busy)return;busy=true;panel.querySelectorAll('button').forEach(b=>b.disabled=true);try{if(await change(Number(b.dataset.level)))panel.close()}finally{busy=false;draw()}};
 return {open(){draw();if(!panel.open)panel.showModal()}};
}
