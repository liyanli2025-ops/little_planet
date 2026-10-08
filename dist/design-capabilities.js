export const homeEditFields=['name','variant','mount','floor','x','z','yaw','width','height','depth','seat','tint','accent','shape','pattern','planter'];
export const outfitEditFields=['name','pattern','color','accent','length','flare','pleats','patternScale','pantsColor','fabric','artwork'];
export const patternedFurniture=['sofa','lamp','rug','cushion','blanket','curtain'];
export function designCapability(scope,type){
 if(scope==='outfit')return '自由设计配色、布料质感和原创图案：动物、品牌风格、文字、组合纹样；保持所选服饰类型';
 if(type==='sofa')return '替换一层窗边沙发';
 if(['plant','floorPlant'].includes(type))return '可选龟背竹、绿萝、虎尾兰、丝兰、金钱树、仙人掌、多肉';
 if(type==='hangingPlant')return '垂吊绿萝，放在固定墙面位置';
 if(type==='curtain')return '替换一层主窗窗帘';
 if(['cushion','blanket'].includes(type))return '放在窗边沙发，每种可放一件';
 if(['wallArt','clock'].includes(type))return '放在固定墙面位置';
 if(['vase','tray','frame','sculpture'].includes(type))return '放在餐桌或书桌固定位置，不含照片上传';
 return '新增独立家具，摆放需留出通道';
}
export function mergeDesignEdit(prior,next,fields,allowed){
 if(fields===undefined)return {...prior,...next};
 if(!Array.isArray(fields)||!fields.length||new Set(fields).size!==fields.length||fields.some(k=>!allowed.includes(k)||!Object.hasOwn(next||{},k)))throw Error('修改内容不完整，请重新描述要改的部分');
 return {...prior,...Object.fromEntries(fields.map(k=>[k,next[k]]))};
}
