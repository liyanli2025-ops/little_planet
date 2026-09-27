import * as T from './vendor/three.module.js';
import {makeBeverage} from './beverage-models.js';

export const sippingMouth=new T.Vector3(0,.77,.304);
const down=new T.Vector3(0,-1,0),shoulder=new T.Vector3(-.27,.61,0);
const wristAt=(sip)=>new T.Vector3(-.33,.42,.24).lerp(new T.Vector3(-.18,.58,.296),sip).sub(shoulder).normalize().multiplyScalar(.31).add(shoulder);
export function sipAmount(elapsed){const t=elapsed%14,smooth=v=>v*v*v*(v*(v*6-15)+10);return t<4?0:t<6?smooth((t-4)/2):t<7.6?1:t<9.6?1-smooth((t-7.6)/2):0}
export function makeSippingDrink(body,arm,avatar,id){
 const rig=new T.Group();rig.name='held-drink';body.add(rig);
 const model=makeBeverage(id,{drinking:true}),opening=new T.Vector3(...model.userData.opening),scale=.19/opening.y;model.scale.setScalar(scale);rig.add(model);
 const upright=avatar.quaternion.clone().invert();
 function pose(sip){
  const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.58*(1-sip)).multiply(upright);
  const up=new T.Vector3(0,1,0).applyQuaternion(q),wrist=wristAt(sip);
  return {q,wrist,base:wrist.clone().add(new T.Vector3(-.024,0,.085)).addScaledVector(up,-.095)};
 }
 const drinking=pose(1),tip=sippingMouth.clone().sub(drinking.base).applyQuaternion(drinking.q.clone().invert());
 const start=opening.clone().multiplyScalar(scale),elbow=start.clone().lerp(tip,.70);elbow.y=Math.max(start.y+.052,tip.y);
 const points=[start.clone().add(new T.Vector3(0,-.014,0)),start.clone().add(new T.Vector3(0,.037,0)),elbow,tip];
 const curve=new T.CatmullRomCurve3(points,false,'centripetal');
 const straw=new T.Mesh(new T.TubeGeometry(curve,32,.005,8,false),new T.MeshStandardMaterial({color:0xf4dab3,roughness:.6}));straw.name='drinking-straw';rig.add(straw);
 const tipMarker=new T.Object3D();tipMarker.position.copy(tip);rig.add(tipMarker);
 // The straw is built once and moves rigidly with the cup. It never grows or bends
 // toward the face as an IK target, and the wrist always stays on the same arm length.
 const samples=curve.getPoints(32);let amount=0;
 return {tick(elapsed){amount=sipAmount(elapsed);const {q,wrist,base}=pose(amount);rig.position.copy(base);rig.quaternion.copy(q);arm.quaternion.setFromUnitVectors(down,wrist.clone().sub(shoulder).normalize())},state(){body.updateWorldMatrix(true,true);const tipInBody=body.worldToLocal(tipMarker.getWorldPosition(new T.Vector3()));return {sip:amount,tip:tipInBody.toArray(),mouthGap:tipInBody.distanceTo(sippingMouth),wrist:wristAt(amount).toArray(),straw:samples.map(v=>v.clone().applyQuaternion(rig.quaternion).add(rig.position).toArray()),base:rig.position.toArray()}},dispose(){rig.removeFromParent();const gs=new Set(),ms=new Set();rig.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose())}};
}

