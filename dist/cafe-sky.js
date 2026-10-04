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
 const disc=new T.Mesh(new T.SphereGeometry(8,28,18),new T.MeshBasicMaterial({color:0xffeed0,toneMapped:false}));disc.name='Sun';scene.add(disc);
 const cloudMat=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
 const clouds=new T.InstancedMesh(new T.SphereGeometry(1,12,8),cloudMat,72);clouds.name='Volumetric cloud lobes';clouds.frustumCulled=false;scene.add(clouds);const transform=new T.Object3D();
 const oceanUniforms={...uniforms,deep:{value:new T.Color(0x267e91)}};
 const ocean=new T.Mesh(new T.PlaneGeometry(1200,1200,192,192).rotateX(-Math.PI/2),new T.ShaderMaterial({uniforms:oceanUniforms,vertexShader:`uniform float time;varying vec3 world;varying vec3 waveNormal;
 void main(){vec3 p=position;float a=p.x*.19+p.z*.13+time*.8,b=p.x*.07-p.z*.23-time*.6;
 p.y+=sin(a)*.16+sin(b)*.09;waveNormal=normalize(vec3(-cos(a)*.0304-cos(b)*.0063,1.,-cos(a)*.0208+cos(b)*.0207));world=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,fragmentShader:`uniform vec3 deep,edge,top,direction;uniform float time,light,warm;varying vec3 world,waveNormal;
 void main(){vec3 view=normalize(cameraPosition-world);vec3 n=normalize(waveNormal+vec3(sin(world.z*.65+world.x*.37+time)*.045,0.,cos(world.x*.73-world.z*.29-time)*.045));float fresnel=pow(1.-max(0.,dot(view,n)),3.);vec3 c=mix(deep,edge,.12+fresnel*.43);vec3 halfway=normalize(view+direction);float glint=pow(max(0.,dot(n,halfway)),180.);c+=mix(vec3(1.,.9,.65),vec3(1.,.4,.12),warm)*glint*light*2.;c=mix(c,edge,smoothstep(280.,590.,length(world.xz))*.62);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));ocean.name='Displaced 3D ocean';ocean.position.y=-3;ocean.frustumCulled=false;horizon.add(ocean);
 const dayTop=new T.Color(0x72b8d6),dayEdge=new T.Color(0xd6e8dc),nightTop=new T.Color(0x101e35),nightEdge=new T.Color(0x344c64),orange=new T.Color(0xeeb38b),rainTop=new T.Color(0x718895),rainEdge=new T.Color(0xb0bdc0);
 function tick(time,wet){const solar=cafeSolar(time),d=solar.direction,t=time/1000;
 uniforms.time.value=t%100000;uniforms.direction.value.set(...d);uniforms.light.value=wet?0:solar.daylight;uniforms.warm.value=solar.twilight;
 uniforms.top.value.copy(nightTop).lerp(dayTop,solar.daylight);uniforms.edge.value.copy(nightEdge).lerp(dayEdge,solar.daylight);
 if(!wet)uniforms.edge.value.lerp(orange,solar.twilight*.8);else{uniforms.top.value.lerp(rainTop,.65);uniforms.edge.value.lerp(rainEdge,.65)}
 disc.position.set(...d).multiplyScalar(700);disc.visible=!wet&&solar.above;disc.material.color.set(solar.twilight>.2?0xffc073:0xffeed0);
 sun.position.set(...d).multiplyScalar(30);sun.intensity=wet?.45*solar.daylight:2.6*solar.daylight;sun.color.set(0xffedce).lerp(new T.Color(0xffa36a),solar.twilight);ambient.intensity=.75+(wet?.55:.85)*solar.daylight;
 oceanUniforms.deep.value.set(0x183947).lerp(new T.Color(wet?0x577d88:0x267e91),solar.daylight);
 cloudMat.color.set(wet?0xa2aeb3:0xf4f0e4);cloudMat.emissive.copy(uniforms.edge.value).multiplyScalar(.4);
 for(let i=0;i<72;i++){const cluster=Math.floor(i/6),l=i%6,a=cluster/12*Math.PI*2+t*.0007,r=145+(cluster%3)*28;transform.position.set(Math.cos(a)*r+(l-2.5)*4,34+(cluster%4)*8+Math.sin(l*1.7)*2,Math.sin(a)*r+Math.cos(l)*4);transform.scale.set(6+(l%3)*1.5,2.8+(l%2)*1.5,4.5);transform.updateMatrix();clouds.setMatrixAt(i,transform.matrix)}clouds.instanceMatrix.needsUpdate=true;
 return solar;
 }
 return {tick,uniforms};
}
