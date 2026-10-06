import {buildTerraceGarden} from './cafe-terrace-garden.js';
import * as T from './vendor/three.module.js';
import {UPPER_Y,STAIR_BOTTOM,upperGroundY,upperSeats} from './cafe-upper-layout.js';
export function buildCafeUpper(parent,pick){
 const group=new T.Group();group.name='Sea breeze loft and stargazing terrace';parent.add(group);const lights=[],roofs=[],walls=[];
 const mats={wood:new T.MeshStandardMaterial({color:0xb08b64,roughness:.82}),cream:new T.MeshStandardMaterial({color:0xf0dfbe,roughness:.9}),sage:new T.MeshStandardMaterial({color:0xa4b299,roughness:1}),brass:new T.MeshStandardMaterial({color:0xbfa47c,roughness:.65}),glass:new T.MeshPhysicalMaterial({color:0xb9d5ca,transparent:true,opacity:.14,roughness:.18,depthWrite:false,side:T.DoubleSide}),glow:new T.MeshStandardMaterial({color:0xffe2af,emissive:0xffc481,emissiveIntensity:1})};
 function mesh(geo,mat,x,y,z,p=group){const o=new T.Mesh(geo,mats[mat]||mat);o.position.set(x,y,z);o.castShadow=mat!=='glass';o.receiveShadow=true;p.add(o);return o}
 const box=(x,y,z,w,h,d,mat='wood',p)=>mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,p);
 const cylinder=(x,y,z,r,h,mat='wood',p)=>mesh(new T.CylinderGeometry(r,r,h,24),mat,x,y,z,p);
 function cushion(x,y,z,w,h,d,mat='cream',p){const o=mesh(new T.SphereGeometry(1,20,12),mat,x,y,z,p);o.scale.set(w,h,d);return o}
 function line(points,r=.03,mat='wood'){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),points.length*5,r,7,false),mat,0,0,0)}
 const outline=[[-6,0],[-5.4,-3.5],[-1,-3.8],[3.5,-3.6],[6,-1.5],[5.9,2.9],[3.5,4.0],[-1,4.0],[-5,3.4]].map(([x,z])=>new T.Vector3(x,0,z));const curve=new T.CatmullRomCurve3(outline,true),points=curve.getPoints(100),shape=new T.Shape(points.map(p=>new T.Vector2(p.x,-p.z)));
 const deckGeo=new T.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:true,bevelSize:.04,bevelThickness:.025,bevelSegments:2});deckGeo.rotateX(-Math.PI/2);const deck=mesh(deckGeo,'wood',0,UPPER_Y-.13,0);pick(deck,'upper-ground');
 const timber=document.createElement('canvas');timber.width=timber.height=512;const tq=timber.getContext('2d');for(let j=0;j<20;j++){tq.fillStyle=['#b49168','#ba9870','#ae8961','#b79570'][j%4];tq.fillRect(j*26,0,25,512);tq.fillStyle='#94704e';tq.fillRect(j*26+25,0,1,512);for(let k=0;k<7;k++){tq.strokeStyle='rgba(107,75,44,.12)';tq.beginPath();tq.moveTo(j*26+3+k*3,0);tq.bezierCurveTo(j*26+k*3+6,140,j*26+k*3,290,j*26+3+k*3,512);tq.stroke()}}const timberMap=new T.CanvasTexture(timber);timberMap.colorSpace=T.SRGBColorSpace;timberMap.wrapS=timberMap.wrapT=T.RepeatWrapping;timberMap.repeat.set(.11,.11);deck.material=new T.MeshStandardMaterial({map:timberMap,roughness:.9});
 // Timber posts and loosely curved rope soften the sea-facing edge.
 for(let i=0;i<100;i+=8){const a=points[i],b=points[Math.min(i+8,100)];if(a.x< -5.5&&a.z<-.9&&a.z> -2.8)continue;cylinder(a.x,UPPER_Y+.43,a.z,.055,.86);for(const h of [.4,.79])line([[a.x,UPPER_Y+h,a.z],[(a.x+b.x)/2,UPPER_Y+h-.08,(a.z+b.z)/2],[b.x,UPPER_Y+h,b.z]],.018,'cream')}
 // Small rounded glazed loft occupies only the rear-left part of the roof.
 const loftCurve=new T.CatmullRomCurve3([[-5.3,-2.9],[-3.3,-3.35],[-.6,-2.9],[.1,-.5],[-1.1,1.1],[-4.1,1.1],[-5.4,-.4]].map(([x,z])=>new T.Vector3(x,0,z)),true);
 const lp=loftCurve.getPoints(48);for(let i=0;i<48;i++){const a=lp[i],b=lp[i+1];if((a.x< -5&&a.z<-.9&&a.z> -2.6)||a.z>-.45)continue;const panel=new T.Group();group.add(panel);const mid=a.clone().add(b).multiplyScalar(.5);const pane=box(mid.x,UPPER_Y+1.12,mid.z,.025,2.1,a.distanceTo(b),'glass',panel);pane.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);if(i%6===0)cylinder(a.x,UPPER_Y+1.12,a.z,.065,2.2);walls.push(panel)}
 const roofShape=new T.Shape(lp.map(p=>new T.Vector2(p.x,-p.z))),roofGeo=new T.ExtrudeGeometry(roofShape,{depth:.12,bevelEnabled:true,bevelSize:.13,bevelThickness:.04,bevelSegments:3});roofGeo.rotateX(-Math.PI/2);roofs.push(mesh(roofGeo,'sage',0,UPPER_Y+2.22,0));
 line(lp.map(p=>[p.x,UPPER_Y+2.19,p.z]),.07,'wood');
 // Low bookcase and a recessed reading niche with uneven book spines.
 box(-4.7,UPPER_Y+.75,.5,.48,1.5,1.65);for(let row=0;row<3;row++)for(let i=0;i<9;i++){const mat=new T.MeshStandardMaterial({color:[0x8e9e91,0xc4a37d,0xb67e69,0xd4c9aa][(i+row)%4],roughness:1});box(-4.42,UPPER_Y+.2+row*.44,.5+(i-4)*.155,.16,.24+(i%3)*.045,.105,mat)}
 box(-.65,UPPER_Y+.92,-2.5,.06,.64,.52,'cream');box(-.61,UPPER_Y+.92,-2.5,.025,.42,.34,'sage');
 function softBox(x,y,z,w,h,d,mat,p){const shape=new T.Shape();const r=.1;shape.moveTo(-w/2+r,-d/2);shape.lineTo(w/2-r,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);shape.lineTo(w/2,d/2-r);shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);shape.lineTo(-w/2+r,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);shape.lineTo(-w/2,-d/2+r);shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelThickness:.035,bevelSize:.025,bevelSegments:3,steps:1});geo.rotateX(-Math.PI/2);return mesh(geo,mat,x,y-h/2,z,p)}
 mats.rose=new T.MeshStandardMaterial({color:0xc39279,roughness:1});mats.linen=new T.MeshStandardMaterial({color:0xd6b785,roughness:1});
 for(const s of upperSeats){const seat=new T.Group();seat.position.set(s.x,UPPER_Y,s.z);seat.rotation.y=s.yaw;group.add(seat);const fabric=s.id==='upper-4'?'rose':s.zone==='loft'?'sage':'cream';softBox(0,.25,0,1.12,.3,.99,'wood',seat);softBox(0,.44,0,1.05,.16,.94,fabric,seat);softBox(0,.72,-.40,1.08,.57,.18,fabric,seat);for(const x of [-.5,.5])softBox(x,.58,0,.17,.3,.91,fabric,seat);const pillow=softBox(.22,.71,-.24,.36,.36,.13,s.id==='upper-3'?'rose':'linen',seat);pillow.rotation.z=.18;pillow.rotation.x=-.16;cylinder(0,.82,.78,.36,.07,'wood',seat);cylinder(0,.4,.78,.055,.8,'wood',seat);pick(seat,'seat',s.id)}
 // Warm woven rugs, small books and casually folded throws.
 function rug(x,z,rx,rz,color){const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d');q.fillStyle=color;q.fillRect(0,0,256,256);q.strokeStyle='rgba(255,243,212,.45)';q.lineWidth=2;for(let i=4;i<256;i+=7){q.beginPath();q.moveTo(i,0);q.lineTo(i,256);q.stroke()}q.strokeStyle='#ae8059';q.lineWidth=7;q.strokeRect(17,17,222,222);const mat=new T.MeshStandardMaterial({map:new T.CanvasTexture(c),roughness:1});const o=mesh(new T.CircleGeometry(1,64),mat,x,UPPER_Y+.045,z);o.rotation.x=-Math.PI/2;o.scale.set(rx,rz,1);o.castShadow=false}
 rug(-2.6,-1.4,2.05,1.55,'#cfb48c');rug(2.8,1.75,2.05,1.3,'#bca27d');
 softBox(-3,UPPER_Y+.35,-2.7,2.8,.45,.95,'sage');
 for(let i=0;i<3;i++){const book=box(-1.2,UPPER_Y+.12+i*.055,-.55,.42,.045,.3,i%2?'sage':'rose');book.rotation.y=.15*i}
 // Soft pleated curtains frame an open front, with a wooden entrance lintel.
 for(const x of [-4.8,-.7]){cylinder(x,UPPER_Y+1.1,.65,.065,2.2);for(let j=0;j<7;j++){const curtain=box(x+(j-3)*.065,UPPER_Y+1.05,.64+Math.sin(j*2)*.045,.073,2,.06,'cream');curtain.castShadow=false}line([[x-.28,UPPER_Y+2.12,.65],[x+.28,UPPER_Y+2.12,.65]],.025)}
 // A strand of little amber bulbs stays over the reading corner, leaving the viewing sky open.
 const strand=[[-5.2,UPPER_Y+2.15,.85],[-3.1,UPPER_Y+1.94,1.05],[-.7,UPPER_Y+2.15,.85]];line(strand,.012,'wood');for(let i=0;i<=12;i++){const t=i/12,x=-5.2+4.5*t,y=UPPER_Y+2.15-.2*Math.sin(t*Math.PI);cushion(x,y-.055,.85+.2*Math.sin(t*Math.PI),.045,.065,.045,'glow')}
 // A loosely draped throw on the first lounge arm.
 const throwGeo=new T.PlaneGeometry(.34,.95,8,20),tp=throwGeo.attributes.position;for(let i=0;i<tp.count;i++){const u=tp.getX(i),v=tp.getY(i),along=(v+.475)/.95;tp.setXYZ(i,1.48+u,UPPER_Y+.70-Math.max(0,along-.56)*.9+Math.sin(u*55)*.013,1.86+along*.8)}throwGeo.computeVertexNormals();const blanketMat=new T.MeshStandardMaterial({color:0x9daea2,roughness:1,side:T.DoubleSide});mesh(throwGeo,blanketMat,0,0,0);
 // Low lanterns and potted foliage add pools of light without blocking the sea.
 for(const [x,z]of [[-.3,2.9],[4.9,1.7],[-4.3,1.9]]){cylinder(x,UPPER_Y+.12,z,.18,.24,'wood');cylinder(x,UPPER_Y+.34,z,.13,.23,'glow');cylinder(x,UPPER_Y+.48,z,.18,.055,'wood');for(const dx of [-.14,.14])box(x+dx,UPPER_Y+.34,z,.022,.26,.022,'wood');const l=new T.PointLight(0xffc980,0,3,2);l.position.set(x,UPPER_Y+.45,z);l.userData.power=2.2;group.add(l);lights.push(l)}
 // Planters leave the skyline open; small warm lamps sit below eye level.
 for(const [x,z]of [[-1,3.6],[5.1,2.7],[5.5,-2.1]]){cylinder(x,UPPER_Y+.21,z,.26,.42,'rose');for(let j=0;j<9;j++){const a=j*2.4;const leaf=cushion(x+Math.sin(a)*.16,UPPER_Y+.62+(j%3)*.13,z+Math.cos(a)*.16,.13,.30,.07,'sage');leaf.rotation.z=Math.sin(a)*.6;leaf.rotation.y=a}}
 for(const [x,z]of [[-3,-1.2],[2.5,1.4],[4,-1.8]]){cylinder(x,UPPER_Y+.78,z,.055,.5,'brass');cylinder(x,UPPER_Y+1.03,z,.19,.23,'cream');cylinder(x,UPPER_Y+.92,z,.15,.025,'glow');const light=new T.PointLight(0xffd6a2,0,7,2);light.position.set(x,UPPER_Y+1,z);group.add(light);lights.push(light)}
 // A real side stair with a top landing, handrails and tread lights.
 const stairs=new T.Group();stairs.name='Loft side stairs';group.add(stairs);for(let i=0;i<28;i++){const z=4.2-(i+.5)*6/28,y=upperGroundY(-7.65,z);box(-7.65,y-.065,z,1.12,.13,6/28+.015,'wood',stairs);if(i%4===0)box(-7.65,y+.008,z+.06,.72,.012,.028,'glow',stairs)}
 for(const x of [-8.22,-7.08]){line([[x,upperGroundY(x,4.2)+.8,4.2],[x,UPPER_Y+.8,-1.8]],.032);for(let i=0;i<=7;i++){const z=4.2-i*6/7;cylinder(x,upperGroundY(-7.65,z)+.4,z,.023,.8)}}
 const bridge=box(-6.5,UPPER_Y-.08,-1.8,2.7,.16,.75);pick(bridge,'upper-ground');pick(stairs,'stairs');const upHit=box(-7.65,upperGroundY(-7.65,4.2)+.3,4.2,1.2,.6,.6,new T.MeshBasicMaterial({visible:false}));pick(upHit,'stairs');
 for(const x of [-7.65,-6]){line([[x,UPPER_Y+.8,-2.17],[x+1.1,UPPER_Y+.8,-2.17]],.03)}
 const starsMarker=cylinder(3.1,UPPER_Y+.035,3.0,.33,.035,'brass');pick(starsMarker,'stargaze');
 const garden=buildTerraceGarden(group);
 return {group,tick(daylight,upper){garden.tick(daylight);for(const l of lights)l.intensity=(1-daylight)*(l.userData.power??(l.position.x<0?7:3));roofs.forEach(o=>o.visible=!upper)},dispose(){}};
}
