import {checkStudioPlan} from './studio-contract.mjs';
const reasonText={response_json:'服务返回内容无法读取',truncated:'设计回复被截断',no_plan:'模型只回复了文字，没有提交设计',multiple_tools:'模型一次提交了多项操作',wrong_tool:'模型未使用设计接口',arguments_json:'设计内容格式不完整',invalid_plan:'设计参数不完整或不符合要求'};
function reject(code,meta,argumentsText){const e=new Error(reasonText[code]);e.planCode=code;e.diagnostic={...meta,reason:code};if(typeof argumentsText==='string')e.repairArguments=argumentsText;throw e;}
// Repair syntax only, never infer missing fields or evaluate model-generated code.
// Quoted strings (including escaped quotes) are copied byte-for-byte.
export function parseDesignArguments(value,meta={}){
 if(typeof value!=='string')return value;
 let text=value.trim();
 const fence=text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
 if(fence){text=fence[1];meta.fenced=true}
 try{return JSON.parse(text)}catch{}
 // Some providers unnecessarily escape apostrophes inside double-quoted JSON strings.
 text=text.replace(/\\'/g,"'");
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
export function parseStudioReply(raw,scope,{imageArtwork=false}={}){
 let d;try{d=JSON.parse(raw)}catch{reject('response_json',{bytes:raw.length})}
 const choice=d?.choices?.[0],m=choice?.message,c=m?.tool_calls;
 const meta={finish:['stop','length','tool_calls','content_filter'].includes(choice?.finish_reason)?choice.finish_reason:'other',toolCount:Array.isArray(c)?c.length:0,contentChars:typeof m?.content==='string'?m.content.length:0};
 if(choice?.finish_reason==='length')reject('truncated',meta);
 let p;
 if(Array.isArray(c)&&c.length){
  if(c.length!==1)reject('multiple_tools',meta);
  if(c[0]?.function?.name!=='edit_object')reject('wrong_tool',meta);
  const a=c[0].function.arguments;meta.argumentChars=typeof a==='string'?a.length:0;
  p=parseDesignArguments(a,meta);
 }else{
  // Some compatible endpoints put the structured result in content despite tool_choice.
  // Accept only a complete JSON object; never infer operations from prose.
  const content=typeof m?.content==='string'?m.content.trim():'';
  try{p=parseDesignArguments(content,meta)}catch(e){if(content.startsWith('{')||content.startsWith('```'))throw e;reject('no_plan',meta)}
 }
 // Some JSON-compatible providers put the edit field list inside tailoring.
 // Move the same declared list; never infer which fields the user requested.
 if(Array.isArray(p?.tailoring?.changedFields)){
  if(p.changedFields!==undefined&&JSON.stringify(p.changedFields)!==JSON.stringify(p.tailoring.changedFields))reject('invalid_plan',meta,JSON.stringify(p));
  p.changedFields=p.tailoring.changedFields;delete p.tailoring.changedFields;
 }
 if(Array.isArray(p?.changedFields))p.changedFields=p.changedFields.filter(k=>k!=='kind');
 // Semantic artwork is rendered by the image artist. Do not validate or render
 // the planner's unused placeholder geometry as though it were the final logo.
 if(imageArtwork&&p?.imageBrief&&p.tailoring&&(!p.changedFields||p.changedFields.includes('artwork'))&&!(p.tailoring.artwork?.layers?.length&&p.tailoring.artwork.layers.every(l=>l.type==='text'))){
  const layout=p.imageBrief.layout||(p.tailoring.artwork?.layout==='repeat'?'repeat':'front');
  p.tailoring.pattern='plain';
  if(layout==='front'&&p.tailoring.patternScale===0)p.tailoring.patternScale=.06;
  p.tailoring.artwork={layout,layers:[{type:'rect',x:.5,y:.5,w:.1,h:.1,fill:p.tailoring.accent||'#ffffff'}]};
 }
 // Optional no-op paint values from JSON-compatible providers are not new design features.
 if(p?.tailoring?.artwork){const a=p.tailoring.artwork;for(const k of ['reference','distribution','brand'])if(a[k]===null||a[k]==='')delete a[k];if(Array.isArray(a.layers))for(const layer of a.layers){for(const k of ['stroke','lineWidth','rotation','smooth'])if(layer[k]===null)delete layer[k];if(layer.stroke==='none')delete layer.stroke;if(layer.lineWidth===0&&!layer.stroke&&layer.type!=='line')delete layer.lineWidth;}}
 try{checkStudioPlan(p,scope)}catch{reject('invalid_plan',meta,JSON.stringify(p))}
 return p;
}
export function repairInstruction(scope,code){return '上次返回未通过校验：'+(reasonText[code]||'参数不完整')+'。只提交一次 edit_object 调用，严格按照工具定义。arguments 必须是合法 JSON：键名和字符串用双引号，小数必须带整数部分且使用英文句点（0.4、-0.2），禁止用逗号写小数（0,4），不要尾逗号或 Markdown。保留用户的设计意图，修正上一份输出。'+(scope==='outfit'?'服饰新3D生成已关闭，只能使用tailor或已有配饰style。保留用户原意和imageBrief语义说明。首次创建完整填写衣物字段；已有衣物修改时changedFields必须位于顶层，列出修改字段，不能放进tailoring。空的reference、brand、distribution应省略。复杂图案保持pattern=plain，交给图片画师；不能用dots代替豹纹。':'新增家具使用 create，提供 description 和完整 object；修改或收起须指定 target。')+'需要澄清时使用 explain。不要只回复一段说明，不要同时提交多项操作。';}
