import * as T from './vendor/three.module.js';
import {wardrobeCatalog,wardrobeCategories} from './wardrobe-catalog.js';
import {releaseModel} from './studio-models.js';
export function createWardrobeContents(parent,w){
 const root=new T.Group();root.userData.dynamic=true;parent.add(root);let rows=wardrobeCatalog(),signature='',pages={};
 const zones={dress:{x:-w*.23,y:1.68,width:w*.43},top:{x:w*.24,y:1.68,width:w*.40},set:{x:-w*.23,y:.45,width:w*.43},accessory:{x:w*.24,y:.72,width:w*.40}};
 function mesh(p,geo,color,x,y,z,action){const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.94}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;if(action)m.userData.action=action;p.add(m);return m;}
 function label(text,x,y,width,action){if(typeof document==='undefined')return;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#e8ddc6';c.fillRect(0,0,512,96);c.fillStyle='#536352';c.textAlign='center';c.font='42px sans-serif';c.fillText(text,256,63);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,.065),new T.MeshBasicMaterial({map:tex}));m.position.set(x,y,.31);m.userData.action=action;root.add(m);}
 function draw(){for(const c of [...root.children])releaseModel(c);
  mesh(root,new T.BoxGeometry(.025,1.51,.47),0xb59a71,0,1.08,-.025);
  mesh(root,new T.BoxGeometry(w*.47,.025,.5),0xb59a71,w*.24,.82,0);
  for(const [category,z]of Object.entries(zones)){
   const all=rows.map((r,i)=>({...r,index:i})).filter(r=>r.category===category),count=Math.max(1,Math.ceil(all.length/4)),page=(pages[category]||0)%count;pages[category]=page;
   label(wardrobeCategories[category]+(count>1?' '+(page+1)+'/'+count:''),z.x,z.y+.12,z.width*.64,'outfit-page-'+category);
   if(count>1){label('‹',z.x-z.width*.43,z.y+.12,z.width*.17,'outfit-prev-'+category);label('›',z.x+z.width*.43,z.y+.12,z.width*.17,'outfit-page-'+category);}
   if(['dress','top'].includes(category)){const rail=mesh(root,new T.CylinderGeometry(.009,.009,z.width,16),0x8c826b,z.x,z.y,0);rail.rotation.z=Math.PI/2;}
   for(const [j,r]of all.slice(page*4,page*4+4).entries()){
    const slot=new T.Group();slot.position.set(z.x+(j-1.5)*z.width/4,z.y,0);root.add(slot);const action='outfit-pick-'+r.index,col=r.look.color||'#b7aa8f';
    if(['dress','top'].includes(category)){
     const cloth=new T.Group();cloth.rotation.y=Math.PI*.40;slot.add(cloth);
     const hook=mesh(cloth,new T.TorusGeometry(.023,.004,6,20,Math.PI*1.7),0x948a70,0,-.03,0);hook.rotation.z=.3;
     const hanger=new T.Shape();hanger.moveTo(0,-.055);hanger.lineTo(-.12,-.13);hanger.lineTo(.12,-.13);hanger.closePath();mesh(cloth,new T.ExtrudeGeometry(hanger,{depth:.008,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}),0xb49669,0,0,0);
     const h=category==='dress'?(r.look.length&&r.look.length<.3?.55:.78):.53,shape=new T.Shape();shape.moveTo(-.05,-.09);shape.lineTo(-.13,-.14);shape.lineTo(-.18,-.25);shape.lineTo(-.105,-.28);shape.lineTo(-.13,-h);shape.quadraticCurveTo(0,-h-.035,.13,-h);shape.lineTo(.105,-.28);shape.lineTo(.18,-.25);shape.lineTo(.13,-.14);shape.lineTo(.05,-.09);shape.closePath();
     mesh(cloth,new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.009,bevelThickness:.008,bevelSegments:3,curveSegments:16}),col,0,0,0,action);
     if(r.look.pattern&&r.look.pattern!=='plain'){
      const accent=r.look.accent||'#f1e9d6',pattern=r.look.pattern;
      if(/flower|floral|dot/.test(pattern))for(let k=0;k<9;k++){
       const x=(k%3-1)*.07,y=-.3-Math.floor(k/3)*.09;
       mesh(cloth,new T.SphereGeometry(.009,8,6),accent,x,y,.04,action);
       if(!/dot/.test(pattern))for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5;mesh(cloth,new T.SphereGeometry(.009,8,6),accent,x+Math.cos(a)*.013,y+Math.sin(a)*.013,.038,action);}
      }else{
       for(let k=0;k<5;k++)mesh(cloth,new T.BoxGeometry(.23,.009,.003),accent,0,-.3-k*.045,.034,action);
       if(/check|plaid/.test(pattern))for(let k=0;k<5;k++)mesh(cloth,new T.BoxGeometry(.009,.22,.003),accent,-.09+k*.045,-.39,.035,action);
      }
     }
     const hit=mesh(slot,new T.BoxGeometry(z.width/4*.92,h,.37),col,0,-h/2,.02,action);hit.material.transparent=true;hit.material.opacity=0;hit.material.depthWrite=false;hit.material.colorWrite=false;
    }else{
     slot.position.y-=.04;
     const g=r.look.kind==='hat'||r.look.kind==='veil'?new T.SphereGeometry(.067,24,16):new T.BoxGeometry(z.width/4*.83,.055,.19);
     const object=mesh(slot,g,col,0,-.04,.09,action);if(r.look.kind==='hat'||r.look.kind==='veil')object.scale.y=.55;
    }
   }
  }
  root.traverse(o=>o.layers.enable(1));
 }
 return {set(items){const key=JSON.stringify(items);if(key===signature)return;signature=key;rows=items;draw();},page(category,dir=1){pages[category]=Math.max(0,(pages[category]||0)+dir);draw();},init(){draw();},dispose(){releaseModel(root)}};
}
