import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {disposeCafeObject} from './cafe-food.js';

// Coordinates are angular around the actual planet, never a flat island lid.
// Broad low-frequency bays avoid pointed notches and abrupt coastline turns.
export const coastEdge=a=>1.04-.29*Math.cos(a-1.55)+.07*Math.sin(2*a+.3);
export function coastPoint(a,theta,lift=0){
 const edge=coastEdge(a),shore=T.MathUtils.smoothstep(theta,edge-.16,edge);
 const radius=17.8+.045*(1-shore),r=Math.sin(theta)*radius;
 const y=-18.25+Math.cos(theta)*radius;
 return new T.Vector3(Math.cos(a)*r,y+lift,Math.sin(a)*r);
}
export function buildMarine(root,seaMat,isDisposed=()=>false){
 const group=new T.Group();group.name='Spherical coast';root.add(group);
 const loader=new GLTFLoader(),url='./assets/coast/',ready=[],animals=[];
 const textureLoader=new T.TextureLoader();
 const texture=(file,color=false)=>{const t=textureLoader.load(url+file);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;return t};
 const sandMaterial=new T.MeshStandardMaterial({map:texture('sand-color.webp',true),bumpMap:texture('sand-height.png'),bumpScale:.018,vertexColors:true,roughness:.93});
 const positions=[],colors=[],uvs=[],indices=[],N=192,M=52;
 for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){
  const a=i/N*Math.PI*2,theta=j/M*coastEdge(a),p=coastPoint(a,theta);positions.push(...p.toArray());
  const wet=T.MathUtils.smoothstep(theta,coastEdge(a)-.12,coastEdge(a));
  const color=new T.Color(0xffefc8).lerp(new T.Color(0xb0a78b),wet*.7);
  colors.push(color.r,color.g,color.b);uvs.push(p.x/4,p.z/4);
  if(j<M&&i<N){const k=j*(N+1)+i;indices.push(k,k+1,k+N+1,k+1,k+N+2,k+N+1)}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
 const beach=new T.Mesh(geo,sandMaterial);beach.name='Continuous spherical beach';beach.receiveShadow=true;group.add(beach);
 function anchor(a,theta){const g=new T.Group(),p=coastPoint(a,theta,.015);g.position.copy(p);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),p.clone().sub(new T.Vector3(0,-18.25,0)).normalize());group.add(g);return g}
 function normalize(g,size){g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());const wrap=new T.Group();wrap.add(g);g.position.sub(new T.Vector3(c.x,b.min.y,c.z));wrap.scale.setScalar(size/Math.max(s.x,s.y,s.z));g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});return wrap}
 function load(file,apply){const task=loader.loadAsync(url+file).then(g=>{if(isDisposed()){disposeCafeObject(g.scene);return}apply(g)}).catch(e=>{group.userData.loadFailed=true;console.warn('Coast asset failed:',file,e.message)});ready.push(task)}
 const names=['Rock_Medium_1','Rock_Medium_2','Rock_Medium_3','Grass_Common_Short','Grass_Wispy_Tall','Bush_Common','Fern_1'];
 names.forEach((name,index)=>load(name+'.gltf',g=>{
  const count=index<3?9:index<5?22:8;
  for(let i=0;i<count;i++){
   // Leave the broad foreground sand open; vegetation gathers in dune clusters.
   const a=.3+(i*2.399+index*.9)%(Math.PI*2),theta=.61+(i%4)*.067;
   if(theta>coastEdge(a)-.23)continue;
   const holder=anchor(a,theta),size=index<3?.6+(i%3)*.34:index<5?.55+(i%3)*.16:1.0+(i%2)*.35;
   const model=normalize(g.scene.clone(true),size);model.rotation.y=i*1.7;holder.add(model);
  }
 }));
 // Reuse only the source palm geometry, not its flat ground or house.
 load('palm.glb',g=>{
  g.scene.updateMatrixWorld(true);const palm=new T.Group();
  g.scene.traverse(m=>{if(m.isMesh&&(/CoconutLeave1/.test(m.name)||m.name==='Tree_GentengTralisWarna_0')){const clone=new T.Mesh(m.geometry.clone().applyMatrix4(m.matrixWorld),m.material.clone());clone.material.color.set(/Coconut/.test(m.name)?0x71844b:0x957350);palm.add(clone)}});
  for(const [a,theta,h]of [[2.65,.67,3.4],[2.92,.75,3.8],[3.18,.70,3.0],[4.5,.67,3.6],[4.75,.75,3.1],[.02,.74,3.2],[.18,.85,3.7]]){const holder=anchor(a,theta);holder.add(normalize(palm.clone(true),h))}
  disposeCafeObject(g.scene);
 });
 // Shallow turquoise water follows precisely the same angular coastline.
 const time={value:0};seaMat.roughness=.25;seaMat.metalness=.08;
 seaMat.onBeforeCompile=shader=>{
  shader.uniforms.coastTime=time;
  shader.vertexShader='varying vec3 coastPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncoastPosition=position;');
  shader.fragmentShader=`uniform float coastTime;varying vec3 coastPosition;
  float coastNoise(vec3 p){return sin(p.x+sin(p.z*.73))*sin(p.z*.82+p.y*.51);}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
   float wave=coastNoise(coastPosition*3.4+vec3(coastTime*.42,0.,coastTime*.23))*.008+coastNoise(coastPosition*8.1-vec3(coastTime*.31))*.003;
   vec3 q0=dFdx(vViewPosition),q1=dFdy(vViewPosition);
   vec3 grad=cross(q1,normal)*dFdx(wave)+cross(normal,q0)*dFdy(wave);
   normal=normalize(normal+grad/max(abs(dot(q0,cross(q1,normal))),.0001));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float a=atan(coastPosition.z,coastPosition.x);
   float theta=acos(clamp(coastPosition.y/17.8,-1.,1.));
   float edge=1.04-.29*cos(a-1.55)+.07*sin(2.*a+.3);
   float shallow=1.-smoothstep(0.,.26,theta-edge);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.20,.65,.57),shallow*.65);
   float caustic=pow(max(0.,coastNoise(coastPosition*5.+vec3(coastTime*.3))),12.);
   diffuseColor.rgb+=shallow*caustic*.055;
   float fresnel=pow(1.-abs(dot(normalize(vNormal),normalize(vViewPosition))),4.);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.60,.77,.78),fresnel*.25);`);
 };
 const surf=[];
 for(let b=0;b<3;b++){
  const g=new T.BufferGeometry(),p=new Float32Array((N+1)*2*3),ix=[];
  g.setAttribute('position',new T.BufferAttribute(p,3));for(let i=0;i<N;i++){const k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2)}g.setIndex(ix);
  const mat=new T.MeshBasicMaterial({color:b===0?0xa0d9c4:0xf5f8e9,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false});group.add(new T.Mesh(g,mat));surf.push({g,p,mat});
 }
 for(let i=0;i<3;i++){
  const a=[.75,2.05,3.75][i],theta=coastEdge(a)+.19,p=new T.Vector3(Math.sin(theta)*Math.cos(a),Math.cos(theta),Math.sin(theta)*Math.sin(a));
  const base=new T.Group();base.position.copy(p).multiplyScalar(17.8).add(new T.Vector3(0,-18.25,0));base.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),p);group.add(base);
  const d=new T.Group();base.add(d);const rings=[];
  for(let j=0;j<2;j++){const ring=new T.Mesh(new T.RingGeometry(.6,.65,48),new T.MeshBasicMaterial({color:0xf0fff5,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;base.add(ring);rings.push(ring)}
  const dropsGeo=new T.BufferGeometry();dropsGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(18*3),3));const drops=new T.Points(dropsGeo,new T.PointsMaterial({color:0xe5fff7,size:.075,transparent:true,opacity:.75,depthWrite:false}));base.add(drops);
  const animal={d,rings,drops,phase:i*4.4,period:15+i*2,mixer:null};animals.push(animal);
  load('dolphin_animated.glb',g=>{const model=normalize(g.scene,2.5);d.add(model);animal.mixer=new T.AnimationMixer(g.scene);for(const clip of g.animations)animal.mixer.clipAction(clip).play()});
 }
 function tick(t){
  time.value=t;
  surf.forEach(({g,p,mat},b)=>{
   const phase=(t*.16+b/3)%1,inrush=Math.sin(phase*Math.PI);mat.opacity=(b===0?.18:.6)*inrush;
   for(let i=0;i<=N;i++){
    const a=i/N*Math.PI*2,theta=coastEdge(a)+.025-inrush*.045+.004*Math.sin(a*23+t);
    for(let j=0;j<2;j++){const th=theta+j*(b===0?.02:.003),v=coastPoint(a,th,.04);const k=(i*2+j)*3;p[k]=v.x;p[k+1]=v.y;p[k+2]=v.z}
   }g.attributes.position.needsUpdate=true;g.computeBoundingSphere();
  });
  for(const {d,rings,drops,phase,period,mixer}of animals){
   const q=(t+phase)%period,u=q/4;d.visible=q<4;mixer?.setTime(t);
   if(d.visible){d.position.set(0,-.7+Math.sin(u*Math.PI)*2.7,(u-.5)*3.5);d.rotation.x=-Math.atan2(Math.cos(u*Math.PI)*2.7*Math.PI,3.5);d.rotation.z=Math.sin(u*Math.PI*2)*.13}
   const splash=q<1?q:q>3.1&&q<4.5?q-3.1:-1;
   drops.visible=splash>=0&&splash<1.2;const dp=drops.geometry.attributes.position;
   for(let j=0;j<18;j++){const a=j/18*Math.PI*2;dp.setXYZ(j,Math.cos(a)*splash*.9,Math.max(0,Math.sin(splash*Math.PI/1.2)*(1+j%3*.25)),(q<1?-1.5:1.5)+Math.sin(a)*splash*.9)}dp.needsUpdate=true;drops.geometry.computeBoundingSphere();
   rings.forEach((m,i)=>{m.visible=splash>=0;m.material.opacity=Math.max(0,.65-splash*.45);m.scale.setScalar(.5+Math.max(0,splash)*2+i*.3);m.position.z=q<1?-1.5:1.5});
  }
 }
 return {tick,group,ready:Promise.all(ready)};
}
