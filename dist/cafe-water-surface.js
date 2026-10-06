// Globe view keeps the sphere. Detail view uses a level sea and a low beach.
// Smoothly widen the cinema-side shore without changing the spherical radius.
export const waterEdge=a=>{const base=1.04-.24*Math.cos(a-1.55)+.09*Math.sin(2*a+.3)-.16*Math.cos(3*(a-1.35));return base+(1.48-base)*.95*Math.exp(5*(Math.cos(a-2.45)-1))};
// Geometry, wave fade, foam and underwater tint must use this same boundary.
export const waterEdgeGLSL=a=>`mix(1.04-.24*cos(${a}-1.55)+.09*sin(2.*${a}+.3)-.16*cos(3.*(${a}-1.35)),1.48,.95*exp(5.*(cos(${a}-2.45)-1.)))`;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export const waterSurface=()=>-1.8;
export function detailBeachY(x,z){const a=Math.atan2(z,x),edge=Math.sin(waterEdge(a))*17.8,t=Math.hypot(x,z)/edge;return -.405-1.395*smooth((t-.15)/.85)}
export function waterRadius(a,t){const edge=Math.sin(waterEdge(a))*17.8;if(t<=.6)return edge*t/.6;return edge+850*Math.pow((t-.6)/.4,2.8)}
