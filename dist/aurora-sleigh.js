import {snowRoute,separatePoint} from './aurora-collision.js';
import * as T from './vendor/three.module.js';
import {snowRadius} from './aurora-terrain.js';
export function createSleighRide(world,wildlife,bear,{onDisembark=()=>{}}={}){
 const up=new T.Vector3(0,1,0),focus=new T.Vector3(),holder=new T.Group();world.add(holder);
 let actor=null,phase='idle',time=0,progress=0,routeStart=0,home=null;
 const startAngle=2.02,theta=.67;
 function point(u){const ph=startAngle+u*Math.PI*2,th=theta+.035*Math.sin(u*Math.PI*4),n=new T.Vector3(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph));return n.multiplyScalar(snowRadius(th,ph)+.035)}
 function locate(u){const p=point(u),n=p.clone().normalize();actor.mount.position.copy(p);actor.mount.quaternion.setFromUnitVectors(up,n);const tangent=point(u+.0001).sub(p).applyQuaternion(actor.mount.quaternion.clone().invert());actor.body.rotation.y=Math.atan2(tangent.x,tangent.z);actor.mount.updateWorldMatrix(true,true)}
 wildlife.ready.then(()=>{actor=wildlife.actors.find(a=>a.kind==='sleigh');locate(0)});
 function onSnow(p){const n=p.clone().normalize(),r=snowRadius(Math.acos(n.y),Math.atan2(n.z,n.x))+.025;return p.setLength(Math.max(p.length(),r))}
 function setHolder(p){p=onSnow(p);holder.position.copy(p);holder.quaternion.setFromUnitVectors(up,p.clone().normalize())}
 function resetPose(){bear.legs.forEach(g=>g.rotation.x=0);bear.arms.forEach(g=>g.rotation.x=0)}
 function start(){if(!actor||phase!=='idle')return false;world.updateMatrixWorld(true);home={parent:bear.avatar.parent,position:bear.avatar.position.clone(),quaternion:bear.avatar.quaternion.clone(),world:bear.avatar.getWorldPosition(new T.Vector3())};holder.add(bear.avatar);bear.avatar.position.set(0,0,0);bear.avatar.quaternion.identity();setHolder(home.world);bear.seatTick(false,1);resetPose();home.path=snowRoute(home.world,actor.mount.position,wildlife.obstacles||[]);if(!home.path.length){home.parent.add(bear.avatar);bear.avatar.position.copy(home.position);bear.avatar.quaternion.copy(home.quaternion);return false;}home.leg=0;home.from=home.world.clone();time=0;routeStart=progress;phase='boarding';return true}
 function stop(){if(!actor||phase==='idle'||phase==='disembarking')return false;world.updateMatrixWorld(true);wildlife.setTraffic(null);actor.deerRigs.forEach((rig,i)=>rig.tick(0,0,i));const p=bear.avatar.getWorldPosition(new T.Vector3());home.depart=p.clone();const landing=actor.body.localToWorld(new T.Vector3(.85,0,-.08)).normalize();home.landing=landing.multiplyScalar(snowRadius(Math.acos(landing.y),Math.atan2(landing.z,landing.x))+.025);const safe=separatePoint(home.landing.x,home.landing.z,wildlife.obstacles||[]);home.landing.set(safe.x,Math.sqrt(Math.max(1,100-safe.x*safe.x-safe.z*safe.z)),safe.z).normalize();home.landing.multiplyScalar(snowRadius(Math.acos(home.landing.y),Math.atan2(home.landing.z,home.landing.x))+.025);holder.add(bear.avatar);bear.avatar.position.set(0,0,0);bear.avatar.quaternion.identity();setHolder(p);bear.seatTick(false,1);phase='disembarking';time=0;return true}
 function seatPoint(){actor.body.updateWorldMatrix(true,true);return actor.body.localToWorld(new T.Vector3(0,.34,-.08))}
 return {focus,get active(){return phase!=='idle'},hit(ray){return !!actor&&ray.intersectObject(actor.body,true).length>0},start,stop,
 state:()=>({phase,progress,ready:!!actor}),network:()=>actor&&phase==='riding'?{kind:'sleigh',position:actor.mount.position.toArray(),quaternion:actor.mount.quaternion.toArray(),rotation:actor.body.rotation.toArray().slice(0,3),speed:1}:null,
 tick(dt){if(!actor||phase==='idle')return;time+=dt;
 if(phase==='boarding'){
  const node=home.path[home.leg],destination=new T.Vector3(node.x,Math.sqrt(Math.max(1,100-node.x*node.x-node.z*node.z)),node.z),duration=Math.max(.05,Math.hypot(node.x-home.from.x,node.z-home.from.z)/.65),u=Math.min(time/duration,1),p=home.from.clone().lerp(destination,u);setHolder(p);const local=destination.clone().sub(p).applyQuaternion(holder.quaternion.clone().invert());bear.avatar.rotation.y=Math.atan2(local.x,local.z);
  bear.avatar.position.y=Math.abs(Math.sin(time*7))*.018;bear.legs.forEach((g,i)=>g.rotation.x=Math.sin(time*7+i*Math.PI)*.28);bear.arms.forEach((g,i)=>g.rotation.x=-Math.sin(time*7+i*Math.PI)*.17);
  if(u===1&&++home.leg<home.path.length){home.from=destination;time=0;}else if(u===1){resetPose();actor.body.add(bear.avatar);bear.avatar.position.set(0,.34,-.08);bear.avatar.quaternion.identity();bear.seatTick(true,1);phase='riding';time=0}
 }else if(phase==='riding'){
  const u=Math.min(time/Math.max(10,95*(1-routeStart)),1);progress=routeStart+(1-routeStart)*u*u*(3-2*u);locate(progress);wildlife.setTraffic({start:point(progress-.012),end:point(progress+.07)});bear.seatTick(true,1);bear.avatar.rotation.z=Math.sin(time*1.6)*.025;
  actor.deerRigs.forEach((rig,i)=>rig.tick(dt,6*u*(1-u),i));
  if(u===1)stop();
 }else if(phase==='disembarking'){
  const u=Math.min(time/5,1),e=u*u*(3-2*u);setHolder(home.depart.clone().lerp(home.landing,e));bear.legs.forEach((g,i)=>g.rotation.x=Math.sin(time*7+i*Math.PI)*.25);
  if(u===1){resetPose();bear.avatar.position.set(0,0,0);bear.avatar.quaternion.identity();bear.seatTick(false,1);phase='idle';if(progress>=.999)progress=0;onDisembark(holder.position.clone())}
 }
 focus.copy(bear.avatar.getWorldPosition(new T.Vector3()));
 }};
}
