import * as T from './vendor/three.module.js';
import {createTeddy} from './teddy.js?v=16';
export function createRecapStage(host){
 const scene=new T.Scene(),renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;host.append(renderer.domElement);
 const camera=new T.PerspectiveCamera(35,1,.1,30);camera.position.set(2.3,2.1,3.7);camera.lookAt(0,.5,0);scene.add(new T.HemisphereLight(0xfff6df,0x829781,2.6));const light=new T.DirectionalLight(0xffe4bc,3);light.position.set(-3,5,3);scene.add(light);
 const teddy=createTeddy(scene),props=new T.Group();scene.add(props);let kind='moment',elapsed=0,frame=0,last=performance.now(),paused=false;
 function box(c,x,y,z,w,h,d){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);props.add(m);return m}
 function ball(c,x,y,z,r){const m=new T.Mesh(new T.SphereGeometry(r,20,16),new T.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);props.add(m);return m}
 function cylinder(c,x,y,z,r1,r2,h){const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,32),new T.MeshStandardMaterial({color:c,roughness:.75}));m.position.set(x,y,z);props.add(m);return m}
 function clear(){props.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});props.clear()}
 function show(e){clear();kind=e.kind;elapsed=0;teddy.setIdentity(e.actor);teddy.avatar.position.set(0,0,0);teddy.avatar.rotation.set(0,-.15,0);teddy.body.rotation.set(0,0,0);teddy.sleep(kind==='sleep');teddy.headphones(kind==='music');teddy.arms.forEach(a=>a.rotation.set(0,0,0));teddy.legs.forEach(a=>a.rotation.set(0,0,0));
 box(0xc6d3b2,0,-.045,0,2.4,.09,1.9);
 if(kind==='sleep'){box(0xbb9a71,0,.17,0,1.15,.3,1.4);box(0xf4ead6,0,.35,0,1.08,.08,1.35);box(0xfaf5e6,0,.43,-.48,.7,.16,.35);teddy.avatar.position.set(0,.54,.23);teddy.avatar.rotation.x=-Math.PI/2;box(0x99af96,0,.55,.27,1.09,.16,.73)}
 if(['read','music'].includes(kind)){box(0x829d85,0,.21,0,1.2,.4,.8);box(0x708f78,0,.57,-.37,1.2,.55,.13);teddy.avatar.position.y=.4;teddy.legs.forEach(a=>a.rotation.x=-1.15);if(kind==='read'){const b=box(0xf0e7cf,0,.86,.4,.45,.04,.3);b.rotation.x=.2;box(0x8b9e79,0,.83,.4,.48,.025,.32)}}
 if(['cook','eat','wash'].includes(kind)){box(0xbb9b70,0,.48,.55,1.05,.1,.55);for(const x of [-.4,.4])box(0xb69a73,x,.22,.55,.07,.45,.36);if(kind==='cook'){cylinder(0x536d63,0,.62,.53,.2,.17,.13);cylinder(0xd9b57d,0,.692,.53,.176,.176,.008);for(const x of [-.24,.24])box(0x536d63,x,.64,.53,.14,.045,.07);cylinder(0xfffaed,0,1.09,0,.17,.17,.09);cylinder(0xfffaed,0,1.17,0,.17,.15,.1);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(0xfffaed,Math.cos(a)*.09,1.24,Math.sin(a)*.09,.075)}}else if(kind==='eat'){box(0xf6ecdc,0,.55,.55,.46,.025,.3);ball(0xdca36d,0,.60,.55,.095)}else box(0xc8d9d5,0,.55,.55,.47,.08,.35)}
 if(kind==='garden'){box(0x8c7152,0,.04,.63,.95,.08,.5);for(const x of [-.3,0,.3]){box(0x788e55,x,.19,.6,.025,.28,.025);ball(0xe2bc96,x,.34,.6,.08)}}
 }
 function tick(now){frame=requestAnimationFrame(tick);const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused)elapsed+=dt;const t=elapsed;
 if(kind==='walk'){teddy.avatar.position.x=Math.sin(t*1.8)*.55;teddy.avatar.rotation.y=Math.cos(t*1.8)>0?1:-1;teddy.legs.forEach((a,i)=>a.rotation.x=Math.sin(t*9+i*Math.PI)*.4)}
 else if(kind==='cook'||kind==='wash'||kind==='garden'){teddy.arms.forEach((a,i)=>a.rotation.x=-.9+Math.sin(t*5+i)*.18);teddy.body.rotation.z=Math.sin(t*2)*.025}
 else if(kind==='eat'){teddy.arms[1].rotation.x=-.7-Math.sin(t*2)*.3}
 else if(kind==='music')teddy.body.rotation.z=Math.sin(t*2)*.06;
 else if(kind==='read')teddy.arms.forEach(a=>a.rotation.x=-.65+Math.sin(t)*.03);
 else if(kind==='moment')teddy.arms[1].rotation.z=-.5+Math.sin(t*3)*.12;
 renderer.render(scene,camera)}
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(host);resize();show({actor:0,kind:'moment'});frame=requestAnimationFrame(tick);
 return {show,pause(v){paused=v},dispose(){cancelAnimationFrame(frame);observer.disconnect();clear();scene.traverse(o=>{o.geometry?.dispose();for(const m of o.material?[].concat(o.material):[]){m.map?.dispose();m.bumpMap?.dispose();m.dispose()}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}};
}
