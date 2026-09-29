import {normal,height} from './surface-nav.js';
import {groundedBody} from './grounding.js';
import * as T from './vendor/three.module.js';
import {createTeddy} from './teddy.js?v=19';
export function createRemoteBear(outdoor,indoor){
 const bear=createTeddy(outdoor,1),a=bear.avatar; a.visible=false;a.userData.remote=true;let target=null,last=0,snap=true;
 const q=new T.Quaternion(),p=new T.Vector3();
 return {bear,hit(ray){return a.visible&&ray.intersectObject(a,true).length>0},design:bear.design,receive(next){snap=!target||!next||target.world!==next.world||target.room!==next.room||target.floor!==next.floor;target=next;last=performance.now()},tick(dt,world,room,floor,localPosition,roomFree,layout){
  a.visible=!!target&&performance.now()-last<10000&&target.world===world&&target.room===room&&(!room||target.floor===floor);if(!a.visible)return;
  let pose=target;if(target.resident){const n=normal(-.08,.34),rot=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),n);pose={...target,position:target.sleeping?[layout.upper.bed[0],3.55,layout.upper.bed[1]-.05]:n.multiplyScalar(height(n)).toArray(),quaternion:target.sleeping?new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0)).toArray():rot.toArray(),bodyPosition:[0,target.sleeping?0:groundedBody([0,0]),0],bodyRotation:[0,0,0],arms:[[0,0,target.sleeping?.2:0],[0,0,target.sleeping?-.2:0]],legs:[[0,0,0],[0,0,0]]}}
  const parent=room?indoor:outdoor;if(a.parent!==parent){parent.add(a);snap=true}const k=snap?1:1-Math.exp(-dt*9);p.fromArray(pose.position);q.fromArray(pose.quaternion);a.position.lerp(p,k);a.quaternion.slerp(q,k);bear.setIdentity(target.identity);bear.sleep(target.sleeping);bear.headphones(target.listening);bear.outfit(target.outfit);
  bear.body.position.lerp(p.fromArray(pose.bodyPosition),k);['x','y','z'].forEach((axis,i)=>bear.body.rotation[axis]+=(pose.bodyRotation[i]-bear.body.rotation[axis])*k);for(const [name,parts]of [['arms',bear.arms],['legs',bear.legs]])parts.forEach((g,i)=>['x','y','z'].forEach((axis,j)=>g.rotation[axis]+=(pose[name][i][j]-g.rotation[axis])*k));snap=false;
 },state(){return {visible:a.visible,position:a.position.toArray(),identity:a.userData.identity,available:target?.available!==false,actor:target?.actor,sleeping:!!target?.sleeping,resident:!!target?.resident,world:target?.world,room:target?.room}},dispose(){a.removeFromParent();const gs=new Set(),ms=new Set(),ts=new Set();a.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of o.material?[].concat(o.material):[]){ms.add(m);if(m.bumpMap)ts.add(m.bumpMap)}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose())}};
}
