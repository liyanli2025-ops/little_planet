import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
export function createAuroraWildlife(world){
 const loader=new GLTFLoader(),actors=[],up=new T.Vector3(0,1,0);
 function anchor(x,z){const g=new T.Group();world.add(g);place(g,x,z);return g}
 function place(g,x,z){const n=new T.Vector3(x,Math.sqrt(100-x*x-z*z),z).normalize();const th=Math.acos(n.y),ph=Math.atan2(n.z,n.x),r=10.055+.10*Math.sin(th*3)*Math.sin(ph*3)**2;g.position.copy(n).multiplyScalar(r+.006);g.quaternion.setFromUnitVectors(up,n)}
 function normalize(model,height){model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),wrap=new T.Group(),scale=height/size.y;wrap.add(model);model.position.sub(new T.Vector3(center.x,box.min.y,center.z));wrap.scale.setScalar(scale);model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(o.material.roughness||0,.5)}}});return wrap}
 // Convert a world-space route tangent to the animal's local spherical frame.
 function face(a,dx,dz){const n=a.mount.position.clone().normalize(),v=new T.Vector3(dx,-(n.x*dx+n.z*dz)/n.y,dz);v.applyQuaternion(a.mount.quaternion.clone().invert());a.body.rotation.y=Math.atan2(v.x,v.z)}
 function bearRig(scene){
  scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(scene),center=box.getCenter(new T.Vector3()),scale=1.02/(box.max.y-box.min.y),group=new T.Group(),parts=[];
  scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.translate(-center.x,-box.min.y,-center.z);g.scale(scale,scale,scale);const mesh=new T.Mesh(g,o.material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);parts.push({g,rest:g.attributes.position.array.slice()})});
  // This supplied bear has no skeleton. Soft lower-leg deformation leaves the torso intact.
  return {group,animate(t,walking){for(const {g,rest} of parts){const pos=g.attributes.position;for(let i=0;i<pos.count;i++){const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2],leg=1-T.MathUtils.smoothstep(y,.20,.53),phase=t*3.8+(x>0?Math.PI:0)+(z>0?Math.PI:0),stride=walking?Math.sin(phase):0,head=T.MathUtils.smoothstep(z,.35,.65)*T.MathUtils.smoothstep(y,.42,.65),sniff=walking?0:(.5+.5*Math.sin(t*1.5))*.045;pos.setXYZ(i,x,y+Math.max(0,stride)*.032*leg-sniff*head,z+stride*.095*leg+sniff*.3*head)}pos.needsUpdate=true;g.computeVertexNormals()}}};
 }
 const ready=Promise.all([
  ...[0,1,2].map(async i=>{const gltf=await loader.loadAsync('./assets/aurora/penguin.glb'),mount=anchor(2.5+i*.55,4.7),body=normalize(gltf.scene,.55+i*.045);mount.add(body);const mixer=new T.AnimationMixer(gltf.scene),idle=mixer.clipAction(gltf.animations.find(a=>/iddle|idle/i.test(a.name))),walk=mixer.clipAction(gltf.animations.find(a=>/walk/i.test(a.name)));walk.play();actors.push({kind:'penguin',mount,body,mixer,idle,walk,index:i,walking:true});}),
  loader.loadAsync('./assets/aurora/polar_bear.glb').then(gltf=>{const mount=anchor(-3.6,1.8),rig=bearRig(gltf.scene),body=rig.group;mount.add(body);actors.push({kind:'polar-bear',mount,body,rig,walking:true})}),
  Promise.all(['sleigh','reindeer'].map(n=>loader.loadAsync('./assets/aurora/'+n+'.glb'))).then(([s,d])=>{const mount=anchor(-2,4.3),train=new T.Group();mount.add(train);const sleigh=normalize(s.scene,.75);train.add(sleigh);for(let i=0;i<2;i++){const deer=normalize(d.scene.clone(true),1.15);deer.rotation.y=Math.PI;deer.position.set((i?1:-1)*.43,0,1.65);train.add(deer)}
   const rope=new T.MeshStandardMaterial({color:0x7c5940,roughness:1});
   for(const x of [-.43,.43]){const curve=new T.CatmullRomCurve3([new T.Vector3(x,.32,.55),new T.Vector3(x,.23,1),new T.Vector3(x,.39,1.65)]);train.add(new T.Mesh(new T.TubeGeometry(curve,20,.012,5,false),rope))}
   train.rotation.y=-.3;actors.push({kind:'sleigh',mount,body:train});
  })
 ]);
 let last=null,elapsed=0;
 return {ready,tick(t){const dt=last===null?0:Math.min(.06,Math.max(0,t-last));last=t;elapsed+=dt;
  for(const a of actors){
   if(a.kind==='penguin'){
    const phase=(elapsed+a.index*2.3)%26,walking=phase<17;
    if(walking!==a.walking){(walking?a.idle:a.walk).fadeOut(.5);(walking?a.walk:a.idle).reset().fadeIn(.5).play();a.walking=walking}
    a.mixer.update(dt);
    const u=Math.min(phase,17)/17*Math.PI*2,x=2.3+a.index*.9+Math.cos(u)*.25,z=4.6+(a.index%2)*.7+Math.sin(u)*.23;
    place(a.mount,x,z);if(walking)face(a,-Math.sin(u)*.25,Math.cos(u)*.23);
   }else if(a.kind==='polar-bear'){
    const phase=elapsed%38,u=Math.min(phase,28)/28*Math.PI*2;a.walking=phase<28;
    place(a.mount,-3.7+Math.cos(u)*.65,3.1+Math.sin(u)*.55);
    if(a.walking)face(a,-Math.sin(u)*.65,Math.cos(u)*.55);
    a.rig.animate(elapsed,a.walking);
   }
  }
 },state:()=>actors.map(a=>({kind:a.kind,height:a.kind==='penguin'?.55+a.index*.045:undefined,walking:a.walking,position:a.mount.position.toArray(),heading:a.body.rotation.y})),actors};
}
