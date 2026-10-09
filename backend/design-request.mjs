import {setTimeout as delay} from 'node:timers/promises';
// Never persist response bodies: providers may echo private prompts or credentials.
export async function requestDesign(url,payload,{key,fetcher=fetch,record=()=>{},pause=delay,deadline=Infinity}={}){
 let body=structuredClone(payload);
 for(let attempt=0;attempt<2;attempt++){
  if(Date.now()>=deadline)throw Error('文字设计等待时间过长，请重试，原设计保留');
  let r;
  try{r=await fetcher(url,{method:'POST',signal:AbortSignal.timeout(Math.max(1,Math.min(35000,Math.floor(deadline-Date.now())))),headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body)});}
  catch(e){record({reason:'provider_transport',attempt,timeout:['TimeoutError','AbortError'].includes(e.name)});if(attempt===0){await pause(500);continue;}throw Error('文字设计连接超时或网络失败，原设计保留');}
  if(r.ok)return r;
  const raw=(await r.text()).slice(0,8000),compat=r.status===400&&/tool_choice/i.test(raw)&&/unsupported|not support|invalid|不支持/i.test(raw);
  const reason=r.status===401||r.status===403?'provider_auth':r.status===429?'provider_busy':r.status===400?'provider_request':'provider_unavailable';
  record({reason,status:r.status,attempt,toolChoiceCompatibility:compat});
  if(attempt===0&&r.status===400&&body.tools?.length){const schema=body.tools[0].function?.parameters;body.messages=[...body.messages,{role:'system',content:'接口兼容模式：不要调用工具，只返回一个完整JSON对象，不要Markdown或解释。JSON须严格遵守下列设计结构，保留全部创意，不生成可执行代码：'+JSON.stringify(schema)}];delete body.tools;delete body.tool_choice;record({reason:'provider_json_compatibility',attempt,status:400});continue;}
  if(attempt===0&&(r.status===429||r.status>=500)){await pause(750);continue;}
  const message=reason==='provider_auth'?'文字设计服务授权或访问权限异常':reason==='provider_busy'?'文字设计服务繁忙，自动重试后仍未恢复':reason==='provider_request'?'文字设计请求格式与模型不兼容':'文字设计服务异常（上游状态 '+r.status+'）';
  throw Error(message+'，原设计保留');
 }
}
