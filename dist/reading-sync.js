// Serial foreground refreshes. Dependencies are injected so timing and failures are testable.
export function createReadingSync({snapshot,ready,request,apply,report,now=Date.now}){
 let running=false,lastShelfAttempt=0,nextRequest=0,retryAt=0;const attempts=new Map();
 async function tick(){
  if(running||!ready()||now()<nextRequest||now()<retryAt)return;
  const s=snapshot();if(!s.binding.connected)return;
  let command;
  if(now()-Math.max(s.binding.synced||0,lastShelfAttempt)>=60000){command={action:'sync',automatic:true};lastShelfAttempt=now();}
  else{
   const candidates=s.items.filter(b=>b.owner===s.actor&&b.source==='weread'&&b.sourceId?.startsWith('book:')&&now()-Math.max(b.progress?.synced||0,attempts.get(b.id)||0)>=60000&&(b.id===s.selected||b.readUpdateTime>(b.progress?.synced||0)));
   candidates.sort((a,b)=>(b.id===s.selected)-(a.id===s.selected)||(b.readUpdateTime||0)-(a.readUpdateTime||0));
   const b=candidates[0];if(!b)return;command={action:'progress',id:b.id,automatic:true};attempts.set(b.id,now());
  }
  running=true;report('正在自动同步微信读书…');
  try{const r=await request(command);if(!r)throw Error('同步暂未完成');apply(r);report('');}
  catch(e){retryAt=now()+60000;report('自动同步未完成：'+e.message+'。已保留上次数据，可手动重试。');}
  finally{running=false;nextRequest=now()+8000;}
 }
 return {tick};
}
