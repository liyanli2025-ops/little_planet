import * as T from './vendor/three.module.js';
import {UPPER_Y,STAIR_BOTTOM,upperGroundY,upperSeats} from './cafe-upper-layout.js';
export function buildCafeUpper(parent,pick){
 const group=new T.Group();group.name='Sea breeze loft and stargazing terrace';parent.add(group);const lights=[],roofs=[],walls=[];
 const mats={wood:new T.MeshStandardMaterial({color:0x947452,roughness:.82}),cream:new T.MeshStandardMaterial({color:0xe3d6b7,roughness:.9}),sage:new T.MeshStandardMaterial({color:0xa4b299,roughness:1}),brass:new T.MeshStandardMaterial({color:0xbfa47c,roughness:.65}),glass:new T.MeshPhysicalMaterial({color:0xb9d5ca,transparent:true,opacity:.14,roughness:.18,depthWrite:false,side:T.DoubleSide}),glow:new T.MeshStandardMaterial({color:0xffe2af,emissive:0xffc481,emissiveIntensity:1})};
 function mesh(geo,mat,x,y,z,p=group){const o=new T.Mesh(geo,mats[mat]||mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o}
 const box=(x,y,z,w,h,d,mat='wood',p)=>mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,p);
 const cylinder=(x,y,z,r,h,mat='wood',p)=>mesh(new T.CylinderGeometry(r,r,h,24),mat,x,y,z,p);
 function cushion(x,y,z,w,h,d,mat='cream',p){const o=mesh(new T.SphereGeometry(1,20,12),mat,x,y,z,p);o.scale.set(w,h,d);return o}
 function line(points,r=.03,mat='wood'){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),points.length*5,r,7,false),mat,0,0,0)}
 const outline=[[-6,0],[-5.4,-3.5],[-1,-3.8],[3.5,-3.6],[6,-1.5],[5.9,2.9],[3.5,4.0],[-1,4.0],[-5,3.4]].map(([x,z])=>new T.Vector3(x,0,z));const curve=new T.CatmullRomCurve3(outline,true),points=curve.getPoints(100),shape=new T.Shape(points.map(p=>new T.Vector2(p.x,-p.z)));
 const deckGeo=new T.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:true,bevelSize:.04,bevelThickness:.025,bevelSegments:2});deckGeo.rotateX(-Math.PI/2);const deck=mesh(deckGeo,'wood',0,UPPER_Y-.13,0);pick(deck,'upper-ground');
 for(let x=-5.6;x<5.6;x+=.38)line([[x,UPPER_Y+.006,-3],[x,UPPER_Y+.006,3]],.006,'brass');
 // Open sea-facing balustrade; the left opening meets the stair bridge.
 for(let i=0;i<points.length-1;i++){const p=points[i];if(p.x< -5.5&&p.z<-.9&&p.z> -2.8)continue;if(i%4===0)cylinder(p.x,UPPER_Y+.49,p.z,.027,.96);if(i%2===0)cylinder(p.x,UPPER_Y+.48,p.z,.009,.92,'brass')}
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];if(a.x< -5.5&&a.z<-.9&&a.z> -2.8)continue;line([[a.x,UPPER_Y+.98,a.z],[b.x,UPPER_Y+.98,b.z]],.035)}
 // Small rounded glazed loft occupies only the rear-left part of the roof.
 const loftCurve=new T.CatmullRomCurve3([[-5.3,-2.9],[-3.3,-3.35],[-.6,-2.9],[.1,-.5],[-1.1,1.1],[-4.1,1.1],[-5.4,-.4]].map(([x,z])=>new T.Vector3(x,0,z)),true);
 const lp=loftCurve.getPoints(48);for(let i=0;i<48;i++){const a=lp[i],b=lp[i+1];if((a.x< -5&&a.z<-.9&&a.z> -2.6)||(a.z>.9&&a.x>-3.2&&a.x<-1.8))continue;const panel=new T.Group();group.add(panel);const mid=a.clone().add(b).multiplyScalar(.5);const pane=box(mid.x,UPPER_Y+1.12,mid.z,.025,2.1,a.distanceTo(b),'glass',panel);pane.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);if(i%3===0)cylinder(a.x,UPPER_Y+1.12,a.z,.027,2.2);walls.push(panel)}
 const roofShape=new T.Shape(lp.map(p=>new T.Vector2(p.x,-p.z))),roofGeo=new T.ExtrudeGeometry(roofShape,{depth:.12,bevelEnabled:true,bevelSize:.13,bevelThickness:.04,bevelSegments:3});roofGeo.rotateX(-Math.PI/2);roofs.push(mesh(roofGeo,'sage',0,UPPER_Y+2.22,0));
 line(lp.map(p=>[p.x,UPPER_Y+2.19,p.z]),.035,'brass');
 // Low bookcase and a recessed reading niche with uneven book spines.
 box(-4.7,UPPER_Y+.75,.5,.48,1.5,1.65);for(let row=0;row<3;row++)for(let i=0;i<9;i++){const mat=new T.MeshStandardMaterial({color:[0x8e9e91,0xc4a37d,0xb67e69,0xd4c9aa][(i+row)%4],roughness:1});box(-4.42,UPPER_Y+.2+row*.44,.5+(i-4)*.155,.16,.24+(i%3)*.045,.105,mat)}
 box(-.65,UPPER_Y+.92,-2.5,.06,.64,.52,'cream');box(-.61,UPPER_Y+.92,-2.5,.025,.42,.34,'sage');
 for(const s of upperSeats){const seat=new T.Group();seat.position.set(s.x,UPPER_Y,s.z);seat.rotation.y=s.yaw;group.add(seat);box(0,.32,0,.85,.16,.8,'wood',seat);cushion(0,.45,0,.44,.11,.4,'cream',seat);cushion(0,.72,-.32,.43,.31,.095,s.zone==='loft'?'sage':'cream',seat);for(const x of [-.39,.39]){cushion(x,.59,0,.065,.09,.37,'cream',seat);for(const z of [-.3,.3])cylinder(x,.15,z,.028,.3,'wood',seat)}cylinder(0,.82,.72,.32,.055,'wood',seat);cylinder(0,.4,.72,.035,.8,'brass',seat);pick(seat,'seat',s.id)}
 // A continuous window bench and woven rug make the reading corner feel lived in.
 box(-3,UPPER_Y+.24,-2.7,2.7,.36,.76,'wood');cushion(-3,UPPER_Y+.45,-2.7,1.36,.09,.39,'cream');
 const rug=mesh(new T.CircleGeometry(1,64),'sage',2.8,UPPER_Y+.015,1.7);rug.rotation.x=-Math.PI/2;rug.scale.set(1.8,1.15,1);rug.castShadow=false;
 // Planters leave the skyline open; small warm lamps sit below eye level.
 for(const [x,z]of [[-1,3.6],[5.1,2.7],[5.5,-2.1]]){box(x,UPPER_Y+.23,z,1,.46,.40,'cream');for(let j=0;j<7;j++){const leaf=cushion(x+(j-3)*.12,UPPER_Y+.68,z,.10,.34,.09,'sage');leaf.rotation.z=Math.sin(j)*.35}}
 for(const [x,z]of [[-3,-1.2],[2.5,1.4],[4,-1.8]]){cylinder(x,UPPER_Y+.78,z,.055,.5,'brass');cylinder(x,UPPER_Y+1.03,z,.19,.23,'cream');cylinder(x,UPPER_Y+.92,z,.15,.025,'glow');const light=new T.PointLight(0xffd6a2,0,7,2);light.position.set(x,UPPER_Y+1,z);group.add(light);lights.push(light)}
 // A real side stair with a top landing, handrails and tread lights.
 const stairs=new T.Group();stairs.name='Loft side stairs';group.add(stairs);for(let i=0;i<28;i++){const z=4.2-(i+.5)*6/28,y=upperGroundY(-7.65,z);box(-7.65,y-.065,z,1.12,.13,6/28+.015,'wood',stairs);if(i%4===0)box(-7.65,y+.008,z+.06,.72,.012,.028,'glow',stairs)}
 for(const x of [-8.22,-7.08]){line([[x,upperGroundY(x,4.2)+.8,4.2],[x,UPPER_Y+.8,-1.8]],.032);for(let i=0;i<=7;i++){const z=4.2-i*6/7;cylinder(x,upperGroundY(-7.65,z)+.4,z,.023,.8)}}
 const bridge=box(-6.5,UPPER_Y-.08,-1.8,2.7,.16,.75);pick(bridge,'upper-ground');pick(stairs,'stairs');const upHit=box(-7.65,upperGroundY(-7.65,4.2)+.3,4.2,1.2,.6,.6,new T.MeshBasicMaterial({visible:false}));pick(upHit,'stairs');
 for(const x of [-7.65,-6]){line([[x,UPPER_Y+.8,-2.17],[x+1.1,UPPER_Y+.8,-2.17]],.03)}
 const starsMarker=cylinder(3.1,UPPER_Y+.035,3.0,.33,.035,'brass');pick(starsMarker,'stargaze');
 return {group,tick(daylight,upper){for(const l of lights)l.intensity=(1-daylight)*(l.position.x<0?7:3);roofs.forEach(o=>o.visible=!upper)},dispose(){}};
}
