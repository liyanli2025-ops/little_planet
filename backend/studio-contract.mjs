import {homeEditFields,outfitEditFields,patternedFurniture} from '../dist/design-capabilities.js';
import {furnitureCatalog,standardKind} from '../dist/furniture-catalog.js';
import {wearableFields,validateWearables} from '../dist/wearable-schema.js';
import {designFields,validateDesignPart,defaultDesign} from '../dist/design-schema.js';
import {validateTailoring} from '../dist/studio-schema.js';
const number=(minimum,maximum)=>({type:'number',minimum,maximum});
const color={type:'string',pattern:'^#[a-fA-F0-9]{6}$'};
const tailoring={type:'object',additionalProperties:false,properties:{kind:{type:'string',enum:['skirt','dress','top','set','hat','veil']},name:{type:'string',minLength:1,maxLength:50},pattern:{type:'string',enum:['plain','check','stripe','dots','flower']},color,accent:color,length:number(.18,.4),flare:number(.02,.13),pleats:{type:'integer',minimum:0,maximum:24},patternScale:number(.03,.12),pantsColor:color},required:['kind','name','pattern','color','accent','length','flare','pleats','patternScale']};
export function studioTool(scope){return {type:'function',function:{name:'edit_object',description:'提交完整设计；不支持的需求用 explain 说明，不生成替代品',parameters:{type:'object',additionalProperties:false,properties:{operation:{type:'string',enum:scope==='outfit'?['asset_create','asset_regenerate','asset_fit','asset_remove','tailor','style','explain']:['create','regenerate','move','remove','explain']},reply:{type:'string'},...(scope==='outfit'?{target:{type:'string'},description:{type:'string'},wearable:{type:'object',additionalProperties:false,properties:wearableFields},tailoring,outfit:{type:'object',additionalProperties:false,properties:{...Object.fromEntries(Object.entries(designFields.outfit).map(([k,v])=>[k,{type:'string',enum:v}])),accessoryColors:{type:'object',additionalProperties:false,properties:{hat:color,shoes:color,accessory:color}}}}}:{target:{type:'string'},description:{type:'string'},object:{type:'object',additionalProperties:false,properties:{name:{type:'string'},kind:{type:'string',enum:['decor','seat','sofa']},floor:{type:'integer',enum:[0,1]},x:number(-4.2,4.2),z:number(-3,3),yaw:number(-Math.PI,Math.PI),width:number(.15,2.5),height:number(.1,1.8),depth:number(.15,1.3),seat:number(.15,.9),tint:color}}})},required:['operation','reply']}}};}
export function checkStudioPlan(p,scope){
 if(!p||typeof p!=='object')throw Error('缺少设计');
 if(p.operation==='explain'){if(typeof p.reply!=='string'||!p.reply.trim())throw Error('缺少说明');return;}
 if(scope==='outfit'){if(['asset_create','asset_regenerate','asset_fit','asset_remove'].includes(p.operation)){if(p.operation!=='asset_create'&&(typeof p.target!=='string'||!p.target))throw Error('缺少目标作品');if(['asset_create','asset_regenerate'].includes(p.operation)&&(typeof p.description!=='string'||!p.description.trim()))throw Error('缺少生成描述');if(p.operation==='asset_create'){const id='11111111-1111-4111-8111-111111111111';validateWearables([{...p.wearable,id,asset:id,description:p.description}]);}return;}if(p.outfit)validateDesignPart('outfit',{...defaultDesign().outfit,...p.outfit});if(p.operation==='style'&&p.outfit&&Object.keys(p.outfit).length)return;if(p.operation!=='tailor'||!validateTailoring(p.tailoring))throw Error('缺少完整服饰');return;}
 if(!['create','regenerate','move','remove'].includes(p.operation))throw Error('家具操作不正确');
}

export function standardOutfitTool(type){
 const tool=studioTool('outfit'),p=tool.function.parameters;
 p.properties.changedFields={type:'array',items:{type:'string',enum:outfitEditFields},minItems:1,uniqueItems:true,description:'修改已有同类服饰时，只列本轮明确需要改变的字段；首次创作省略'};
 p.properties.operation.enum=['tailor','explain'];
 p.properties.tailoring=structuredClone(p.properties.tailoring);
 p.properties.tailoring.properties.kind.enum=[type];
 if(['skirt','dress'].includes(type))p.properties.tailoring.properties.length={type:'number',enum:[0.22,0.38]};
 if(type==='set')p.properties.tailoring.required.push('pantsColor');
 for(const key of ['target','description','wearable','outfit'])delete p.properties[key];
 tool.function.description='根据用户选择的标准类型设计可穿戴样式，不能生成独立3D物体';
 return tool;
}

export function standardHomeTool(type){
 const tool=studioTool('home'),p=tool.function.parameters;
 p.properties.changedFields={type:'array',items:{type:'string',enum:homeEditFields},minItems:1,uniqueItems:true,description:'move时只列本轮需要改变的字段；其余字段由服务器保留；create省略'};
 p.properties.operation.enum=['create','move','remove','explain'];
 const props=p.properties.object.properties;
 const c=furnitureCatalog[type];if(!c)throw Error("家具类型不正确");props.kind.enum=[standardKind(type)];
 props.standard={type:'string',enum:[type]};
 if(type==='sofa')p.properties.target.description='已有替换沙发使用当前objects中的id；原有窗边沙发使用builtin:sofa。首次替换也可用create并省略target。不能另放第二张沙发。';
 props.accent=color;props.shape={type:'string',enum:['round','square']};
 props.pattern={type:'string',enum:patternedFurniture.includes(type)?['plain','stripe','check']:['plain']};
 if(!c.mounts.includes('floor'))props.depth=number(.02,1.3);
 props.variant={type:'string',enum:c.variants};props.mount={type:'string',enum:c.mounts};
 if(['tray','wallArt','clock'].includes(type))props.height=number(.025,.85);
 if(type==='lamp')props.shape.enum=['round'];
 if(c.group==='plant'){props.planter={type:'string',enum:['terracotta','ceramic']};props.shape.enum=['round'];}
 if(type==='rug')props.height=number(.025,.06);
 p.properties.object.required=Object.keys(props);
 delete p.properties.description;
 tool.function.description='设计可直接使用的标准家具样式和摆放位置；移动或收起现有家具需填写 target';
 return tool;
}
