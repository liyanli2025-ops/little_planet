// One language provider for all design surfaces; never fall back to another billable service.
export function resolveDesignEnv(env){
 const provider=env.AI_TEXT_PROVIDER||'auto';
 if(!['auto','tencent','custom'].includes(provider))throw Error('AI_TEXT_PROVIDER 配置不正确');
 if(provider==='tencent'||provider==='auto'&&env.TENCENT_3D_API_KEY){
  return {...env,AI_API_KEY:env.TENCENT_3D_API_KEY||'',AI_BASE_URL:'https://tokenhub.tencentmaas.com/v1',AI_MODEL:env.TENCENT_TEXT_MODEL||'hy3'};
 }
 return {...env};
}
export function designThinking(endpoint,model){
 const host=new URL(endpoint).hostname;
 return host==='tokenhub.tencentmaas.com'&&['hy3','hy4-preview'].includes(model?.toLowerCase())||host==='open.bigmodel.cn'&&model?.toLowerCase()==='glm-4.7-flash'?{thinking:{type:'disabled'}}:{};
}
