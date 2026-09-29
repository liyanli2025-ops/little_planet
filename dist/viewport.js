// Safari can zoom the document through gestures that begin over UI, not canvas.
(()=>{
 const cancel=e=>{if(e.cancelable)e.preventDefault()};
 for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,cancel,{passive:false});
 document.addEventListener('touchmove',e=>{if(e.touches.length>1)cancel(e)},{passive:false});
 const resetPage=()=>{if(window.scrollX||window.scrollY)window.scrollTo(0,0)};
 window.addEventListener('resize',resetPage);
 window.addEventListener('pageshow',resetPage);
 document.addEventListener('focusout',()=>setTimeout(()=>{if(!document.activeElement?.matches('input,textarea,select,[contenteditable=true]'))resetPage()},150));
})();
