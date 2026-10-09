import {applyGarmentSurface} from './garment-surface.js';
import * as T from './vendor/three.module.js';
import {releaseModel} from './studio-models.js';
export function createStandardHeadwear(head){
 const root=new T.Group();root.name='standard-headwear';root.userData.wardrobeSlot='hat';head.add(root);let key='',blocked=false,spec;
 const mesh=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);root.add(m);return m};
 function set(v){if(JSON.stringify(v)===key)return;key=JSON.stringify(v);spec=v;for(const c of [...root.children])releaseModel(c);if(!v){root.visible=false;return}
 let texture=null;if(['stripe','check','dots'].includes(v.pattern)){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=v.color;ctx.fillRect(0,0,128,128);ctx.fillStyle=v.accent;if(v.pattern==='dots'){for(const [x,y]of [[32,32],[96,96]]){ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill()}}else{ctx.fillRect(0,0,128,24);ctx.fillRect(0,64,128,24);if(v.pattern==='check'){ctx.globalAlpha=.5;ctx.fillRect(0,0,24,128);ctx.fillRect(64,0,24,128)}}texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(.06/v.patternScale,.06/v.patternScale);}
 const cloth=new T.MeshPhysicalMaterial({color:texture?'#ffffff':v.color,map:texture,roughness:.95,sheen:.5,side:T.DoubleSide});
 applyGarmentSurface(cloth,v,{headwear:true});
 if(v.kind==='hat'){const band=mesh(new T.TorusGeometry(.19,.013,12,64),cloth,0,.235,0);band.rotation.x=Math.PI/2;band.scale.y=.9;}
 if(v.kind==='hat'){const crown=mesh(new T.SphereGeometry(1,56,32),cloth,0,.275,-.015);crown.scale.set(.23,.075,.195);mesh(new T.SphereGeometry(.019,24,16),cloth,0,.353,-.015)}else{
 const pos=[],uv=[],index=[],rows=28,cols=64;
 const veilPoint=(t,u)=>{const a=Math.PI/3+u*Math.PI*4/3,fold=Math.sin(u*Math.PI*16+.35*Math.sin(t*4));let r,y;if(t<.36){const q=t/.36,theta=.12+q*1.3;r=.285*Math.sin(theta);y=-.008+.285*Math.cos(theta);}else{const q=(t-.36)/.64;r=.282+q*.16;y=.035-q*(.42+v.length*.55);}r+=fold*.012*Math.sin(t*Math.PI/2);return new T.Vector3(Math.sin(a)*r,y,Math.cos(a)*r*.85-.028);};
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const t=j/rows,p=veilPoint(t,i/cols);pos.push(p.x,p.y,p.z);uv.push(i/cols,t)}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;index.push(a,b,a+1,a+1,b,b+1)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
 const gauze=cloth.clone();gauze.transparent=true;gauze.opacity=.3;gauze.depthWrite=false;
 const weave=document.createElement('canvas');weave.width=weave.height=64;const wc=weave.getContext('2d');wc.fillStyle='#777777';wc.fillRect(0,0,64,64);wc.strokeStyle='#dddddd';wc.lineWidth=1;for(let i=0;i<64;i+=8){wc.beginPath();wc.moveTo(i,0);wc.lineTo(i,64);wc.moveTo(0,i);wc.lineTo(64,i);wc.stroke();}gauze.alphaMap=new T.CanvasTexture(weave);gauze.alphaMap.wrapS=gauze.alphaMap.wrapT=T.RepeatWrapping;gauze.alphaMap.repeat.set(35,30);mesh(geo,gauze,0,0,0);
 const comb=new T.MeshStandardMaterial({color:v.accent,roughness:.75});for(let i=0;i<5;i++){const tooth=mesh(new T.CapsuleGeometry(.002,.024,3,6),comb,(i-2)*.012,.258,-.066);tooth.rotation.x=.8;}

 // Follow the actual draped edge rather than placing decoration on the headband.
 const edge=[];for(let i=0;i<=cols;i++)edge.push(veilPoint(1,i/cols));
 const lace=new T.MeshStandardMaterial({color:v.accent,roughness:1,transparent:true,opacity:.7});
 mesh(new T.TubeGeometry(new T.CatmullRomCurve3(edge),96,.003,5,false),lace,0,0,0);
 if(/雏菊|daisy/i.test(v.name)){const petals=new T.MeshStandardMaterial({color:'#fffaf0',roughness:1}),center=new T.MeshStandardMaterial({color:'#e5bf64',roughness:1});for(let i=2;i<cols;i+=6){const pos=edge[i];for(let n=0;n<7;n++){const a=n*Math.PI*2/7,p=mesh(new T.SphereGeometry(1,10,6),petals,pos.x+Math.cos(a)*.009,pos.y+Math.sin(a)*.009,pos.z);p.scale.set(.007,.004,.002);p.rotation.z=a;}mesh(new T.SphereGeometry(.004,10,6),center,pos.x,pos.y,pos.z+.003);}}

 }
 if(v.pattern==='flower'){const petal=new T.MeshStandardMaterial({color:v.accent,roughness:.9});for(let i=0;i<7;i++){const a=-Math.PI*.4+i*Math.PI*.8/6,x=Math.sin(a)*.18,z=Math.cos(a)*.16;for(let n=0;n<5;n++){const b=n*Math.PI*2/5;const p=mesh(new T.SphereGeometry(1,16,12),petal,x+Math.cos(b)*.015,.247+Math.sin(b)*.015,z);p.scale.set(.012,.012,.006)}}}
 root.visible=!blocked;
 }
 return {set,hide(v){blocked=v;root.visible=!!spec&&!blocked}};
}
