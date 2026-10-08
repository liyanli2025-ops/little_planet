import {setTimeout as delay} from 'node:timers/promises';
// Never persist response bodies: providers may echo private prompts or credentials.
export async function requestDesign(url,payload,{key,fetcher=fetch,record=()=>{},pause=delay}={}){
 let body=structuredClone(payload);
 for(let attempt=0;attempt<2;attempt++){
  let r;
  try{r=await fetcher(url,{method:'POST',signal:AbortSignal.timeout(35000),headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body)});}
  catch(e){record({reason:'provider_transport',attempt,timeout:['TimeoutError','AbortError'].includes(e.name)});if(attempt===0){await pause(500);continue;}throw Error('文字设计连接超时或网络失败，原设计保留');}
  if(r.ok)return r;
  const raw=(await r.text()).slice(0,8000),compat=r.status===400&&/tool_choice/i.test(raw)&&/unsupported|not support|invalid|不支持/i.test(raw);
  const reason=r.status===401||r.status===403?'provider_auth':r.status===429?'provider_busy':r.status===400?'provider_request':'provider_unavailable';
  record({reason,status:r.status,attempt,toolChoiceCompatibility:compat});
  if(attempt===0&&compat){body.tool_choice='auto';continue;}
  if(attempt===0&&(r.status===429||r.status>=500)){await pause(750);continue;}
  const message=reason==='provider_auth'?'文字设计服务授权或访问权限异常':reason==='provider_busy'?'文字设计服务繁忙，自动重试后仍未恢复':reason==='provider_request'?'文字设计请求格式与模型不兼容':'文字设计服务异常（上游状态 '+r.status+'）';
  throw Error(message+'，原设计保留');
 }
}
