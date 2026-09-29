import * as T from './vendor/three.module.js';
import {outfits} from './outfits.js';

// Rounded, padded garments with individual cuts; coordinates are local to the hanger.
export function createHangingGarment(parent,id,width,material){
 const d=outfits[id],g=new T.Group();g.name='tailored-'+id;g.position.set(0,-.036,.006);g.scale.setScalar(width<1?.83:1.03);parent.add(g);
 const cloth=material(d.color,'fabric'),edge=material(new T.Color(d.color).multiplyScalar(.86).getHex(),'fabric'),thread=material(new T.Color(d.color).lerp(new T.Color(0xf4ebd8),.25).getHex(),'fabric'),ivory=material(0xeee4cf,'fabric'),metal=material(0xb49b65,'metal');
 const add=(geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
 const ell=(m,x,y,z,a,b,c)=>{const o=add(new T.SphereGeometry(1,28,20),m,x,y,z);o.scale.set(a,b,c);return o};
 const front=(x,y)=>.037+.013*Math.max(0,1-(x/.15)**2)*Math.sin(Math.min(1,Math.abs(y)/.35)*Math.PI);
 function seam(points,m=edge,r=.002){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(([x,y,z])=>new T.Vector3(x,y,z??front(x,y)+.001))),28,r,8,false),m)}
 function padded(shape,m=cloth,depth=.028){const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:8,bevelSize:.009,bevelThickness:.008,curveSegments:18,steps:2});const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const bulge=.013*Math.max(0,1-(x/.15)**2)*Math.sin(Math.min(1,Math.abs(y)/.35)*Math.PI);pos.setZ(i,z+(z>depth/2?bulge:-bulge*.4)+.0015*Math.sin(x*110+y*13)*Math.sin(Math.abs(y)*8))}geo.computeVertexNormals();return add(geo,m)}
 function panel(x,y,w,h,m=cloth){const s=new T.Shape();s.moveTo(x-w/2,y+h/2-.01);s.quadraticCurveTo(x-w/2,y+h/2,x-w/2+.01,y+h/2);s.lineTo(x+w/2-.01,y+h/2);s.quadraticCurveTo(x+w/2,y+h/2,x+w/2,y+h/2-.01);s.lineTo(x+w/2,y-h/2+.012);s.quadraticCurveTo(x+w/2,y-h/2,x+w/2-.012,y-h/2);s.lineTo(x-w/2+.012,y-h/2);s.quadraticCurveTo(x-w/2,y-h/2,x-w/2,y-h/2+.012);s.closePath();const o=padded(s,m,.008);o.position.z=.036;return o}
 if(d.kind==='scarf'){
  for(const side of [-1,1]){const x=side*.027,end=side<0?-.32:-.28,s=new T.Shape();s.moveTo(x-.023,-.02);s.bezierCurveTo(x-.036,-.11,x-.007,-.19,x-.024,end);s.quadraticCurveTo(x,end-.011,x+.023,end);s.bezierCurveTo(x+.031,-.19,x+.012,-.09,x+.023,-.02);s.closePath();padded(s);seam([[x-.017,-.04],[x-.022,-.13],[x-.010,-.23],[x-.018,end+.01]],thread,.002);for(let i=0;i<6;i++)seam([[x-.018+i*.007,end,.024],[x-.020+i*.007,end-.018,.027]],thread,.0015)}
  seam([[-.049,-.022,-.005],[-.048,.022,0],[0,.034,.024],[.048,.022,0],[.049,-.022,-.005]],cloth,.014);return g;
 }
 if(d.kind==='overalls'){
  const s=new T.Shape();s.moveTo(-.079,-.137);s.quadraticCurveTo(-.085,-.18,-.083,-.24);s.lineTo(-.078,-.36);s.quadraticCurveTo(-.05,-.373,-.020,-.36);s.lineTo(-.012,-.257);s.quadraticCurveTo(0,-.245,.012,-.257);s.lineTo(.020,-.36);s.quadraticCurveTo(.05,-.373,.078,-.36);s.lineTo(.083,-.24);s.quadraticCurveTo(.085,-.18,.079,-.137);s.closePath();padded(s);panel(0,-.12,.125,.135);panel(0,-.125,.063,.052,edge);
  for(const side of [-1,1]){seam([[side*.046,-.092,.049],[side*.057,-.025,.044],[side*.047,.015,.009],[side*.049,-.112,-.015]],cloth,.012);ell(metal,side*.045,-.075,.063,.009,.009,.004);seam([[side*.075,-.168],[side*.062,-.20],[side*.031,-.205]],thread,.0015);seam([[side*.023,-.35],[side*.049,-.354],[side*.076,-.35]],thread,.002)}
  seam([[-.076,-.15],[0,-.155],[.076,-.15]],thread,.0018);return g;
 }
 const long=d.kind==='knit'||d.kind==='cardigan'||d.kind==='hoodie';const s=new T.Shape();s.moveTo(-.038,0);s.quadraticCurveTo(-.066,-.007,-.093,-.027);s.quadraticCurveTo(-.112,-.041,-.125,-.070);s.lineTo(long?-.16:-.15,long?-.205:-.115);s.quadraticCurveTo(long?-.14:-.132,long?-.219:-.129,long?-.115:-.108,long?-.206:-.13);s.lineTo(-.081,-.10);s.quadraticCurveTo(-.083,-.19,-.081,-.32);s.quadraticCurveTo(0,-.338,.081,-.32);s.quadraticCurveTo(.083,-.19,.081,-.10);s.lineTo(long?.115:.108,long?-.206:-.13);s.quadraticCurveTo(long?.14:.132,long?-.219:-.129,long?.16:.15,long?-.205:-.115);s.lineTo(.125,-.070);s.quadraticCurveTo(.112,-.041,.093,-.027);s.quadraticCurveTo(.066,-.007,.038,0);s.bezierCurveTo(.037,-.047,-.037,-.047,-.038,0);s.closePath();padded(s);
 seam([[-.038,0],[-.032,-.025],[0,-.035],[.032,-.025],[.038,0]],d.kind==='stripe'?ivory:edge,.005);
 seam([[-.077,-.309],[0,-.319],[.077,-.309]],edge,.005);seam([[-.075,-.30],[0,-.31],[.075,-.30]],thread,.0015);
 for(const side of [-1,1]){seam([[side*.081,-.117],[side*.078,-.21],[side*.078,-.298]],thread,.0014);const y=long?-.200:-.117;seam([[side*(long?.119:.111),y-.002],[side*(long?.138:.131),y-.008],[side*(long?.155:.147),y+.003]],edge,.0045)}
 if(d.kind==='knit')for(const x of [-.047,0,.047]){for(let i=0;i<10;i++){const y=-.07-i*.022;seam([[x-.008,y+.006],[x,y-.004],[x+.008,y+.006]],thread,.0016)}}
 if(d.kind==='stripe')for(const y of [-.086,-.135,-.184,-.233,-.282])seam([[-.075,y],[0,y-.002],[.075,y]],ivory,.007);
 if(d.kind==='cardigan'){seam([[0,-.04],[0,-.17],[0,-.315]],edge,.005);for(const y of [-.065,-.12,-.175,-.23,-.285]){ell(ivory,.008,y,front(0,y)+.013,.006,.006,.003);seam([[-.009,y-.005],[-.009,y+.005]],thread,.001)}for(const side of [-1,1]){panel(side*.047,-.245,.045,.051);seam([[side*.047-.018,-.224],[side*.047+.018,-.224]],thread,.0015)}}
 if(d.kind==='hoodie'){ell(cloth,0,.002,-.015,.060,.067,.040);ell(edge,0,.016,.020,.037,.043,.018);seam([[-.042,.001],[-.034,.046],[0,.062],[.034,.046],[.042,.001]],cloth,.008);for(const side of [-1,1]){seam([[side*.029,-.038,.048],[side*.024,-.113,.057]],ivory,.002);ell(metal,side*.024,-.115,.056,.003,.008,.003)}panel(0,-.244,.105,.058);for(const side of [-1,1])seam([[side*.048,-.22],[side*.028,-.235],[side*.035,-.26]],edge,.002)}
 return g;
}
