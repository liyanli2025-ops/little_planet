import * as T from './vendor/three.module.js';
import {cafeSolar} from './cafe-solar.js';
// World-space geometry, not a window texture. The detail ocean is hidden in globe view.
export function createCafeSky(scene,horizon,sun,ambient){
 const uniforms={top:{value:new T.Color()},edge:{value:new T.Color()},direction:{value:new T.Vector3()},time:{value:0},light:{value:1},warm:{value:0}};
 const dome=new T.Mesh(new T.SphereGeometry(950,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,vertexShader:'varying vec3 directionView;void main(){directionView=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform vec3 top,edge,direction;uniform float light,warm;varying vec3 directionView;
 void main(){vec3 d=normalize(directionView);vec3 c=mix(edge,top,smoothstep(0.,.75,max(0.,d.y)));float glow=pow(max(0.,dot(d,direction)),22.)*light;c+=vec3(.32,.15,.055)*glow*(.3+warm);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));dome.name='Spatial sky dome';dome.frustumCulled=false;scene.add(dome);
 const disc=new T.Mesh(new T.SphereGeometry(12,28,18),new T.MeshBasicMaterial({color:0xffeed0,toneMapped:false}));disc.name='Sun';scene.add(disc);
 const cloudMat=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
 const clouds=new T.InstancedMesh(new T.SphereGeometry(1,12,8),cloudMat,72);clouds.name='Volumetric cloud lobes';clouds.frustumCulled=false;scene.add(clouds);const transform=new T.Object3D();
 const dayTop=new T.Color(0x72b8d6),dayEdge=new T.Color(0xa8d6dd),nightTop=new T.Color(0x101e35),nightEdge=new T.Color(0x344c64),orange=new T.Color(0xeeb38b),rainTop=new T.Color(0x718895),rainEdge=new T.Color(0xb0bdc0);
 function tick(time,wet){const solar=cafeSolar(time),d=solar.direction,t=time/1000;
 uniforms.time.value=t%100000;uniforms.direction.value.set(...d);uniforms.light.value=wet?0:solar.daylight;uniforms.warm.value=solar.twilight;
 uniforms.top.value.copy(nightTop).lerp(dayTop,solar.daylight);uniforms.edge.value.copy(nightEdge).lerp(dayEdge,solar.daylight);
 if(!wet)uniforms.edge.value.lerp(orange,solar.twilight*.8);else{uniforms.top.value.lerp(rainTop,.65);uniforms.edge.value.lerp(rainEdge,.65)}
 disc.position.set(...d).multiplyScalar(700);disc.visible=!wet&&solar.above;disc.material.color.set(solar.twilight>.2?0xffc073:0xffeed0);
 sun.position.set(...d).multiplyScalar(30);sun.intensity=wet?.45*solar.daylight:2.6*solar.daylight;sun.color.set(0xffedce).lerp(new T.Color(0xffa36a),solar.twilight);ambient.intensity=.75+(wet?.55:.85)*solar.daylight;

 cloudMat.color.set(wet?0xa2aeb3:0xf4f0e4);cloudMat.emissive.copy(uniforms.edge.value).multiplyScalar(.4);
 for(let i=0;i<72;i++){const cluster=Math.floor(i/6),l=i%6,a=cluster/12*Math.PI*2+t*.0007,r=145+(cluster%3)*28;transform.position.set(Math.cos(a)*r+(l-2.5)*4,34+(cluster%4)*8+Math.sin(l*1.7)*2,Math.sin(a)*r+Math.cos(l)*4);transform.scale.set(6+(l%3)*1.5,2.8+(l%2)*1.5,4.5);transform.updateMatrix();clouds.setMatrixAt(i,transform.matrix)}clouds.instanceMatrix.needsUpdate=true;
 return solar;
 }
 return {tick,uniforms};
}
