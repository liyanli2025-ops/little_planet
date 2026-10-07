(()=>{
 const el=document.getElementById('planet-arrival'),label=el.querySelector('p'),retry=el.querySelector('button');let timer,leaving,busy=false,phase="";
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 function start(partner=false,text=null){clearTimeout(timer);clearTimeout(leaving);el.hidden=false;el.classList.remove('departed');label.textContent=text||(partner?'正在靠近你':'正在回家');el.setAttribute('aria-busy','true');retry.hidden=true;document.getElementById('app').inert=true;timer=setTimeout(()=>{label.textContent=(phase||'还在路上')+'，加载较慢，请稍候';retry.hidden=false},30000)}
 async function finish(){await frames();el.setAttribute('aria-busy','false');clearTimeout(timer);el.classList.add('departed');document.getElementById('app').inert=false;leaving=setTimeout(()=>{el.hidden=true},280)}
 retry.onclick=()=>location.reload();
 window.planetArrival={start,finish,phase(text){phase=text;label.textContent=text;},async travel(partner,change){if(busy)return;busy=true;start(partner);try{await frames();change();await finish()}finally{busy=false}}};start();
})();
