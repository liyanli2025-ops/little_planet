const drawer=document.querySelector('#daybook-drawer');
const trigger=document.querySelector('#open-daybook');
export function closeDaybook(){if(drawer?.open)drawer.close()}
trigger.addEventListener('click',()=>{if(!drawer.open){drawer.showModal();trigger.setAttribute('aria-expanded','true')}});
document.querySelector('#close-daybook').addEventListener('click',closeDaybook);
drawer.addEventListener('close',()=>trigger.setAttribute('aria-expanded','false'));
drawer.addEventListener('click',event=>{
 if(event.target===drawer){
  const r=drawer.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDaybook();
 }
 // Release the modal focus trap before the existing action opens a model or starts a walk.
 if(event.target.closest('[data-action],#all-memories,#go-camp,#go-pet,#go-read,#view-mode,#tour-world,[data-weather]'))closeDaybook();
},true);
