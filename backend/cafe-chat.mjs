import {createHash} from 'node:crypto';
import {hostPersona,cafeOrderTool} from './cafe-host.mjs';
import {fail,AppError} from './store.mjs';
import {resolveDesignEnv,designThinking} from './ai-provider.mjs';
import {cafeSeats,cafeMenu} from '../dist/cafe-catalog.js';
// Conversation stays private and expires in memory; never put it in public presence.
export function createCafeChat({cafe,env=process.env,fetcher=fetch,now=Date.now}){
 const sessions=new Map();let running=0;
 return {async send(u,b){
  const state=cafe.view(u),own=state.guests.find(g=>g.id===u.id);
  fail(!!own,'请先进入咖啡馆再聊天',409);
  fail(typeof b?.message==='string'&&b.message.trim().length>0&&b.message.length<=600,'请写下 1–600 字想说的话');
  fail(typeof b.command==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(b.command),'消息编号无效');
  for(const [id,s] of sessions)if(!s.busy&&now()-s.at>1800000)sessions.delete(id);
  let s=sessions.get(u.id);if(!s){fail(sessions.size<500,'主理熊暂时忙不过来，请稍后再聊',429);s={history:[],at:0};sessions.set(u.id,s)}
  if(s.command===b.command){fail(s.message===b.message,'消息编号已使用',409);return s.result||{reply:s.reply}}
  fail(!s.busy&&running<4,'主理熊正在回复，请稍等一下',429);
  fail(!s.at||now()-s.at>=2000,'慢慢聊，稍等一下再发送',429);
  const e=resolveDesignEnv(env);fail(e.AI_API_KEY&&e.AI_BASE_URL&&e.AI_MODEL,'主理熊的 AI 聊天还没有配置好',503);
  let url;try{url=new URL(e.AI_BASE_URL.replace(/\/$/,'')+'/chat/completions')}catch{throw new AppError(503,'聊天接口配置不正确')}
  fail(url.protocol==='https:','聊天接口需要 HTTPS',503);
  s.busy=true;s.at=now();running++;
  try{
   const response=await fetcher(url,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+e.AI_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model:e.AI_MODEL,messages:[{role:'system',content:hostPersona+'\n当前客人状态：'+JSON.stringify({hour:state.sky?.hour,weather:state.sky?.weather,night:state.sky?.night,order:own.order?.items||null,held:own.held?.items||null})},...s.history,{role:'user',content:b.message.trim()}],tools:[cafeOrderTool],tool_choice:'auto',max_tokens:800,...designThinking(url,e.AI_MODEL)})});
   if(!response.ok)throw new AppError(response.status===429?429:502,response.status===429?'主理熊暂时忙不过来，请稍后再聊':'聊天服务暂时没有回应，请稍后重试');
   const result=await response.json(),message=result.choices?.[0]?.message;let reply=message?.content,ordered=false;
   const calls=message?.tool_calls||[];
   if(calls.length){
    fail(calls.length===1&&calls[0].function?.name==='place_cafe_order','这份点单没有听清，请再说一次',502);
    let args;try{args=JSON.parse(calls[0].function.arguments)}catch{throw new AppError(502,'点单内容没有整理好，请再说一次')}
    fail(args&&Array.isArray(args.items)&&args.items.length>=1&&args.items.length<=2&&new Set(args.items).size===args.items.length&&args.items.every(id=>cafeMenu.some(i=>i.id===id))&&['here','takeaway'].includes(args.mode),'菜单里没有这份完整的餐食，请换一种说法',502);
    const current=cafe.view(u).guests.find(g=>g.id===u.id);
    fail(!!current,'你已经离开咖啡馆，回来再点吧',409);
    const command='chat-'+createHash('sha256').update(String(u.id)+':'+b.command).digest('hex').slice(0,48);
    try{cafe.update(u,{action:'order',command,items:args.items,mode:args.mode});ordered=true;reply='好，'+args.items.map(id=>cafeMenu.find(i=>i.id===id).name).join('和')+'，'+(args.mode==='takeaway'?'帮你打包':'在店里慢慢享用')+'。已经记下了，我按顺序准备，做好后点吧台托盘就能拿。'}catch(e){if(!(e instanceof AppError))throw e;reply=e.message;}
   }
   fail(typeof reply==='string'&&reply.trim(),'主理熊没有听清，请再说一次',502);
   s.reply=reply.trim().slice(0,1800);s.command=b.command;s.message=b.message;s.result={reply:s.reply,ordered};
   s.history=[...s.history,{role:'user',content:b.message.trim()},{role:'assistant',content:s.reply}].slice(-12);
   return s.result||{reply:s.reply};
  }catch(error){if(error instanceof AppError)throw error;throw new AppError(502,'聊天连接中断，请稍后重试')}
  finally{s.busy=false;running--;s.at=now()}
 }};
}
