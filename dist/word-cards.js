import {nextWord,answerWord,readProgress} from './word-progress.js';
const examples=[
 ['gentle','/ˈdʒentl/','温柔的；轻柔的','A gentle breeze comes through the window.','微风从窗户吹进来。'],
 ['cozy','/ˈkoʊzi/','温暖舒适的','This room feels cozy.','这个房间让人感觉温暖舒适。'],
 ['wander','/ˈwɑːndər/','漫步；闲逛','We wander through the garden.','我们在花园里漫步。'],
 ['bloom','/bluːm/','开花','The roses bloom in spring.','玫瑰在春天盛开。'],
 ['cherish','/ˈtʃerɪʃ/','珍惜；珍爱','I cherish our time together.','我珍惜我们在一起的时光。']];
const decks={ky:'考研进阶',ielts:'雅思进阶',toefl:'托福进阶',everyday:'日常高频'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createWordCards({onStart,onEnd,onComplete,identity=()=>0}){
 const el=document.createElement('dialog');el.className='word-cards';el.setAttribute('aria-label','沙发单词卡');document.body.append(el);
 let words=null,failed=false,current=null,progress=null,storageKey='',storageFailed=false,session=new Map(),deck='ky',loadToken=0;const cache=new Map();
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify(progress));storageFailed=false}catch{storageFailed=true}}
 function choose(){current=nextWord(progress,words.length);}
 function draw(){el.innerHTML=`<header><span><select data-word-deck aria-label="选择词书">${Object.entries(decks).map(([id,name])=>`<option value="${id}" ${deck===id?'selected':''}>${name}</option>`).join('')}</select> <small>${session.size?'已学 '+session.size+' 词':''}</small></span><button data-word-close aria-label="起身离开">×</button></header>`;
 if(!words){el.innerHTML+=`<section class="word-finish"><p>${failed?'词卡暂时没取到':'正在翻开词卡…'}</p>${failed?'<button data-word-retry>再试一次</button>':''}</section>`;return}
 const w=words[current],example=examples.find(e=>e[0]===w[0]);
 el.innerHTML+=`<article class="word-study" tabindex="0" aria-label="单词卡。左滑或左方向键：忘记；右滑或右方向键：记住。"><div class="word-heading"><h2>${esc(w[0])}</h2><button data-word-speak aria-label="朗读单词" ${!window.speechSynthesis?'hidden':''}>♪</button></div><div class="word-phonetic">${w[1]?esc('/'+w[1].replace(/^\/|\/$/g,'')+'/'):''}</div><div class="word-meaning"><strong>${esc(w[2])}</strong>${example?`<span>${esc(example[3])}</span><small>${esc(example[4])}</small>`:''}</div></article><footer class="word-swipe-hints"><span>← 忘记</span><span>记住 →</span></footer><span class="word-feedback" role="status" aria-live="polite"></span>${storageFailed?'<small role="status">浏览器未能保存进度，请勿关闭页面。</small>':''}`

 }
 function selectDeck(id){clearTimeout(answerTimer);answerTimer=null;drag=null;deck=Object.hasOwn(decks,id)?id:'ky';window.speechSynthesis?.cancel();storageKey=deck==='everyday'?'echoo-words-v1-'+identity():'echoo-words-v2-'+identity()+'-'+deck;let raw;try{raw=localStorage.getItem(storageKey);localStorage.setItem('echoo-word-deck-'+identity(),deck)}catch{}progress=readProgress(raw);storageFailed=false;words=null;load()}
 async function load(){const token=++loadToken,id=deck;failed=false;draw();try{let data=cache.get(id);if(!data){const r=await fetch(new URL('./assets/words/'+id+'.json',import.meta.url));if(!r.ok)throw Error();data=await r.json();if(!Array.isArray(data)||!data.length||!data.every(w=>Array.isArray(w)&&w.length>=3&&w.every(v=>typeof v==='string')))throw Error();cache.set(id,data)}if(token!==loadToken||!el.open)return;words=data;choose();draw()}catch{if(token!==loadToken||!el.open)return;failed=true;draw()}}
 function close(){if(!el.open)return;clearTimeout(answerTimer);answerTimer=null;drag=null;el.close();loadToken++;window.speechSynthesis?.cancel();onEnd();if(session.size){const known=[...session.values()].filter(Boolean).length;onComplete(known,session.size-known);session.clear()}}
 el.addEventListener('change',e=>{if(e.target.matches('[data-word-deck]'))selectDeck(e.target.value)});
 el.addEventListener('cancel',e=>{e.preventDefault();close()});
 let drag=null,answerTimer=null;
 function answer(known){if(!words||answerTimer!==null||!el.open)return;const card=el.querySelector('.word-study');session.set(words[current][0],known);answerWord(progress,current,known,words.length);persist();window.speechSynthesis?.cancel();el.querySelector('.word-feedback').textContent=known?'记住了':'会再复习';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;card.style.transition=reduced?'none':'transform 140ms ease, opacity 140ms ease';card.style.transform='translateX('+(known?120:-120)+'px)';card.style.opacity='0';answerTimer=setTimeout(()=>{answerTimer=null;if(!el.open)return;choose();draw();el.querySelector('.word-study')?.focus({preventScroll:true})},reduced?0:140)}
 el.addEventListener('pointerdown',e=>{const card=e.target.closest('.word-study');if(!card||e.target.closest('button')||!e.isPrimary||e.button!==0||answerTimer!==null)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,card};card.setPointerCapture(e.pointerId)});
 el.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8){drag.card.style.transform='translateX('+Math.max(-120,Math.min(120,dx))+'px) rotate('+(dx/24)+'deg)';el.querySelector('.word-swipe-hints').dataset.direction=dx>0?'right':'left'}});
 function release(e,cancel=false){if(!drag||drag.id!==e.pointerId)return;const {x,y,card}=drag;drag=null;if(card.hasPointerCapture(e.pointerId))card.releasePointerCapture(e.pointerId);const dx=e.clientX-x,dy=e.clientY-y;card.style.transform='';el.querySelector('.word-swipe-hints')?.removeAttribute('data-direction');if(!cancel&&Math.abs(dx)>=55&&Math.abs(dx)>Math.abs(dy)*1.25)answer(dx>0)}
 el.addEventListener('pointerup',e=>release(e));el.addEventListener('pointercancel',e=>release(e,true));
 el.addEventListener('keydown',e=>{if(e.target.closest('select,input,textarea')||!['ArrowLeft','ArrowRight'].includes(e.key)||e.repeat)return;e.preventDefault();answer(e.key==='ArrowRight')});
 el.addEventListener('click',e=>{if(e.target.closest('[data-word-close]'))return close();if(e.target.closest('[data-word-retry]'))return load();if(!words)return;if(e.target.closest('[data-word-speak]')){const s=new SpeechSynthesisUtterance(words[current][0]);s.lang='en-US';s.rate=.8;speechSynthesis.cancel();speechSynthesis.speak(s)}});
 return {open(){if(el.open)return;let saved;try{saved=localStorage.getItem('echoo-word-deck-'+identity())}catch{}session=new Map();onStart();el.show();selectDeck(saved||'ky')},close};
}
