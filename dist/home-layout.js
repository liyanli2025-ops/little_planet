import * as T from './vendor/three.module.js';
const H=2.7;
export const homeLayouts=[
 {name:'garden',width:8,depth:7,stairX:-4.45,entry:[0,2.7],
  lower:{fridge:[.95,-2.85],cook:[-1.15,-2.85],table:[-.35,.35],sofa:[2.8,.95],book:[2.7,-2.85],record:[-3.40,0],
   stops:{fridge:[.95,-1.9],cook:[-1.15,-1.75],table:[-.35,1.7],vase:[-.35,1.7],sit:[1.7,1],bookshelf:[2.7,-1.8],music:[-2.55,0],games:[.7,2.9],journal:[.8,2.5],stairs:[-3.55,2.2]},
   rects:[[.5,1.4,-3.3,-2.35],[-2.85,-.1,-3.3,-2.35],[-3.6,-2.65,-2.95,-1.5],[-1.3,.6,-.6,1.3],[2.3,3.55,-.2,2.1],[1.75,3.6,-3.25,-2.5],[-3.72,-3.08,-.43,.43],[-.65,-.05,-1.2,-.65],[-1.95,-1.4,.09,.61],[.7,1.2,.09,.61],[1.15,2.21,1.97,3.03]]},
  upper:{bed:[-.45,-.55],bath:[2.6,-2.5],wardrobe:[-2.75,-2.85],desk:[2.9,.65],travel:[-2.6,1.5],
   stops:{bed:[-.45,1.95],bathroom:[2.28,-2.14],wardrobe:[-2.75,-1.8],journal:[1.9,.65],'desk-0':[1.65,.65],travel:[-1.8,1.5],stairs:[-3.55,-1.45]},
   rects:[[-1.43,.53,-1.88,.78],[-3.45,-2.05,-3.25,-2.45],[2.6,3.6,-.15,1.45],[-2.94,-2.26,1.25,1.75],[-1.10,.20,.83,1.35]]},
  sit:[2.65,.53,.95,-Math.PI/2],stand:[1.7,1],cookYaw:Math.PI},
 {name:'study',width:9,depth:6,stairX:4.95,entry:[0,2.35],
  lower:{fridge:[3.55,-2.45],cook:[1.95,-2.45],table:[2.05,1],sofa:[-3.8,.1],book:[-1.6,-2.65],record:[-3.6,-2.45],
   stops:{fridge:[3.55,-1.5],cook:[1.95,-1.35],table:[2.05,2.12],vase:[2.05,2.12],sit:[-1,.95],bookshelf:[-1.6,-1.6],music:[-3.6,-1.55],games:[-2.9,2.25],journal:[-.1,1.8],stairs:[4.0,2.2]},
   rects:[[3.1,4,-2.9,-2],[.9,3,-2.9,-1.95],[1.2,2.9,.43,1.57],[-4.35,-3.35,-1.3,1.45],[-2.7,-.5,-2.95,-2.3],[-4.1,-3.1,-2.85,-2.1],[1.78,2.32,-.3,.23],[2.98,3.48,.73,1.27],[-1.89,-.41,1.475,2.225]]},
  upper:{bed:[-3.1,.95],bath:[-3.35,-2.1],wardrobe:[-2,-2.35],desk:[.85,-2.45],travel:[.1,1.7],
   stops:{bed:[-3.1,2.65],bathroom:[-3.67,-1.74],wardrobe:[-2,-1.15],journal:[.85,-1.35],'desk-0':[-.23,-.99],'desk-1':[1.93,-.99],travel:[.9,1.7],stairs:[4,-1.45]},
   rects:[[-4.08,-2.12,-.38,2.28],[-2.45,-1.55,-2.9,-1.9],[-1.5,3.2,-2.9,-1.98],[-.24,.44,1.45,1.95],[3.35,4.09,-2.75,-2.1],[.69,1.61,.29,1.21]]},
  sit:[-1,.12,.85,0],stand:[-.1,1.2],cookYaw:Math.PI}
];
homeLayouts[0].upper.seats=[[2.02,3.02,.65,Math.PI/2]];
homeLayouts[1].upper.seats=[[-.23,3.15,-1.37,Math.PI],[1.93,3.15,-1.37,Math.PI]];
// Individual bathroom fixtures leave the front-left doorway and washbasin approach walkable.
export const bathroomObstacles=[[-.83,-.73,-.67,.66],[.73,.80,-.67,.66],[-.73,.73,-.70,-.62],[-.68,-.04,-.54,-.05],[.17,.66,-.32,.38],[.20,.78,.60,.66]];
for(const layout of homeLayouts){const [x,z]=layout.upper.bath;layout.upper.rects.push(...bathroomObstacles.map(([a,b,c,d])=>[x+a,x+b,z+c,z+d]));}
export function homeFree(layout,floor,x,z){const layer=floor?layout.upper:layout.lower;return Math.abs(x)<layout.width/2-.22&&Math.abs(z)<layout.depth/2-.22&&!layer.rects.some(([x0,x1,z0,z1])=>x>x0-.24&&x<x1+.24&&z>z0-.24&&z<z1+.24)}
export function homeRoute(layout,floor,from,x,z){const step=.14,W=Math.ceil((layout.width-.5)/step)+1,D=Math.ceil((layout.depth-.5)/step)+1,dx=(layout.width-.5)/(W-1),dz=(layout.depth-.5)/(D-1),pos=i=>new T.Vector3(-layout.width/2+.25+(i%W)*dx,floor*H+.022,-layout.depth/2+.25+Math.floor(i/W)*dz);const best=(x,z)=>{let n=-1,d=Infinity;for(let i=0;i<W*D;i++){const p=pos(i),q=(p.x-x)**2+(p.z-z)**2;if(q<d&&homeFree(layout,floor,p.x,p.z)){d=q;n=i}}return n},a=best(from.x,from.z),b=best(x,z);if(a<0||b<0)return [];const queue=[a],prev=new Map([[a,-1]]);for(let k=0;k<queue.length;k++){const c=queue[k];if(c===b){const out=[];for(let n=b;n!==a;n=prev.get(n))out.push(pos(n));out.reverse();if(homeFree(layout,floor,x,z))out.push(new T.Vector3(x,floor*H+.022,z));return out}for(const [di,dj]of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=c%W+di,jj=Math.floor(c/W)+dj;if(ii<0||ii>=W||jj<0||jj>=D)continue;const n=jj*W+ii,p=pos(n);if(!prev.has(n)&&homeFree(layout,floor,p.x,p.z)){prev.set(n,c);queue.push(n)}}}return []}
