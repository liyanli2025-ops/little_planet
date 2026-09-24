import * as T from './vendor/three.module.js';
export function createLifestyle({outdoor,avatar,body,legs,arms,place,box,ball,cylinder,line,mat,interactive,normal}){
const camp=place(outdoor,-1.35,.02),tent=new T.Group();camp.add(tent);
const cloth=new T.MeshStandardMaterial({color:0xbc9064,roughness:.94,side:T.DoubleSide});
function panel(points){let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.computeVertexNormals();let m=new T.Mesh(geo,cloth);m.castShadow=true;m.receiveShadow=true;tent.add(m)}
box(tent,0x75846a,0,.025,0,1.38,.04,1.38);
for(let s of [-1,1]){panel([0,.96,-.64,s*.67,.06,-.64,s*.67,.06,.64,0,.96,-.64,s*.67,.06,.64,0,.96,.64]);line(tent,0xede0ba,new T.Vector3(0,.97,-.65),new T.Vector3(s*.68,.07,-.65),.012);line(tent,0xede0ba,new T.Vector3(0,.97,.65),new T.Vector3(s*.68,.07,.65),.012);for(let z of [-.65,.65]){line(tent,0xeee0b8,new T.Vector3(s*.53,.25,z),new T.Vector3(s*.91,.015,z*1.28),.008);cylinder(tent,0x77684c,s*.91,.04,z*1.28,.018,.018,.09)}}
panel([-.67,.06,-.64,0,.96,-.64,.67,.06,-.64]);
panel([-.67,.06,.65,0,.96,.65,-.34,.08,.7]);panel([.67,.06,.65,0,.96,.65,.34,.08,.7]);
line(tent,0xe5d7b0,new T.Vector3(0,.99,-.68),new T.Vector3(0,.99,.69),.027);
for(let x of [-.24,.24]){box(tent,0xaab2a0,x,.065,-.05,.35,.06,.85);let pillow=ball(tent,0xe8d8b9,x,.11,-.35,.14,12);pillow.scale.set(.17,.065,.12)}
const blanket=box(camp,0xccb18a,0,.027,1.05,.98,.03,.56);for(let x of [-.32,0,.32])box(camp,0xe6d4b0,x,.046,1.05,.08,.008,.55);
const lamp=new T.Group();camp.add(lamp);lamp.position.set(.83,.04,.5);cylinder(lamp,0x6b745f,0,.01,0,.085,.085,.025);cylinder(lamp,0xf1d390,0,.13,0,.057,.057,.2);cylinder(lamp,0x65745c,0,.25,0,.09,.063,.055);let glow=new T.PointLight(0xffd394,1.1,2);glow.position.set(.83,.25,.5);camp.add(glow);
const roll=box(camp,0x95a18b,0,.13,0,.5,.2,.28);box(camp,0x70836b,-.13,.24,0,.035,.025,.3);box(camp,0x70836b,.13,.24,0,.035,.025,.3);
interactive('camp',-1.35,.02,.7,-1.35,.28);
const sitFrame=place(outdoor,.92,.52);
legs.forEach((g,i)=>g.name='leg-'+i);arms.forEach((g,i)=>g.name='arm-'+i);body.name='body';
const companion=avatar.clone(true);outdoor.add(companion);companion.visible=false;
const compBody=companion.getObjectByName('body'),compLegs=[0,1].map(i=>companion.getObjectByName('leg-'+i)),compArms=[0,1].map(i=>companion.getObjectByName('arm-'+i));
companion.traverse(m=>{if(m.isMesh){m.material=m.material.clone();if([mat(0x71979a),mat(0x769799),mat(0x6a9094)].some(x=>x.color.getHex()===m.material.color.getHex()))m.material.color.set(0xb38562)}});
function book(parent){let g=new T.Group();parent.add(g);g.position.set(0,.4,.27);g.rotation.x=-.28;for(let s of [-1,1]){let cover=box(g,0x547b65,s*.073,0,0,.145,.018,.18);cover.rotation.z=-s*.12;let pages=box(g,0xf5ebcf,s*.071,.012,0,.138,.023,.17);pages.rotation.z=-s*.12;for(let j=0;j<4;j++)box(g,0xd6c9a8,s*.07,.027,-.057+j*.031,.082,.002,.003)}let page=box(g,0xfaf1d6,.07,.037,0,.14,.003,.17);g.visible=false;return {g,page}}
const mainBook=book(body),otherBook=book(compBody);
let active='',together=false,built=false,reading=false,turn=0,tentScale=.03;
function pose(a,b,ls,as,x,frame,read){a.position.set(x,active==='bench'?.19:.04,active==='bench'?0:1.05);a.quaternion.identity();frame.add(a);ls.forEach(g=>g.rotation.x=-1.15);as.forEach((g,i)=>{g.rotation.x=read?-1.05:-.35;g.rotation.z=(i===0?1:-1)*.12});b.position.y=0}
return {get active(){return active},get paired(){return together},get reading(){return reading},campBuilt(v){built=v;roll.visible=!v;tent.visible=v;blanket.visible=v;lamp.visible=v;glow.visible=v;if(!v&&active==='camp')this.stand()},sit(pair=false,read=true){active='bench';together=pair;reading=read;pose(avatar,body,legs,arms,pair?-.32:0,sitFrame,read);companion.visible=pair;if(pair)pose(companion,compBody,compLegs,compArms,.32,sitFrame,read);mainBook.g.visible=read;otherBook.g.visible=pair&&read;},rest(pair=false){if(!built)return;active='camp';together=pair;reading=false;pose(avatar,body,legs,arms,pair?-.32:0,camp,false);companion.visible=pair;if(pair)pose(companion,compBody,compLegs,compArms,.32,camp,false);mainBook.g.visible=false;otherBook.g.visible=false;},stand(){if(!active)return;outdoor.add(avatar);avatar.position.set(0,0,0);avatar.quaternion.identity();legs.forEach(g=>g.rotation.x=0);arms.forEach(g=>{g.rotation.x=0;g.rotation.z=0});body.position.y=0;companion.visible=false;mainBook.g.visible=false;otherBook.g.visible=false;active='';together=false;reading=false;},turnPage(){turn=Math.PI},tick(dt,t){const goal=built?1:.03;tentScale+=(goal-tentScale)*(1-Math.exp(-dt*7));tent.scale.setScalar(tentScale);if(active){body.position.y=Math.sin(t*1.3)*.005;compBody.position.y=Math.sin(t*1.3+.5)*.005;if(reading){turn=Math.max(0,turn-dt*3.8);mainBook.page.rotation.z=Math.sin(turn)*1.6;otherBook.page.rotation.z=Math.sin(turn)*1.6}}glow.intensity=1+Math.sin(t*3)*.08},focus(){if(!active)return null;let center=avatar.getWorldPosition(new T.Vector3());if(together)center.add(companion.getWorldPosition(new T.Vector3())).multiplyScalar(.5);return center.add(new T.Vector3(0,.38,0))},state(){return {activity:active,paired:together,reading,tent:built}}}
}

