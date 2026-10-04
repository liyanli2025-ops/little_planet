import * as T from './vendor/three.module.js';
import {buildMarine} from './cafe-marine.js';
import {buildCoast} from './cafe-coast.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {loadPlantModel} from './plant-models.js';
import {makeCafeFood,disposeCafeObject} from './cafe-food.js';
import {cafeOutline,cafeMenu,cafeSeats,cafeTables} from './cafe-catalog.js';

// Coastal reading room: rounded bays, a recessed entry and a walnut service core.
export function buildCafe(worldRoot,pick,isDisposed){
 const root=new T.Group();root.name="Cafe building";worldRoot.add(root);
 const mats=new Map(),front=new T.Group(),furniture=new T.Group(),roof=new T.Group(),horizon=new T.Group(),decor=new T.Group();root.add(front,furniture,roof,horizon,decor);horizon.visible=false;
 const ready=[],lamps=[],shore=[],occluders=[];
 const mat=(c,r=.8)=>{const key=c+':'+r;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:r}));return mats.get(key)};
 const mesh=(p,g,c,x=0,y=0,z=0)=>{const m=new T.Mesh(g,typeof c==='object'?c:mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m};
 const box=(p,c,x,y,z,w,h,d)=>mesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);
 const cyl=(p,c,x,y,z,r,h,rt=r)=>mesh(p,new T.CylinderGeometry(rt,r,h,32),c,x,y,z);
 const ell=(p,c,x,y,z,a,b=a,d=a)=>{const m=mesh(p,new T.SphereGeometry(1,28,18),c,x,y,z);m.scale.set(a,b,d);return m};
 function rounded(p,c,x,y,z,w,h,d,r=.10){const shape=new T.Shape(),a=w/2,b=d/2;r=Math.min(r,a,b);shape.moveTo(-a+r,-b);shape.lineTo(a-r,-b);shape.quadraticCurveTo(a,-b,a,-b+r);shape.lineTo(a,b-r);shape.quadraticCurveTo(a,b,a-r,b);shape.lineTo(-a+r,b);shape.quadraticCurveTo(-a,b,-a,b-r);shape.lineTo(-a,-b+r);shape.quadraticCurveTo(-a,-b,-a+r,-b);const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3,curveSegments:10});geo.rotateX(-Math.PI/2);return mesh(p,geo,c,x,y-h/2,z)}
 function tube(p,c,points,r=.025){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),Math.max(20,points.length*3),r,8,false),c)}
 function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');let seed=7;const rand=()=>((seed=seed*16807%2147483647)/2147483647);q.fillStyle=kind==='wood'?'#bfa582':'#d6c5a3';q.fillRect(0,0,512,512);if(kind==='wood'){for(let i=0;i<80;i++){q.strokeStyle=`rgba(65,40,20,${.018+rand()*.06})`;q.lineWidth=.5+rand();q.beginPath();const y=rand()*512;for(let x=0;x<=512;x+=32)q.lineTo(x,y+Math.sin(x*.012+i)*3);q.stroke()}for(let i=0;i<8;i++){q.fillStyle='#69533d';q.globalAlpha=.16;q.fillRect(0,i*64,512,2)}q.globalAlpha=1;}else{for(let i=0;i<512;i+=3){q.strokeStyle=i%2?'#b2a38c':'#e6d8ba';q.lineWidth=.6;q.beginPath();q.moveTo(i,0);q.lineTo(i,512);q.stroke();q.beginPath();q.moveTo(0,i);q.lineTo(512,i);q.stroke()}}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='wood'?4:3,kind==='wood'?4:3);return t}
 const timber=new T.MeshStandardMaterial({map:texture('wood'),roughness:.87}),woven=new T.MeshStandardMaterial({map:texture('fabric'),color:0xe5d5b4,roughness:1});
 const seaMat=new T.MeshStandardMaterial({color:0x7fb7b5,roughness:.32,metalness:.08});mesh(worldRoot,new T.SphereGeometry(17.8,80,48),seaMat,0,-18.25,0);
 const curve=new T.CatmullRomCurve3(cafeOutline.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal'),outline=curve.getPoints(140),floorShape=new T.Shape(outline.map(v=>new T.Vector2(v.x,-v.z)));
 function slab(parent,shape,y,depth,color){const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.07,bevelThickness:.045,bevelSegments:3,curveSegments:18});geo.rotateX(-Math.PI/2);return mesh(parent,geo,color,0,y,0)}
 slab(root,floorShape,-.02,.18,0x67513e);const floor=slab(root,floorShape,.17,.025,timber);const uv=floor.geometry.attributes.uv,pos=floor.geometry.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/14,pos.getZ(i)/10);uv.needsUpdate=true;
 // Outside arrival deck wraps around a recessed front door.
 rounded(root,timber,0,.10,5.1,3.2,.18,2.3,.55);
 for(let i=0;i<15;i++){const z=6.3+i*.18,top=.10-i*.205,ground=-18.25+Math.sqrt(17.84*17.84-z*z);rounded(root,0xb8a180,0,(top+ground)/2,z,2.5,Math.max(.1,top-ground),.25,.07)}
 const wood=0x59402d,brass=0xb39464,glass=new T.MeshPhysicalMaterial({color:0xc8dfd5,transparent:true,opacity:.10,roughness:.15,metalness:.04,depthWrite:false,side:T.DoubleSide});
 const perimeter=curve.getSpacedPoints(32);
 for(let i=0;i<32;i++){const a=perimeter[i],b=perimeter[i+1],mid=a.clone().add(b).multiplyScalar(.5),length=a.distanceTo(b),angle=Math.atan2(b.x-a.x,b.z-a.z),part=new T.Group();root.add(part);part.userData.wall=true;part.userData.center=mid.clone();occluders.push(part);
  if(mid.z>3.4&&Math.abs(mid.x)<1.55)continue;
  const glassPanel=box(part,glass,mid.x,1.95,mid.z,.035,3.15,length-.07);glassPanel.rotation.y=angle;
  const sill=box(part,0x9c8060,mid.x,.31,mid.z,.14,.23,length+.04);sill.rotation.y=angle;
  const lintel=box(part,wood,mid.x,3.59,mid.z,.15,.16,length+.08);lintel.rotation.y=angle;
  cyl(part,wood,a.x,1.94,a.z,.047,3.37);
  if(i%4===1){for(let j=0;j<6;j++){const t=j*.055,px=a.x+(b.x-a.x)*t,pz=a.z+(b.z-a.z)*t;const drape=ell(part,0xe8dec6,px,1.94,pz,.07,1.53,.06);drape.rotation.y=angle}}
 }
 // Layered curved eaves and a glazed oval rooflight; no rectangular box roof.
 const roofShape=floorShape.clone(),skylight=new T.Path();skylight.absellipse(.3,.1,2.1,1.3,0,Math.PI*2,true);roofShape.holes.push(skylight);
 slab(roof,roofShape,3.66,.14,0xe0d3b7);slab(roof,roofShape,3.84,.09,0x64766a);
 const roofRim=outline.map(v=>[v.x,3.97,v.z]);roofRim.push(roofRim[0]);tube(roof,0xb8b097,roofRim,.035);
 const roofGlass=mesh(roof,new T.CircleGeometry(1,64),glass,.3,3.86,.1);roofGlass.rotation.x=-Math.PI/2;roofGlass.scale.set(2.08,1.28,1);
 for(let i=-1;i<=1;i++){const beam=box(roof,wood,.3+i*.72,3.90,.1,.045,.05,2.45);}
 function art(p,x,y,z,w,h,kind,angle=0){const c=document.createElement('canvas');c.width=384;c.height=256;const q=c.getContext('2d');q.fillStyle='#e8ddc5';q.fillRect(0,0,384,256);if(kind==='sign'){q.fillStyle='#4c5143';q.textAlign='center';q.font='34px serif';q.fillText('海 风 来 信',192,113);q.font='17px serif';q.fillText('COFFEE  ·  SEA  ·  STORIES',192,159)}else{q.fillStyle=['#94b8b0','#b4b58d','#a8b9bd'][kind%3];q.fillRect(18,18,348,220);q.fillStyle='#efdcaa';q.beginPath();q.arc(270,72,27,0,7);q.fill();q.fillStyle='#729994';q.fillRect(18,145,348,93);q.fillStyle='#d6c29c';q.beginPath();q.moveTo(18,207);q.quadraticCurveTo(160,124,366,208);q.lineTo(366,238);q.lineTo(18,238);q.fill();q.fillStyle='#627e6c';q.beginPath();q.moveTo(70,170);q.lineTo(110,91);q.lineTo(145,175);q.fill()}const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;p.add(g);rounded(g,wood,0,0,0,w+.10,h+.10,.055,.04);const plane=mesh(g,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:new T.CanvasTexture(c),roughness:1}),0,0,.09);return g}
 const sign=art(front,0,3.0,4.15,2.35,.78,'sign');
 // Smooth walnut horseshoe counter and brass footrail.
 const bar=new T.Shape();bar.moveTo(-4.25,3.9);bar.lineTo(.6,3.9);bar.quadraticCurveTo(1.10,3.8,1.10,3.25);bar.quadraticCurveTo(.9,2.50,-.1,2.48);bar.lineTo(-3.6,2.48);bar.quadraticCurveTo(-4.5,2.55,-4.5,3.15);bar.quadraticCurveTo(-4.5,3.7,-4.25,3.9);
 slab(root,bar,.21,1.0,wood);slab(root,bar,1.22,.10,0x7f5c40);
 for(let i=0;i<30;i++)box(decor,i%2?0x64442d:0x795138,-3.7+i*.127,.70,-2.465,.055,.91,.034);
 tube(decor,brass,[[-4.1,.4,-2.6],[-3.7,.4,-2.23],[-.4,.4,-2.23],[.75,.4,-2.67]],.027);
 // Plaster service wall with deep shelves, books, cups and postcards.
 rounded(root,0xd9ccb1,-1.75,1.9,-4.68,5.8,3.35,.22,.22);
 for(const y of [1.12,1.85,2.60]){rounded(decor,wood,-1.75,y,-4.48,5.5,.065,.40,.035);for(let i=0;i<11;i++){const x=-4.1+i*.44;if(y===1.85&&i>6)continue;const bottle=cyl(decor,[0x698578,0xb18a62,0x8e6d53,0xd5c59c][i%4],x,y+.19,-4.40,.065,.29,.052);cyl(decor,brass,x,y+.365,-4.40,.028,.075)}}
 for(let i=0;i<5;i++)art(decor,-.25+i*.29,2.15+(i%2)*.035,-4.43,.22,.28,i,.02*(i-2));
 const machine=rounded(decor,0x9ba99b,-3.15,1.61,-3.38,.84,.52,.51,.09);box(decor,0x394d43,-3.15,1.56,-3.11,.72,.22,.035);rounded(decor,0xc4c9b8,-3.15,1.35,-3.10,.87,.04,.29,.025);
 for(const x of [-3.36,-3.02]){cyl(decor,brass,x,1.5,-3.04,.023,.17);const cup=makeCafeFood('cafe_latte');cup.scale.setScalar(.65);cup.position.set(x,1.36,-3.03);decor.add(cup)}
 cyl(decor,0x46584b,-4.03,1.53,-3.34,.15,.4);cyl(decor,0x9f7753,-4.03,1.87,-3.34,.13,.25,.16);
 for(let i=0;i<4;i++){const cup=makeCafeFood('cafe_latte');cup.position.set(-1.5+i*.24,1.33,-3.3);cup.scale.setScalar(.6);decor.add(cup)}
 rounded(decor,0xa88460,-.3,1.34,-2.99,.45,.04,.28,.08);for(let i=0;i<4;i++)box(decor,0xe9dfc6,-.3,1.38+i*.008,-2.99,.20,.008,.17);
 pick(box(root,new T.MeshBasicMaterial({visible:false}),-1.65,1.4,-3.0,5.5,2,1.5),'drinks');
 // Curved-end refrigerated display and thin bronze framing.
 rounded(root,wood,2.9,.71,-3.3,3.05,1,1.22,.25);rounded(root,0xcbb99b,2.9,1.25,-3.3,3.2,.10,1.34,.22);
 for(const x of [1.31,4.49]){box(decor,glass,x,1.83,-3.3,.026,1.07,1.24);for(const z of [-3.92,-2.68])cyl(decor,brass,x,1.83,z,.018,1.09)}
 box(decor,glass,2.9,1.83,-2.68,3.15,1.07,.025);box(decor,glass,2.9,2.38,-3.3,3.2,.025,1.25);box(decor,glass,2.9,1.82,-3.3,3.10,.025,1.20);
 cafeMenu.filter(i=>i.kind==='dessert').forEach((item,i)=>{const x=1.86+(i%3)*1.04,y=i<3?1.31:1.86;const f=makeCafeFood(item.id,{display:true});f.position.set(x,y,-3.24);root.add(f);ready.push(f.userData.ready);pick(box(root,new T.MeshBasicMaterial({visible:false}),x,y+.2,-3.18,.96,.43,1.10),'item',item.id)});
 // Layered woven rugs define each window bay.
 for(const [i,[x,z]]of cafeTables.entries()){const rug=mesh(furniture,new T.CircleGeometry(1,64),woven,x,.252,z);rug.rotation.x=-Math.PI/2;rug.scale.set(1.63,1.16,1);const rim=mesh(furniture,new T.RingGeometry(.93,1,64),mat(i%2?0x85917a:0xbb966d),x,.255,z);rim.rotation.x=-Math.PI/2;rim.scale.set(1.64,1.17,1);
  cyl(furniture,wood,x,.62,z,.065,.74);cyl(furniture,wood,x,.26,z,.34,.065);cyl(furniture,i%2?0xa7825e:0xc8af88,x,1.0,z,.56,.08);const vase=cyl(furniture,[0xb99878,0x8d9b89,0xd6cbb4][i%3],x,1.13,z,.064,.18,.048);for(let j=0;j<3;j++){tube(furniture,0x758366,[[x,1.18,z],[x+(j-1)*.055,1.35,z+.03]],.005);ell(furniture,i%2?0xe2c799:0xdcb7a7,x+(j-1)*.055,1.37,z+.03,.035,.024,.036)}
  const napkin=rounded(furniture,0xe4dac5,x+.29,1.048,z+.02,.20,.007,.16,.015);napkin.rotation.y=.2;cyl(furniture,0xc0aa79,x-.28,1.12,z,.048,.12);const flame=ell(furniture,new T.MeshBasicMaterial({color:0xffd18b}),x-.28,1.2,z,.011,.026,.011);
 }
 for(const s of cafeSeats){const g=new T.Group();g.position.set(s.x,.21,s.z);g.rotation.y=s.yaw;furniture.add(g);if(s.zone==='bar'){g.position.y+=.27;for(const side of [-1,1])for(const z of [-.21,.21])cyl(g,wood,side*.25,-.07,z,.03,.5);tube(g,0xb29258,[[-.28,.05,.26],[.28,.05,.26]],.018)}g.userData.chair=true;occluders.push(g);const color=[0xb6b99a,0xcbb493,0xbe9680,0xa0b1a4][s.table%4];rounded(g,wood,0,.34,0,.7,.13,.65,.19);ell(g,color,0,.45,.01,.37,.09,.34);ell(g,color,0,.78,-.28,.38,.34,.10);for(const side of [-1,1]){ell(g,color,side*.34,.62,-.015,.075,.085,.31);for(const z of [-.21,.21])cyl(g,wood,side*.25,.18,z,.023,.35)}const pillow=ell(g,s.table%2?0xe0c38e:0xd9c9ad,.07,.75,-.15,.20,.20,.073);pillow.rotation.z=.10;pick(box(g,new T.MeshBasicMaterial({visible:false}),0,.54,.02,.68,.48,.65),'seat',s.id)}
 // Book nook, a turntable and postcards give the cafe its own history.
 const library=new T.Group();library.position.set(-6.25,.21,-1.45);library.rotation.y=.55;decor.add(library);rounded(library,wood,0,1.02,0,1.75,2.05,.42,.09);
 for(let row=0;row<4;row++){box(library,0x896c49,0,.28+row*.46,.05,1.7,.035,.46);for(let j=0;j<13;j++){const h=.23+(j%4)*.036,book=box(library,[0x8f9c84,0xc5ae83,0xa47561,0x7e9193,0xd0c4a5][(j+row)%5],-.74+j*.12,.3+row*.46+h/2,.27,.075+(j%2)*.018,h,.18);book.rotation.z=j%6===0?.09:0;box(library,0xe1d4b8,-.74+j*.12,.34+row*.46,.365,.05,.01,.005)}}
 const music=rounded(decor,wood,-5.25,.60,-3.0,1.25,.75,.62,.09);rounded(decor,0xbda887,-5.25,1.02,-3.0,1.12,.07,.54,.07);cyl(decor,0x303b33,-5.33,1.073,-2.99,.19,.012);cyl(decor,0xc6ab77,-5.33,1.083,-2.99,.055,.009);tube(decor,brass,[[-4.88,1.1,-3.14],[-4.96,1.14,-3.0],[-5.2,1.14,-2.93]],.012);
 for(const [x,z,variant,height]of [[-5.8,3.65,'monstera',1.45],[6.0,1.4,'yucca',1.6],[-5.3,-3.65,'pothos',1.10],[5.5,-2.4,'monstera',1.3],[2,4.15,'zzplant',1.0],[-2.4,4.0,'sansevieria',1.0]])ready.push(loadPlantModel({standard:'floorPlant',variant,width:height*.65,height,depth:height*.65,shape:'round',planter:'ceramic',tint:'#e6dac3'}).then(g=>{g.position.set(x,.21,z);if(isDisposed())disposeCafeObject(g);else decor.add(g)}).catch(()=>{}));
 function pendant(x,z,y=2.85,r=.28){const g=new T.Group();g.position.set(x,y,z);decor.add(g);g.userData.pendant=true;occluders.push(g);const shade=cyl(g,0xc4a775,0,0,0,r,.26,r*.70);const glow=ell(g,new T.MeshStandardMaterial({color:0xffdfb3,emissive:0xffc786,emissiveIntensity:.5}),0,-.13,0,r*.85,.025,r*.85);lamps.push(glow);cyl(g,wood,0,(3.65-y)/2,0,.008,3.65-y);for(let i=0;i<14;i++){const a=i/14*Math.PI*2;tube(g,0x91764d,[[Math.cos(a)*r*.70,.13,Math.sin(a)*r*.70],[Math.cos(a)*r,-.11,Math.sin(a)*r]],.007)}}
 for(const [x,z]of [[-3.4,-2.5],[-1,-2.5],[3.1,-2.3],[-4,2.3],[4.6,1.8],[.1,2.6]])pendant(x,z,2.7,.24);
 for(const [x,z]of [[-6.6,-.55],[6.4,-1.5]]){cyl(decor,brass,x,1.12,z,.023,1.82);cyl(decor,wood,x,.25,z,.23,.035);cyl(decor,0xd1bd96,x,2.10,z,.33,.35,.21);const lamp=ell(decor,new T.MeshStandardMaterial({color:0xffe2b6,emissive:0xffc887,emissiveIntensity:.5}),x,1.94,z,.27,.025,.27);lamps.push(lamp)}
 const string=[];for(let i=0;i<=32;i++){const x=-6.5+i*.4,y=3.0-.30*Math.sin(i/32*Math.PI),z=3.5+Math.cos(i*.14)*.30;string.push([x,y,z]);if(i%2===0){const bulb=ell(decor,new T.MeshStandardMaterial({color:0xffe4b0,emissive:0xffb968,emissiveIntensity:1}),x,y-.055,z,.028);lamps.push(bulb)}}tube(decor,wood,string,.008);
 pick(box(root,new T.MeshBasicMaterial({visible:false}),0,1.4,4.15,2.3,2.6,.1),'enter');const ground=slab(root,floorShape,.198,.003,new T.MeshBasicMaterial({visible:false}));pick(ground,'ground');pick(box(root,new T.MeshBasicMaterial({visible:false}),0,.19,5.2,3.2,.01,2.8),'ground');
 const {planet,coast,awning}=buildCoast({root,roof,furniture,pick,box,cyl,ell,rounded,tube,timber,lamps});
 // Batch opaque static decoration; keep interactive targets and curtains separate.
 function batch(group){group.updateWorldMatrix(true,true);const byMat=new Map();for(const o of [...group.children]){if(!o.isMesh||o.material.transparent||o.userData.pick)continue;const list=byMat.get(o.material)||[];list.push(o);byMat.set(o.material,list)}for(const [material,list]of byMat){if(list.length<3)continue;const geos=list.map(o=>(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix));const combined=mergeGeometries(geos,false);if(combined){const m=new T.Mesh(combined,material);m.castShadow=m.receiveShadow=true;group.add(m);for(const o of list){group.remove(o);o.geometry.dispose()}}geos.forEach(g=>g.dispose())}}
 batch(decor);batch(furniture);batch(coast);const marine=buildMarine(worldRoot,seaMat,isDisposed);ready.push(marine.ready);
 return {occluders,building:root,marine,planet,awning,roof,front,furniture,horizon,shore,seaMat,ready,lamps,mesh,box};
}