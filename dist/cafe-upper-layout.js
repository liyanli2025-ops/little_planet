import {detailBeachY} from './cafe-water-surface.js';
export const UPPER_Y=4.12,STAIR_BOTTOM={x:-7.65,z:4.2},STAIR_TOP={x:-7.65,z:-1.8};
export function upperWalkable(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&((Math.abs(x+7.65)<.57&&z>=-2.15&&z<=4.55)||(x>=-8.2&&x<=-5&&z>=-2.15&&z<=-1.45)||(Math.abs(x)<5.8&&z>-3.3&&z<3.65))}
export function upperGroundY(x,z){if(x< -6.4&&z> -1.8){const t=Math.max(0,Math.min(1,(4.2-z)/6));return detailBeachY(STAIR_BOTTOM.x,STAIR_BOTTOM.z)+(UPPER_Y-detailBeachY(STAIR_BOTTOM.x,STAIR_BOTTOM.z))*t}return UPPER_Y}
export const upperSeats=[[-3.8,-2.7,Math.PI,'loft'],[-2.2,-2.7,Math.PI,'loft'],[2,2.2,0,'roof'],[3.4,2.2,0,'roof'],[4.6,.5,Math.PI/2,'roof']].map(([x,z,yaw,zone],i)=>({id:'upper-'+i,floor:1,zone,table:10,x,z,y:UPPER_Y+.65,avatarY:UPPER_Y+.50,yaw,approachX:x-Math.sin(yaw)*.65,approachZ:z-Math.cos(yaw)*.65}));
