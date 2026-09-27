import * as T from './vendor/three.module.js';
import {foodCatalog} from './food-catalog.js';
export function makeFood(id){const f=foodCatalog[id];if(!f)throw Error('Unknown food '+id);const g=new T.Group(),materials=new Map();const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.8}));return materials.get(c)};
 function mesh(geo,c,x=0,y=0,z=0){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}
 const box=(c,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z),ball=(c,x,y,z,a,b=a,d=a)=>{const m=mesh(new T.SphereGeometry(1,20,14),c,x,y,z);m.scale.set(a,b,d);return m},cyl=(c,x,y,z,a,b,h)=>mesh(new T.CylinderGeometry(a,b,h,28),c,x,y,z);
 function tube(c,pts,r=.012){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),24,r,6,false),c)}
 const tray=()=>{box(0xe9e4d5,0,.024,0,.36,.045,.28);for(const x of [-.175,.175])box(0xc9d7cf,x,.05,0,.018,.045,.29);for(const z of [-.14,.14])box(0xc9d7cf,0,.05,z,.36,.045,.018)},bowl=()=>{cyl(0x9fbeb4,0,.09,0,.19,.12,.17);cyl(0xf3e6c9,0,.18,0,.175,.175,.014)},leaf=(x,y,z,c=f.color)=>{const m=ball(c,x,y,z,.08,.03,.055);m.rotation.z=x*3;return m};const c=f.color;
 switch(f.shape){
 case 'carton':box(0xf3edde,0,.2,0,.22,.37,.18);box(c,0,.19,.093,.204,.20,.009);const roof=cyl(0xf1ead6,0,.416,0,.06,.155,.085);roof.rotation.y=Math.PI/4;box(c,0,.45,0,.22,.02,.035);cyl(0xe7d1b4,.065,.41,.027,.025,.025,.035);break;
 case 'bottle':cyl(c,0,.16,0,.09,.085,.29);ball(c,0,.30,0,.09,.08,.09);cyl(c,0,.365,0,.038,.038,.09);cyl(0xe9d9b8,0,.419,0,.046,.046,.025);cyl(0xf4ead1,0,.16,0,.092,.092,.11);break;
 case 'can':if(id==='cola'){box(0xf2ead4,0,.16,.087,.12,.035,.007);box(0xf2ead4,.018,.205,.087,.09,.018,.007)}cyl(c,0,.17,0,.086,.086,.31);cyl(0xd9dcd2,0,.33,0,.083,.083,.018);mesh(new T.TorusGeometry(.022,.005,6,14),0x718378,0,.342,0).rotation.x=Math.PI/2;break;
 case 'cup':cyl(c,0,.15,0,.105,.08,.28);cyl(0xf0e8d8,0,.3,0,.114,.114,.025);box(0xe8b796,.03,.41,0,.013,.2,.013);break;
 case 'jar':cyl(c,0,.14,0,.106,.098,.25);cyl(0xc5ac7b,0,.275,0,.11,.11,.032);box(0xf0e3c7,0,.145,.103,.14,.09,.01);break;
 case 'egg':tray();for(let i=0;i<4;i++)ball(c,(i%2-.5)*.14,.11,(Math.floor(i/2)-.5)*.12,.056,.08,.056);break;
 case 'cheese':const sh=new T.Shape();sh.moveTo(-.16,-.13);sh.lineTo(.16,-.13);sh.lineTo(-.16,.13);sh.closePath();const cm=mesh(new T.ExtrudeGeometry(sh,{depth:.13,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,steps:1}),c,0,.05,0);cm.rotation.x=-Math.PI/2;for(let i=0;i<3;i++)ball(0xc99d4c,-.10+i*.05,.185,-.06,.017,.006,.017);break;
 case 'wrapped':box(0xebddba,0,.06,0,.3,.11,.22);box(c,0,.117,0,.25,.007,.17);break;
 case 'tray':tray();for(let i=0;i<4;i++)box(c,(i%2-.5)*.15,.10,(Math.floor(i/2)-.5)*.12,.13,.10,.1);break;
 case 'carrot':const m=cyl(c,0,.18,0,.066,.012,.31);m.rotation.z=.3;for(let i=0;i<3;i++)tube(0x6f935b,[[0,.33,0],[(i-1)*.07,.47,0]],.012);break;
 case 'longveg':for(let i=0;i<2;i++){const m=ball(c,(i-.5)*.09,.09,0,.05,.05,.20);m.rotation.y=.17;}break;
 case 'leaves':for(let i=0;i<9;i++){const a=i*2.4;leaf(Math.cos(a)*.09,.06+i*.012,Math.sin(a)*.07,i%2?c:0xc3cf97)}break;
 case 'broccoli':cyl(0xa6b47b,0,.09,0,.035,.06,.17);for(let i=0;i<7;i++)ball(c,Math.cos(i*2.4)*.09,.19+Math.sin(i)*.025,Math.sin(i*2.4)*.07,.075);break;
 case 'mushroom':for(let i=0;i<3;i++){const x=(i-1)*.10,z=(i%2)*.09;cyl(0xe6dbc1,x,.08,z,.028,.036,.13);ball(c,x,.15,z,.075,.044,.075)}break;
 case 'grapes':case 'berries':tray();for(let i=0;i<16;i++)ball(c,Math.sin(i*2.4)*.12,.07+Math.floor(i/6)*.04,Math.cos(i*2.4)*.09,f.shape==='grapes'?.036:.025);break;
 case 'melon':tray();for(let i=0;i<3;i++){box(0x6f9864,(i-1)*.095,.08,0,.085,.08,.20);box(c,(i-1)*.095,.135,0,.081,.06,.19);for(let j=0;j<2;j++)ball(0x514834,(i-1)*.095,.17,j*.06-.03,.007)}break;
 case 'tomato':case 'pepper':case 'apple':case 'orange':case 'peach':case 'lemon':case 'berry':ball(c,0,.15,0,f.shape==='lemon'?.17:.14,.14,.13);cyl(0x74824a,0,.3,0,.013,.014,.065);leaf(.045,.29,0,0x7c995b);if(f.shape==='berry')for(let i=0;i<12;i++)ball(0xf0d09a,Math.sin(i*2.4)*.12,.08+(i%4)*.046,Math.cos(i*2.4)*.11,.008);break;
 case 'pudding':cyl(0xeee4c8,0,.02,0,.2,.2,.035);cyl(c,0,.14,0,.11,.15,.21);cyl(0x966b47,0,.25,0,.11,.11,.018);break;
 case 'cookies':tray();for(let i=0;i<4;i++){cyl(c,(i%2-.5)*.14,.073+Math.floor(i/2)*.024,0,.09,.09,.024);for(let j=0;j<4;j++)ball(0x775238,(i%2-.5)*.14+Math.sin(j*2.1)*.05,.09+Math.floor(i/2)*.024,Math.cos(j*2.1)*.05,.008)}break;
 case 'cake':box(c,0,.10,0,.27,.18,.24);box(0xf3e8d6,0,.21,0,.28,.035,.25);ball(0xd87a74,0,.255,0,.049);break;
 case 'bread':case 'sandwich':case 'roujiamo':cyl(0xf0e4c9,0,.02,0,.22,.22,.024);if(f.shape==='roujiamo'){ball(c,0,.075,0,.19,.055,.15);for(let i=0;i<7;i++)ball(i%2?0x93623f:0x72955a,Math.sin(i*2.4)*.13,.13,Math.cos(i*2.4)*.11,.038,.025,.03);ball(c,0,.18,0,.19,.055,.15);for(let i=0;i<6;i++)ball(0xf0d6a0,Math.sin(i*2.4)*.1,.232,Math.cos(i*2.4)*.08,.01,.004,.006);}else{box(c,0,.07,0,.29,.07,.25);if(f.shape==='sandwich'){box(0x739558,0,.12,0,.31,.02,.25);box(0xc48268,0,.15,0,.27,.035,.23);}box(0xeedeae,0,f.shape==='sandwich'?.20:.14,0,.29,.06,.25)}break;
 case 'rice':bowl();for(let i=0;i<25;i++)ball(0xf6eedb,Math.sin(i*2.4)*.14,.195+(i%3)*.009,Math.cos(i*2.4)*.13,.022,.011,.01);break;
 case 'noodles':bowl();for(let i=0;i<7;i++)tube(c,Array.from({length:20},(_,j)=>{const a=j*.5;return [Math.sin(a+i)*(.06+i*.012),.20+i*.004,Math.cos(a+i)*(.06+i*.01)]}),.009);leaf(-.09,.23,.04,0x85a45e);ball(0xf1e9cc,.07,.225,-.035,.058,.013,.043);ball(0xe2be61,.07,.239,-.035,.025,.006,.023);break;
 case 'salad':bowl();for(let i=0;i<10;i++){const x=Math.sin(i*2.4)*.13,z=Math.cos(i*2.4)*.12;leaf(x,.21+(i%2)*.02,z, i%2?0x92b667:0xbdc984);if(i%3===0)ball(0xd5765f,x,.26,z,.029)}break;
 case 'skewers':tray();for(let i=0;i<3;i++){const x=(i-1)*.1;box(0xc5a474,x,.08,0,.012,.012,.38);for(let j=0;j<3;j++){const m=box((i+j)%3?c:0x789755,x,.115,(j-1)*.09,.074,.068,.07);m.rotation.y=.2}}break;
 case 'sushi':tray();for(let i=0;i<3;i++){const x=(i-1)*.1;box(0xf2e9d6,x,.09,0,.083,.09,.15);box(c,x,.147,0,.09,.028,.16);box(0x566955,x,.167,0,.026,.008,.16)}break;
 case 'meal':tray();for(let i=0;i<4;i++)ball(c,-.09,.08,(i-1.5)*.06,.055,.032,.031);for(let i=0;i<9;i++)ball(0xeee5d0,.08+Math.sin(i)*.04,.07,Math.cos(i)*.09,.025,.02,.025);leaf(0,.11,-.07,0x809d60);break;
 case 'icecream':cyl(0xb8cbb9,0,.08,0,.16,.13,.14);for(let i=0;i<3;i++)ball(i%2?0xe9dac0:c,Math.sin(i*2.1)*.065,.19,Math.cos(i*2.1)*.055,.085);break;
 case 'dumplings':case 'bao':tray();for(let i=0;i<4;i++){const x=(i%2-.5)*.15,z=(Math.floor(i/2)-.5)*.12;ball(c,x,.11,z,.064,f.shape==='bao'?.07:.045,.05);for(let j=0;j<4;j++)box(0xd4c8b2,x+(j-1.5)*.02,.15,z,.006,.008,.05)}break;
 case 'shrimp':tray();for(let i=0;i<5;i++)tube(c,Array.from({length:9},(_,j)=>[(i%3-1)*.1+Math.cos(j*.4)*.035,.09,Math.floor(i/3)*.11-.07+Math.sin(j*.4)*.035]),.016);break;
 case 'fish':case 'meat':tray();ball(c,0,.10,0,.155,.05,.105);for(let i=0;i<4;i++)tube(0xeacfc0,[[-.10+i*.045,.143,-.065],[-.12+i*.045,.15,0],[-.08+i*.045,.142,.065]],.006);break;
 case 'peas':tray();for(let i=0;i<24;i++)ball(i%3?c:0xe3c46b,Math.sin(i*2.4)*.14,.07+(i%3)*.014,Math.cos(i*2.4)*.11,.018);break;
 default:throw Error('Missing food geometry '+f.shape);
 }g.userData.food=id;return g;
}
