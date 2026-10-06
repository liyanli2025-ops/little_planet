// Globe view keeps the sphere. Detail view uses a level sea and a low beach.
// Smoothly widen the cinema-side shore without changing the spherical radius.
export const waterEdge=a=>1.22+.13*Math.cos(3*(a-2.45))+.035*Math.sin(2*(a+.3))+.075*Math.cos(a-2.45)+.018*Math.sin(5*(a-.2));
// Broad unequal coves and rounded headlands; no narrow local cutouts.
export const waterEdgeGLSL=a=>`(1.22+.13*cos(3.*(${a}-2.45))+.035*sin(2.*(${a}+.3))+.075*cos(${a}-2.45)+.018*sin(5.*(${a}-.2)))`;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export const waterSurface=()=>-1.8;
export function detailBeachY(x,z){const a=Math.atan2(z,x),edge=Math.sin(waterEdge(a))*17.8,t=Math.hypot(x,z)/edge;return -.405-1.395*smooth((t-.15)/.85)}
export function waterRadius(a,t){const edge=Math.sin(waterEdge(a))*17.8;if(t<=.6)return edge*t/.6;return edge+850*Math.pow((t-.6)/.4,2.8)}
