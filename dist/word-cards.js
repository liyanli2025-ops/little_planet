import {nextWord,answerWord,readProgress} from './word-progress.js';
const examples=[
 ['gentle','/ˈdʒentl/','温柔的；轻柔的','A gentle breeze comes through the window.','微风从窗户吹进来。'],
 ['cozy','/ˈkoʊzi/','温暖舒适的','This room feels cozy.','这个房间让人感觉温暖舒适。'],
 ['wander','/ˈwɑːndər/','漫步；闲逛','We wander through the garden.','我们在花园里漫步。'],
 ['bloom','/bluːm/','开花','The roses bloom in spring.','玫瑰在春天盛开。'],
 ['cherish','/ˈtʃerɪʃ/','珍惜；珍爱','I cherish our time together.','我珍惜我们在一起的时光。']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createWordCards({onStart,onEnd,onComplete,identity=()=>0}){
 const el=document.createElement('dialog');el.className='word-cards';el.setAttribute('aria-label','沙发单词卡');document.body.append(el);
 let words=null,loading=false,failed=false,current=null,flipped=false,progress=null,storageKey='',storageFailed=false,session=new Map();
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify(progress));storageFailed=false}catch{storageFailed=true}}
 function choose(){current=nextWord(progress,words.length);flipped=false}
 function draw(){el.innerHTML=`<header><span>日常词卡 <small>${session.size?'已学 '+session.size+' 词':''}</small></span><button data-word-close aria-label="起身离开">×</button></header>`;
 if(!words){el.innerHTML+=`<section class="word-finish"><p>${failed?'词卡暂时没取到':'正在翻开词卡…'}</p>${failed?'<button data-word-retry>再试一次</button>':''}</section>`;return}
 const w=words[current],example=examples.find(e=>e[0]===w[0]);
 el.innerHTML+=`<div class="word-heading"><h2>${esc(w[0])}</h2><button data-word-speak aria-label="朗读单词" ${!window.speechSynthesis?'hidden':''}>♪</button></div><div class="word-phonetic">${w[1]?esc('/'+w[1].replace(/^\/|\/$/g,'')+'/'):''}</div><button class="word-flip" data-word-flip aria-label="${flipped?'收起释义':'翻开释义'}">${flipped?`<strong>${esc(w[2])}</strong>${example?`<span>${esc(example[3])}</span><small>${esc(example[4])}</small>`:''}`:'<span class="word-flip-hint">轻点，翻开释义 ↗</span>'}</button><footer>${flipped?'<button data-word-answer="again">还不熟</button><button class="word-known" data-word-answer="known">记住了</button>':'<span class="word-deck-note">日常高频</span>'}</footer>${storageFailed?'<small role="status">浏览器未能保存进度，请勿关闭页面。</small>':''}`
 }
 async function load(){if(loading)return;loading=true;failed=false;draw();try{const r=await fetch(new URL('./assets/words/everyday.json',import.meta.url));if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data)||!data.length||!data.every(w=>Array.isArray(w)&&w.length>=3&&w.every(v=>typeof v==='string')))throw Error();words=data;if(el.open){choose();draw()}}catch{failed=true;if(el.open)draw()}finally{loading=false}}
 function close(){if(!el.open)return;el.close();window.speechSynthesis?.cancel();onEnd();if(session.size){const known=[...session.values()].filter(Boolean).length;onComplete(known,session.size-known);session.clear()}}
 el.addEventListener('cancel',e=>{e.preventDefault();close()});
 el.addEventListener('click',e=>{if(e.target.closest('[data-word-close]'))return close();if(e.target.closest('[data-word-retry]'))return load();if(!words)return;if(e.target.closest('[data-word-flip]')){flipped=!flipped;draw();return}if(e.target.closest('[data-word-speak]')){const s=new SpeechSynthesisUtterance(words[current][0]);s.lang='en-US';s.rate=.8;speechSynthesis.cancel();speechSynthesis.speak(s);return}const b=e.target.closest('[data-word-answer]');if(!b||!flipped)return;const known=b.dataset.wordAnswer==='known';session.set(current,known);answerWord(progress,current,known,words.length);persist();choose();draw()});
 return {open(){if(el.open)return;storageKey='echoo-words-v1-'+identity();let raw;try{raw=localStorage.getItem(storageKey)}catch{}progress=readProgress(raw);session=new Map();flipped=false;onStart();el.show();if(words){choose();draw()}else load()},close};
}
