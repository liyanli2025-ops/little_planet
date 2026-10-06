import {detailBeachY} from './cafe-water-surface.js';
export const beachSeats=[[5,12.2],[7.5,11.5],[10.2,9.8]].map(([x,z],i)=>({id:'beach-'+i,zone:'beach',table:9,x,z,y:detailBeachY(x,z)+.42,avatarY:detailBeachY(x,z)+.34,yaw:Math.atan2(x,z),approachX:x-.6,approachZ:z-.3}));
