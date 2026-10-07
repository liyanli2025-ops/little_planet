import {createAuroraWildlife} from './aurora-wildlife.js';
import {createAuroraLodge} from './aurora-lodge.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import * as T from './vendor/three.module.js';
import {createTeddy} from './teddy.js';
const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.1,450),renderer=new T.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x08172c);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.body.prepend(renderer.domElement);
const world=new T.Group();scene.add(world);scene.add(new T.HemisphereLight(0xb4d7ff,0x234251,1.25));
const moonlight=new T.DirectionalLight(0xb6d9ff,1.5);moonlight.position.set(-12,26,10);moonlight.castShadow=true;moonlight.shadow.mapSize.set(1024,1024);Object.assign(moonlight.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.5,far:70});moonlight.shadow.normalBias=.035;scene.add(moonlight);
const mat=(color,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
const snow=mat(0xe3edf3),wood=mat(0x614739),dark=mat(0x274a50),ice=new T.MeshPhysicalMaterial({color:0xa9dce4,roughness:.48,metalness:.06}),gold=new T.MeshStandardMaterial({color:0xffd49a,emissive:0xffae4e,emissiveIntensity:2.2});
function mesh(g,m,p=world){const o=new T.Mesh(g,m);o.castShadow=o.receiveShadow=true;p.add(o);return o}
function ball(x,y,z,r,m,p=world){const o=mesh(new T.SphereGeometry(r,12,8),m,p);o.position.set(x,y,z);return o}
function box(x,y,z,w,h,d,m,p=world){const o=mesh(new T.BoxGeometry(w,h,d),m,p);o.position.set(x,y,z);return o}
function rod(a,b,r,m,p=world){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),m,p);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o}
function shore(phi){return 1.01+.11*Math.sin(phi*2+.7)+.065*Math.cos(phi*3-1)}
const sea=mesh(new T.SphereGeometry(10,96,64),new T.MeshStandardMaterial({color:0x125563,roughness:.32,metalness:.48}));sea.name='spherical-ice-ocean';const oceanTime={value:0};sea.material.onBeforeCompile=shader=>{shader.uniforms.oceanTime=oceanTime;shader.fragmentShader='uniform float oceanTime;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n normal=normalize(normal+vec3(sin(vViewPosition.x*9.+vViewPosition.y*4.+sin(vViewPosition.y*3.)+oceanTime*.6)*.027,cos(vViewPosition.x*6.+vViewPosition.y*11.+oceanTime*.5)*.009,0.));')};
const geo=new T.BufferGeometry(),positions=[],indices=[],rows=48,cols=144;
for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const ph=i/cols*Math.PI*2,th=j/rows*shore(ph),r=10.055+.10*Math.sin(th*3)*Math.sin(ph*3)**2;positions.push(r*Math.sin(th)*Math.cos(ph),r*Math.cos(th),r*Math.sin(th)*Math.sin(ph))}
for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1)}geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const cap=mesh(geo,snow);cap.material.side=T.DoubleSide;
function surface(x,z,lift=0){const o=new T.Group(),n=new T.Vector3(x,Math.sqrt(Math.max(1,100-x*x-z*z)),z).normalize();o.position.copy(n).multiplyScalar(10.09+lift);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n);world.add(o);return o}
let seed=87;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
for(let i=0;i<38;i++){const a=rand()*Math.PI*2,r=4.5+rand()*3.3,x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>3&&x>-5)continue;const g=surface(x,z),h=.95+rand()*1.25;rod([0,0,0],[0,h,0],.045,wood,g);
 for(let k=0;k<5;k++){const y=.28+k*h*.16,w=(1-k*.16)*h*.29;for(let j=0;j<5;j++){const a=j/5*Math.PI*2+k*.7,branch=ball(Math.cos(a)*w*.50,y,Math.sin(a)*w*.5,1,dark,g);branch.scale.set(w*.67,h*.13,w*.23);branch.rotation.y=-a;branch.rotation.z=Math.cos(a)*-.18;const cap=ball(Math.cos(a)*w*.5,y+h*.055,Math.sin(a)*w*.5,1,snow,g);cap.scale.set(w*.64,h*.10,w*.25);cap.rotation.y=-a}}
 ball(0,h*.98,0,h*.085,snow,g);
}
const brickMats=Array.from({length:6},(_,i)=>{const m=ice.clone();m.color.setHSL(.535,.24,.63+i*.014);return m});
const lodge=surface(-1,-.4);lodge.name='warm-ice-lodge';
const floor=mesh(new T.CylinderGeometry(2.2,2.3,.14,64),wood,lodge);floor.position.y=.03;
// Individual curved ice bricks, with a front doorway left open.
for(let row=0;row<8;row++){const low=row/8*Math.PI/2,high=(row+1)/8*Math.PI/2,count=Math.max(5,Math.round(24*Math.cos(low)));for(let i=0;i<count;i++){const angle=(i+(row%2)*.5)/count*Math.PI*2,mid=angle+Math.PI/count;if(row<4&&Math.abs(Math.atan2(Math.sin(mid-Math.PI/2),Math.cos(mid-Math.PI/2)))<.29)continue;
const g=new T.SphereGeometry(2.04,10,4,angle+.003,Math.PI*2/count-.006,Math.PI/2-high+.003,high-low-.006);mesh(g,brickMats[Math.floor(rand()*brickMats.length)],lodge);}}
const door=mesh(new T.CircleGeometry(.64,40),new T.MeshStandardMaterial({color:0xc58b50,emissive:0xffa54c,emissiveIntensity:.6}),lodge);door.scale.y=1.25;door.position.set(0,.70,2.035);
const arch=new T.Mesh(new T.TorusGeometry(.68,.18,10,28,Math.PI),ice);arch.position.set(0,.58,2.12);lodge.add(arch);box(-.68,.30,2.12,.3,.6,.48,ice,lodge);box(.68,.30,2.12,.3,.6,.48,ice,lodge);
for(let i=0;i<11;i++)box(0,.035,2.1+i*.23,1.2,.055,.20,wood,lodge);
const light=new T.PointLight(0xffb66b,24,9,2);light.position.set(0,1,1.4);lodge.add(light);
for(const x of [-1.25,1.25]){const post=rod([x,0,2.4],[x,1.15,2.4],.045,wood,lodge);ball(x,1.17,2.4,.12,gold,lodge)}
function lantern(parent,x,z){rod([x,0,z],[x,.65,z],.024,wood,parent);box(x,.72,z,.18,.25,.18,gold,parent);box(x,.88,z,.24,.05,.24,wood,parent)}
const path=[];for(let i=0;i<17;i++){const z=3+i*.29,x=-1+Math.sin(i*.20)*1.1;const g=surface(x,z);if(i%3===0)lantern(g,-.7,0);for(const side of [-1,1]){const foot=ball(side*.12,.015,0,.07,mat(0xb0c7d5),g);foot.scale.set(.65,.12,1.2)}path.push(g)}
// Sheltered seating beside the lodge, facing the ice bay.
const nook=surface(2.1,2.7);
for(const x of [-.6,.65]){box(x,.25,0,.8,.16,.7,wood,nook);box(x,.51,-.3,.8,.57,.12,wood,nook);box(x,.35,0,.77,.12,.65,mat(x<0?0xc19c86:0x8cacac),nook);for(const s of [-1,1])rod([x+s*.3,0,-.23],[x+s*.3,.23,-.23],.035,wood,nook)}
for(const x of [-.6,.65]){const cushion=ball(x,.48,-.16,1,mat(0xb59a83),nook);cushion.scale.set(.28,.22,.10);const blanket=ball(x,.40,.16,1,mat(0x8bacaa),nook);blanket.scale.set(.34,.075,.32)}
const bear=createTeddy(nook,0);bear.avatar.position.set(-.6,.28,0);bear.avatar.scale.setScalar(.63);bear.seatTick(true,1);bear.relax(true);
const table=mesh(new T.CylinderGeometry(.30,.32,.10,24),wood,nook);table.position.set(.05,.4,.65);rod([.05,0,.65],[.05,.35,.65],.06,wood,nook);ball(.05,.57,.65,.075,gold,nook);
const nookLight=new T.PointLight(0xffc985,7,4);nookLight.position.set(0,1,0);nook.add(nookLight);
for(let i=0;i<22;i++){const x=-3.5+rand()*10,z=5.5+rand()*2.5;if(x*x+z*z>95||Math.asin(Math.hypot(x,z)/10)<shore(Math.atan2(z,x))+.02)continue;const g=surface(x,z,-.08),o=mesh(new T.CylinderGeometry(.18+rand()*.25,.32,.10,6),ice,g);o.rotation.y=rand()*6}
for(let i=0;i<13;i++){const x=-5+rand()*10,z=7.7+rand()*1.5;if(x*x+z*z>97)continue;const g=surface(x,z,-.07),o=mesh(new T.CylinderGeometry(.3+rand()*.4,.5,.10,7),snow,g);o.rotation.y=rand()*6}
// Warm suspended string lights around the outdoor nook.
for(const x of [-1.5,1.5])rod([x,0,-.7],[x,2,-.7],.035,wood,nook);
const curve=new T.CatmullRomCurve3([new T.Vector3(-1.5,2,-.7),new T.Vector3(0,1.65,-.7),new T.Vector3(1.5,2,-.7)]);
mesh(new T.TubeGeometry(curve,32,.009,4,false),wood,nook);
for(let i=0;i<13;i++){const v=curve.getPoint(i/12);ball(v.x,v.y-.06,v.z,.037,gold,nook)}
// Seamless spherical sky: integer longitude harmonics close at 360 degrees.
const auroras=[];
const auroraMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.BackSide,blending:T.AdditiveBlending,uniforms:{time:{value:0}},
vertexShader:`varying vec3 skyDirection;void main(){skyDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec3 skyDirection;uniform float time;void main(){vec3 d=normalize(skyDirection);float longitude=atan(d.z,d.x),latitude=asin(clamp(d.y,-1.,1.));vec3 light=vec3(0.);
for(int i=0;i<3;i++){float layer=float(i),x=longitude-time*.025+layer*1.7;float edge=-.12+layer*.32+.13*sin(x*3.+time*.12+layer)+.055*sin(x*7.-time*.18);float h=latitude-edge;
float base=smoothstep(-.015,.045,h),fade=exp(-max(h,0.)*9.);float fold=x+.025*sin(x*5.+time*.22)+.009*sin(latitude*13.-time*.3);float rays=.50+.28*sin(fold*180.+time*.5)+.16*sin(fold*391.-time*.3);float drift=.65+.35*sin(x*2.-time*.12+layer);
vec3 color=mix(vec3(.10,.90,.57),vec3(.32,.32,.92),smoothstep(.04,.31,h));color=mix(color,vec3(.74,.25,.55),smoothstep(.23,.48,h)*.6);light+=color*base*fade*(.32+rays*.68)*drift*.65;}
float poleFade=1.-smoothstep(1.25,1.56,abs(latitude));gl_FragColor=vec4(light*poleFade,1.);}`});
const auroraSky=new T.Mesh(new T.SphereGeometry(190,96,48),auroraMaterial);auroraSky.name='spherical-aurora-sky';auroraSky.frustumCulled=false;scene.add(auroraSky);auroras.push(auroraMaterial);
const starsGeo=new T.BufferGeometry(),stars=[];for(let i=0;i<1600;i++){let x=rand()*2-1,y=rand()*.95+.04,z=rand()*2-1;const n=new T.Vector3(x,y,z).normalize().multiplyScalar(160);stars.push(...n.toArray())}starsGeo.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(starsGeo,new T.PointsMaterial({color:0xd0e5f5,size:.28,sizeAttenuation:true,transparent:true,opacity:.8})));
ball(-22,18,-48,1.05,new T.MeshBasicMaterial({color:0xffedce}),scene);
const hazeCanvas=document.createElement('canvas');hazeCanvas.width=hazeCanvas.height=128;const c=hazeCanvas.getContext('2d'),grad=c.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(230,240,221,.30)');grad.addColorStop(.25,'rgba(170,214,221,.10)');grad.addColorStop(1,'rgba(160,220,230,0)');c.fillStyle=grad;c.fillRect(0,0,128,128);const halo=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(hazeCanvas),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));halo.position.set(-22,18,-48);halo.scale.set(12,12,1);scene.add(halo);
world.updateMatrixWorld(true);
const batches=new Map();
world.traverse(o=>{if(!o.isMesh||o===sea)return;for(let p=o;p;p=p.parent)if(p===bear.avatar)return;const key=o.material.uuid;let batch=batches.get(key);if(!batch)batches.set(key,batch=[]);batch.push(o)});
for(const objects of batches.values()){if(objects.length<2)continue;const copies=objects.map(o=>{const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');return g}),merged=mergeGeometries(copies);if(merged){const o=mesh(merged,objects[0].material);for(const old of objects)old.removeFromParent()}for(const g of copies)g.dispose()}
const wildlife=createAuroraWildlife(world);let assetsReady=false;wildlife.ready.then(()=>assetsReady=true).catch(e=>{document.querySelector('#loading').textContent='模型加载失败，请刷新重试';console.error(e)});
const interior=createAuroraLodge();scene.add(interior.group);
const lodgeHit=new T.Mesh(new T.SphereGeometry(2.15,16,12),new T.MeshBasicMaterial({visible:false}));lodge.add(lodgeHit);
let press=null,gestureMoved=false;
let az=.18,polar=.94,range=36,target=new T.Vector3(0,3,0),mode='planet',pointer=new Map(),pairDistance=0,last=0;
const presets={inside:{target:[0,-49,.2],range:11,polar:1.12,az:.10},planet:{target:[0,3,0],range:39,polar:1.30,az:.18},lodge:{target:[-1,10.4,1.5],range:10,polar:1.23,az:.25},bay:{target:[2,8,5.5],range:13,polar:1.36,az:.55}};
function choose(name){if(!presets[name])return;mode=name;world.visible=name!=='inside';interior.group.visible=name==='inside';document.querySelector('#leave-lodge').hidden=name!=='inside';document.querySelector('footer').textContent=name==='inside'?'冰杯、暖灯与一段慢下来的时光 · 点门口回到雪地':'点冰屋进入 · 拖动环顾 · 双指缩放';const p=presets[name];target.fromArray(p.target);range=p.range*(innerWidth<600?(name==='planet'?1.58:name==='inside'?1.5:1):1);polar=p.polar;az=p.az;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===name))}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>choose(b.dataset.view));
const canvas=renderer.domElement;canvas.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY};gestureMoved=pointer.size>0;canvas.setPointerCapture(e.pointerId);pointer.set(e.pointerId,[e.clientX,e.clientY]);pairDistance=0});canvas.addEventListener('pointermove',e=>{const old=pointer.get(e.pointerId);if(!old)return;const dx=e.clientX-old[0],dy=e.clientY-old[1];if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>6)gestureMoved=true;pointer.set(e.pointerId,[e.clientX,e.clientY]);if(pointer.size===1){az-=dx*.005;polar=T.MathUtils.clamp(polar-dy*.004,.25,mode==='planet'?1.6:2.2)}else{const [a,b]=[...pointer.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pairDistance)range=T.MathUtils.clamp(range*pairDistance/d,4,65);pairDistance=d}});for(const ev of ['pointerup','pointercancel'])canvas.addEventListener(ev,e=>{if(ev==='pointerup'&&!gestureMoved&&press&&pointer.size===1){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);if(mode==='inside'){const exit=interior.hits.filter(h=>h.type==='exit');if(ray.intersectObjects(exit.map(h=>h.object),true).length)choose('lodge')}else if(ray.intersectObject(lodgeHit,true).length)choose('inside')}pointer.delete(e.pointerId);pairDistance=0;press=null});canvas.addEventListener('wheel',e=>{e.preventDefault();range=T.MathUtils.clamp(range*Math.exp(e.deltaY*.001),4,65)},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let paused=false;document.addEventListener('visibilitychange',()=>paused=document.hidden);
function tick(ms){requestAnimationFrame(tick);if(paused||ms-last<32)return;last=ms;wildlife.tick(ms/1000);interior.tick(ms/1000,camera.position);oceanTime.value=ms/1000;for(const m of auroras)m.uniforms.time.value=ms/1000;camera.position.set(target.x+Math.sin(az)*Math.sin(polar)*range,target.y+Math.cos(polar)*range,target.z+Math.cos(az)*Math.sin(polar)*range);camera.lookAt(target);auroraSky.position.copy(camera.position);sea.material.color.setHSL(.51+Math.sin(ms*.00012)*.015,.60,.20);renderer.render(scene,camera);document.querySelector('#loading').hidden=assetsReady}
document.querySelector('#leave-lodge').onclick=()=>choose('lodge');choose('planet');requestAnimationFrame(tick);
window.auroraPreview={state:()=>({assetsReady,animals:wildlife.state(),mode,range,az,polar,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,auroraTime:auroras[0].uniforms.time.value}),choose};
