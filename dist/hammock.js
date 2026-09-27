import * as T from './vendor/three.module.js';
import {makeSippingDrink,sipAmount} from './sipping-drink.js';
export const hammockLocation={theta:-2.7,latitude:-.18,approachLatitude:.19};
export function createHammock({outdoor,avatar,body,legs,arms,teddy,place,box,ball,cylinder,line,interactive,obstacles}){
 const {theta,latitude,approachLatitude}=hammockLocation;const site=place(outdoor,theta,latitude),swing=new T.Group(),sling=new T.Group();site.add(swing);swing.position.y=1.22;swing.add(sling);sling.position.y=-1.22;let active=false,drink=null,food=null,elapsed=0;
 for(const side of [-1,1]){const x=side*1.3;cylinder(site,0x907452,x,.72,0,.07,.13,1.65,14);line(site,0x907452,new T.Vector3(x,1,0),new T.Vector3(x+side*.23,1.66,.10),.043);for(let k=0;k<7;k++){const a=k*2.4;const crown=ball(site,k%2?0x799b54:0x9cba72,x+Math.cos(a)*.26,1.8+(k%3)*.12,Math.sin(a)*.27,.38,18);crown.scale.y*=.78}for(let k=0;k<3;k++){const a=k*2.1;line(site,0x907452,new T.Vector3(x,.06,0),new T.Vector3(x+Math.cos(a)*.2,-.17,Math.sin(a)*.2),.06)}const anchor=new T.Vector3(x,0,0);site.localToWorld(anchor);obstacles.push({n:anchor.normalize(),radius:.16});
 for(const z of [-.43,0,.43])line(sling,0xd4bd8f,new T.Vector3(x,1.22,0),new T.Vector3(side*.98,.93,z),.012);
 const tie=new T.Mesh(new T.TorusGeometry(.084,.012,8,24),new T.MeshStandardMaterial({color:0xccb58a}));tie.rotation.x=Math.PI/2;tie.position.set(x,1.22,0);site.add(tie);
 }
 const positions=[],colors=[],indices=[],W=36,H=14;const yAt=(x,z)=>.69+.24*(x/.98)**2+.085*(z/.43)**2;
 for(let i=0;i<=W;i++)for(let j=0;j<=H;j++){const x=-.98+i/W*1.96,z=-.43+j/H*.86;positions.push(x,yAt(x,z),z);const c=new T.Color(j%4<2?0xe5d9b7:0x759a88);colors.push(c.r,c.g,c.b);if(i<W&&j<H){let a=i*(H+1)+j;indices.push(a,a+1,a+H+1,a+1,a+H+2,a+H+1)}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();const fabric=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1}));fabric.castShadow=fabric.receiveShadow=true;sling.add(fabric);
 for(const z of [-.43,.43]){const points=[];for(let i=0;i<=30;i++){const x=-.98+i/30*1.96;points.push(new T.Vector3(x,yAt(x,z)+.007,z))}const seam=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),36,.012,7,false),new T.MeshStandardMaterial({color:0xe6d8b4}));sling.add(seam)}
 for(const x of [-.98,.98]){const bar=cylinder(sling,0xb99a68,x,.95,0,.028,.028,.94,16);bar.rotation.x=Math.PI/2}
 const pillow=ball(sling,0xe8d1aa,-.65,.88,0,.25,24);pillow.scale.set(.23,.065,.32);pillow.rotation.z=-.15;
 interactive('hammock',theta,latitude,.7,theta,approachLatitude);
 function removeDrink(){drink?.dispose();drink=null}
 return {start(id){removeDrink();food=id;elapsed=0;active=true;sling.add(avatar);avatar.position.set(.47,.98,.05);avatar.rotation.set(-1.05,0,1.36);body.position.y=0;legs.forEach((g,i)=>g.rotation.set(-.12,0,i?-.05:.05));arms[1].rotation.set(-.30,0,-.2);arms[0].rotation.set(-1.0,0,.08);teddy.sunglasses(true);teddy.relax(true);drink=makeSippingDrink(body,arms[0],avatar,id);drink.tick(0);},stop(){if(!active)return;active=false;food=null;teddy.sipping(false);teddy.sunglasses(false);teddy.relax(false);body.scale.setScalar(1);removeDrink();swing.rotation.x=0;},tick(dt){if(!active)return;elapsed+=dt;const sip=sipAmount(elapsed);swing.rotation.x=Math.sin(elapsed*.65)*.019*(1-sip*.65);body.scale.set(1+Math.sin(elapsed*1.4)*.003,1+Math.sin(elapsed*1.4)*.004,1);legs.forEach((g,i)=>g.rotation.x=-.12+Math.sin(elapsed*.8+i*.9)*.027*(1-sip));drink.tick(elapsed);teddy.sipping(sip>.98);
 },orientation(){return site.quaternion.clone().invert()},focus(){return site.localToWorld(new T.Vector3(0,.95,0))},state(){return {active,food,sunglasses:active,sway:swing.rotation.x,location:[theta,latitude],elapsed,drink:drink?.state()}},get active(){return active}};
}
