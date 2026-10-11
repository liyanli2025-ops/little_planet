import {clothSurface} from './cloth-surface.js';
import {designColors} from './design-schema.js';
import {createTeddy} from './teddy.js';
import {defaultDesign} from './design-schema.js';
import * as T from './vendor/three.module.js';
import {wardrobeCatalog,wardrobeCategories,wardrobeOutfit} from './wardrobe-catalog.js';
import {releaseModel} from './studio-models.js';
export function createWardrobeContents(parent,w){
 const root=new T.Group();root.userData.dynamic=true;parent.add(root);let rows=[],signature='',pages={},fits=[];
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
   holder.scale.set(scale,scale,row.category!=='accessory'?scale*.55:scale);holder.position.set(-center.x*scale,top-box.max.y*scale,-center.z*holder.scale.z);
  };fits.push(fit);fit();
 }
 function draw(){fits=[];for(const c of [...root.children])releaseModel(c);
  // Clothes hang vertically from real rails; accessories rest on lower shelves.
  const clothes=rows.map((item,index)=>({item,index})).filter(x=>x.item.category!=='accessory'),accessories=rows.map((item,index)=>({item,index})).filter(x=>x.item.category==='accessory');
  const tiers=clothes.length>6?2:1;
  const wood=0xa88860,metal=0x827668;
  function tube(points,r,color,parent=root){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,32,r,8,false),new T.MeshStandardMaterial({color,roughness:.7}));parent.add(m);return m;}
  for(let tier=0;tier<tiers;tier++){
   const rail=1.78-tier*.70; tube([[-w*.44,rail,-.02],[w*.44,rail,-.02]],.014,metal);
   const group=clothes.filter((_,i)=>i%tiers===tier),spacing=w*.82/Math.max(group.length,1);
   for(const [j,{item,index}] of group.entries()){
    const slot=new T.Group();slot.position.set((j-(group.length-1)/2)*spacing,rail,0);slot.rotation.y=group.length>4?-.30:0;root.add(slot);const action='outfit-pick-'+index,breadth=Math.min(.52,w*.38),height=tiers===1?1.10:.53;
    tube([[0,.025,-.02],[.028,.045,-.02],[.043,.015,-.02],[.012,-.045,-.02],[0,-.09,-.02]],.007,metal,slot);
    tube([[0,-.09,0],[-breadth*.48,-.16,0],[-breadth*.43,-.19,0],[breadth*.43,-.19,0],[breadth*.48,-.16,0],[0,-.09,0]],.009,wood,slot);
    garment(slot,item,breadth,height,action,-.16);
    const hit=mesh(slot,new T.BoxGeometry(Math.min(spacing*.95,breadth),height,.24),0xffffff,0,-.16-height*.5,.10,action);hit.material.transparent=true;hit.material.opacity=0;hit.material.depthWrite=false;hit.material.colorWrite=false;
   }
  }
  const shelfY=.32;mesh(root,new T.BoxGeometry(w*.91,.024,.43),wood,0,shelfY,-.025);
  for(const [j,{item,index}] of accessories.entries()){
   const cols=Math.max(1,Math.ceil(accessories.length/2)),spacing=w*.83/cols,slot=new T.Group();slot.position.set((j%cols-(cols-1)/2)*spacing,shelfY+(j>=cols?.20:0),.06);root.add(slot);const action='outfit-pick-'+index;
   garment(slot,item,Math.min(.25,spacing*.9),.17,action,.18);
   const hit=mesh(slot,new T.BoxGeometry(spacing*.94,.18,.28),0xffffff,0,.09,.04,action);hit.material.transparent=true;hit.material.opacity=0;hit.material.depthWrite=false;hit.material.colorWrite=false;
  }
  if(accessories.length>1)mesh(root,new T.BoxGeometry(w*.91,.02,.43),wood,0,shelfY+.20,-.025);
  root.traverse(o=>o.layers.enable(1));
 }

 return {set(items){const key=JSON.stringify(items);if(key===signature)return;signature=key;rows=items;draw();},page(category,dir=1){pages[category]=Math.max(0,(pages[category]||0)+dir);draw();},init(){draw();},dispose(){if(typeof document!=='undefined')document.removeEventListener('studio-model-state',refresh);releaseModel(root)}};
}
