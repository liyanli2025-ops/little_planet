// Forget interrupted contacts before a new gesture; a primary contact starts a fresh touch session.
export function bindPointerRecovery(canvas,pointers,reset,{window:win=globalThis.window,document:doc=globalThis.document}={}){
 const clear=()=>{pointers.clear();reset();};
 const down=e=>{if(e.isPrimary&&pointers.size&&!pointers.has(e.pointerId))clear();};
 const lost=e=>{if(pointers.has(e.pointerId))clear();};
 const move=e=>{if(e.pointerType==='mouse'&&e.buttons===0&&pointers.has(e.pointerId))clear();};
 const hidden=()=>{if(doc?.hidden)clear();};
 canvas.style.touchAction='none';canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('lostpointercapture',lost);canvas.addEventListener('pointermove',move,true);
 win?.addEventListener('blur',clear);win?.addEventListener('pagehide',clear);doc?.addEventListener('visibilitychange',hidden);
 return ()=>{clear();canvas.removeEventListener('pointerdown',down,true);canvas.removeEventListener('lostpointercapture',lost);canvas.removeEventListener('pointermove',move,true);win?.removeEventListener('blur',clear);win?.removeEventListener('pagehide',clear);doc?.removeEventListener('visibilitychange',hidden);};
}
