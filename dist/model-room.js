import * as T from './vendor/three.module.js';
export function createModelView(host,options){
const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;host.appendChild(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,70),root=new T.Group();scene.add(root);scene.add(new T.HemisphereLight(0xfffbea,0x799280,2.5));let light=new T.DirectionalLight(0xffe8c5,3);light.position.set(-3,7,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
const cache=new Map();function mat(c){if(!cache.has(c))cache.set(c,new T.MeshStandardMaterial({color:c,roughness:.75}));return cache.get(c)}
function mesh(g,c,p,x=0,y=0,z=0){let m=new T.Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function box(p,c,x,y,z,w,h,d){return mesh(new T.BoxGeometry(w,h,d),c,p,x,y,z)}
function ball(p,c,x,y,z,r){return mesh(new T.SphereGeometry(r,20,12),c,p,x,y,z)}
function cyl(p,c,x,y,z,r1,r2,h){return mesh(new T.CylinderGeometry(r1,r2,h,28),c,p,x,y,z)}
function group(p,x=0,y=0,z=0){let g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
function label(p,text,x,y,z,w=.6,h=.16){let canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;let ctx=canvas.getContext('2d');ctx.fillStyle='#f6f0d9';ctx.fillRect(0,0,256,64);ctx.fillStyle='#415b4c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 28px sans-serif';ctx.fillText(text,128,33);let texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;let m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,transparent:true}));m.position.set(x,y,z);p.add(m);return m}
function food(type,p){let g=group(p);if(type==='milk'){box(g,0xefeadc,0,.21,0,.25,.42,.2);box(g,0xd8a9a0,0,.18,.103,.22,.17,.005);cyl(g,0xe4b7ab,.065,.438,0,.038,.038,.025);let top=box(g,0xf1eada,0,.44,0,.25,.06,.2);top.rotation.z=.04;label(g,'MILK',0,.28,.106,.18,.045)}
else if(type==='egg'){let m=ball(g,0xf0dec0,0,.12,0,.11);m.scale.set(.8,1.22,.8)}
else if(type==='tomato'){ball(g,0xcf644e,0,.14,0,.14);cyl(g,0x6e8b45,0,.278,0,.014,.022,.07);for(let i=0;i<5;i++){let a=i*6.28/5,m=box(g,0x6c934b,Math.cos(a)*.04,.261,Math.sin(a)*.04,.12,.015,.025);m.rotation.y=-a}}
else if(type==='pudding'){cyl(g,0xe4c07a,0,.14,0,.105,.145,.23);cyl(g,0x996b3e,0,.26,0,.108,.108,.022);cyl(g,0xf3eee0,0,.025,0,.19,.19,.025)}
else if(type==='cookie'){cyl(g,0xa9824f,0,.028,0,.17,.17,.04);for(let i=0;i<7;i++){let a=i*2.4;ball(g,0x6f5034,Math.cos(a)*.11,.053,Math.sin(a)*.11,.017)}}
else if(type==='rice'){cyl(g,0xc0d2bf,0,.085,0,.16,.09,.16);let rice=ball(g,0xf7ebd5,0,.165,0,.148);rice.scale.y*=.48;for(let i=0;i<8;i++)ball(g,0xfaf3e3,(i%3-1)*.045,.20,(Math.floor(i/3)-1)*.04,.018)}
else if(type==='omelet'){cyl(g,0xf6eed8,0,.02,0,.31,.31,.035);let omelet=ball(g,0xe1bd64,0,.105,0,.22);omelet.scale.set(1.15,.46,.77);for(let i=0;i<5;i++){let stripe=box(g,0xbf6651,-.13+i*.065,.202-Math.abs(i-2)*.006,0,.033,.012,.14);stripe.rotation.y=.28}}
else if(type==='toast'){cyl(g,0xadbf9f,0,.06,0,.23,.17,.14);cyl(g,0xead587,0,.133,0,.21,.21,.015);for(let i=0;i<5;i++)ball(g,0x729b54,(i-2)*.057,.15,.025*Math.sin(i),.012)}
else return food('milk',p);
return g}
const itemModels=[],pickables=[],steam=[],mode=options.mode;let selection=null,door=null,doorAngle=0,active=true,frame,phase=0,yaw=mode==='fridge'?-.08:.05,stage=options.stage||0,consuming=null;let panel=null,panGroup=null,plate=null,boardIngredients=[];
function selectable(g,item){g.userData.item=item;g.traverse(m=>{if(m.isMesh){m.userData.item=item;pickables.push(m)}});itemModels.push({g,item,base:g.position.clone()})}
if(mode==='fridge'){
box(root,0x9db5a2,0,1.68,-.62,2.35,3.36,.13);box(root,0xabc0aa,-1.15,1.68,-.05,.14,3.36,1.16);box(root,0xabc0aa,1.15,1.68,-.05,.14,3.36,1.16);box(root,0xbed0b8,0,.04,0,2.35,.14,1.24);box(root,0xbed0b8,0,3.32,0,2.35,.14,1.24);box(root,0xe7ece0,0,1.67,-.535,2.08,3.17,.03);
for(let y of [.25,1.15,2.05,2.95]){box(root,0xd3ded0,0,y,.02,2.1,.055,.98);box(root,0xf5eee0,0,y,.53,2.1,.065,.035)}
let bulb=box(root,0xffe8a8,0,3.18,-.18,.42,.035,.24);bulb.material=mat(0xffe8a8).clone();bulb.material.emissive.set(0xffd78a);bulb.material.emissiveIntensity=.5;
door=group(root,-1.13,0,.59);box(door,0xb1c5ac,1.14,1.68,0,2.28,3.32,.14);box(door,0x758e74,2.07,1.74,.13,.07,.58,.06);box(door,0xf4e4b7,.58,2.62,.084,.48,.37,.015);label(door,'FOR YOU',.58,2.62,.1,.4,.10);
(options.items||[]).slice(0,9).forEach((item,i)=>{let g=food(item.food,root);g.position.set((i%3-1)*.64,.31+(2-Math.floor(i/3))*.9,.04);g.scale.setScalar(1.48);selectable(g,item);label(root,'×'+item.qty,g.position.x,g.position.y-.015,.555,.26,.09);if(item.gift){let gift=box(g,0xc99983,.13,.13,.06,.045,.25,.045);gift.rotation.z=.1}});
label(root,'FRESH LITTLE THINGS',0,3.48,.1,1.7,.1);
}else if(mode==='cook'){
box(root,0xb39972,0,.02,0,3.8,.18,2);box(root,0xd7c9a4,0,.14,0,3.92,.07,2.07);box(root,0xb69362,-.8,.21,.37,1.45,.08,.78);
panGroup=group(root,.9,.25,-.03);cyl(panGroup,0x596656,0,.03,0,.53,.48,.1);cyl(panGroup,0x394d42,0,.096,0,.46,.46,.035);box(panGroup,0x9d7c51,0,.04,.75,.14,.09,.65);for(let i=0;i<7;i++){let m=ball(panGroup,0xc0cbb9,(i%3-1)*.12,.2,Math.floor(i/3)*.1,.07);m.material=new T.MeshBasicMaterial({color:0xfaf8e8,transparent:true,opacity:.38,depthWrite:false});steam.push(m)}
const ingredients=Object.keys(options.needs||{rice:1,egg:1,tomato:1});ingredients.forEach((type,i)=>{let g=food(type,root);g.position.set(-1.35+i*.45,.24,-.51);g.scale.setScalar(1.2);g.userData.type=type;boardIngredients.push(g);selectable(g,{id:type,food:type,step:true})});
plate=food(options.recipe||'omelet',root);plate.position.set(-.55,.22,.33);plate.scale.setScalar(1.75);plate.visible=stage>=3;
const boardTarget=box(root,0xb89864,-.76,.259,.34,1.47,.008,.8);boardTarget.userData.item={step:true,id:'board'};pickables.push(boardTarget);panGroup.traverse(m=>{if(m.isMesh&&!steam.includes(m)){m.userData.item={step:true,id:'pan'};pickables.push(m)}});
label(root,'MADE WITH CARE',0,.04,1.05,1.8,.1);
}else{
box(root,0xbca074,0,.02,0,3.7,.14,1.9);box(root,0xe2d6b8,0,.102,0,2.8,.012,1.3);
(options.items||[]).slice(0,6).forEach((item,i)=>{let g=food(item.recipe||'omelet',root);g.position.set((i%3-1)*.92,.15,(Math.floor(i/3)-.5)*.72);g.scale.setScalar(1.3);if(item.locked){g.clear();box(g,0xb3c5a2,0,.16,0,.55,.28,.42);box(g,0xd4dfbb,0,.32,0,.59,.04,.45)}selectable(g,item)});
}
function resize(){let w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}let observer=new ResizeObserver(resize);observer.observe(host);resize();
let ray=new T.Raycaster(),down=null;renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,yaw};renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(down)yaw=T.MathUtils.clamp(down.yaw+(e.clientX-down.x)*.004,-.45,.6)});renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7){let rect=host.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);let hit=ray.intersectObjects(pickables).find(h=>h.object.visible&&h.object.parent.visible);if(hit){if(mode==='cook')options.onStep?.();else{api.select(hit.object.userData.item.id);options.onSelect?.(hit.object.userData.item)}}}down=null});renderer.domElement.addEventListener('pointercancel',()=>down=null);
let clock=new T.Clock(),last=0;
function draw(){if(!active)return;frame=requestAnimationFrame(draw);let t=clock.getElapsedTime(),dt=Math.min(.05,t-last);last=t;root.rotation.y=yaw;
if(door){doorAngle+=(-2.8-doorAngle)*(1-Math.exp(-dt*3.6));door.rotation.y=doorAngle}
for(let entry of itemModels){if(mode==='cook')continue;let {g,base,item}=entry;let lift=item.id===selection?.1:0;g.position.y+=(base.y+lift-g.position.y)*.14;g.position.z+=(base.z+(item.id===selection?.25:0)-g.position.z)*.14}
if(mode==='cook'){boardIngredients.forEach((g,i)=>{let target=stage===0?new T.Vector3(-1.35+i*.45,.24,-.51):stage===1?new T.Vector3(-1.17+i*.37,.27,.34):new T.Vector3(.75+(i%2)*.2,.37,(i-1)*.14);g.position.lerp(target,.08);g.visible=stage<3;if(stage===2){g.rotation.z=Math.sin(t*5+i)*.12;g.position.y+=Math.sin(t*6+i)*.004}});steam.forEach((g,i)=>{g.visible=stage===2;g.position.y=.2+((t*.33+i*.12)%.9);g.material.opacity=.32*(1-(g.position.y-.2)/.9)});plate.visible=stage>=3}
if(consuming){let a=Math.min(1,(t-consuming.start)/.65);consuming.g.scale.setScalar(consuming.scale*(1-a));consuming.g.position.y+=dt*.22;if(a===1){const done=consuming.done;consuming=null;done()}}
let mobile=host.clientWidth<450;camera.position.set(mode==='fridge'?3.2:3.2,mode==='fridge'?3.25:4.4,mode==='fridge'?6.8:5.6);if(mobile)camera.position.multiplyScalar(1.08);camera.lookAt(0,mode==='fridge'?1.72:.3,0);renderer.render(scene,camera)}
const api={select(id){selection=id},step(v){stage=v},consume(id){let e=itemModels.find(e=>e.item.id===id);if(!e)return Promise.resolve();return new Promise(done=>{consuming={g:e.g,scale:e.g.scale.x,start:clock.getElapsedTime(),done}})},state(){return {mode,stage,selected:selection,items:itemModels.map(e=>e.item.id),door:doorAngle}},dispose(){active=false;cancelAnimationFrame(frame);observer.disconnect();if(consuming){consuming.done();consuming=null}scene.traverse(m=>{if(m.isMesh){m.geometry.dispose();if(m.material.map)m.material.map.dispose();m.material.dispose()}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}};
host.getModelState=api.state;draw();return api;
}

