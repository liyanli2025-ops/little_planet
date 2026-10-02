import * as T from './vendor/three.module.js';
import {releaseModel} from './studio-models.js';
export function createStandardHeadwear(head){
 const root=new T.Group();root.name='standard-headwear';head.add(root);let key='',blocked=false,spec;
 const mesh=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);root.add(m);return m};
 function set(v){if(JSON.stringify(v)===key)return;key=JSON.stringify(v);spec=v;for(const c of [...root.children])releaseModel(c);if(!v){root.visible=false;return}
 let texture=null;if(['stripe','check','dots'].includes(v.pattern)){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=v.color;ctx.fillRect(0,0,128,128);ctx.fillStyle=v.accent;if(v.pattern==='dots'){for(const [x,y]of [[32,32],[96,96]]){ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill()}}else{ctx.fillRect(0,0,128,24);ctx.fillRect(0,64,128,24);if(v.pattern==='check'){ctx.globalAlpha=.5;ctx.fillRect(0,0,24,128);ctx.fillRect(64,0,24,128)}}texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;}
 const cloth=new T.MeshPhysicalMaterial({color:texture?'#ffffff':v.color,map:texture,roughness:.95,sheen:.5,side:T.DoubleSide});
 const band=mesh(new T.TorusGeometry(.19,.013,12,64),cloth,0,.235,0);band.rotation.x=Math.PI/2;band.scale.y=.9;
 if(v.kind==='hat'){const crown=mesh(new T.SphereGeometry(1,56,32),cloth,0,.275,-.015);crown.scale.set(.23,.075,.195);mesh(new T.SphereGeometry(.019,24,16),cloth,0,.353,-.015)}else{
 const pos=[],uv=[],index=[],rows=28,cols=64;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const t=j/rows,a=Math.PI/2+i/cols*Math.PI,r=.19+t*.19+Math.sin(i/cols*Math.PI*12)*.009*t;pos.push(Math.sin(a)*r,.235-t*(.5+v.length*.3),Math.cos(a)*r*.85-.018);uv.push(i/cols,t)}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;index.push(a,b,a+1,a+1,b,b+1)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
 const gauze=cloth.clone();gauze.transparent=true;gauze.opacity=.45;gauze.depthWrite=false;mesh(geo,gauze,0,0,0);
 }
 if(v.pattern==='flower'){const petal=new T.MeshStandardMaterial({color:v.accent,roughness:.9});for(let i=0;i<7;i++){const a=-Math.PI*.4+i*Math.PI*.8/6,x=Math.sin(a)*.18,z=Math.cos(a)*.16;for(let n=0;n<5;n++){const b=n*Math.PI*2/5;const p=mesh(new T.SphereGeometry(1,16,12),petal,x+Math.cos(b)*.015,.247+Math.sin(b)*.015,z);p.scale.set(.012,.012,.006)}}}
 root.visible=!blocked;
 }
 return {set,hide(v){blocked=v;root.visible=!!spec&&!blocked}};
}
