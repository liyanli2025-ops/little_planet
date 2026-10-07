import {createCafeChatUI} from './cafe-chat-ui.js';
export function createAuroraChat(interior){
 let active=false,generation=0,session=null,polling=false;
 async function api(path,data){
  if(!session){let r;try{r=await fetch('/api/session',{credentials:'same-origin'});session=await r.json()}catch{throw Error('当前是静态场景预览，AI 聊天需要在已登录的服务器页面使用。')}
   if(!session.authenticated){session=null;throw Error('请先在主页登录，再来和凛灯聊天。')}}
  const r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':session.csrf,'X-Planet-Space':String(session.space)},body:JSON.stringify(data),signal:AbortSignal.timeout(55000)});
  const value=await r.json();if(!r.ok)throw Error(value.error||'暂时没有连接上凛灯');return value;
 }
 const ui=createCafeChatUI(document.body,{async cafeChat(message){const token=generation;await api('/api/aurora/lodge',{action:'join'});if(!active||token!==generation)throw Error('你已离开冰屋');const result=await api('/api/aurora/chat',message);await sync();return result;}},()=>{}, {name:'凛灯',greeting:'我是凛灯，替这片雪地守着一盏灯。想聊会儿天也好，喝一杯也好。这里有云莓冰酿、蓝莓雪松气泡、极光冰杯酒（含酒精）和暖可可。'});
 async function sync(){if(!active||!session||polling)return;polling=true;const token=generation;try{const state=await api('/api/aurora/lodge',{action:'status'});if(active&&token===generation)interior.setOrder(state.guests[0]);}finally{polling=false}}
 const timer=setInterval(()=>{if(active&&session)sync().catch(()=>{})},1500);
 return {open(){ui.open()},setActive(value){active=value;generation++;ui.seat(value);if(!value){ui.reset();interior.setOrder(null);if(session)api('/api/aurora/lodge',{action:'leave'}).catch(()=>{})}},async take(){if(!session)return;await api('/api/aurora/lodge',{action:'take'});await sync()},async finish(){if(!session)return;await api('/api/aurora/lodge',{action:'finish'});await sync()},dispose(){clearInterval(timer)}};
}
