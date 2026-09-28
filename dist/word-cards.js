// Curated demonstration deck; not an imported exam syllabus.
const words=[
 ['gentle','/ˈdʒentl/','温柔的；轻柔的','A gentle breeze comes through the window.','微风从窗户吹进来。'],
 ['cozy','/ˈkoʊzi/','温暖舒适的','This room feels cozy.','这个房间让人感觉温暖舒适。'],
 ['wander','/ˈwɑːndər/','漫步；闲逛','We wander through the garden.','我们在花园里漫步。'],
 ['bloom','/bluːm/','开花','The roses bloom in spring.','玫瑰在春天盛开。'],
 ['cherish','/ˈtʃerɪʃ/','珍惜；珍爱','I cherish our time together.','我珍惜我们在一起的时光。']];
export function createWordCards({onStart,onEnd,onComplete}){
 const el=document.createElement('dialog');el.className='word-cards';el.setAttribute('aria-label','沙发单词卡');document.body.append(el);let index=0,flipped=false,known=0,done=false;
 function draw(){el.innerHTML=`<header><span>日常词卡 <small>${done?'':(index+1)+' / '+words.length}</small></span><button data-word-close aria-label="起身离开">×</button></header>`+(done?`<section class="word-finish"><span>✧</span><h2>今天记到这里</h2><p>认识了 ${known} 个词，${words.length-known} 个还想再看看</p><button data-word-close>起身走走</button></section>`:`<div class="word-heading"><h2>${words[index][0]}</h2><button data-word-speak aria-label="朗读单词" ${!window.speechSynthesis?'hidden':''}>♪</button></div><div class="word-phonetic">${words[index][1]}</div><button class="word-flip" data-word-flip aria-label="${flipped?'收起释义':'翻开释义'}">${flipped?`<strong>${words[index][2]}</strong><span>${words[index][3]}</span><small>${words[index][4]}</small>`:'<span class="word-flip-hint">轻点，翻开释义 ↗</span>'}</button><footer>${flipped?'<button data-word-answer="again">还不熟</button><button class="word-known" data-word-answer="known">记住了</button>':'<span class="word-deck-note">日常 · 体验词组</span>'}</footer>`)}
 function close(){if(!el.open)return;el.close();window.speechSynthesis?.cancel();onEnd()}
 el.addEventListener('cancel',e=>{e.preventDefault();close()});
 el.addEventListener('click',e=>{if(e.target.closest('[data-word-close]'))return close();if(e.target.closest('[data-word-flip]')){flipped=!flipped;draw();return}if(e.target.closest('[data-word-speak]')){const s=new SpeechSynthesisUtterance(words[index][0]);s.lang='en-US';s.rate=.8;speechSynthesis.cancel();speechSynthesis.speak(s);return}const b=e.target.closest('[data-word-answer]');if(!b||done||!flipped)return;if(b.dataset.wordAnswer==='known')known++;index++;flipped=false;if(index===words.length){done=true;onComplete(known,words.length-known)}draw()});
 return {open(){if(el.open)return;index=0;known=0;done=false;flipped=false;onStart();draw();el.show();el.querySelector('[data-word-flip]').focus({preventScroll:true})},close};
}
