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
 let words=null,failed=false,current=null,flipped=false,progress=null,storageKey='',storageFailed=false,session=new Map(),deck='ky',loadToken=0;const cache=new Map();
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify(progress));storageFailed=false}catch{storageFailed=true}}
 function choose(){current=nextWord(progress,words.length);flipped=false}
 function draw(){el.innerHTML=`<header><span><select data-word-deck aria-label="选择词书">${Object.entries(decks).map(([id,name])=>`<option value="${id}" ${deck===id?'selected':''}>${name}</option>`).join('')}</select> <small>${session.size?'已学 '+session.size+' 词':''}</small></span><button data-word-close aria-label="起身离开">×</button></header>`;
 if(!words){el.innerHTML+=`<section class="word-finish"><p>${failed?'词卡暂时没取到':'正在翻开词卡…'}</p>${failed?'<button data-word-retry>再试一次</button>':''}</section>`;return}
 const w=words[current],example=examples.find(e=>e[0]===w[0]);
 el.innerHTML+=`<div class="word-heading"><h2>${esc(w[0])}</h2><button data-word-speak aria-label="朗读单词" ${!window.speechSynthesis?'hidden':''}>♪</button></div><div class="word-phonetic">${w[1]?esc('/'+w[1].replace(/^\/|\/$/g,'')+'/'):''}</div><button class="word-flip" data-word-flip aria-label="${flipped?'收起释义':'翻开释义'}">${flipped?`<strong>${esc(w[2])}</strong>${example?`<span>${esc(example[3])}</span><small>${esc(example[4])}</small>`:''}`:'<span class="word-flip-hint">轻点，翻开释义 ↗</span>'}</button><footer>${flipped?'<button data-word-answer="again">还不熟</button><button class="word-known" data-word-answer="known">记住了</button>':'<span class="word-deck-note">'+decks[deck]+'</span>'}</footer>${storageFailed?'<small role="status">浏览器未能保存进度，请勿关闭页面。</small>':''}`
 }
 function selectDeck(id){deck=Object.hasOwn(decks,id)?id:'ky';window.speechSynthesis?.cancel();storageKey=deck==='everyday'?'echoo-words-v1-'+identity():'echoo-words-v2-'+identity()+'-'+deck;let raw;try{raw=localStorage.getItem(storageKey);localStorage.setItem('echoo-word-deck-'+identity(),deck)}catch{}progress=readProgress(raw);storageFailed=false;flipped=false;words=null;load()}
 async function load(){const token=++loadToken,id=deck;failed=false;draw();try{let data=cache.get(id);if(!data){const r=await fetch(new URL('./assets/words/'+id+'.json',import.meta.url));if(!r.ok)throw Error();data=await r.json();if(!Array.isArray(data)||!data.length||!data.every(w=>Array.isArray(w)&&w.length>=3&&w.every(v=>typeof v==='string')))throw Error();cache.set(id,data)}if(token!==loadToken||!el.open)return;words=data;choose();draw()}catch{if(token!==loadToken||!el.open)return;failed=true;draw()}}
 function close(){if(!el.open)return;el.close();loadToken++;window.speechSynthesis?.cancel();onEnd();if(session.size){const known=[...session.values()].filter(Boolean).length;onComplete(known,session.size-known);session.clear()}}
 el.addEventListener('change',e=>{if(e.target.matches('[data-word-deck]'))selectDeck(e.target.value)});
 el.addEventListener('cancel',e=>{e.preventDefault();close()});
 el.addEventListener('click',e=>{if(e.target.closest('[data-word-close]'))return close();if(e.target.closest('[data-word-retry]'))return load();if(!words)return;if(e.target.closest('[data-word-flip]')){flipped=!flipped;draw();return}if(e.target.closest('[data-word-speak]')){const s=new SpeechSynthesisUtterance(words[current][0]);s.lang='en-US';s.rate=.8;speechSynthesis.cancel();speechSynthesis.speak(s);return}const b=e.target.closest('[data-word-answer]');if(!b||!flipped)return;const known=b.dataset.wordAnswer==='known';session.set(words[current][0],known);answerWord(progress,current,known,words.length);persist();choose();draw()});
 return {open(){if(el.open)return;let saved;try{saved=localStorage.getItem('echoo-word-deck-'+identity())}catch{}session=new Map();flipped=false;onStart();el.show();selectDeck(saved||'ky')},close};
}
