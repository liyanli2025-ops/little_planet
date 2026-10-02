import {homeFree,homeRoute} from './home-layout.js';
export function studioLayout(base,objects=[],check=false){const l=structuredClone(base);for(const o of objects){const layer=o.floor?l.upper:l.lower;const halfX=(Math.abs(Math.cos(o.yaw))*o.width+Math.abs(Math.sin(o.yaw))*o.depth)/2,halfZ=(Math.abs(Math.sin(o.yaw))*o.width+Math.abs(Math.cos(o.yaw))*o.depth)/2;
 const replacement=o.kind==='sofa'&&o.floor===0&&Math.hypot(o.x-base.lower.sofa[0],o.z-base.lower.sofa[1])<.02;
 if(replacement){if(o.width>2.1||o.depth>.9||Math.abs(o.yaw-base.sit[3])>.02)throw Error('窗边沙发超出原座位范围');const pose=[base.sit[0],o.seat-.17,base.sit[2],base.sit[3]];l.sit=pose;layer.seats.sit={pose,stand:base.stand};continue}
 if(o.kind==='sofa')throw Error('双人沙发请放在窗边原座位区');
 const rect=[o.x-halfX,o.x+halfX,o.z-halfZ,o.z+halfZ];
 if(check){if(Math.abs(o.x)+halfX>l.width/2-.28||Math.abs(o.z)+halfZ>l.depth/2-.28||layer.rects.some(r=>rect[0]<r[1]+.08&&rect[1]>r[0]-.08&&rect[2]<r[3]+.08&&rect[3]>r[2]-.08))throw Error('这个位置与现有家具重叠，请换个位置');}
 layer.rects.push(rect);
 if(o.kind==='seat'){if(o.floor!==0)throw Error('新增座椅暂放一层');const id='sit-ai-'+o.id,stand=[o.x+Math.sin(o.yaw)*(o.depth/2+.55),o.z+Math.cos(o.yaw)*(o.depth/2+.55)];layer.stops[id]=stand;layer.seats[id]={pose:[o.x,o.seat-.17,o.z,o.yaw],stand}}
 }
 if(check)for(const f of [0,1]){const layer=f?l.upper:l.lower,start=layer.stops.stairs;for(const p of Object.values(layer.stops)){if(!homeFree(l,f,...p)||!homeRoute(l,f,{x:start[0],z:start[1]},...p).length&&Math.hypot(p[0]-start[0],p[1]-start[1])>.1)throw Error('摆放会挡住通道或家具入口，请换个位置')}}return l}
