import * as T from './vendor/three.module.js';
import {cafeSolar} from './cafe-solar.js';
// World-space geometry, not a window texture. The detail ocean is hidden in globe view.
export function createCafeSky(scene,horizon,sun,ambient){
 const uniforms={top:{value:new T.Color()},edge:{value:new T.Color()},middle:{value:new T.Color()},direction:{value:new T.Vector3()},time:{value:0},light:{value:1},warm:{value:0}};
 const dome=new T.Mesh(new T.SphereGeometry(950,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,uniforms,vertexShader:'varying vec3 directionView;void main(){directionView=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform vec3 top,edge,middle,direction;uniform float light,warm;varying vec3 directionView;
 void main(){vec3 d=normalize(directionView);float h=max(0.,d.y);vec3 c=mix(edge,middle,smoothstep(0.,.25,h));c=mix(c,top,smoothstep(.18,.85,h));float glow=pow(max(0.,dot(d,direction)),22.)*light;c+=vec3(.32,.15,.055)*glow*(.15+warm*.55);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));dome.name='Spatial sky dome';dome.frustumCulled=false;scene.add(dome);
 const disc=new T.Mesh(new T.SphereGeometry(12,28,18),new T.MeshBasicMaterial({color:0xffeed0,toneMapped:false}));disc.name='Sun';scene.add(disc);
 const cloudMat=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
 const clouds=new T.InstancedMesh(new T.SphereGeometry(1,12,8),cloudMat,144);clouds.name='Volumetric cloud lobes';clouds.frustumCulled=false;scene.add(clouds);const transform=new T.Object3D();
 const cloudShade={value:0};cloudMat.onBeforeCompile=shader=>{shader.uniforms.cloudWarm=cloudShade;shader.vertexShader='varying float cloudY;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncloudY=normal.y;');shader.fragmentShader='varying float cloudY;uniform float cloudWarm;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb *= mix(vec3(1.),mix(vec3(.40,.17,.39),vec3(1.,.64,.36),smoothstep(-.65,.75,cloudY)),cloudWarm);')};
 const starPositions=[];for(let i=0;i<320;i++){const a=i*2.399963,up=.025+.965*((i*.618034)%1),r=Math.sqrt(1-up*up)*650;starPositions.push(Math.cos(a)*r,up*650,Math.sin(a)*r)}
 const stars=new T.Points(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(starPositions,3)),new T.PointsMaterial({color:0xffefd6,size:3,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));stars.name='Island stars';scene.add(stars);
 const dayTop=new T.Color(0x72b8d6),dayEdge=new T.Color(0xa8d6dd),nightTop=new T.Color(0x101e35),nightEdge=new T.Color(0x344c64),orange=new T.Color(0xeeb38b),rainTop=new T.Color(0x718895),rainEdge=new T.Color(0xb0bdc0);
 function tick(time,wet){const solar=cafeSolar(time),d=solar.direction,t=time/1000;
 stars.material.opacity=wet?0:Math.max(0,1-solar.daylight*3-solar.twilight);stars.rotation.y=t*.00001;uniforms.time.value=t%100000;uniforms.direction.value.set(...d);uniforms.light.value=wet?0:solar.daylight;uniforms.warm.value=solar.twilight;
 uniforms.top.value.copy(nightTop).lerp(dayTop,solar.daylight);uniforms.edge.value.copy(nightEdge).lerp(dayEdge,solar.daylight);uniforms.middle.value.copy(uniforms.edge.value).lerp(uniforms.top.value,.45);
 if(!wet){const warmth=solar.twilight;uniforms.edge.value.lerp(new T.Color(0xffa24c),warmth);uniforms.middle.value.lerp(new T.Color(solar.hour<12?0xef9cac:0xe96f91),warmth);uniforms.top.value.lerp(new T.Color(0x60528f),warmth*.9)}else{uniforms.top.value.lerp(rainTop,.65);uniforms.edge.value.lerp(rainEdge,.65);uniforms.middle.value.copy(uniforms.edge.value).lerp(uniforms.top.value,.5)}
 disc.position.set(...d).multiplyScalar(700);disc.visible=!wet&&solar.above;disc.material.color.set(solar.twilight>.2?0xffc073:0xffeed0);
 sun.position.set(...d).multiplyScalar(30);sun.intensity=wet?.45*solar.daylight:2.6*solar.daylight;sun.color.set(0xffedce).lerp(new T.Color(0xffa36a),solar.twilight);ambient.intensity=.75+(wet?.55:.85)*solar.daylight;

 cloudShade.value=wet?0:solar.twilight;cloudMat.color.set(wet?0xa2aeb3:0xfff5eb);cloudMat.emissive.copy(uniforms.edge.value).multiplyScalar(wet?.15:.25+solar.twilight*.4);
 for(let i=0;i<144;i++){const cluster=Math.floor(i/8),l=i%8,a=cluster/18*Math.PI*2+t*.0022,r=135+(cluster%3)*35;transform.position.set(Math.cos(a)*r+(l-3.5)*4.8,21+(cluster%5)*7+Math.sin(l*1.7+cluster)*1.2,Math.sin(a)*r+Math.cos(l*1.3)*4);transform.scale.set(6+(l%3)*2,1.0+(l%3)*.55,3.2+(l%2));transform.updateMatrix();clouds.setMatrixAt(i,transform.matrix)}clouds.instanceMatrix.needsUpdate=true;
 return solar;
 }
 return {tick,uniforms};
}
