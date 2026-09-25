import * as T from './vendor/three.module.js';
import {createRainGear} from './rain-gear.js?v=7';
export function createTeddy(parent,identity=0){
 const avatar=new T.Group(),body=new T.Group(),head=new T.Group();parent.add(avatar);avatar.add(body);body.name='body';body.add(head);head.position.y=.8;
 const fur=new T.MeshStandardMaterial({color:0xf3f2ed,roughness:.97}),muzzleMat=new T.MeshStandardMaterial({color:0xf5eee2,roughness:1}),earMat=new T.MeshStandardMaterial({color:0xe0ddd6,roughness:1}),black=new T.MeshStandardMaterial({color:0x292323,roughness:.36});
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),pixels=ctx.createImageData(128,128);let seed=13;for(let i=0;i<pixels.data.length;i+=4){seed=seed*16807%2147483647;let v=80+seed%135;pixels.data.set([v,v,v,255],i)}ctx.putImageData(pixels,0,0);fur.bumpMap=new T.CanvasTexture(c);fur.bumpMap.wrapS=fur.bumpMap.wrapT=T.RepeatWrapping;fur.bumpMap.repeat.set(4,4);fur.bumpScale=.0016;
 function ell(p,m,x,y,z,sx,sy,sz){const o=new T.Mesh(new T.SphereGeometry(1,40,28),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;p.add(o);return o}
 // One continuous pear-shaped surface makes the head, shoulders and belly feel soft.
 const profile=[[0,.16],[.19,.17],[.28,.23],[.325,.34],[.337,.46],[.312,.58],[.279,.70],[.282,.82],[.268,.92],[.207,1.005],[.11,1.047],[0,1.06]];
 const curve=new T.CatmullRomCurve3(profile.map(([r,y])=>new T.Vector3(r,y,0)),false,'centripetal');const pts=curve.getPoints(100).map(v=>new T.Vector2(Math.max(0,v.x),v.y));
 const torso=new T.Mesh(new T.LatheGeometry(pts,64),fur);torso.scale.z=.81;torso.castShadow=torso.receiveShadow=true;body.add(torso);
 const legs=[],arms=[];
 for(let i=0;i<2;i++){let s=i?1:-1,g=new T.Group();body.add(g);g.position.set(s*.145,.25,0);g.name='leg-'+i;ell(g,fur,0,-.078,.022,.128,.167,.144);legs.push(g)}
 for(let i=0;i<2;i++){let s=i?1:-1,g=new T.Group();body.add(g);g.position.set(s*.27,.61,0);g.name='arm-'+i;let arm=ell(g,fur,s*.027,-.16,0,.102,.222,.115);arm.rotation.z=s*.13;arms.push(g)}
 for(let s of [-1,1]){ell(head,fur,s*.218,.215,-.005,.089,.093,.061);ell(head,earMat,s*.218,.216,.047,.052,.058,.012)}
 const muzzle=ell(head,muzzleMat,0,-.009,.228,.095,.092,.065);
 const nose=ell(head,black,0,.023,.288,.032,.026,.023);
 let mouth=new T.Mesh(new T.CapsuleGeometry(.004,.032,6,10),black);mouth.position.set(0,-.010,.294);head.add(mouth);
 for(let s of [-1,1]){ell(head,black,s*.094,.060,.218,.018,.022,.014);let glint=ell(head,new T.MeshBasicMaterial({color:0xf5f4ed}),s*.094-.004,.067,.229,.004,.005,.003)}


 // Pads face inward across the head; only the thin cup edges face the viewer.
 const headphones=new T.Group();headphones.name='music-headphones';headphones.visible=false;head.add(headphones);
 const bandMat=new T.MeshStandardMaterial({color:0x385b50,roughness:.8}),padMat=new T.MeshStandardMaterial({color:0xd5ccb5,roughness:1}),metalMat=new T.MeshStandardMaterial({color:0x809087,metalness:.25,roughness:.65});
 const arc=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI;arc.push(new T.Vector3(Math.cos(a)*.302,.226+Math.sin(a)*.133,-.016))}
 const band=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(arc),48,.016,12,false),bandMat);band.castShadow=true;headphones.add(band);
 for(const side of [-1,1]){const cup=new T.Group();cup.position.set(side*.277,.208,-.013);headphones.add(cup);cup.rotation.y=side*Math.PI/2;cup.rotation.z=-side*.18;
  ell(cup,padMat,0,0,-.010,.076,.099,.034);ell(cup,bandMat,0,0,.025,.073,.093,.024);
  const seam=new T.Mesh(new T.TorusGeometry(.066,.002,8,40),metalMat);seam.position.z=.043;seam.scale.y=1.27;cup.add(seam);
  const hinge=new T.Mesh(new T.CapsuleGeometry(.009,.038,8,12),metalMat);hinge.position.set(0,.078,.022);cup.add(hinge);
 }
 const rainGear=createRainGear({body,head,arms});let rainy=false,currentIdentity=identity;
 function setIdentity(i){currentIdentity=i;const white=i===0;fur.color.set(white?0xf3f2ed:0x70432f);earMat.color.set(white?0xe0ddd6:0x753c28);muzzleMat.color.set(white?0xf3f2ed:0xf3e9d9);nose.scale.set(white?.041:.032,white?.032:.026,white?.028:.023);torso.scale.x=white?1.02:1;avatar.userData.identity=i}
 const scarf=new T.Group();body.add(scarf);scarf.visible=false;const cloth=new T.MeshStandardMaterial({color:0x82b3a0,roughness:1});const collar=new T.Mesh(new T.TorusGeometry(.282,.037,12,40),cloth);collar.rotation.x=Math.PI/2;collar.scale.y=.81;collar.position.y=.69;scarf.add(collar);for(const x of [.07,.14]){const tail=new T.Mesh(new T.BoxGeometry(.055,.19,.027),cloth);tail.position.set(x,.60,.245);tail.rotation.z=x===.07?-.12:.15;scarf.add(tail)}
 setIdentity(identity);
 return {avatar,body,legs,arms,setIdentity,headphones(v){headphones.visible=!!v},get listening(){return headphones.visible},outfit(v){scarf.visible=v!=="plain"&&!!v;cloth.color.set(v==="amber"?0xd4a15c:0x82b3a0)},rain(v){if(rainy!==v){rainy=v;rainGear.set(v)}},rainTick(t,hold=true,shared=false){rainGear.tick(t,hold,shared)},rainState:rainGear.state};
}
