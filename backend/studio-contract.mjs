import {validateTailoring} from '../dist/studio-schema.js';
const number=(minimum,maximum)=>({type:'number',minimum,maximum});
const color={type:'string',pattern:'^#[a-fA-F0-9]{6}$'};
const tailoring={type:'object',additionalProperties:false,properties:{kind:{type:'string',enum:['skirt','dress','top']},name:{type:'string',minLength:1,maxLength:50},pattern:{type:'string',enum:['plain','check','stripe','dots']},color,accent:color,length:number(.18,.4),flare:number(.02,.13),pleats:{type:'integer',minimum:0,maximum:24},patternScale:number(.03,.12)},required:['kind','name','pattern','color','accent','length','flare','pleats','patternScale']};
export function studioTool(scope){return {type:'function',function:{name:'edit_object',description:'提交完整设计；不支持的需求用 explain 说明，不生成替代品',parameters:{type:'object',additionalProperties:false,properties:{operation:{type:'string',enum:scope==='outfit'?['tailor','explain']:['create','regenerate','move','remove','explain']},reply:{type:'string'},...(scope==='outfit'?{tailoring}:{target:{type:'string'},description:{type:'string'},object:{type:'object',additionalProperties:false,properties:{name:{type:'string'},kind:{type:'string',enum:['decor','seat','sofa']},floor:{type:'integer',enum:[0,1]},x:number(-4.2,4.2),z:number(-3,3),yaw:number(-Math.PI,Math.PI),width:number(.15,2.5),height:number(.1,1.8),depth:number(.15,1.3),seat:number(.15,.9),tint:color}}})},required:['operation','reply']}}};}
export function checkStudioPlan(p,scope){
 if(!p||typeof p!=='object')throw Error('缺少设计');
 if(p.operation==='explain'){if(typeof p.reply!=='string'||!p.reply.trim())throw Error('缺少说明');return;}
 if(scope==='outfit'){if(p.operation!=='tailor'||!validateTailoring(p.tailoring))throw Error('缺少完整服饰');return;}
 if(!['create','regenerate','move','remove'].includes(p.operation))throw Error('家具操作不正确');
}
