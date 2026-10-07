import * as T from './vendor/three.module.js';
import {snowRadius} from './aurora-terrain.js';
export function createSleighRide(world,wildlife,bear){
 const up=new T.Vector3(0,1,0),focus=new T.Vector3(),holder=new T.Group();world.add(holder);
 let actor=null,phase='idle',time=0,progress=0,home=null;
 const startAngle=2.02,theta=.67;
 function point(u){const ph=startAngle+u*Math.PI*2,th=theta+.035*Math.sin(u*Math.PI*4),n=new T.Vector3(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph));return n.multiplyScalar(snowRadius(th,ph)+.035)}
 function locate(u){const p=point(u),n=p.clone().normalize();actor.mount.position.copy(p);actor.mount.quaternion.setFromUnitVectors(up,n);const tangent=point(u+.0001).sub(p).applyQuaternion(actor.mount.quaternion.clone().invert());actor.body.rotation.y=Math.atan2(tangent.x,tangent.z);actor.mount.updateWorldMatrix(true,true)}
 // Two subtle runner marks follow the snow surface, leaving the middle of the island open.
 const trackMaterial=new T.MeshStandardMaterial({color:0xb9d0df,roughness:1});
 for(const offset of [-.18,.18]){const pts=[];for(let i=0;i<=240;i++){const u=i/240,p=point(u),n=p.clone().normalize(),t=point(u+.0001).sub(p).normalize(),side=new T.Vector3().crossVectors(n,t);pts.push(p.addScaledVector(side,offset).addScaledVector(n,-.026))}const track=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),240,.018,4,false),trackMaterial);world.add(track)}
 wildlife.ready.then(()=>{actor=wildlife.actors.find(a=>a.kind==='sleigh');locate(0)});
 function onSnow(p){const n=p.clone().normalize(),r=snowRadius(Math.acos(n.y),Math.atan2(n.z,n.x))+.025;return p.setLength(Math.max(p.length(),r))}
 function setHolder(p){p=onSnow(p);holder.position.copy(p);holder.quaternion.setFromUnitVectors(up,p.clone().normalize())}
 function resetPose(){bear.legs.forEach(g=>g.rotation.x=0);bear.arms.forEach(g=>g.rotation.x=0)}
 function start(){if(!actor||phase!=='idle')return false;world.updateMatrixWorld(true);home={parent:bear.avatar.parent,position:bear.avatar.position.clone(),quaternion:bear.avatar.quaternion.clone(),world:bear.avatar.getWorldPosition(new T.Vector3())};holder.add(bear.avatar);bear.avatar.position.set(0,0,0);bear.avatar.quaternion.identity();setHolder(home.world);bear.seatTick(false,1);resetPose();time=0;progress=0;phase='boarding';return true}
 function seatPoint(){actor.body.updateWorldMatrix(true,true);return actor.body.localToWorld(new T.Vector3(0,.34,-.08))}
 return {focus,get active(){return phase!=='idle'},hit(ray){return !!actor&&ray.intersectObject(actor.body,true).length>0},start,
 state:()=>({phase,progress,ready:!!actor}),
 tick(dt){if(!actor||phase==='idle')return;time+=dt;
 if(phase==='boarding'){
  const u=Math.min(time/5,1),e=u*u*(3-2*u),destination=point(0).addScaledVector(point(0).normalize(),.02),p=home.world.clone().lerp(destination,e);setHolder(p);const local=destination.clone().sub(p).applyQuaternion(holder.quaternion.clone().invert());bear.avatar.rotation.y=Math.atan2(local.x,local.z);
  bear.avatar.position.y=Math.abs(Math.sin(time*7))*.018;bear.legs.forEach((g,i)=>g.rotation.x=Math.sin(time*7+i*Math.PI)*.28);bear.arms.forEach((g,i)=>g.rotation.x=-Math.sin(time*7+i*Math.PI)*.17);
  if(u===1){resetPose();actor.body.add(bear.avatar);bear.avatar.position.set(0,.34,-.08);bear.avatar.quaternion.identity();bear.seatTick(true,1);phase='riding';time=0}
 }else if(phase==='riding'){
  const u=Math.min(time/95,1);progress=u*u*(3-2*u);locate(progress);bear.seatTick(true,1);bear.avatar.rotation.z=Math.sin(time*1.6)*.025;
  // Separate, small body movements avoid a rigid train while preserving the supplied deer shape.
  actor.body.children.slice(1,3).forEach((deer,i)=>{deer.position.y=Math.abs(Math.sin(time*3.6+i*.7))*.025;deer.rotation.z=Math.sin(time*3.6+i*.7)*.018});
  if(u===1){locate(0);actor.body.children.slice(1,3).forEach(d=>{d.position.y=0;d.rotation.z=0});const p=seatPoint();holder.add(bear.avatar);bear.avatar.position.set(0,0,0);bear.avatar.quaternion.identity();setHolder(p);home.depart=p;bear.seatTick(false,1);phase='disembarking';time=0}
 }else if(phase==='disembarking'){
  const u=Math.min(time/5,1),e=u*u*(3-2*u);setHolder(home.depart.clone().lerp(home.world,e));bear.legs.forEach((g,i)=>g.rotation.x=Math.sin(time*7+i*Math.PI)*.25);
  if(u===1){resetPose();home.parent.add(bear.avatar);bear.avatar.position.copy(home.position);bear.avatar.quaternion.copy(home.quaternion);bear.seatTick(true,1);phase='idle';progress=0}
 }
 focus.copy(bear.avatar.getWorldPosition(new T.Vector3()));
 }};
}
