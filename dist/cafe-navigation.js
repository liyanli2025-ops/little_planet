import {upperWalkable,upperGroundY} from './cafe-upper-layout.js';
import {cafeWalkable} from './cafe-catalog.js';
import {detailBeachY,waterEdge} from './cafe-water-surface.js';
export const CAFE_BEACH_ENTRY={x:0,z:9.6};
export function beachWalkable(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&(z>=9.2||(x< -7.3&&z>=3))&&Math.hypot(x,z)<Math.sin(waterEdge(Math.atan2(z,x)))*17.8-.8}
export function cafeRouteWalkable(x,z,floor=0){if(floor===1)return upperWalkable(x,z);return cafeWalkable(x,z)||(Math.abs(x)<1.12&&z>=6.1&&z<=9.65)||beachWalkable(x,z)}
export function cafeGroundY(x,z,floor=0){if(floor===1)return upperGroundY(x,z);if(cafeWalkable(x,z))return .22;if(Math.abs(x)<1.25&&z>=6.2&&z<9.2){const step=Math.floor((z-6.2)/3*16);return .22+(detailBeachY(0,9.2)+.02-.22)*step/16}return detailBeachY(x,z)+.02}
