const BASE='https://tokenhub.tencentmaas.com/v1/api/3d';
export function createTencent3D({key=process.env.TENCENT_3D_API_KEY,fetcher=fetch}={}){
 async function call(action,body){
  if(!key?.trim())throw new Error('容器没有读取到 TENCENT_3D_API_KEY');
  let r;try{r=await fetcher(BASE+'/'+action,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+key.trim(),'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)})}catch{throw new Error('请求未获确认：网络失败或超时；不要重新提交生成任务')}
  const data=await r.json().catch(()=>null);
  if(!r.ok){const code=String(data?.error?.code||'').replace(/[^a-zA-Z0-9_.-]/g,'').slice(0,80);const e=new Error('腾讯接口 HTTP '+r.status+(code?'，错误码 '+code:'')+'。请检查模型权限、额度和网络。');e.definite=true;throw e}
  if(!data||typeof data!=='object')throw new Error('腾讯接口返回格式不正确');
  return data;
 }
 return {
  async submit(prompt){if(typeof prompt!=='string'||!prompt.trim()||Buffer.byteLength(prompt,'utf8')>1024)throw new Error('描述需为 1–1024 字节');const d=await call('submit',{model:'hy-3d-3.1',prompt,generate_type:'Normal',face_count:20000});if(typeof d.id!=='string'||!/^\d{1,80}$/.test(d.id))throw new Error('提交结果没有有效任务编号，请在腾讯控制台核查，勿重复生成');return {id:d.id,model:'hy-3d-3.1'}},
  async query(id){if(!/^\d{1,80}$/.test(id))throw new Error('任务编号不正确');const d=await call('query',{model:'hy-3d-3.1',id});if(!['queued','in_progress','completed','failed'].includes(d.status))throw new Error('任务状态无法识别');return d},
  async download(url){let u;try{u=new URL(url)}catch{throw new Error('模型地址不正确')}if(u.protocol!=='https:'||u.port||u.username||u.password||!u.hostname.endsWith('.cos.ap-guangzhou.tencentcos.cn'))throw new Error('模型下载域名待核对，已保留任务；不会重新生成');const r=await fetcher(u,{redirect:'error',signal:AbortSignal.timeout(120000)});if(!r.ok)throw new Error('模型下载失败，可继续查询同一个任务');const chunks=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>32*1024*1024)throw new Error('模型超过 32MB，暂不导入手机场景');chunks.push(chunk)}const bytes=Buffer.concat(chunks);inspectGLB(bytes);return bytes}
 };
}
export function inspectGLB(b){
 if(b.length<20||b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length||b.readUInt32LE(16)!==0x4e4f534a)throw new Error('不是有效的 GLB 2 模型');
 const n=b.readUInt32LE(12);if(n>b.length-20||n>4*1024*1024)throw new Error('模型元数据大小不正确');let d;try{d=JSON.parse(b.subarray(20,20+n).toString())}catch{throw new Error('模型元数据无法解析')}
 if(d.asset?.version!=='2.0'||!d.meshes?.length)throw new Error('模型缺少网格');
 if([...(d.buffers||[]),...(d.images||[])].some(x=>x.uri))throw new Error('模型依赖外部资源，暂不导入');
 let triangles=0;for(const mesh of d.meshes)for(const p of mesh.primitives||[]){if(p.mode!==undefined&&p.mode!==4)throw new Error('模型包含非三角面');const count=d.accessors?.[p.indices??p.attributes?.POSITION]?.count;if(!Number.isSafeInteger(count)||count<0)throw new Error('模型面数无法读取');triangles+=count/3}
 if(triangles>100000)throw new Error('模型面数过高，暂不导入');return {triangles:Math.ceil(triangles),meshes:d.meshes.length,bytes:b.length};
}
