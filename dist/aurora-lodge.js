import {auroraMenu} from './aurora-menu.js';
import {iceMaterial,iceBrick} from './aurora-ice.js';
import {sipAmount} from './sipping-drink.js';
import * as T from './vendor/three.module.js';
import {createTeddy} from './teddy.js';
export function createAuroraLodge(){
 const group=new T.Group(),hits=[],glows=[],walls=[];group.position.y=-50;group.visible=false;
 const material=(color)=>new T.MeshStandardMaterial({color,roughness:.78});
 const cord=material(0x59666b);
 const ice=iceMaterial();const snow=material(0xe5f0f4);
 const snowCanvas=document.createElement('canvas');snowCanvas.width=snowCanvas.height=128;const snowContext=snowCanvas.getContext('2d'),pixels=snowContext.createImageData(128,128);for(let i=0;i<128*128;i++){const value=130+Math.sin(i*12.9898)*Math.sin(i*.731)*38;pixels.data.set([value,value,value,255],i*4)}snowContext.putImageData(pixels,0,0);const grain=new T.CanvasTexture(snowCanvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(9,9);snow.bumpMap=grain;snow.bumpScale=.018;snow.roughness=1;
 const glow=new T.MeshStandardMaterial({color:0xffd49e,emissive:0xffbc6b,emissiveIntensity:1.1});
 function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o}
 function rounded(x,y,z,w,h,d,m){const s=new T.Shape(),r=Math.min(.13,w/4,d/4);s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1});g.rotateX(-Math.PI/2);
 // Extrusion UVs extend outside 0..1; map each face into the ice atlas tile.
 g.computeBoundingBox();const bounds=g.boundingBox,size=bounds.getSize(new T.Vector3()),pos=g.attributes.position,norm=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<pos.count;i++){const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i)),nz=Math.abs(norm.getZ(i));const px=(pos.getX(i)-bounds.min.x)/size.x,py=(pos.getY(i)-bounds.min.y)/size.y,pz=(pos.getZ(i)-bounds.min.z)/size.z;if(ny>=nx&&ny>=nz)uv.setXY(i,px,pz);else if(nx>=nz)uv.setXY(i,pz,py);else uv.setXY(i,px,py)}
 return mesh(g,m,x,y-h/2,z)}
 const floor=mesh(new T.CylinderGeometry(3.5,3.6,.18,80),snow,0,-.085,0);
 // The real planet's snow cap surrounds this floor; no separate backdrop plane.

 // Keep a consistent angular pitch across courses so every joint is staggered by half a brick.
 for(let row=0;row<10;row++){const lo=row/10*1.49,hi=(row+1)/10*1.49,pitch=Math.PI/12;
 for(let i=-1;i<13;i++){const start=Math.max(Math.PI,Math.PI+(i+(row%2)*.5)*pitch),end=Math.min(Math.PI*2,Math.PI+(i+1+(row%2)*.5)*pitch);if(end-start<.02)continue;
 const wall=mesh(iceBrick(3.48,start+.009,end-start-.018,lo+.006,hi-.006,.20),ice);wall.userData.mid=(start+end)/2;walls.push(wall)}}
 // A single ice bar with three built-in seats; the snow floor stays open.
 for(let row=0;row<3;row++)for(let col=0;col<6;col++){const x=(col-2.5)*.55;rounded(x,.19+row*.30,-1.68+.23*(x/1.5)**2,.53,.28,.60,ice)}
 const barShape=new T.Shape();barShape.moveTo(-1.78,-1.10);barShape.quadraticCurveTo(0,-1.66,1.78,-1.10);barShape.lineTo(1.78,-1.91);barShape.quadraticCurveTo(0,-2.36,-1.78,-1.91);barShape.closePath();const barGeometry=new T.ExtrudeGeometry(barShape,{depth:.14,bevelEnabled:true,bevelSize:.045,bevelThickness:.025,bevelSegments:3,steps:1});barGeometry.rotateX(Math.PI/2);barGeometry.computeBoundingBox();const bb=barGeometry.boundingBox,bs=bb.getSize(new T.Vector3()),bp=barGeometry.attributes.position,bn=barGeometry.attributes.normal,bu=barGeometry.attributes.uv;for(let i=0;i<bp.count;i++){const x=(bp.getX(i)-bb.min.x)/bs.x,y=(bp.getY(i)-bb.min.y)/bs.y,z=(bp.getZ(i)-bb.min.z)/bs.z;bu.setXY(i,Math.abs(bn.getX(i))>.6?z:x,Math.abs(bn.getY(i))>.6?z:y)}const bar=mesh(barGeometry,ice,0,.94,0);
 const frost=ice.clone();frost.color.set(0xd7edf0);frost.roughness=.38;frost.transmission=.12;

 rounded(0,1.96,-2.63,2.65,.12,.38,ice);
 for(const x of [-1.05,1.05])for(let row=0;row<6;row++)rounded(x,.16+row*.30,-2.65,.20,.29,.34,ice);
 // Low banks of packed snow merge the dome into its floor.
 const bankPoints=Array.from({length:33},(_,i)=>{const a=Math.PI+i*Math.PI/32;return new T.Vector3(Math.cos(a)*3.15,.04,Math.sin(a)*3.15)});mesh(new T.TubeGeometry(new T.CatmullRomCurve3(bankPoints),64,.16,10,false),snow);

 const glass=new T.MeshPhysicalMaterial({color:0xc6edf1,roughness:.13,metalness:.1,transparent:true,opacity:.65,side:T.DoubleSide});
 function cup(x,y,z){const c=mesh(new T.CylinderGeometry(.11,.09,.22,24,1,true),glass,x,y+.11,z);mesh(new T.CylinderGeometry(.083,.075,.14,24),new T.MeshStandardMaterial({color:0xc06c56,roughness:.2}),x,y+.08,z);return c}
 for(let i=0;i<7;i++){const bottle=mesh(new T.CylinderGeometry(.075,.09,.29+(i%3)*.04,16),glass,-1.05+i*.35,2.17,-2.63);mesh(new T.CylinderGeometry(.03,.04,.11,12),ice,bottle.position.x,2.36,-2.63)}
 const seatTop=.73;
 for(const x of [-1.1,0,1.1]){
  rounded(x,.30,-.40,.78,.60,.72,ice);
  const seat=rounded(x,.65,-.40,.86,.11,.79,frost);hits.push({object:seat,type:'seat',x});
  // Rounded ice back and low arms leave the torso clear of the seat.
  rounded(x,.84,.04,.86,.22,.13,ice);
  for(const dx of [-.40,.40])rounded(x+dx,.84,-.39,.09,.18,.69,ice);
 }
 const host=createTeddy(group,1);host.avatar.position.set(.45,0,-2.35);host.avatar.scale.setScalar(1.22);host.avatar.rotation.y=0;host.seatTick(false,1);group.updateMatrixWorld(true);const hostBounds=new T.Box3().setFromObject(host.avatar);host.avatar.position.y+=group.position.y-hostBounds.min.y;host.relax(true);
 // Small ice formations and light held inside the ice give this room its own character.
 for(const side of [-1,1]){for(let i=0;i<4;i++){const crystal=mesh(new T.ConeGeometry(.09+i*.018,.24+i*.11,5),ice,side*(2.30+i*.09),.12+i*.055,-1.1+i*.12);crystal.rotation.z=side*(.12+i*.08)}const blue=new T.PointLight(0x8adfea,2.5,2.5,2);blue.position.set(side*2.5,.35,-1.4);group.add(blue)}
 const edgeGlow=new T.MeshStandardMaterial({color:0xffe5b6,emissive:0xffd39a,emissiveIntensity:.55});
 for(const x of [-1.1,0,1.1]){const inset=mesh(new T.SphereGeometry(.045,10,8),edgeGlow,x,.16,-.05);inset.castShadow=false;}
 const visitor=createTeddy(group,0);visitor.avatar.scale.setScalar(.75);
 for(let i=0;i<60;i++)visitor.seatTick(true,1/60);
 // The seated torso starts at local y=.16 with a .9 body scale.
 visitor.avatar.position.set(-1.1,seatTop-.16*.9*.75,-.42);
 visitor.avatar.rotation.y=Math.PI;visitor.relax(true);
 // Warm bulbs on sagging strings, without pendant lanterns.
 for(let strand=0;strand<3;strand++){
  const z=-1.85+strand*.86,y=2.18+strand*.13;
  const curve=new T.CatmullRomCurve3([new T.Vector3(-2.25,y,z),new T.Vector3(-1.1,y-.22,z+.07),new T.Vector3(0,y-.31,z+.10),new T.Vector3(1.1,y-.22,z+.07),new T.Vector3(2.25,y,z)]);
  mesh(new T.TubeGeometry(curve,40,.008,4,false),cord);
  for(let i=0;i<19;i++){const p=curve.getPoint(i/18);mesh(new T.CylinderGeometry(.009,.009,.075,5),cord,p.x,p.y-.03,p.z);const bulb=mesh(new T.SphereGeometry(.033,8,6),glow,p.x,p.y-.085,p.z);bulb.castShadow=false;glows.push(bulb)}
 }
 for(const x of [-1.4,1.4]){const light=new T.PointLight(0xffd4a0,9,6,2);light.position.set(x,2,-.5);group.add(light)}
 hits.push({object:host.avatar,type:'host'});
 const served=cup(.5,.98,-1.35),servedLiquid=group.children[group.children.indexOf(served)+1];served.visible=servedLiquid.visible=false;
 hits.push({object:served,type:'served'});
 const held=cup(-1.1,1.22,-1.1),heldLiquid=group.children[group.children.indexOf(held)+1];held.visible=heldLiquid.visible=false;hits.push({object:held,type:'drink'});
 let order=null,drinking=false;const ceramic=material(0xe8e2cf);
 function setOrder(guest){order=guest?.order||null;drinking=!!guest?.held;held.visible=heldLiquid.visible=drinking;if(!order)served.visible=servedLiquid.visible=false;
 const drink=auroraMenu.find(x=>x.id===(order||guest?.held)?.items?.[0]);
 if(drink){servedLiquid.material.color.set(drink.color);heldLiquid.material.color.set(drink.color);served.material=held.material=drink.id==='aurora_cocoa'?ceramic:glass;}}
 const exit=rounded(0,.04,3.15,1.25,.035,.42,snow);hits.push({object:exit,type:'exit'});
 return {group,hits,visitor,host,setOrder,setIdentity:id=>visitor.setIdentity(id),setAppearance(appearance,outfit){visitor.design(appearance);visitor.outfit(outfit||'plain')},pose:()=>({position:visitor.avatar.position.toArray(),quaternion:visitor.avatar.quaternion.toArray(),seated:true,animation:{arms:visitor.arms.map(a=>a.rotation.toArray().slice(0,3)),legs:visitor.legs.map(a=>a.rotation.toArray().slice(0,3)),bodyPosition:visitor.body.position.toArray(),bodyRotation:visitor.body.rotation.toArray().slice(0,3),drinking}}),sit(x){visitor.avatar.position.x=x},tick(t,camera){for(const w of walls){const a=w.userData.mid;w.visible=-Math.cos(a)*camera.x+Math.sin(a)*camera.z<0}host.body.rotation.z=Math.sin(t*.7)*.018;const preparing=order&&Date.now()<order.readyAt;
 host.arms[0].rotation.x=preparing?-.9+Math.sin(t*5)*.28:-.1+Math.sin(t)*.035;
 host.arms[1].rotation.x=preparing?-.7+Math.cos(t*5)*.18:-.1;
 host.body.rotation.y=preparing?Math.sin(t*2)*.10:0;
 served.visible=servedLiquid.visible=!!order&&!preparing;
 const sip=drinking?sipAmount(t):0;visitor.arms[0].rotation.x=drinking?-.55-sip*.63:0;
 visitor.sipping(sip>.85);
 if(drinking){group.updateMatrixWorld(true);const hand=visitor.arms[0].localToWorld(new T.Vector3(0,-.29,.10));group.worldToLocal(hand);held.position.copy(hand);heldLiquid.position.copy(hand).y-=.03;}},state:()=>({hostFootHeight:host.avatar.position.y,hostStanding:true,cups:3,seats:3,seatTop,visitorSeatContact:visitor.avatar.position.y+.16*.9*.75})};
}
