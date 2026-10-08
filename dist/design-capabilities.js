export const homeEditFields=['name','variant','mount','floor','x','z','yaw','width','height','depth','seat','tint','accent','shape','pattern','planter'];
export const outfitEditFields=['name','pattern','color','accent','length','flare','pleats','patternScale','pantsColor'];
export const patternedFurniture=['sofa','lamp','rug','cushion','blanket','curtain'];
export function designCapability(scope,type){
 if(scope==='outfit')return type==='hat'?'贝雷帽：配色、纯色/条纹/格纹/圆点/花朵、花纹大小；不支持改变帽型':type==='veil'?'头纱：配色、花纹、垂落长度；不支持蕾丝或刺绣':type==='set'?'两件套：上衣配色和花纹、裤子纯色；不支持改变袖型或裤型':'配色、纯色/条纹/格纹/圆点/小花、花纹大小、衣长及下摆；不支持改袖型、领口、文字或蕾丝';
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
