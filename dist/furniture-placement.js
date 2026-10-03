import {furnitureCatalog} from './furniture-catalog.js';
// Fixed support areas deliberately leave the dining centre (food/vase) and desk activities clear.
export function supportPose(base,o){
 const study=base.name==='study',m=o.mount;
 if(m==='table'){const [x,z]=base.lower.table;return {floor:0,x:x+(study?-.55:-.55),z:z-.22,y:.805,yaw:0,maxW:.44,maxD:.32,maxH:.65}}
 if(m==='desk'){const [x,z]=base.upper.desk;return study?{floor:1,x:x+.12,z:z-.16,y:.905,yaw:0,maxW:.44,maxD:.32,maxH:.65}:{floor:1,x:x-.04,z:z+.36,y:.825,yaw:-Math.PI/2,maxW:.32,maxD:.28,maxH:.48}}
 if(m==='sofa'){const [x,z]=base.lower.sofa,yaw=base.sit[3],u=o.standard==='blanket'?.62:-.62,v=o.standard==='blanket'?.1:-.05;return {floor:0,x:x+u*Math.cos(yaw)+v*Math.sin(yaw),z:z-u*Math.sin(yaw)+v*Math.cos(yaw),y:o.standard==='blanket'?Math.max(.12,base.sit[1]+.17-o.height*.53):base.sit[1]+.21,yaw,maxW:.6,maxD:.45,maxH:.7}}
 if(m==='wall')return {floor:o.floor,x:study?3.5:-3.02,z:-base.depth/2+.13,y:o.standard==='hangingPlant'?1.5:1.35,yaw:0,maxW:.8,maxD:.35,maxH:.85};
 if(m==='window')return {floor:0,x:study?-1.5:-.95,z:study?-2.76:-3.25,y:study?.86:1.05,yaw:0,maxW:.45,maxD:.15,maxH:study?1.4:1.34};
 return null;
}
export function resolveFurnitureSupport(base,o){
 if(!furnitureCatalog[o.standard])return o;
 const c=furnitureCatalog[o.standard],mount=o.mount||c.mounts[0];
 if(!c.mounts.includes(mount))throw Error('这类物品不能放在这个位置');
 const next={...o,mount},p=supportPose(base,next);
 if(p){if(o.width>p.maxW||o.depth>p.maxD||o.height>p.maxH)throw Error('物品尺寸超出摆放区域，请设计得小一些');Object.assign(next,{floor:p.floor,x:p.x,z:p.z,y:p.y,yaw:p.yaw});}
 else delete next.y;
 return next;
}
export function validateFurnitureSupport(base,o){
 const p=supportPose(base,o);if(!p)return false;
 if(o.floor!==p.floor||Math.abs(o.x-p.x)>.001||Math.abs(o.z-p.z)>.001||Math.abs((o.y||0)-p.y)>.001||Math.abs(o.yaw-p.yaw)>.001||o.width>p.maxW||o.depth>p.maxD||o.height>p.maxH)throw Error('物品没有放在有效的支撑面上');
 return true;
}
