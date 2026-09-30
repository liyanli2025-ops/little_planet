import * as T from './vendor/three.module.js';
import {groundedBody} from './grounding.js';
export function gesture(bear,kind,t,side=0){const fade=Math.min(1,t*3,Math.max(0,(kind==='highfive'?3:5)-t)*3),wave=Math.sin(t*5);bear.body.position.y=groundedBody([0,0])+Math.max(0,Math.sin(t*6))*(kind==='dance'?.045:.012)*fade;bear.body.rotation.set(kind==='highfive'?.14*fade:0,0,kind==='dance'?wave*.10*fade:0);bear.legs.forEach((g,i)=>g.rotation.set(kind==='dance'?Math.sin(t*6+i*Math.PI)*.16*fade:0,0,0));bear.arms.forEach(g=>g.scale.set(1,1,1));bear.arms.forEach((g,i)=>g.rotation.set(kind==='highfive'?(i===side?-2.05*fade:-.15*fade):(-.35+Math.sin(t*5+i*Math.PI)*.24)*fade,0,kind==='highfive'?0:(i?-.35:.35)*fade));}
export function faceBear(bear,other,room){const p=bear.avatar.position,up=room?new T.Vector3(0,1,0):p.clone().normalize(),forward=other.clone().sub(p);forward.addScaledVector(up,-forward.dot(up));if(forward.lengthSq()<1e-8)return;forward.normalize();const right=new T.Vector3().crossVectors(up,forward).normalize();bear.avatar.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward));}

const smooth=(t,a,b)=>T.MathUtils.smoothstep(t,a,b);
// Both clients use the same two anchor points and clock. Hands share a world-space target.
export function socialPositions(kind,t,anchors,room){const mid=anchors[0].clone().add(anchors[1]).multiplyScalar(.5),up=room?new T.Vector3(0,1,0):mid.clone().normalize(),angle=kind==='dance'?Math.PI*2*smooth(t,.9,4.15):0;return anchors.map(p=>p.clone().sub(mid).applyAxisAngle(up,angle).add(mid))}
function reach(bear,index,target,weight){const arm=bear.arms[index];bear.avatar.updateWorldMatrix(true,true);const local=bear.body.worldToLocal(target.clone()).sub(arm.position),length=local.length(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,-1,0),local.normalize());arm.quaternion.slerp(q,weight);arm.scale.y=1+(Math.min(1.4,length/.34)-1)*weight;}
export function pairGesture(a,b,kind,t,room){
 const end=kind==='dance'?5:3,weight=smooth(t,.18,.75)*(1-smooth(t,end-.65,end));
 for(const bear of [a,b]){gesture(bear,kind,t,0);if(kind==='highfive'){bear.body.rotation.x=.03*weight;bear.arms.forEach(g=>g.rotation.set(-.15*weight,0,0))}bear.relax?.(weight>.2);}
 faceBear(a,b.avatar.position,room);faceBear(b,a.avatar.position,room);
 const up=(room?new T.Vector3(0,1,0):a.avatar.position.clone().add(b.avatar.position).normalize()).applyQuaternion(a.avatar.parent.getWorldQuaternion(new T.Quaternion()));
 // Opposite arm indices face the same side; matching indices would cross the bodies.
 for(const i of kind==='dance'?[0,1]:[1]){
  a.avatar.updateWorldMatrix(true,true);b.avatar.updateWorldMatrix(true,true);
  const target=a.arms[i].getWorldPosition(new T.Vector3()).add(b.arms[1-i].getWorldPosition(new T.Vector3())).multiplyScalar(.5).addScaledVector(up,kind==='dance'?-.08:.16);
  reach(a,i,target,weight);reach(b,1-i,target,weight);
 }
}
export function resetGesture(bear){bear.body.scale.set(1,1,1);bear.body.rotation.set(0,0,0);bear.body.position.y=groundedBody([0,0]);bear.arms.forEach(g=>{g.rotation.set(0,0,0);g.scale.set(1,1,1)});bear.legs.forEach(g=>g.rotation.set(0,0,0));bear.relax?.(false)}
