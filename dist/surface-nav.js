import * as T from './vendor/three.module.js';
export const R=4.2;
export function normal(t,lat){return new T.Vector3(Math.sin(t)*Math.cos(lat),Math.cos(t)*Math.cos(lat),Math.sin(lat))}
export function coordinates(n){return [Math.atan2(n.x,n.y),Math.asin(T.MathUtils.clamp(n.z,-1,1))]}
export function river(n){return Math.abs(Math.asin(T.MathUtils.clamp(n.z,-1,1))-.82)<.13}
export function bridge(n){let [t,l]=coordinates(n);return river(n)&&[1.6,-2.05].some(a=>Math.abs(Math.atan2(Math.sin(t-a),Math.cos(t-a)))<.095)}
export function height(n){if(bridge(n))return R+.07;const edge=Math.abs(Math.asin(T.MathUtils.clamp(n.z,-1,1))-.82);const bank=T.MathUtils.smoothstep(edge,.085,.16);return R-.085*(1-bank)+bank*.015*(Math.sin(n.x*11)*Math.cos(n.y*9)+Math.sin(n.z*13)*.5)}
export function step(n,d,meters){const tangent=d.clone().addScaledVector(n,-d.dot(n)).normalize();return n.clone().multiplyScalar(Math.cos(meters/R)).addScaledVector(tangent,Math.sin(meters/R)).normalize()}
export function distance(a,b){return R*Math.acos(T.MathUtils.clamp(a.dot(b),-1,1))}
export function walkable(n,obstacles=[]){if(river(n)&&!bridge(n))return false;return !obstacles.some(o=>distance(n,o.n)<o.radius+.09)}
export function route(start,goal,obstacles=[]){const W=100,H=53;const latAt=j=>-1.51+j*3.02/(H-1);const node=(i,j)=>normal(i/W*Math.PI*2,latAt(j));const id=(i,j)=>j*W+(i+W)%W;const idx=n=>{let [t,l]=coordinates(n);return id(Math.round(((t+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*W)%W,Math.max(0,Math.min(H-1,Math.round((l+1.51)/3.02*(H-1)))))};const N=W*H,cache=new Map();const pos=k=>{if(!cache.has(k))cache.set(k,node(k%W,Math.floor(k/W)));return cache.get(k)};const allowed=new Map();const valid=k=>{if(!allowed.has(k))allowed.set(k,walkable(pos(k),obstacles));return allowed.get(k)};let a=idx(start),b=idx(goal);if(!walkable(goal,obstacles))return [];
function nearest(k){if(valid(k))return k;let best=-1,dist=Infinity;for(let dj=-5;dj<=5;dj++)for(let di=-5;di<=5;di++){let j=Math.floor(k/W)+dj;if(j<0||j>=H)continue;let c=id(k%W+di,j),d=distance(pos(c),pos(k));if(valid(c)&&d<dist){best=c;dist=d}}return best}
a=nearest(a);b=nearest(b);if(a<0||b<0)return [];
const open=new Set([a]),came=new Int32Array(N).fill(-1),g=new Float32Array(N).fill(Infinity),f=new Float32Array(N).fill(Infinity);g[a]=0;f[a]=distance(pos(a),goal);let count=0;
while(open.size&&count++<8000){let c=-1,best=Infinity;for(let k of open)if(f[k]<best){c=k;best=f[k]}if(c===b){let chain=[];for(let k=c;k!==a&&k>=0;k=came[k])chain.push(pos(k).clone());chain.reverse();chain.push(goal.clone());return chain}open.delete(c);const i=c%W,j=Math.floor(c/W);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if((!di&&!dj)||j+dj<0||j+dj>=H)continue;let k=id(i+di,j+dj);if(!valid(k))continue;if(di&&dj&&(!valid(id(i+di,j))||!valid(id(i,j+dj))))continue;let mid=pos(c).clone().add(pos(k)).normalize();if(!walkable(mid,obstacles))continue;let cost=g[c]+distance(pos(c),pos(k));if(cost<g[k]){came[k]=c;g[k]=cost;f[k]=cost+distance(pos(k),goal);open.add(k)}}}return []}

