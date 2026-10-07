import {createRunningDeer} from './aurora-deer-gait.js';
import {snowShore} from './aurora-terrain.js';
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
export function createAuroraWildlife(world){
 const loader=new GLTFLoader(),actors=[],up=new T.Vector3(0,1,0);
 function anchor(x,z){const g=new T.Group();world.add(g);place(g,x,z);return g}
 function place(g,x,z){const n=new T.Vector3(x,Math.sqrt(100-x*x-z*z),z).normalize();const th=Math.acos(n.y),ph=Math.atan2(n.z,n.x),r=10.055+.10*Math.sin(th*3)*Math.sin(ph*3)**2;g.position.copy(n).multiplyScalar(r+.006);g.quaternion.setFromUnitVectors(up,n)}
 function normalize(model,height){model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),wrap=new T.Group(),scale=height/size.y;wrap.add(model);model.position.sub(new T.Vector3(center.x,box.min.y,center.z));wrap.scale.setScalar(scale);model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(o.material.roughness||0,.5)}}});return wrap}
 // Convert a world-space route tangent to the animal's local spherical frame.
 function face(a,dx,dz){const n=a.mount.position.clone().normalize(),v=new T.Vector3(dx,-(n.x*dx+n.z*dz)/n.y,dz);v.applyQuaternion(a.mount.quaternion.clone().invert());a.body.rotation.y=Math.atan2(v.x,v.z)}
 function cloneAnimal(source){const copy=source.clone(true),map=new Map();function pair(a,b){map.set(a,b);a.children.forEach((c,i)=>pair(c,b.children[i]))}pair(source,copy);source.traverse(o=>{if(o.isSkinnedMesh){const c=map.get(o);c.skeleton=o.skeleton.clone();c.skeleton.bones=o.skeleton.bones.map(b=>map.get(b));c.bind(c.skeleton,o.bindMatrix)}});return copy}
 const shore=snowShore;
 const ease=x=>x*x*(3-2*x);
 function penguinRoute(t,i){
  const duration=66+i*.7,q=(t+i*8.2)%duration,ph=.53+i*.11,edge=shore(ph),a=.59+(i%3)*.045;
  let th=a,phi=ph,state='idle',pitch=0,lift=0,water=0;
  if(q>=7&&q<23){state='walk';th=T.MathUtils.lerp(a,edge-.12,ease((q-7)/16))}
  else if(q>=23&&q<29){state='slide';th=T.MathUtils.lerp(edge-.12,edge-.025,ease((q-23)/6))}
  else if(q>=29&&q<31){state='dive';const u=(q-29)/2;th=T.MathUtils.lerp(edge-.025,edge+.105,ease(u));pitch=Math.PI/2*ease(u);lift=Math.sin(u*Math.PI)*.32;water=ease(u)}
  else if(q>=31&&q<47){state='swim';const u=(q-31)/16*Math.PI*6;phi=ph+.19*Math.sin(u);th=shore(phi)+.105+.15*(1-Math.cos(u));pitch=Math.PI/2;water=1;lift=.035*Math.sin(q*2.5)}
  else if(q>=47&&q<50){state='emerge';const u=(q-47)/3;th=T.MathUtils.lerp(edge+.105,edge-.025,ease(u));pitch=Math.PI/2*(1-ease(u));water=1-ease(u);lift=Math.sin(u*Math.PI)*.24}
  else if(q>=50){state='walk';th=T.MathUtils.lerp(edge-.025,a,ease((q-50)/(duration-50)))}
  return {x:10*Math.sin(th)*Math.cos(phi),z:10*Math.sin(th)*Math.sin(phi),state,pitch,lift,water};
 }
 function bearRig(scene){
  scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(scene),center=box.getCenter(new T.Vector3()),scale=1.02/(box.max.y-box.min.y),group=new T.Group(),parts=[];
  scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.translate(-center.x,-box.min.y,-center.z);g.scale(scale,scale,scale);const mesh=new T.Mesh(g,o.material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);parts.push({g,rest:g.attributes.position.array.slice()})});
  // This supplied bear has no skeleton. Soft lower-leg deformation leaves the torso intact.
  return {group,animate(t,walking,state){for(const {g,rest} of parts){const pos=g.attributes.position;for(let i=0;i<pos.count;i++){const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2],leg=1-T.MathUtils.smoothstep(y,.20,.53),phase=t*3.8+(x>0?Math.PI:0)+(z>0?Math.PI:0),stride=Math.sin(phase)*walking,head=T.MathUtils.smoothstep(z,.35,.65)*T.MathUtils.smoothstep(y,.42,.65),sniff=state==='sniff'?(.5+.5*Math.sin(t*1.1))*.09:0;pos.setXYZ(i,x+(state==='look-around'?Math.sin(t*.8)*.075*head:0),y+Math.max(0,stride)*.032*leg-sniff*head,z+stride*.095*leg+sniff*.3*head)}pos.needsUpdate=true;g.computeVertexNormals()}}};
 }
 const ready=Promise.all([
  loader.loadAsync('./assets/aurora/penguin.glb').then(gltf=>{for(let i=0;i<8;i++){
   const model=cloneAnimal(gltf.scene),mount=anchor(3,5),body=new T.Group(),visual=normalize(model,.49+(i%3)*.045);body.add(visual);mount.add(body);
   const mixer=new T.AnimationMixer(model),actions={};for(const [key,pattern] of Object.entries({idle:/iddle|idle/i,walk:/walk/i,slide:/slide/i}))actions[key]=mixer.clipAction(gltf.animations.find(a=>pattern.test(a.name)));
   actions.idle.play();const wake=new T.Mesh(new T.RingGeometry(.12,.15,24),new T.MeshBasicMaterial({color:0xb9eff4,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));wake.rotation.x=-Math.PI/2;mount.add(wake);
   actors.push({kind:'penguin',mount,body,visual,mixer,actions,index:i,state:'idle',action:'idle',wake,walking:false});
  }}),
  loader.loadAsync('./assets/aurora/polar_bear.glb').then(gltf=>{const mount=anchor(-3.6,1.8),rig=bearRig(gltf.scene),body=rig.group;mount.add(body);actors.push({kind:'polar-bear',mount,body,rig,walking:true})}),
  Promise.all(['sleigh','reindeer'].map(n=>loader.loadAsync('./assets/aurora/'+n+'.glb'))).then(([s,d])=>{const mount=anchor(-2,4.3),train=new T.Group();mount.add(train);const sleigh=normalize(s.scene,.75);train.add(sleigh);const deerRigs=[];for(let i=0;i<2;i++){const rig=createRunningDeer(d.scene),deer=rig.group;deerRigs.push(rig);deer.rotation.y=Math.PI;deer.position.set((i?1:-1)*.43,0,1.65);train.add(deer)}
   const rope=new T.MeshStandardMaterial({color:0x7c5940,roughness:1});
   for(const x of [-.43,.43]){const curve=new T.CatmullRomCurve3([new T.Vector3(x,.32,.55),new T.Vector3(x,.23,1),new T.Vector3(x,.39,1.65)]);train.add(new T.Mesh(new T.TubeGeometry(curve,20,.012,5,false),rope))}
   train.rotation.y=-.3;actors.push({kind:'sleigh',mount,body:train,deerRigs});
  })
 ]);
 let traffic=null;
 function avoid(a,x,z,dt,water=0){
  let desired=0;
  if(traffic&&water===0){const p=new T.Vector3(x,Math.sqrt(Math.max(0,100-x*x-z*z)),z),line=new T.Line3(traffic.start,traffic.end),closest=new T.Vector3();line.closestPointToPoint(p,true,closest);const distance=p.distanceTo(closest);desired=(1-T.MathUtils.smoothstep(distance,1.5,3.8))*1.7}
  a.avoid=T.MathUtils.damp(a.avoid||0,desired,3,dt);a.yielding=desired>.15;
  const radius=Math.hypot(x,z),scale=Math.max(.2,(radius-a.avoid)/radius);let nx=x*scale,nz=z*scale;
  // Small local spacing corrections keep neighbors from occupying the same spot.
  if(water===0)for(const other of actors){if(other===a||other.kind==='sleigh')continue;const dx=nx-other.mount.position.x,dz=nz-other.mount.position.z,d=Math.hypot(dx,dz),gap=a.kind==='polar-bear'||other.kind==='polar-bear'?.85:.42;if(d>.001&&d<gap){nx+=dx/d*(gap-d)*Math.min(1,dt*3);nz+=dz/d*(gap-d)*Math.min(1,dt*3)}}
  return {x:nx,z:nz};
 }
 let last=null,elapsed=0;
 return {ready,setTraffic(value){traffic=value},tick(t){const dt=last===null?0:Math.min(.06,Math.max(0,t-last));last=t;elapsed+=dt;
  for(const a of actors){
   if(a.kind==='penguin'){
    const r=penguinRoute(elapsed,a.index),next=penguinRoute(elapsed+.025,a.index),key=r.state==='walk'?'walk':r.state==='slide'?'slide':'idle';
    if(key!==a.action){a.actions[a.action].fadeOut(.65);a.actions[key].reset().fadeIn(.65).play();a.action=key}
    a.state=r.state;a.walking=key==='walk';a.mixer.update(dt*(r.state==='swim'?1.8:1));
    if(r.state==='swim'){for(const [name,sign] of [['Flipper1_l_010',1],['Flipper1_r_012',-1]]){const bone=a.visual.getObjectByName(name);if(bone)bone.rotation.z+=Math.sin(elapsed*10+a.index)*.24*sign}}
    const adjusted=avoid(a,r.x,r.z,dt,r.water);place(a.mount,adjusted.x,adjusted.z);const radius=T.MathUtils.lerp(a.mount.position.length(),9.62,r.water);a.mount.position.setLength(radius+r.lift);
    if(Math.hypot(next.x-r.x,next.z-r.z)>.00001){const old=a.body.rotation.y;face(a,next.x-r.x,next.z-r.z);const desired=a.body.rotation.y;a.body.rotation.y=old+Math.atan2(Math.sin(desired-old),Math.cos(desired-old))*Math.min(1,dt*(r.state==='swim'?14:5))}
    a.visual.rotation.x=T.MathUtils.damp(a.visual.rotation.x,r.pitch,7,dt);a.visual.position.y=0;
    const waddle=a.walking?Math.sin(a.actions.walk.time*2*Math.PI/a.actions.walk.getClip().duration)*.11:0;a.visual.rotation.z=T.MathUtils.damp(a.visual.rotation.z,waddle,12,dt);a.visual.position.z=-r.water*.23;
    a.wake.position.y=r.water*.38;
    a.wake.material.opacity=(r.state==='dive'||r.state==='emerge')?Math.sin(r.water*Math.PI)*.3:0;a.wake.scale.setScalar(1+((elapsed*1.7+a.index)%1)*1.6);
   }else if(a.kind==='polar-bear'){
    const phase=elapsed%60,segment=Math.floor(phase/12),local=phase%12,points=[[-3.9,2.8],[-4.2,4.2],[-2.8,5.0],[-2.4,3.9],[-3.1,3.0]],from=points[segment],to=points[(segment+1)%points.length],u=ease(Math.min(local/8,1));a.walking=local<8;a.state=a.walking?'amble':segment%2?'look-around':'sniff';
    const adjusted=avoid(a,T.MathUtils.lerp(from[0],to[0],u),T.MathUtils.lerp(from[1],to[1],u),dt);place(a.mount,adjusted.x,adjusted.z);
    const old=a.body.rotation.y;if(a.walking){face(a,to[0]-from[0],to[1]-from[1]);const desired=a.body.rotation.y;a.body.rotation.y=old+Math.atan2(Math.sin(desired-old),Math.cos(desired-old))*Math.min(1,dt*2)}
    const gait=a.walking?Math.sin(Math.PI*Math.min(local/8,1)):0;a.rig.animate(elapsed,gait,a.state);a.body.rotation.z=Math.sin(elapsed*2.8)*.015*gait;

   }
  }
 },state:()=>actors.map(a=>({kind:a.kind,height:a.kind==='penguin'?.49+(a.index%3)*.045:undefined,walking:a.walking,activity:a.state,yielding:!!a.yielding,position:a.mount.position.toArray(),heading:a.body.rotation.y})),actors};
}
