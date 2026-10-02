import {checkStudioPlan} from './studio-contract.mjs';
const reasonText={response_json:'服务返回内容无法读取',truncated:'设计回复被截断',no_plan:'模型只回复了文字，没有提交设计',multiple_tools:'模型一次提交了多项操作',wrong_tool:'模型未使用设计接口',arguments_json:'设计内容格式不完整',invalid_plan:'设计参数不完整或不符合要求'};
function reject(code,meta,argumentsText){const e=new Error(reasonText[code]);e.planCode=code;e.diagnostic={...meta,reason:code};if(typeof argumentsText==='string')e.repairArguments=argumentsText;throw e;}
// Repair syntax only, never infer missing fields or evaluate model-generated code.
// Quoted strings (including escaped quotes) are copied byte-for-byte.
function parseArguments(value,meta){
 if(typeof value!=='string')return value;
 let text=value.trim();
 const fence=text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
 if(fence){text=fence[1];meta.fenced=true}
 try{return JSON.parse(text)}catch{}
 let normalized='',start=0,quoted=false,escaped=false;
 // Only an object scalar immediately after ':' can use this compatibility rule.
 // Arrays, quoted text, and ambiguous nonzero comma-grouped integers stay untouched.
 const syntax=part=>part.replace(/^(\s*:\s*)(-?0),(\d+)(?=\s*[,}])/,(all,prefix,integer,fraction)=>{
  meta.decimalCommas=(meta.decimalCommas||0)+1;return prefix+integer+'.'+fraction;
 }).replace(/([:\[,]\s*)-?\.\d+(?:[eE][+-]?\d+)?(?=\s*[,}\]])/g,number=>{meta.leadingDecimals=(meta.leadingDecimals||0)+1;return number.replace(/(-?)\./,'$10.')}).replace(/,\s*(?=[}\]])/g,()=>{meta.trailingCommas=(meta.trailingCommas||0)+1;return ''});
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"'){normalized+=text.slice(start,i+1);start=i+1;quoted=false}}
  else if(c==='"'){normalized+=syntax(text.slice(start,i));start=i;quoted=true}
 }
 normalized+=quoted?text.slice(start):syntax(text.slice(start));
 try{return JSON.parse(normalized)}catch(e){
  const position=String(e.message).match(/position (\d+)/);
  meta.syntax=quoted?'unterminated_string':/Unexpected end/.test(e.message)?'unexpected_end':'invalid_token';
  if(position)meta.position=Number(position[1]);
  reject('arguments_json',meta,value);
 }
}
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
  p=parseArguments(a,meta);
 }else{
  // Some compatible endpoints put the structured result in content despite tool_choice.
  // Accept only a complete JSON object; never infer operations from prose.
  const content=typeof m?.content==='string'?m.content.trim():'';
  const json=content.startsWith('```')?content.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''):content;
  try{p=JSON.parse(json)}catch{reject('no_plan',meta)}
 }
 try{checkStudioPlan(p,scope)}catch{reject('invalid_plan',meta,JSON.stringify(p))}
 return p;
}
export function repairInstruction(scope,code){return '上次返回未通过校验：'+(reasonText[code]||'参数不完整')+'。只提交一次 edit_object 调用，严格按照工具定义。arguments 必须是合法 JSON：键名和字符串用双引号，小数必须带整数部分且使用英文句点（0.4、-0.2），禁止用逗号写小数（0,4），不要尾逗号或 Markdown。保留用户的设计意图，修正上一份输出。'+(scope==='outfit'?'新增头纱、帽子、包或其他独立作品使用 asset_create，提供 description 和完整 wearable（name,slot,width,height,depth,x,y,z,yaw,tint）；不要改成基础裙装。修改已有作品使用 asset_fit 或 asset_regenerate 并指定 target。只有基础剪裁才使用 tailor。':'新增家具使用 create，提供 description 和完整 object；修改或收起须指定 target。')+'需要澄清时使用 explain。不要只回复一段说明，不要同时提交多项操作。';}
