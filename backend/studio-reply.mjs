import {checkStudioPlan} from './studio-contract.mjs';
const reasonText={response_json:'服务返回内容无法读取',truncated:'设计回复被截断',no_plan:'模型只回复了文字，没有提交设计',multiple_tools:'模型一次提交了多项操作',wrong_tool:'模型未使用设计接口',arguments_json:'设计内容格式不完整',invalid_plan:'设计参数不完整或不符合要求'};
function reject(code,meta){const e=new Error(reasonText[code]);e.planCode=code;e.diagnostic={...meta,reason:code};throw e;}
export function parseStudioReply(raw,scope){
 let d;try{d=JSON.parse(raw)}catch{reject('response_json',{bytes:raw.length})}
 const choice=d?.choices?.[0],m=choice?.message,c=m?.tool_calls;
 const meta={finish:['stop','length','tool_calls','content_filter'].includes(choice?.finish_reason)?choice.finish_reason:'other',toolCount:Array.isArray(c)?c.length:0,contentChars:typeof m?.content==='string'?m.content.length:0};
 if(choice?.finish_reason==='length')reject('truncated',meta);
 let p;
 if(Array.isArray(c)&&c.length){
  if(c.length!==1)reject('multiple_tools',meta);
  if(c[0]?.function?.name!=='edit_object')reject('wrong_tool',meta);
  const a=c[0].function.arguments;meta.argumentChars=typeof a==='string'?a.length:0;
  try{p=typeof a==='string'?JSON.parse(a):a}catch{reject('arguments_json',meta)}
 }else{
  // Some compatible endpoints put the structured result in content despite tool_choice.
  // Accept only a complete JSON object; never infer operations from prose.
  const content=typeof m?.content==='string'?m.content.trim():'';
  const json=content.startsWith('```')?content.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''):content;
  try{p=JSON.parse(json)}catch{reject('no_plan',meta)}
 }
 try{checkStudioPlan(p,scope)}catch{reject('invalid_plan',meta)}
 return p;
}
export function repairInstruction(scope,code){return '上次返回未通过校验：'+(reasonText[code]||'参数不完整')+'。只提交一次 edit_object 调用，严格按照工具定义。'+(scope==='outfit'?'新增头纱、帽子、包或其他独立作品使用 asset_create，提供 description 和完整 wearable（name,slot,width,height,depth,x,y,z,yaw,tint）；不要改成基础裙装。修改已有作品使用 asset_fit 或 asset_regenerate 并指定 target。只有基础剪裁才使用 tailor。':'新增家具使用 create，提供 description 和完整 object；修改或收起须指定 target。')+'需要澄清时使用 explain。不要只回复一段说明，不要同时提交多项操作。';}
