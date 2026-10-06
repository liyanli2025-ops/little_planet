import * as T from './vendor/three.module.js';
import {createCafeClouds} from './cafe-clouds.js';
import {cafeSolar} from './cafe-solar.js';
// World-space geometry, not a window texture. The detail ocean is hidden in globe view.
export function createCafeSky(scene,horizon,sun,ambient){
 const uniforms={top:{value:new T.Color()},edge:{value:new T.Color()},middle:{value:new T.Color()},direction:{value:new T.Vector3()},time:{value:0},moonDirection:{value:new T.Vector3()},moonLight:{value:0},light:{value:1},warm:{value:0}};
 const dome=new T.Mesh(new T.SphereGeometry(950,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,uniforms,vertexShader:'varying vec3 directionView;void main(){directionView=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform vec3 top,edge,middle,direction;uniform float light,warm;varying vec3 directionView;
 void main(){vec3 d=normalize(directionView);float h=max(0.,d.y);vec3 c=mix(edge,middle,smoothstep(0.,.25,h));c=mix(c,top,smoothstep(.18,.85,h));float glow=pow(max(0.,dot(d,direction)),22.)*light;c+=vec3(.32,.15,.055)*glow*(.15+warm*.55);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));dome.name='Spatial sky dome';dome.frustumCulled=false;scene.add(dome);
 const disc=new T.Mesh(new T.SphereGeometry(12,28,18),new T.MeshBasicMaterial({color:0xffeed0,toneMapped:false}));disc.name='Sun';scene.add(disc);
 const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=256;
 const hc=haloCanvas.getContext('2d'),hg=hc.createRadialGradient(128,128,0,128,128,128);
 [[0,1],[.10,.8],[.18,.42],[.34,.14],[.65,.035],[1,0]].forEach(([r,a])=>hg.addColorStop(r,`rgba(255,230,185,${a})`));hc.fillStyle=hg;hc.fillRect(0,0,256,256);
 const halo=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(haloCanvas),color:0xffeed1,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.name='Soft solar aureole';halo.scale.set(155,155,1);scene.add(halo);
 // A spatial crescent moon follows the island's stylized Beijing-time night cycle.
 const moon=new T.Mesh(new T.SphereGeometry(25,48,32),new T.ShaderMaterial({transparent:true,uniforms:{fade:{value:0},lightDir:{value:new T.Vector3(.92,.12,-.55).normalize()}},vertexShader:'varying vec3 n;void main(){n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float fade;uniform vec3 lightDir;varying vec3 n;void main(){vec3 v=normalize(n);float lit=smoothstep(-.04,.14,dot(v,lightDir));float mottling=.96+.04*sin(v.x*43.)*sin(v.y*37.);vec3 c=mix(vec3(.05,.08,.13),vec3(1.,.88,.66)*mottling,lit);gl_FragColor=vec4(c,fade);}',depthWrite:false}));moon.name='Island moon';scene.add(moon);
 const clouds=createCafeClouds(scene,uniforms);
 let seed=7321;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};const starPositions=[];for(let i=0;i<900;i++){const a=random()*Math.PI*2,up=.025+.965*random(),r=Math.sqrt(1-up*up)*650;starPositions.push(Math.cos(a)*r,up*650,Math.sin(a)*r)}
 const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=32;const ctx=starCanvas.getContext('2d'),gradient=ctx.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.22,'rgba(255,255,255,1)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
 const stars=new T.Points(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(starPositions,3)),new T.PointsMaterial({color:0xffefd6,map:new T.CanvasTexture(starCanvas),size:4,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));stars.name='Island stars';scene.add(stars);
 const dayTop=new T.Color(0x72b8d6),dayEdge=new T.Color(0xa8d6dd),nightTop=new T.Color(0x101e35),nightEdge=new T.Color(0x344c64),orange=new T.Color(0xeeb38b),rainTop=new T.Color(0x718895),rainEdge=new T.Color(0xb0bdc0);
 function tick(time,wet){const solar=cafeSolar(time),d=solar.direction,t=time/1000;
 const nightHour=solar.hour<12?solar.hour+24:solar.hour,moonProgress=T.MathUtils.clamp((nightHour-18)/12,0,1),moonAz=.34+(moonProgress-1/3)*1.8,moonElevation=.12+Math.sin(moonProgress*Math.PI)*.8;moon.position.set(Math.sin(moonAz)*Math.cos(moonElevation),Math.sin(moonElevation),Math.cos(moonAz)*Math.cos(moonElevation)).multiplyScalar(620);uniforms.moonDirection.value.copy(moon.position).normalize();moon.lookAt(0,0,0);moon.material.uniforms.fade.value=wet?0:1-solar.daylight;moon.visible=moon.material.uniforms.fade.value>.03;uniforms.moonLight.value=moon.material.uniforms.fade.value;
 stars.material.opacity=wet?0:Math.max(0,1-solar.daylight*3-solar.twilight);stars.rotation.y=t*.00001;uniforms.time.value=t%100000;uniforms.direction.value.set(...d);uniforms.light.value=wet?0:solar.daylight;uniforms.warm.value=solar.twilight;
 uniforms.top.value.copy(nightTop).lerp(dayTop,solar.daylight);uniforms.edge.value.copy(nightEdge).lerp(dayEdge,solar.daylight);uniforms.middle.value.copy(uniforms.edge.value).lerp(uniforms.top.value,.45);
 if(!wet){const warmth=solar.twilight;uniforms.edge.value.lerp(new T.Color(0xffa24c),warmth);uniforms.middle.value.lerp(new T.Color(solar.hour<12?0xef9cac:0xe96f91),warmth);uniforms.top.value.lerp(new T.Color(0x60528f),warmth*.9)}else{uniforms.top.value.lerp(rainTop,.65);uniforms.edge.value.lerp(rainEdge,.65);uniforms.middle.value.copy(uniforms.edge.value).lerp(uniforms.top.value,.5)}
 disc.position.set(...d).multiplyScalar(700);disc.visible=!wet&&solar.above;disc.material.color.set(solar.twilight>.2?0xffc073:0xffeed0);
 halo.position.copy(disc.position);halo.visible=disc.visible;halo.material.opacity=.65+solar.twilight*.25;halo.material.color.set(solar.twilight>.2?0xffad69:0xffeed1);halo.scale.setScalar(155+solar.twilight*55);
 sun.position.set(...d).multiplyScalar(30);sun.intensity=wet?.45*solar.daylight:2.6*solar.daylight;sun.color.set(0xffedce).lerp(new T.Color(0xffa36a),solar.twilight);ambient.intensity=1.0+(wet?.55:.85)*solar.daylight;

 clouds.tick(time,solar,wet);
 return solar;
 }
 return {tick,uniforms};
}
