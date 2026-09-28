(()=>{
 const el=document.getElementById('planet-arrival'),label=el.querySelector('p'),retry=el.querySelector('button');let timer,leaving,busy=false;
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 function start(partner=false){clearTimeout(timer);clearTimeout(leaving);el.hidden=false;el.classList.remove('departed');label.textContent=partner?'正在靠近你':'正在回家';retry.hidden=true;document.getElementById('app').inert=true;timer=setTimeout(()=>{label.textContent='还在路上，稍等一会儿';retry.hidden=false},30000)}
 async function finish(){await frames();clearTimeout(timer);el.classList.add('departed');document.getElementById('app').inert=false;leaving=setTimeout(()=>{el.hidden=true},280)}
 retry.onclick=()=>location.reload();
 window.planetArrival={start,finish,async travel(partner,change){if(busy)return;busy=true;start(partner);try{await frames();change();await finish()}finally{busy=false}}};start();
})();
