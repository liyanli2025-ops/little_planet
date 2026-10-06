import {GLTFLoader} from './vendor/GLTFLoader.js';
import * as T from './vendor/three.module.js';
import {cinemaProgram,cinemaSeats} from './cinema-catalog.js';
import {detailBeachY} from './cafe-water-surface.js';

// One player feeds the physical screen and the optional close-up. No video is
// fetched during island arrival; server time remains the shared playback clock.
export function createCafeCinema(parent,pick,host,{onSound}={}){
 const group=new T.Group();group.name='beach-cinema';parent.add(group);
 const wood=new T.MeshStandardMaterial({color:0x92704b,roughness:.85});
 function box(x,y,z,w,h,d,material=wood){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m}
 const sx=-9.5,sz=5.6,base=detailBeachY(sx,sz),width=4.55,height=2.56;
 for(const x of [sx-width/2-.15,sx+width/2+.15])box(x,base+1.85,sz,.13,3.7,.13);
 box(sx,base+3.56,sz,width+.45,.13,.16);
 const poster=document.createElement('canvas');poster.width=1024;poster.height=576;
 const q=poster.getContext('2d');q.fillStyle='#293f46';q.fillRect(0,0,1024,576);
 q.fillStyle='#e5c58c';q.textAlign='center';q.font='28px serif';q.fillText('SEA BREEZE · OPEN AIR',512,160);
 q.fillStyle='#faf2d9';q.font='68px serif';q.fillText('海风放映室',512,285);
 q.font='27px sans-serif';q.fillText('每晚 18:00 — 次日 06:00',512,363);q.fillText('坐下来，和海一起看一部短片',512,414);
 const posterTexture=new T.CanvasTexture(poster);posterTexture.colorSpace=T.SRGBColorSpace;
 const screenMaterial=new T.MeshBasicMaterial({map:posterTexture,side:T.DoubleSide,toneMapped:false});
 const screen=new T.Mesh(new T.PlaneGeometry(width,height),screenMaterial);screen.position.set(sx,base+2.12,sz+.08);group.add(screen);pick(screen,'cinema');
 const roll=new T.Mesh(new T.CylinderGeometry(.09,.09,width+.1,16),new T.MeshStandardMaterial({color:0xe5dfcc}));roll.rotation.z=Math.PI/2;roll.position.set(sx,base+3.5,sz+.08);group.add(roll);
 const ready=new GLTFLoader().loadAsync('./assets/coast/beach-chair.glb').then(({scene:model})=>{
  if(disposed)return;
  const oriented=new T.Group();oriented.add(model);model.rotation.y=-1.7203;
  const bounds=new T.Box3().setFromObject(oriented),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const scale=.86/size.x;model.position.set(-center.x,-bounds.min.y,-center.z);oriented.scale.setScalar(scale);
  oriented.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});
  for(const seat of cinemaSeats){const g=oriented.clone(true);g.name='cinema-beach-chair';g.position.set(seat.x,detailBeachY(seat.x,seat.z),seat.z);g.rotation.y=seat.yaw;group.add(g);pick(g,'seat',seat.id)}
 });
 for(const seat of cinemaSeats){const g=new T.Group();g.position.set(seat.x,detailBeachY(seat.x,seat.z),seat.z);g.rotation.y=seat.yaw;group.add(g);
  const top=new T.Mesh(new T.CylinderGeometry(.34,.34,.055,24),wood);top.position.set(0,.55,.72);g.add(top);
  for(const x of [-.22,.22]){const leg=new T.Mesh(new T.BoxGeometry(.045,.53,.045),wood);leg.position.set(x,.265,.72);g.add(leg)}
 }
 // A low rope-and-lantern edge gives the seating a sheltered boundary,
 // with a broad strip of dry sand still beyond it. It stays out of the aisle.
 const lanternGlass=new T.MeshStandardMaterial({color:0xffddaa,emissive:0xffbc69,emissiveIntensity:.7,roughness:.6});
 const ropeMaterial=new T.MeshStandardMaterial({color:0xb09a74,roughness:1});
 const edgePosts=[[-13.25,4.3],[-13.4,6.5],[-13.1,8.7],[-12.1,10.8]];
 const ropePoints=[];
 for(const [x,z]of edgePosts){const y=detailBeachY(x,z);box(x,y+.34,z,.09,.68,.09);ropePoints.push(new T.Vector3(x,y+.60,z));box(x,y+.79,z,.22,.055,.22);box(x,y+.92,z,.15,.22,.15,lanternGlass);box(x,y+1.06,z,.22,.055,.22);for(const dx of [-.09,.09])for(const dz of [-.09,.09])box(x+dx,y+.92,z+dz,.022,.25,.022)}
 for(let i=1;i<ropePoints.length;i++){const a=ropePoints[i-1],b=ropePoints[i],mid=a.clone().lerp(b,.5);mid.y-=.15;group.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([a,mid,b]),20,.014,5,false),ropeMaterial))}
 const px=-8.7,pz=10.05,py=detailBeachY(px,pz);box(px,py+.25,pz,.48,.5,.45);box(px,py+.6,pz,.38,.2,.31,new T.MeshStandardMaterial({color:0xd5c9ad,roughness:.7}));
 const lens=new T.Mesh(new T.CylinderGeometry(.065,.065,.10,16),new T.MeshBasicMaterial({color:0xffeac1}));lens.rotation.x=Math.PI/2;lens.position.set(px,py+.61,pz-.19);group.add(lens);
 const end=new T.Vector3(sx,base+2.12,sz+.09),start=lens.position.clone(),beamDirection=end.clone().sub(start);
 const beam=new T.Mesh(new T.CylinderGeometry(1.6,.035,beamDirection.length(),24,1,true),new T.MeshBasicMaterial({color:0xffe6ad,transparent:true,opacity:.025,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));beam.position.copy(start).addScaledVector(beamDirection,.5);beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),beamDirection.normalize());group.add(beam);
 const lightMaterial=new T.MeshBasicMaterial({color:0xffd49b,toneMapped:false});
 const bulbs=[];
 const poles=[[-12.5,5],[-6.5,5],[-12.5,9.9],[-6.5,9.9]];
 for(const [x,z]of poles)box(x,detailBeachY(x,z)+2.25,z,.085,4.5,.085);
 for(const [ai,bi]of [[0,2],[2,3],[3,1],[0,3],[1,2]]){
  const a=new T.Vector3(poles[ai][0],detailBeachY(...poles[ai])+4.45,poles[ai][1]),b=new T.Vector3(poles[bi][0],detailBeachY(...poles[bi])+4.45,poles[bi][1]),points=[];
  for(let i=0;i<=24;i++){const t=i/24,v=a.clone().lerp(b,t);v.y-=.4*Math.sin(t*Math.PI);points.push(v);
   if(i>0&&i<24&&i%2===0){const bulb=new T.Mesh(new T.SphereGeometry(.055,10,8),lightMaterial);bulb.position.copy(v);bulb.position.y-=.06;group.add(bulb);bulbs.push(bulb)}}
  group.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x5b5140})));
 }
 const lamp=new T.PointLight(0xffd39a,0,9,2);lamp.position.set(-9.5,base+2,8);group.add(lamp);
 const board=box(-7.1,detailBeachY(-7.1,9.7)+.75,9.7,.72,1,.07,new T.MeshStandardMaterial({color:0x394f4b}));
 const sign=new T.Mesh(new T.PlaneGeometry(.67,.38),new T.MeshBasicMaterial({map:posterTexture,toneMapped:false}));sign.position.copy(board.position).add(new T.Vector3(0,.15,.04));group.add(sign);pick(board,'cinema-board');pick(sign,'cinema-board');
 const video=document.createElement('video');video.playsInline=true;video.muted=true;video.preload='none';video.setAttribute('playsinline','');video.setAttribute('aria-label','海风放映室影片');
 const texture=new T.VideoTexture(video);texture.colorSpace=T.SRGBColorSpace;
 const ui=document.createElement('div');ui.className='cinema-strip';ui.hidden=true;ui.innerHTML='<button data-film="fold" aria-label="收起电影面板">×</button><div><strong>海风放映室</strong><span class="cinema-status" role="status"></span></div><button data-film="sound">开启电影声音</button><button data-film="large">看大银幕</button><button data-film="retry" hidden>重新连接</button><details><summary>片单与署名</summary><div class="cinema-credits"></div></details>';
 const chip=document.createElement('button');chip.className='cinema-chip';chip.textContent='放映室 · 展开';chip.hidden=true;host.append(ui,chip);
 let folded=false;chip.onclick=()=>{folded=false;ui.hidden=false;chip.hidden=true};
 const overlay=document.createElement('div');overlay.className='cinema-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','银幕近景');overlay.innerHTML='<button class="cinema-back">返回现场</button>';overlay.append(video);host.append(overlay);
 let current=null,program=null,active=false,disposed=false,failed=false,pending=false,blocked=false,playingAttempt=false,lastSync=0,lastStatus='',audible=false;
 const status=ui.querySelector('.cinema-status'),retry=ui.querySelector('[data-film="retry"]');
 function credit(f){const el=ui.querySelector('.cinema-credits');el.replaceChildren();const link=document.createElement('a');link.href=f.page;link.target='_blank';link.rel='noopener';link.textContent=f.original;const license=document.createElement('a');license.href=f.licenseUrl;license.target='_blank';license.rel='noopener';license.textContent=f.license;el.append(link,document.createTextNode(' · '+f.credit+' · '),license)}
 function muted(value){video.muted=value;audible=!value;ui.querySelector('[data-film="sound"]').textContent=value?'开启电影声音':'关闭电影声音';onSound?.(active&&audible)}
 function play(){if(disposed||!active||failed||blocked||playingAttempt||!program?.open||program.intermission)return;playingAttempt=true;video.play().catch(e=>{if(e.name==='AbortError')return;blocked=true;if(active&&!disposed&&program?.open){status.textContent='点“重新连接”开始播放';retry.hidden=false}}).finally(()=>{playingAttempt=false})}
 video.addEventListener('loadedmetadata',()=>{if(disposed||!program||!current)return;pending=false;status.textContent=lastStatus;retry.hidden=true;video.currentTime=Math.min(program.offset,Math.max(0,video.duration-.15));play()});
 video.addEventListener('error',()=>{if(!current||disposed)return;failed=true;pending=false;screenMaterial.map=posterTexture;screenMaterial.needsUpdate=true;status.textContent='片源暂时无法连接，可以稍后重试';retry.hidden=false});
 function enlarge(){if(!active)return;overlay.hidden=false;document.body.classList.add('cinema-closeup');overlay.querySelector('button').focus();play()}
 function shrink(){overlay.hidden=true;document.body.classList.remove('cinema-closeup');(folded?chip:ui.querySelector('[data-film="large"]')).focus()}
 overlay.querySelector('button').onclick=shrink;
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape')shrink();if(e.key==='Tab'){e.preventDefault();overlay.querySelector('button').focus()}});
 ui.onclick=e=>{const key=e.target.closest('[data-film]')?.dataset.film;if(key==='fold'){folded=true;ui.hidden=true;chip.hidden=false;chip.focus()}if(key==='sound'){blocked=false;muted(!video.muted);play()}if(key==='large')enlarge();if(key==='retry'){failed=false;blocked=false;retry.hidden=true;pending=true;video.load();play()}};
 function visibility(){if(document.hidden){video.pause();onSound?.(false)}}
 document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',visibility);
 function tick(time,visible,overview=false){
  // Re-seat the whole outdoor set onto the sphere in the distant view.
  if(overview){const scale=parent.scale.x,center=new T.Vector3(-9.5,detailBeachY(-9.5,7.7),7.7),x=center.x*scale,z=center.z*scale,y=Math.sqrt(17.845**2-x*x-z*z);
   group.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(x,y,z).normalize());group.position.set(x/scale,(-18.25+y)/scale,z/scale).sub(center.applyQuaternion(group.quaternion));
  }else{group.position.set(0,0,0);group.quaternion.identity()}

  program=cinemaProgram(time);active=visible&&!document.hidden;ui.hidden=!visible||folded;chip.hidden=!visible||!folded;document.body.classList.toggle('at-cinema',visible);
  screen.scale.y=program.open?1:.075;screen.position.y=program.open?base+2.12:base+3.4;lamp.intensity=program.open?3:0;beam.visible=program.open&&visible&&video.readyState>=2;bulbs.forEach(b=>b.visible=program.open);
  const description=program.open?(program.intermission?'稍歇片刻，即将播放下一部':program.film.title+' · 全岛同步放映'):'白天在这里歇歇脚 · 今晚 18:00 开映';
  if(description!==lastStatus){lastStatus=description;if(!failed)status.textContent=description;credit(program.film)}
  if(!active||!program.open||program.intermission){video.pause();if(!active&&current){current=null;video.removeAttribute('src');video.load()}overlay.hidden=true;document.body.classList.remove('cinema-closeup');screenMaterial.map=posterTexture;onSound?.(false);return}
  onSound?.(audible);
  if(current!==program.film.id){current=program.film.id;failed=false;blocked=false;retry.hidden=true;pending=true;screenMaterial.map=posterTexture;screenMaterial.needsUpdate=true;video.src='/api/cinema/film/'+current;video.load();play();credit(program.film)}
  if(failed)return;
  if(video.readyState>=2&&!video.seeking){if(time-lastSync>2500){lastSync=time;if(Math.abs(video.currentTime-program.offset)>2)video.currentTime=Math.min(program.offset,Math.max(0,video.duration-.15))}if(screenMaterial.map!==texture){screenMaterial.map=texture;screenMaterial.needsUpdate=true}if(video.paused)play()}
 }
 return {ready,group,tick,enlarge,state:()=>({film:current,time:video.currentTime,open:program?.open,active,failed,muted:video.muted,ready:video.readyState}),dispose(){disposed=true;document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',visibility);document.body.classList.remove('cinema-closeup');document.body.classList.remove('at-cinema');current=null;video.pause();video.removeAttribute('src');video.load();ui.remove();chip.remove();overlay.remove();texture.dispose();posterTexture.dispose();onSound?.(false)}};
}
