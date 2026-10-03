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
  mesh(root,new T.BoxGeometry(.025,1.51,.47),0xb59a71,0,1.08,-.025);
  mesh(root,new T.BoxGeometry(w*.47,.025,.5),0xb59a71,w*.24,.82,0);
  for(const [category,z]of Object.entries(zones)){
   const capacity=category==='set'?3:category==='accessory'?2:4;
   const all=rows.map((r,i)=>({...r,index:i})).filter(r=>r.category===category),count=Math.max(1,Math.ceil(all.length/capacity)),page=(pages[category]||0)%count;pages[category]=page;
   label(wardrobeCategories[category]+(count>1?' '+(page+1)+'/'+count:''),z.x,z.y+.12,z.width*.64,'outfit-page-'+category);
   if(count>1){label('‹',z.x-z.width*.43,z.y+.12,z.width*.17,'outfit-prev-'+category);label('›',z.x+z.width*.43,z.y+.12,z.width*.17,'outfit-page-'+category);}
   if(['dress','top','set'].includes(category)){const rail=mesh(root,new T.CylinderGeometry(.009,.009,z.width,16),0x8c826b,z.x,z.y,0);rail.rotation.z=Math.PI/2;}
   for(const [j,r]of all.slice(page*capacity,page*capacity+capacity).entries()){
    const slot=new T.Group();slot.position.set(z.x+(j-(capacity-1)/2)*z.width/capacity,z.y,0);root.add(slot);const action='outfit-pick-'+r.index,col=r.look.color||'#b7aa8f';
    if(['dress','top','set'].includes(category)){
     const cloth=new T.Group();cloth.rotation.y=Math.PI*.40;slot.add(cloth);
     const hook=mesh(cloth,new T.TorusGeometry(.023,.004,6,20,Math.PI*1.7),0x948a70,0,-.03,0);hook.rotation.z=.3;
     const hanger=new T.Shape();hanger.moveTo(0,-.055);hanger.lineTo(-.12,-.13);hanger.lineTo(.12,-.13);hanger.closePath();mesh(cloth,new T.ExtrudeGeometry(hanger,{depth:.008,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}),0xb49669,0,0,0);
     const h=category==='dress'?.78:category==='set'?.45:.53;
     garment(cloth,r,category==='set'?.48:.55,h,action,-.10);
     const hit=mesh(slot,new T.BoxGeometry(z.width/capacity*.92,h,.37),col,0,-h/2,.02,action);hit.material.transparent=true;hit.material.opacity=0;hit.material.depthWrite=false;hit.material.colorWrite=false;
    }else{
     const height=category==='set'?.50:.30,width=category==='set'?Math.min(.48,z.width*.80):z.width/capacity*.88;
     garment(slot,r,width,height,action,-.02);
     const hit=mesh(slot,new T.BoxGeometry(z.width/capacity*.94,height,.35),col,0,-height/2,.02,action);hit.material.transparent=true;hit.material.opacity=0;hit.material.depthWrite=false;hit.material.colorWrite=false;
    }
   }
  }
  root.traverse(o=>o.layers.enable(1));
 }
 return {set(items){const key=JSON.stringify(items);if(key===signature)return;signature=key;rows=items;draw();},page(category,dir=1){pages[category]=Math.max(0,(pages[category]||0)+dir);draw();},init(){draw();},dispose(){if(typeof document!=='undefined')document.removeEventListener('studio-model-state',refresh);releaseModel(root)}};
}
