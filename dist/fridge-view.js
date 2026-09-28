import * as T from './vendor/three.module.js';
import {makeFood} from './food-models.js';
import {foodCatalog} from './food-catalog.js';
export function createFridgeView(host,options){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,40),renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(renderer.domElement);host.classList.add('fridge-stage');
 scene.add(new T.HemisphereLight(0xfff9e9,0x809b91,1.35));const light=new T.DirectionalLight(0xffedda,2.6);light.position.set(-3,6,5);light.target.position.set(0,2,0);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:16});light.shadow.normalBias=.025;light.shadow.bias=-.0003;scene.add(light,light.target);const root=new T.Group();scene.add(root);const materials=new Map(),models=[],doors={chill:true,freezer:true};let selected=null,active=true,frame,consumeResolve=null;
 function mat(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.56}));return materials.get(color)}
 function rounded(w,h,d){const r=Math.min(.055,w/4,h/4,d/4),sh=new T.Shape(),x=-w/2+r,y=-h/2+r;sh.moveTo(x+r,y);sh.lineTo(x+w-3*r,y);sh.quadraticCurveTo(x+w-2*r,y,x+w-2*r,y+r);sh.lineTo(x+w-2*r,y+h-3*r);sh.quadraticCurveTo(x+w-2*r,y+h-2*r,x+w-3*r,y+h-2*r);sh.lineTo(x+r,y+h-2*r);sh.quadraticCurveTo(x,y+h-2*r,x,y+h-3*r);sh.lineTo(x,y+r);sh.quadraticCurveTo(x,y,x+r,y);const geo=new T.ExtrudeGeometry(sh,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3,steps:1,curveSegments:5});geo.translate(0,0,-d/2+r);return geo}
 function box(p,c,x,y,z,w,h,d,glass=false){const mesh=new T.Mesh(!glass&&w>.08&&h>.06&&d>.06?rounded(w,h,d):new T.BoxGeometry(w,h,d),glass?new T.MeshPhysicalMaterial({color:c,transparent:true,opacity:.42,roughness:.16,depthWrite:false}):mat(c));mesh.castShadow=!glass;mesh.receiveShadow=true;mesh.position.set(x,y,z);p.add(mesh);return mesh}
 const cream=0xece7d8,inside=0xf8f4e8,trim=0xc8cfc3,metal=0xa7b2a6;
 box(root,cream,0,2,-.38,2.14,4.12,.15);for(const x of [-1.04,1.04])box(root,cream,x,2,.07,.14,4.12,1.03);for(const y of [0,1.13,4.02])box(root,cream,0,y,.08,2.17,.13,1.07);box(root,inside,0,2,-.28,1.98,3.9,.04);
 for(const x of [-.86,.86])box(root,metal,x,-.13,.16,.17,.19,.62);
 // Glass shelves with a fine front rail, and two transparent crisper drawers.
 for(const y of [1.80,2.46,3.12]){box(root,0xc0dbd7,0,y,.12,1.94,.035,.86,true);box(root,trim,0,y,.56,1.94,.035,.025)}
 for(const x of [-.49,.49]){box(root,0xcbdcd3,x,1.25,.12,.92,.025,.8);box(root,0xc8d8cf,x,1.47,.52,.92,.4,.024,true);for(const side of [-.46,.46])box(root,0xc8d8cf,x+side,1.47,.12,.022,.4,.82,true);box(root,cream,x,1.69,.54,.94,.035,.025);box(root,metal,x,1.58,.56,.22,.025,.035)}
 for(const y of [.13,.59]){box(root,inside,0,y,.1,1.95,.035,.87);box(root,0xc9d8d5,0,y+.14,.56,1.94,.26,.03,true);box(root,metal,0,y+.24,.58,.36,.022,.02)}
 box(root,trim,0,3.92,.12,.74,.04,.48);const led=box(root,0xffffff,0,3.89,.12,.62,.015,.3);led.material=new T.MeshStandardMaterial({color:0xf5fff7,emissive:0xc8eadd,emissiveIntensity:.6});const cold=new T.PointLight(0xe4fff5,2,4);cold.position.set(0,3.6,.5);scene.add(cold);
 for(const y of [1.8,2.46,3.12])box(root,0xc4cec4,0,y-.045,-.25,1.88,.065,.008);
 for(let i=0;i<7;i++)box(root,0xc5cec3,0,3.66-i*.045,-.245,.42,.013,.01);
 const hinges={};for(const [zone,bottom,height]of [['chill',1.18,2.78],['freezer',.02,1.04]]){const hinge=new T.Group();hinge.position.set(1.1,bottom,.66);root.add(hinge);hinges[zone]=hinge;box(hinge,0xa5b2a6,-1.04,height/2,-.035,2.1,height,.072);box(hinge,cream,-1.04,height/2,.08,2.13,height,.18);box(hinge,inside,-1.04,height/2,-.064,1.94,height-.15,.035);box(hinge,metal,-1.77,zone==='chill'?.38:.7,.24,.065,.44,.09);box(hinge,0xe6dfcb,-1.77,zone==='chill'?.38:.7,.29,.075,.31,.045);
 if(zone==='chill'){for(const y of [.20,1.05,1.87]){box(hinge,cream,-1.04,y,-.26,1.8,.06,.4);box(hinge,0xc5d7ce,-1.04,y+.16,-.47,1.8,.25,.025,true);for(const x of [-1.95,-.13])box(hinge,cream,x,y+.12,-.26,.04,.23,.42)}box(hinge,trim,-1.04,2.58,.183,.58,.085,.008);box(hinge,0x65867e,-1.04,2.58,.19,.24,.035,.006)}
 }
 const toolbar=document.createElement('div');toolbar.className='fridge-doors';for(const [zone,label]of [['chill','冷藏'],['freezer','冷冻']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label','开合'+label+'门');b.setAttribute('aria-expanded','true');b.onclick=()=>{doors[zone]=!doors[zone];b.setAttribute('aria-expanded',String(doors[zone]));if(models.find(m=>m.item.id===selected)?.zone===zone&&!doors[zone]){selected=null;options.onSelect?.({id:null})}};toolbar.append(b)}host.append(toolbar);
 const chilled=options.items.filter(i=>foodCatalog[i.food]?.zone!=='freezer'),frozen=options.items.filter(i=>foodCatalog[i.food]?.zone==='freezer');

 // Stable physical sizes, independent of the amount in stock. Storage belongs
 // to each selectable stock group, so it comes forward with the food.
 function stockModel(item,index,zone){
  const g=new T.Group(),f=foodCatalog[item.food];
  function food(x,y,z,w,h,d,rotation=0){const model=makeFood(item.food);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const scale=Math.min(w/Math.max(size.x,.001),h/Math.max(size.y,.001),d/Math.max(size.z,.001));const anchor=new T.Group();model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);anchor.add(model);anchor.position.set(x,y,z);anchor.rotation.y=rotation;g.add(anchor)}
  function tub(color=0x92b8a7,height=.20){box(g,0xe5eee8,0,.025,0,.49,.035,.39);for(const x of [-.24,.24])box(g,0xc4d9d1,x,height/2,0,.018,height,.39,true);for(const z of [-.19,.19])box(g,0xc4d9d1,0,height/2,z,.48,height,.018,true);box(g,color,0,height+.014,0,.51,.034,.41);for(const x of [-.25,.25])box(g,color,x,height-.026,0,.025,.09,.13)}
  const produce=['水果','果蔬食材'].includes(f.category)&&!['flour','tofu','egg'].includes(item.food);
  if(zone==='freezer'){
   // Sealed freezer pouch, with a transparent window and a small food preview.
   const color=['dumplings','bao'].includes(item.food)?0x91aaa3:['fish','shrimp'].includes(item.food)?0x91b2be:0xbc9386;
   box(g,0xeee8db,0,.18,0,.49,.34,.19);box(g,color,0,.34,0,.50,.047,.20);box(g,color,0,.037,0,.49,.042,.19);
   box(g,0xc5dbd4,0,.174,.104,.37,.21,.009,true);food(0,.075,.118,.32,.17,.08);box(g,0xfaf6e8,0,.287,.106,.24,.038,.012);
   for(const x of [-.21,.21])box(g,0xd3cec1,x,.18,.106,.01,.25,.007);
  }else if(produce){
   box(g,0xc7b590,0,.027,0,.5,.04,.4);
   for(const z of [-.20,.20])for(const y of [.07,.12])box(g,0xd1c19f,0,y,z,.51,.027,.018);
   for(const x of [-.25,.25]){box(g,0xc1ad84,x,.085,0,.025,.14,.41);for(const z of [-.20,.20])box(g,0xbfae8d,x,.09,z,.025,.16,.025)}
   const count=Math.min(3,item.qty||1);for(let k=0;k<count;k++)food(k===1?.12:-.10,.052,k===0?.07:-.11,.21,.23,.19,(k-1)*.27);
  }else if(['熟食便当','甜点点心'].includes(f.category)||['cheese','butter','tofu'].includes(item.food)){
   food(0,.045,0,.42,.19,.32);tub(f.category==='甜点点心'?0xd5b38d:0x8eafa4,.24);
   // A clear inset in the lid lets the actual dish remain visible.
   const lid=g.children[g.children.length-3];lid.material=new T.MeshPhysicalMaterial({color:0xdce9df,transparent:true,opacity:.26,roughness:.22,depthWrite:false});
  }else if(item.food==='egg'){
   box(g,0xc9bda0,0,.032,0,.48,.055,.34);food(0,.060,0,.42,.16,.28);box(g,0xd7cdb2,0,.17,-.17,.49,.27,.028);
  }else{
   food(-.06,0,.04,.29,.48,.30,-.045);
   if(item.qty>1)food(.13,0,-.13,.29,.48,.30,.06);
  }
  return g;
 }
 function place(item,index,zone){const g=stockModel(item,index,zone),f=foodCatalog[item.food];g.scale.setScalar(1.1);let parent=root;
 if(zone==='freezer')g.position.set((index%3-1)*.60,.16+Math.floor(index/3)*.46,.16+(index%2)*.035);
 else if(index>=12){parent=hinges.chill;g.position.set(-.70-(index%2)*.70,.24+Math.floor((index-12)/2)*.835,-.29);g.rotation.y=Math.PI}
 else {const row=Math.floor(index/3);g.position.set((index%3-1)*.60,row===3?1.28:3.16-row*.66,.04+(index%2)*.18);g.rotation.y=(index%3-1)*.025}
 parent.add(g);const button=document.createElement('button');button.type='button';button.className='fridge-food-hit';button.setAttribute('aria-label',f.name+(item.gift?'，对方留下的':''));button.dataset.food=item.food;button.dataset.item=item.id;button.onclick=()=>{if(doors[zone]){api.select(item.id);options.onSelect?.(item)}};host.append(button);models.push({g,item,zone,base:g.position.clone(),parent,button});}
 const rack=[],shelves=[];for(const i of chilled){if(rack.length<6&&['乳品饮料','酱料小菜'].includes(foodCatalog[i.food].category))rack.push(i);else shelves.push(i)}while(shelves.length>12)rack.push(shelves.pop());shelves.sort((a,b)=>Number(['水果','果蔬食材'].includes(foodCatalog[a.food].category))-Number(['水果','果蔬食材'].includes(foodCatalog[b.food].category)));const produce=shelves.filter(i=>['水果','果蔬食材'].includes(foodCatalog[i.food].category));const other=shelves.filter(i=>!produce.includes(i));const bottom=produce.splice(0,3);other.push(...produce);other.forEach((i,n)=>place(i,n<9?n:9+bottom.length+n-9,'chill'));bottom.forEach((i,n)=>place(i,9+n,'chill'));rack.forEach((i,n)=>place(i,n+12,'chill'));frozen.forEach((i,n)=>place(i,n,'freezer'));
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();camera.position.set(2.6,4.0,9.6);const target=new T.Vector3(.85,1.96,.25);camera.position.sub(target).multiplyScalar(Math.max(1,.84/camera.aspect)).add(target);camera.lookAt(target)}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 let consuming=null;const screen=new T.Vector3();function tick(){if(!active)return;for(const zone of ['chill','freezer'])hinges[zone].rotation.y=T.MathUtils.lerp(hinges[zone].rotation.y,doors[zone]?2.72:0,.13);
 for(const m of models){const isSelected=m.item.id===selected;const target=m.base.clone();if(isSelected)target.z+=m.parent===root?.40:-.40;m.g.position.lerp(target,.14);m.g.scale.lerp(new T.Vector3().setScalar(isSelected?1.30:1.1),.14);if(consuming?.id===m.item.id){const t=Math.min(1,(performance.now()-consuming.start)/360);m.g.scale.multiplyScalar(1-t);if(t===1){consuming=null;consumeResolve?.();consumeResolve=null}}
 m.g.updateWorldMatrix(true,false);screen.set(0,.16,0).applyMatrix4(m.g.matrixWorld).project(camera);m.button.hidden=!doors[m.zone]||Math.abs(hinges[m.zone].rotation.y-2.72)>.18;m.button.style.left=(screen.x*.5+.5)*host.clientWidth+'px';m.button.style.top=(-screen.y*.5+.5)*host.clientHeight+'px';m.button.classList.toggle('selected',isSelected);m.button.setAttribute('aria-pressed',String(isSelected));}
 renderer.render(scene,camera);frame=requestAnimationFrame(tick)}
 const api={select(id){selected=id},consume(id){return new Promise(resolve=>{consumeResolve=resolve;consuming={id,start:performance.now()}})},state(){return {mode:'fridge',selected,doors:{...doors},items:models.map(m=>({id:m.item.id,food:m.item.food,zone:m.zone,extension:m.g.position.z-m.base.z}))}},dispose(){active=false;cancelAnimationFrame(frame);observer.disconnect();consumeResolve?.();const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of [].concat(o.material))ms.add(m)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();host.replaceChildren();delete host.getModelState}};host.getModelState=api.state;tick();return api;
}
