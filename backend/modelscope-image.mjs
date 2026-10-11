import {imageArtistPrompt} from './clothing-brief.mjs';
// Server-only adapter. Never fall back to a paid provider or repeat a submission.
import {textureSeed} from './texture-seed.mjs';
export function createModelScopeImage({token,model='Qwen/Qwen-Image-Edit',generationModel=model,fetcher=fetch}={}){
 const base='https://api-inference.modelscope.cn/v1';
 async function api(path,{method='GET',body,headers={}}={}){
  const r=await fetcher(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  if(!r.ok){const e=Error(r.status===401||r.status===403?'魔搭令牌或推理权限无效':r.status===402||r.status===429?'魔搭免费额度或并发限制已达上限，请稍后重试':`魔搭图片接口 HTTP ${r.status}`);e.definite=true;throw e;}
  return r.json();
 }
 return {
  async submit(prompt,color='#ffffff',reference){const selected=reference?model:generationModel;if(!token)throw Error('魔搭图片服务尚未配置');const d=await api('/images/generations',{method:'POST',headers:{'X-ModelScope-Async-Mode':'true'},body:{model:selected,prompt,size:'1024x1024',...(/edit/i.test(selected)?{image_url:reference||textureSeed(color)}:{})}});if(typeof d.task_id!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(d.task_id))throw Error('魔搭未返回有效任务编号');return d.task_id;},
  async query(id){return api('/tasks/'+encodeURIComponent(id),{headers:{'X-ModelScope-Task-Type':'image_generation'}});},
  async download(address){
   const u=new URL(address);if(u.protocol!=='https:'||u.username||u.password||!/(^|\.)(modelscope\.cn|aliyuncs\.com)$/.test(u.hostname))throw Error('魔搭图片下载地址不受支持');
   const r=await fetcher(u,{signal:AbortSignal.timeout(30000),redirect:'error'});if(!r.ok)throw Error('魔搭图片下载失败');
   if(Number(r.headers.get('content-length'))>8*1024*1024)throw Error('图片超过大小限制');
   const chunks=[];let n=0;for await(const chunk of r.body){n+=chunk.length;if(n>8*1024*1024)throw Error('图片超过大小限制');chunks.push(chunk);}const bytes=Buffer.concat(chunks);
   const mime=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'image/webp':null;
   if(!mime)throw Error('魔搭结果不是支持的图片');return {bytes,mime};
  }
 };
}
export function imageTextureRequest(p,prompt){
 if(p.operation!=='tailor')return null;
 if(p.changedFields&&!p.changedFields.some(f=>['artwork','pattern'].includes(f)))return null;
 const v=p.tailoring;if(!v||(v.artwork?.reference||v.artwork?.brand))return null;
 if(p.changedFields?.some(f=>['artwork','pattern'].includes(f))&&v.artwork===null&&v.pattern==='plain')return null;
 if(v.artwork?.layers?.length&&v.artwork.layers.every(layer=>layer.type==='text'))return null;
 const text=String(prompt||'');
 if(!p.imageBrief&&!v.artwork&&!/(图案|印花|纹样|刺绣|豹纹|斑马|动物|猫|狗|蝴蝶|星空|山水|花卉|卡通|logo|pattern|print|embroider)/i.test(text))return null;
 const layout=p.imageBrief?.layout||v.artwork?.layout||'repeat';
 return {layout,prompt:imageArtistPrompt(v,text,p.imageBrief,layout),reviewPrompt:imageArtistPrompt(v,'',p.imageBrief,layout)};
}
