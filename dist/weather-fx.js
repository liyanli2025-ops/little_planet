import * as T from './vendor/three.module.js';
export function createWeather(scene,camera){
scene.add(camera);const layer=new T.Group();camera.add(layer);
let mode='sun',indoor=false,seed=32;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const count=700,data=Array.from({length:count},()=>({x:(rand()-.5)*14,y:(rand()-.5)*11,z:-4-rand()*12,s:rand(),phase:rand()*6.28}));
const rainGeo=new T.BufferGeometry(),rainPos=new Float32Array(count*6);rainGeo.setAttribute('position',new T.BufferAttribute(rainPos,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xd7edfa,transparent:true,opacity:.73,depthTest:false,depthWrite:false}));rain.renderOrder=100;layer.add(rain);
const snowGeo=new T.BufferGeometry(),snowPos=new Float32Array(count*3);snowGeo.setAttribute('position',new T.BufferAttribute(snowPos,3));
const snow=new T.Points(snowGeo,new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms:{pixelRatio:{value:Math.min(devicePixelRatio,1.75)}},vertexShader:'uniform float pixelRatio; void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(48.0/-p.z,2.5,8.)*pixelRatio;}',fragmentShader:'void main(){float d=length(gl_PointCoord-vec2(.5));float a=1.-smoothstep(.22,.5,d);if(a<.01)discard;gl_FragColor=vec4(.98,.99,1.,a*.9);}'}));snow.renderOrder=101;layer.add(snow);
function set(v,inRoom=false){mode=v;indoor=inRoom;rain.visible=!indoor&&v==='rain';snow.visible=!indoor&&v==='snow'}
set('sun');
return {set,tick(dt,t){if(indoor||!['rain','snow'].includes(mode))return;for(let i=0;i<count;i++){let p=data[i];p.y-=dt*(mode==='rain'?6.5+p.s*5:.45+p.s*.6);p.x+=dt*(mode==='rain'?.85:Math.sin(t*.7+p.phase)*.25);if(p.y<-5.5){p.y=5.5;p.x=(rand()-.5)*14}if(p.x>7)p.x=-7;if(mode==='rain'){let j=i*6,len=.12+p.s*.23;rainPos[j]=p.x;rainPos[j+1]=p.y;rainPos[j+2]=p.z;rainPos[j+3]=p.x-.055;rainPos[j+4]=p.y+len;rainPos[j+5]=p.z}else{snowPos[i*3]=p.x; snowPos[i*3+1]=p.y; snowPos[i*3+2]=p.z}}if(mode==='rain')rainGeo.attributes.position.needsUpdate=true;else snowGeo.attributes.position.needsUpdate=true},state(){return {mode,visible:!indoor&&['rain','snow'].includes(mode),particleCount:count}},dispose(){camera.remove(layer);rainGeo.dispose();snowGeo.dispose();rain.material.dispose();snow.material.dispose()}}
}
