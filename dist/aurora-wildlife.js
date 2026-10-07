import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
export function createAuroraWildlife(world){
 const loader=new GLTFLoader(),actors=[],up=new T.Vector3(0,1,0);
 function anchor(x,z){const g=new T.Group();world.add(g);place(g,x,z);return g}
 function place(g,x,z){const n=new T.Vector3(x,Math.sqrt(100-x*x-z*z),z).normalize();g.position.copy(n).multiplyScalar(10.17);g.quaternion.setFromUnitVectors(up,n)}
 function normalize(model,height){model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),wrap=new T.Group(),scale=height/size.y;wrap.add(model);model.position.sub(new T.Vector3(center.x,box.min.y,center.z));wrap.scale.setScalar(scale);model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(o.material.roughness||0,.5)}}});return wrap}
 const ready=Promise.all([
  ...[0,1,2].map(async i=>{const gltf=await loader.loadAsync('./assets/aurora/penguin.glb'),mount=anchor(2.5+i*.55,4.7),body=normalize(gltf.scene,.55+i*.045);mount.add(body);const mixer=new T.AnimationMixer(gltf.scene),idle=mixer.clipAction(gltf.animations.find(a=>/iddle|idle/i.test(a.name))),walk=mixer.clipAction(gltf.animations.find(a=>/walk/i.test(a.name)));walk.play();actors.push({kind:'penguin',mount,body,mixer,idle,walk,index:i,walking:true});}),
  loader.loadAsync('./assets/aurora/polar_bear.glb').then(gltf=>{const mount=anchor(-4,1.8),body=normalize(gltf.scene,1.02);mount.add(body);body.rotation.y=.7;actors.push({kind:'polar-bear',mount,body})}),
  Promise.all(['sleigh','reindeer'].map(n=>loader.loadAsync('./assets/aurora/'+n+'.glb'))).then(([s,d])=>{const mount=anchor(-2,4.3),train=new T.Group();mount.add(train);const sleigh=normalize(s.scene,.75);train.add(sleigh);for(let i=0;i<2;i++){const deer=normalize(d.scene.clone(true),1.15);deer.rotation.y=Math.PI;deer.position.set((i?1:-1)*.43,0,1.65);train.add(deer)}
   const rope=new T.MeshStandardMaterial({color:0x7c5940,roughness:1});
   for(const x of [-.43,.43]){const curve=new T.CatmullRomCurve3([new T.Vector3(x,.32,.55),new T.Vector3(x,.23,1),new T.Vector3(x,.39,1.65)]);train.add(new T.Mesh(new T.TubeGeometry(curve,20,.012,5,false),rope))}
   train.rotation.y=-.3;actors.push({kind:'sleigh',mount,body:train});
  })
 ]);
 let last=0;
 return {ready,tick(t){const dt=Math.min(.06,Math.max(0,t-last));last=t;for(const a of actors){if(a.kind==='penguin'){const phase=(t+a.index*2.3)%22,walking=phase<13;if(walking!==a.walking){(walking?a.idle:a.walk).fadeOut(.5);(walking?a.walk:a.idle).reset().fadeIn(.5).play();a.walking=walking}a.mixer.update(dt);const u=Math.min(phase,13)/13*Math.PI*2,x=3.0+a.index*.48+Math.cos(u)*.42,z=4.6+Math.sin(u)*.33;place(a.mount,x,z);if(walking)a.body.rotation.y=Math.atan2(-Math.sin(u)*.42,Math.cos(u)*.33)}else if(a.kind==='polar-bear'){a.body.rotation.y=.7+Math.sin(t*.18)*.08;a.body.position.y=Math.sin(t*.7)*.007}}},state:()=>actors.map(a=>({kind:a.kind,height:a.kind==='penguin'?.55+a.index*.045:undefined,walking:a.walking})),actors};
}
