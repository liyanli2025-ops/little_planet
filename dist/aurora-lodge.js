import {iceMaterial,iceBrick} from './aurora-ice.js';
import * as T from './vendor/three.module.js';
import {createTeddy} from './teddy.js';
export function createAuroraLodge(){
 const group=new T.Group(),hits=[],glows=[],walls=[];group.position.y=-50;group.visible=false;
 const material=(color)=>new T.MeshStandardMaterial({color,roughness:.78});
 const wood=material(0x654435),trim=material(0xbfa078),cream=material(0xe9d9b9),sage=material(0x638d8e),rose=material(0xb87968);
 const ice=iceMaterial();const snow=material(0xe5f0f4);
 const snowCanvas=document.createElement('canvas');snowCanvas.width=snowCanvas.height=128;const snowContext=snowCanvas.getContext('2d'),pixels=snowContext.createImageData(128,128);for(let i=0;i<128*128;i++){const value=130+Math.sin(i*12.9898)*Math.sin(i*.731)*38;pixels.data.set([value,value,value,255],i*4)}snowContext.putImageData(pixels,0,0);const grain=new T.CanvasTexture(snowCanvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(9,9);snow.bumpMap=grain;snow.bumpScale=.018;snow.roughness=1;
 const glow=new T.MeshStandardMaterial({color:0xffd49e,emissive:0xffbc6b,emissiveIntensity:1.1});
 function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o}
 function rounded(x,y,z,w,h,d,m){const s=new T.Shape(),r=Math.min(.13,w/4,d/4);s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1});g.rotateX(-Math.PI/2);return mesh(g,m,x,y-h/2,z)}
 const floor=mesh(new T.CylinderGeometry(3.5,3.6,.18,80),snow,0,-.085,0);
 // Keep a consistent angular pitch across courses so every joint is staggered by half a brick.
 for(let row=0;row<10;row++){const lo=row/10*1.49,hi=(row+1)/10*1.49,pitch=Math.PI/12;
 for(let i=-1;i<13;i++){const start=Math.max(Math.PI,Math.PI+(i+(row%2)*.5)*pitch),end=Math.min(Math.PI*2,Math.PI+(i+1+(row%2)*.5)*pitch);if(end-start<.02)continue;
 const wall=mesh(iceBrick(3.48,start+.009,end-start-.018,lo+.006,hi-.006,.20),ice);wall.userData.mid=(start+end)/2;walls.push(wall)}}
 const carpet=mesh(new T.CylinderGeometry(1.6,1.6,.022,64),sage,0,.04,.8);carpet.scale.z=.67;
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2;mesh(new T.SphereGeometry(.025,8,6),cream,Math.cos(a)*1.52,.063,.8+Math.sin(a)*1.02)}
 rounded(0,.63,-1.7,3.1,1.18,.65,ice);rounded(0,1.26,-1.7,3.3,.13,.85,wood);
 for(let x=-1.45;x<=1.5;x+=.21)rounded(x,.64,-1.345,.08,.95,.04,trim);
 rounded(0,2.13,-2.6,2.8,.13,.35,wood);
 const glass=new T.MeshPhysicalMaterial({color:0xc6edf1,roughness:.13,metalness:.1,transparent:true,opacity:.65,side:T.DoubleSide});
 function cup(x,y,z){const c=mesh(new T.CylinderGeometry(.11,.09,.22,24,1,true),glass,x,y+.11,z);mesh(new T.CylinderGeometry(.083,.075,.14,24),new T.MeshStandardMaterial({color:0xc06c56,roughness:.2}),x,y+.08,z);hits.push({object:c,type:'cup'});return c}
 for(let i=0;i<7;i++){const bottle=mesh(new T.CylinderGeometry(.08,.10,.35+(i%3)*.05,16),material([0x41665d,0xb77352,0x748da4][i%3]),-1.05+i*.35,2.35,-2.6);mesh(new T.CylinderGeometry(.034,.045,.14,12),trim,bottle.position.x,2.62,-2.6)}
 for(const x of [-1,0,1])cup(x,1.34,-1.55);
 const tables=[];for(const x of [-1.75,1.75]){rounded(x,.36,.75,1.23,.23,1.35,wood);rounded(x,.53,.75,1.2,.23,1.28,cream);rounded(x,.91,.23,1.23,.69,.20,sage);for(const dx of [-.54,.54])rounded(x+dx,.76,.75,.16,.33,1.23,cream);
 const pillow=mesh(new T.SphereGeometry(1,20,14),rose,x,.86,.48);pillow.scale.set(.30,.27,.09);pillow.rotation.z=x<0?.15:-.12;
 const table=mesh(new T.CylinderGeometry(.51,.52,.10,40),wood,x,.65,1.72);mesh(new T.CylinderGeometry(.06,.12,.60,16),trim,x,.31,1.72);cup(x-.13,.72,1.72);tables.push(table)}
 const host=createTeddy(group,1);host.avatar.position.set(.65,.72,-2.35);host.avatar.scale.setScalar(.85);host.relax(true);
 const visitor=createTeddy(group,0);visitor.avatar.position.set(-1.75,.43,.75);visitor.avatar.scale.setScalar(.75);visitor.seatTick(true,1);visitor.relax(true);
 for(const x of [-2.1,0,2.1]){mesh(new T.CylinderGeometry(.009,.009,.65,8),wood,x,2.78,-.35);const lantern=mesh(new T.SphereGeometry(.27,24,16),glow,x,2.30,-.35);lantern.scale.y=1.15;for(let k=0;k<8;k++){const a=k/8*Math.PI;const ring=mesh(new T.TorusGeometry(.277,.008,4,36),trim,x,2.30,-.35);ring.rotation.y=a;ring.scale.y=1.15}glows.push(lantern)}
 const light=new T.PointLight(0xffbf7b,23,9,2);light.position.set(0,2.2,.6);group.add(light);
 const curve=new T.CatmullRomCurve3([new T.Vector3(-2.9,1.8,-.9),new T.Vector3(0,2.65,-2.9),new T.Vector3(2.9,1.8,-.9)]);
 mesh(new T.TubeGeometry(curve,48,.009,5,false),wood);for(let i=0;i<25;i++){const p=curve.getPoint(i/24);mesh(new T.SphereGeometry(.028,8,6),glow,p.x,p.y,p.z)}
 const exit=rounded(0,.04,3.15,1.25,.035,.42,snow);hits.push({object:exit,type:'exit'});
 return {group,hits,tick(t,camera){for(const w of walls){const a=w.userData.mid;w.visible=-Math.cos(a)*camera.x+Math.sin(a)*camera.z<0}host.body.rotation.z=Math.sin(t*.7)*.018;host.arms[0].rotation.x=-.1+Math.sin(t)*.035},state:()=>({cups:5})};
}
