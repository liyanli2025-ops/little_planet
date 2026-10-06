import * as T from './vendor/three.module.js';
import {UPPER_Y as Y} from './cafe-upper-layout.js';
// Decorative flowers are instanced by material, keeping a lush garden affordable.
export function buildTerraceGarden(parent){
 const root=new T.Group();root.name='Roof flower garden';parent.add(root);
 const batches=new Map(),ball=new T.SphereGeometry(1,10,7),obj=new T.Object3D();
 function petal(color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){let b=batches.get(color);if(!b){b={material:new T.MeshStandardMaterial({color,roughness:.95}),poses:[]};batches.set(color,b)}obj.position.set(x,y,z);obj.scale.set(sx,sy,sz);obj.rotation.set(rx,ry,rz);obj.updateMatrix();b.poses.push(obj.matrix.clone())}
 const green=0x63825a,lightGreen=0x8b9d60;
 function stem(x,y,z,h){petal(green,x,y+h/2,z,.009,h/2,.009);for(let i=0;i<3;i++){const side=i%2?1:-1;petal(i%2?green:lightGreen,x+side*.07,y+h*(.25+i*.16),z,.10,.025,.04,0,0,side*.5)}}
 function flower(type,x,y,z,h,index){stem(x,y,z,h);y+=h;
  if(type==='daisy'){const color=index%3===0?0xe9b19d:0xf3e7c9;for(let j=0;j<9;j++){const a=j/9*Math.PI*2;petal(color,x+Math.cos(a)*.065,y,z+Math.sin(a)*.065,.067,.018,.025,0,-a,0)}petal(0xd8b45e,x,y+.016,z,.029,.025,.029)}
  if(type==='rose'){for(let ring=0;ring<3;ring++)for(let j=0;j<5+ring;j++){const a=j/(5+ring)*Math.PI*2+ring*.7,r=.024+ring*.026;petal(index%2?0xc87981:0xe5ae9d,x+Math.cos(a)*r,y+(.02-ring*.008),z+Math.sin(a)*r,.051,.041,.025,.25,-a,0)}}
  if(type==='lavender'){for(let j=0;j<8;j++){const a=j*2.4;petal(index%2?0xa19cbe:0x817b9e,x+Math.sin(a)*.024,y+j*.025,z+Math.cos(a)*.024,.026,.039,.027)}}
  if(type==='hydrangea'){for(let j=0;j<24;j++){const a=j*2.4,u=(j+.5)/24,r=Math.sqrt(1-u*u)*.13;petal(index%2?0xa8baca:0xc3b1c9,x+Math.sin(a)*r,y+u*.13,z+Math.cos(a)*r,.041,.035,.04)}}
 }
 function pot(x,z,r,h,color,type,count){const mat=new T.MeshStandardMaterial({color,roughness:1}),pot=new T.Mesh(new T.CylinderGeometry(r,r*.74,h,24),mat);pot.position.set(x,Y+h/2,z);pot.castShadow=pot.receiveShadow=true;root.add(pot);const soil=new T.Mesh(new T.CylinderGeometry(r*.94,r*.94,.025,24),new T.MeshStandardMaterial({color:0x534834}));soil.position.set(x,Y+h,z);root.add(soil);for(let i=0;i<count;i++){const a=i*2.4,d=Math.sqrt((i+.5)/count)*r*.87;flower(type,x+Math.cos(a)*d,Y+h,z+Math.sin(a)*d,.22+(i%4)*.075,i)}
 }
 const pots=[[-4.7,2.4,.32,.44,0xbc9277,'hydrangea',13],[-4,2.8,.23,.3,0xd9c7a5,'daisy',12],[-3.3,3.2,.28,.42,0x9dafa1,'lavender',18],[-2.5,3.4,.3,.37,0xb58068,'rose',16],[-1.65,3.5,.23,.28,0xe0c9a3,'daisy',14],[-.4,3.65,.32,.4,0xa2ad9a,'hydrangea',14],[4.9,3,.3,.42,0xb58068,'rose',14],[5.45,2.2,.25,.36,0xd9c7a5,'lavender',19],[5.65,1.2,.3,.4,0xa2ad9a,'hydrangea',14],[5.7,-.2,.26,.35,0xb58068,'daisy',13],[4.7,-2.65,.35,.45,0xd9c7a5,'rose',20],[3.8,-3,.26,.34,0x9dafa1,'lavender',20],[-4.7,-2.8,.25,.45,0xb58068,'rose',13]];
 for(const p of pots)pot(...p);
 // Trailing vines soften the reading nook and the timber balustrade.
 for(const [x,z]of [[-5,.7],[-.7,.7],[-4.5,-3.1]])for(let branch=0;branch<3;branch++)for(let j=0;j<18;j++){const y=Y+2.22-j*.065,dx=Math.sin(j*.45+branch)*.09;petal(j%2?green:lightGreen,x+(branch-1)*.17+dx,y,z+Math.cos(j*.4)*.07,.06,.09,.021,0,j*.5,.5*Math.sin(j));if(j%6===0)flower('daisy',x+dx,y,z,.06,j)}
 // Layered fern and broad-leaf clusters make sheltered pockets, not a row of pots.
 for(const [x,z,h]of [[-5,-2.7,1.5],[-4.8,-.1,1.3],[-.8,-2.7,1.35],[-.3,-.6,1.15],[1.2,-2.8,1.3],[4.9,-1.4,1.4],[-3.8,3,.8],[-1.2,3.2,.8]]){
  pot(x,z,.3,.32,0x9f7859,'rose',0);for(let k=0;k<9;k++){const a=k*2.4,spread=.65+(k%3)*.12;for(let j=0;j<8;j++){const t=j/8;const px=x+Math.sin(a)*spread*t,pz=z+Math.cos(a)*spread*t,py=Y+.32+h*Math.sin(t*Math.PI)*.65;petal(k%2?green:lightGreen,px,py,pz,.07,.16,.025,.3,a,.5);petal(green,px+.05*Math.cos(a),py-.06,pz-.05*Math.sin(a),.065,.13,.025,-.3,a,-.5)}}
 }
 // Vines spill over the pergola, while the sea-facing sky is left open.
 for(let i=0;i<150;i++){const t=i/149,x=-5.3+4.75*t,z=i%2?1.05:-3.1;petal(i%3?green:lightGreen,x,Y+2.63+Math.sin(i*2.1)*.10,z+Math.sin(i*1.9)*.17,.13,.065,.09,0,i,.2);if(i%7===0)flower('rose',x,Y+2.54,z,.10,i)}
 for(const x of [-5.3,-.55])for(let i=0;i<75;i++){const z=-3.1+i/74*4.15;petal(i%2?green:lightGreen,x+Math.sin(i)*.15,Y+2.63+Math.cos(i)*.07,z,.11,.065,.10,0,i,0)}
 for(const p of [[-4.4,2,.25,.35,0xb58068,'rose',14],[-3.7,2.5,.22,.3,0xa2ad9a,'daisy',15],[-.1,-1.4,.26,.38,0xd9c7a5,'hydrangea',14],[.5,-2.5,.23,.4,0xb58068,'lavender',18],[4.7,-1.5,.27,.38,0xd9c7a5,'rose',15]])pot(...p);
 for(const [color,b]of batches){const m=new T.InstancedMesh(ball,b.material,b.poses.length);b.poses.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.castShadow=m.receiveShadow=true;root.add(m)}
 const glow=new T.MeshStandardMaterial({color:0xffdea7,emissive:0xffbe69,emissiveIntensity:.65,roughness:1});
 const paper=document.createElement('canvas');paper.width=256;paper.height=128;const q=paper.getContext('2d');q.fillStyle='#edcb8f';q.fillRect(0,0,256,128);q.strokeStyle='#936b35';q.lineWidth=2;for(let x=0;x<256;x+=16){q.beginPath();q.moveTo(x,0);q.lineTo(x,128);q.stroke()}for(let y=0;y<128;y+=12){q.beginPath();q.moveTo(0,y);q.lineTo(256,y);q.stroke()}const tex=new T.CanvasTexture(paper);tex.colorSpace=T.SRGBColorSpace;const wicker=new T.MeshStandardMaterial({map:tex,color:0xffe9bf,emissive:0xe9a657,emissiveIntensity:.45,roughness:1});
 function cable(points,r=.012){const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),28,r,5,false),new T.MeshStandardMaterial({color:0x765b3e}));root.add(o)}
 // Lanterns cluster over the reading side only: the right-hand sky stays open.
 for(let row=0;row<4;row++){const z=-2.2+row*.9;cable([[-5.1,Y+2.23,z],[-3,Y+2.12,z],[-.6,Y+2.23,z]]);for(let j=0;j<3;j++){const x=-4.7+j*1.65+row*.10,drop=.22+((row+j)%3)*.14,y=Y+2.12-drop;cable([[x,Y+2.13,z],[x,y,z]],.008);const lamp=new T.Mesh(new T.SphereGeometry(1,24,16),wicker);lamp.scale.set(.19+row*.025,.22+(j%2)*.045,.19+row*.025);lamp.position.set(x,y-.2,z);root.add(lamp)}}
 for(let row=0;row<3;row++){const z=-1.7+row*.95;const path=[[-5.1,Y+2.16,z],[-2.8,Y+1.99,z+.2],[-.65,Y+2.16,z]];cable(path,.007);for(let j=0;j<18;j++){const t=j/17,o=new T.Mesh(new T.SphereGeometry(.026,8,6),glow);o.position.set(-5.1+4.45*t,Y+2.12-.16*Math.sin(t*Math.PI),z+.2*Math.sin(t*Math.PI));root.add(o)}}
 return {tick(daylight){glow.emissiveIntensity=.2+(1-daylight)*1.6;wicker.emissiveIntensity=.08+(1-daylight)*.65}};
}
