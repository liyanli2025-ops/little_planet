import {clothSurface} from './cloth-surface.js';
import {designColors} from './design-schema.js';
import {createTeddy} from './teddy.js';
import {defaultDesign} from './design-schema.js';
import * as T from './vendor/three.module.js';
import {wardrobeCatalog,wardrobeCategories,wardrobeOutfit} from './wardrobe-catalog.js';
import {releaseModel} from './studio-models.js';
export function createWardrobeContents(parent,w){
 const root=new T.Group();root.userData.dynamic=true;parent.add(root);let rows=wardrobeCatalog(),signature='',pages={},fits=[];
 const refresh=()=>{for(const fit of fits)fit();root.traverse(o=>o.layers.enable(1));};if(typeof document!=='undefined')document.addEventListener('studio-model-state',refresh);
 const zones={dress:{x:-w*.23,y:1.68,width:w*.43},top:{x:w*.24,y:1.68,width:w*.40},set:{x:-w*.23,y:.85,width:w*.43},accessory:{x:w*.24,y:.72,width:w*.40}};
 function mesh(p,geo,color,x,y,z,action){const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.94}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;if(action)m.userData.action=action;p.add(m);return m;}
 function label(text,x,y,width,action){if(typeof document==='undefined')return;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#e8ddc6';c.fillRect(0,0,512,96);c.fillStyle='#536352';c.textAlign='center';c.font='42px sans-serif';c.fillText(text,256,63);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,.065),new T.MeshBasicMaterial({map:tex}));m.position.set(x,y,.31);m.userData.action=action;root.add(m);}
 function garment(parent,row,width,height,action,top){
  if(typeof document==='undefined')return;
  if(row.look.kind==='scarf'){
   const color=designColors[row.patch.primary]||row.look.color,material=new T.MeshPhysicalMaterial({color,roughness:.98,sheen:.7,side:T.DoubleSide});
   const folded=new T.Mesh(clothSurface((u,v)=>[(u-.5)*width*.65,top-v*height*.85,.04+.016*Math.sin(v*Math.PI*2)+.006*Math.cos(u*Math.PI*4)],18,30),material);folded.userData.action=action;parent.add(folded);
   const back=folded.clone();back.position.set(width*.08,.015,-.02);parent.add(back);return;
  }
  const holder=new T.Group(),bear=createTeddy(holder),base=[];
  bear.avatar.traverseVisible(o=>{if(o.isMesh)base.push(o)});
  bear.design(wardrobeOutfit(defaultDesign().outfit,row));
  for(const o of base)o.visible=false;
  parent.add(holder);
  const fit=()=>{holder.updateWorldMatrix(true,true);const inverse=holder.matrixWorld.clone().invert(),box=new T.Box3();
   holder.traverseVisible(o=>{if(o.isMesh){o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld)));o.userData.action=action;}});
   if(box.isEmpty())return;
   const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=Math.min(width/Math.max(size.x,.01),height/Math.max(size.y,.01));
   holder.scale.set(scale,scale,row.category!=='accessory'?scale*.3:scale);holder.position.set(-center.x*scale,top-box.max.y*scale,-center.z*holder.scale.z);
  };fits.push(fit);fit();
 }
 function draw(){fits=[];for(const c of [...root.children])releaseModel(c);
  // One continuous shelf grid in catalog order; saved pieces precede defaults.
  const cols=4,count=Math.max(1,Math.ceil(rows.length/cols)),step=Math.min(.47,1.72/count),width=w*.88/cols;
  for(let row=0;row<count;row++){const y=1.83-row*step;mesh(root,new T.BoxGeometry(w*.91,.018,.43),0xb59a71,0,y-step+.025,-.025);}
  for(const [index,item] of rows.entries()){const slot=new T.Group(),row=Math.floor(index/cols),column=index%cols,top=1.83-row*step;slot.position.set((column-(cols-1)/2)*width,top,0);root.add(slot);const action='outfit-pick-'+index;
   garment(slot,item,width*.82,step*.76,action,-.015);
   const hit=mesh(slot,new T.BoxGeometry(width*.92,step*.9,.37),0xffffff,0,-step*.46,.025,action);hit.material.transparent=true;hit.material.opacity=0;hit.material.depthWrite=false;hit.material.colorWrite=false;
  }
  root.traverse(o=>o.layers.enable(1));
 }

 return {set(items){const key=JSON.stringify(items);if(key===signature)return;signature=key;rows=items;draw();},page(category,dir=1){pages[category]=Math.max(0,(pages[category]||0)+dir);draw();},init(){draw();},dispose(){if(typeof document!=='undefined')document.removeEventListener('studio-model-state',refresh);releaseModel(root)}};
}
