import {fail,AppError} from './store.mjs';
import {resolveDesignEnv,designThinking} from './ai-provider.mjs';
import {cafeSeats,cafeMenu} from '../dist/cafe-catalog.js';
// Conversation stays private and expires in memory; never put it in public presence.
export function createCafeChat({cafe,env=process.env,fetcher=fetch,now=Date.now}){
 const sessions=new Map();let running=0;
 return {async send(u,b){
  const own=cafe.view(u).guests.find(g=>g.id===u.id);
  fail(cafeSeats.some(s=>s.id===own?.seat&&s.zone==='bar'),'坐到吧台前，就能和主理熊聊天了',409);
  fail(typeof b?.message==='string'&&b.message.trim().length>0&&b.message.length<=600,'请写下 1–600 字想说的话');
  fail(typeof b.command==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(b.command),'消息编号无效');
  for(const [id,s] of sessions)if(!s.busy&&now()-s.at>1800000)sessions.delete(id);
  let s=sessions.get(u.id);if(!s){fail(sessions.size<500,'主理熊暂时忙不过来，请稍后再聊',429);s={history:[],at:0};sessions.set(u.id,s)}
  if(s.command===b.command){fail(s.message===b.message,'消息编号已使用',409);return {reply:s.reply}}
  fail(!s.busy&&running<4,'主理熊正在回复，请稍等一下',429);
  fail(!s.at||now()-s.at>=2000,'慢慢聊，稍等一下再发送',429);
  const e=resolveDesignEnv(env);fail(e.AI_API_KEY&&e.AI_BASE_URL&&e.AI_MODEL,'主理熊的 AI 聊天还没有配置好',503);
  let url;try{url=new URL(e.AI_BASE_URL.replace(/\/$/,'')+'/chat/completions')}catch{throw new AppError(503,'聊天接口配置不正确')}
  fail(url.protocol==='https:','聊天接口需要 HTTPS',503);
  s.busy=true;s.at=now();running++;
  try{
   const response=await fetcher(url,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+e.AI_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model:e.AI_MODEL,messages:[{role:'system',content:'你是海边咖啡馆「海风来信」的主理熊。温暖、自然、简洁地用中文与坐在吧台的客人聊天，每次通常一到三句话。你是 AI 角色，不冒充真人。可闲聊和推荐菜单，但不能代替用户下单、修改账号或承诺已执行操作，也看不到其他访客的私人信息。所有餐饮免费，需用户从菜单点选。菜单：'+cafeMenu.map(i=>i.name).join('、')},...s.history,{role:'user',content:b.message.trim()}],max_tokens:450,...designThinking(url,e.AI_MODEL)})});
   if(!response.ok)throw new AppError(response.status===429?429:502,response.status===429?'主理熊暂时忙不过来，请稍后再聊':'聊天服务暂时没有回应，请稍后重试');
   const result=await response.json(),reply=result.choices?.[0]?.message?.content;
   fail(typeof reply==='string'&&reply.trim(),'主理熊没有听清，请再说一次',502);
   s.reply=reply.trim().slice(0,1800);s.command=b.command;s.message=b.message;
   s.history=[...s.history,{role:'user',content:b.message.trim()},{role:'assistant',content:s.reply}].slice(-12);
   return {reply:s.reply};
  }catch(error){if(error instanceof AppError)throw error;throw new AppError(502,'聊天连接中断，请稍后重试')}
  finally{s.busy=false;running--;s.at=now()}
 }};
}
