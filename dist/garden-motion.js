import * as T from './vendor/three.module.js';
import {createPlant} from './garden-models.js';
const clamp=T.MathUtils.clamp,smooth=x=>{x=clamp(x,0,1);return x*x*x*(x*(x*6-15)+10)};
const pulse=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function createGardenMotion({garden,beds,avatar,body,arms,legs,outdoor,groundAt}){
 let run=null;
 const hand=new T.Group();hand.position.set(.035,-.32,.035);arms[1].add(hand);
 const can=new T.Group(),trowel=new T.Group(),water=new T.Group();hand.add(can,trowel);garden.add(water);can.visible=trowel.visible=water.visible=false;
 const materials={green:new T.MeshStandardMaterial({color:0x85a99c,roughness:.7}),rim:new T.MeshStandardMaterial({color:0xcbd6bc,roughness:.65}),wood:new T.MeshStandardMaterial({color:0xb99565,roughness:.9}),steel:new T.MeshStandardMaterial({color:0xb8bca9,roughness:.5}),water:new T.MeshBasicMaterial({color:0xa6d3db,transparent:true,opacity:.8})};
 function mesh(parent,geometry,material,position=V()){const o=new T.Mesh(geometry,material);o.position.copy(position);o.castShadow=material!==materials.water;parent.add(o);return o}
 mesh(can,new T.CylinderGeometry(.075,.085,.14,20),materials.green,V(0,-.15,.025));
 const handle=mesh(can,new T.TorusGeometry(.066,.012,8,28),materials.rim,V(0,-.066,.025));
 const spoutStart=V(0,-.17,.08),spoutEnd=V(0,-.10,.24),delta=spoutEnd.clone().sub(spoutStart);
 const spout=mesh(can,new T.CylinderGeometry(.016,.023,delta.length(),12),materials.green,spoutStart.clone().add(spoutEnd).multiplyScalar(.5));spout.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());
 const nozzle=mesh(can,new T.SphereGeometry(.028,12,8),materials.rim,spoutEnd);nozzle.scale.set(1,.5,1);
 mesh(trowel,new T.CylinderGeometry(.015,.015,.15,10),materials.wood,V(0,-.015,.015));
 const blade=mesh(trowel,new T.SphereGeometry(1,16,10),materials.steel,V(0,-.13,.035));blade.scale.set(.037,.065,.009);blade.rotation.x=-.25;
 const drops=Array.from({length:14},()=>mesh(water,new T.SphereGeometry(.007,6,4),materials.water));
 function grounded(point){return garden.worldToLocal(outdoor.localToWorld(groundAt(outdoor.worldToLocal(garden.localToWorld(point.clone())))))}
 function orient(position,direction){const p=outdoor.worldToLocal(garden.localToWorld(position.clone())),upWorld=outdoor.localToWorld(p.clone().add(p.clone().normalize())),up=garden.worldToLocal(upWorld).sub(position).normalize();const forward=direction.clone().addScaledVector(up,-direction.dot(up)).normalize(),right=V().crossVectors(up,forward).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward));}
 // Ground the actual ellipsoidal feet even while the torso leans or knees flex.
 function feet(){const bq=body.quaternion;let bottom=Infinity;legs.forEach(leg=>{const q=bq.clone().multiply(leg.quaternion),center=V(0,-.078,.022).applyQuaternion(leg.quaternion).add(leg.position).applyQuaternion(bq),extent=Math.hypot(V(.128,0,0).applyQuaternion(q).y,V(0,.167,0).applyQuaternion(q).y,V(0,0,.144).applyQuaternion(q).y);bottom=Math.min(bottom,center.y-extent)});body.position.y=-bottom;}
 function cleanFlower(r){if(!r.flower)return;r.flower.traverse(o=>{if(o.isMesh)o.geometry.dispose()});r.flower.removeFromParent()}
 function stop(ok=false){if(!run)return;const r=run;run=null;can.visible=trowel.visible=water.visible=false;cleanFlower(r);if(ok)r.parent.attach(avatar);else{r.parent.add(avatar);avatar.position.copy(r.position);avatar.quaternion.copy(r.quaternion);}body.position.copy(r.bodyPosition);body.rotation.copy(r.bodyRotation);arms.forEach((a,i)=>a.rotation.copy(r.arms[i]));legs.forEach((a,i)=>a.rotation.copy(r.legs[i]));r.resolve(ok)}
 function walking(r,u,back,dt){const s=smooth(u),progress=back?1-s:s;avatar.position.copy(grounded(r.path.getPointAt(progress)));const direction=r.path.getTangentAt(progress).multiplyScalar(back?-1:1);let facing=orient(avatar.position,direction);const near=smooth((u-.75)/.25);if(near)facing.slerp(back?r.startQuaternion:r.workQuaternion,near);avatar.quaternion.rotateTowards(facing,dt*3.6);const stride=Math.sin(Math.PI*u)**.5;legs.forEach((a,i)=>a.rotation.set(Math.sin(r.t*9+i*Math.PI)*.25*stride,0,0));arms.forEach((a,i)=>a.rotation.set(-Math.sin(r.t*9+i*Math.PI)*.18*stride,0,0));body.rotation.set(0,0,Math.sin(r.t*9)*.012*stride);feet();}
 return {get active(){return !!run},stop,state(){return run?{phase:run.phase,type:run.type,time:run.t,hand:hand.getWorldPosition(V()).toArray(),tool:(run.type==='water'?can:trowel).getWorldPosition(V()).toArray()}:null},start(type,plot,crop){if(run||!beds[plot])return Promise.resolve(false);return new Promise(resolve=>{
 const r=run={type,phase:'approach',t:0,resolve,parent:avatar.parent,position:avatar.position.clone(),quaternion:avatar.quaternion.clone(),bodyRotation:body.rotation.clone(),bodyPosition:body.position.clone(),arms:arms.map(a=>a.rotation.clone()),legs:legs.map(a=>a.rotation.clone())};
 garden.attach(avatar);r.startQuaternion=avatar.quaternion.clone();r.from=avatar.position.clone();const bed=beds[plot].position;r.to=grounded(V(0,0,bed.z+.015));r.workQuaternion=orient(r.to,bed.clone().sub(r.to));
 const inAisle=Math.abs(r.from.x)<.15&&r.from.z<1.35;const points=inAisle?[r.from.clone(),r.to.clone()]:[r.from.clone(),V(r.from.x*.4,0,Math.max(r.from.z,1.28)),V(0,0,1.08),r.to.clone()];r.path=inAisle?new T.LineCurve3(r.from.clone(),r.to.clone()):new T.CatmullRomCurve3(points,false,'centripetal');r.walk=r.from.distanceTo(r.to)<.025?0:Math.max(.45,r.path.getLength()/1.05);r.work=type==='plant'?2.8:type==='water'?2.5:2.3;
 if(type==='harvest'){r.flower=createPlant(hand,crop,true);r.flower.position.set(0,-.14,.035);r.flower.visible=false}
 })},tick(dt){if(!run)return;const r=run;r.t+=dt;can.visible=trowel.visible=water.visible=false;const t=r.t-r.walk;
 if(t<0){walking(r,r.t/r.walk,false,dt);return}
 if(t>r.work){r.phase='settle';if(r.flower)r.flower.visible=false;const q=smooth((t-r.work)/.25);body.rotation.copy(r.bodyRotation);body.position.lerp(r.bodyPosition,q);arms.forEach((a,i)=>a.rotation.copy(r.arms[i]));legs.forEach((a,i)=>a.rotation.copy(r.legs[i]));if(q===1)stop(true);return}
 r.phase='work';avatar.position.copy(r.to);avatar.quaternion.rotateTowards(r.workQuaternion,dt*3.6);
 const hold=pulse(t,0,.45,r.work-.45,r.work),bend=(typeBend(r.type))*hold;body.rotation.set(bend,0,0);legs.forEach(a=>a.rotation.set(-.10*hold,0,0));
 let right=-.78*hold,left=-.24*hold;
 if(r.type==='plant'){const dig=pulse(t,.45,.65,1.45,1.65)*Math.sin((t-.45)*Math.PI*4);right+=.13*dig;left-=.40*pulse(t,1.55,1.8,2.05,2.3);trowel.visible=hold>.001;trowel.scale.setScalar(smooth(t/.25)*(1-smooth((t-(r.work-.3))/.3)));trowel.quaternion.copy(arms[1].quaternion).invert().multiply(new T.Quaternion().setFromEuler(new T.Euler(.20+dig*.12,0,0)))}
 if(r.type==='water'){const pour=pulse(t,.5,.85,1.6,2.05);right=-1.03*hold;left=-.58*hold;can.visible=hold>.001;can.scale.setScalar(smooth(t/.25)*(1-smooth((t-(r.work-.3))/.3)));can.userData.pour=pour;}
 if(r.flower){const lift=smooth((t-.75)/.7);right=(-.67-.50*lift)*hold;left=-.52*hold;r.flower.visible=t>.75;r.flower.scale.setScalar(.75*smooth((t-.75)/.25)*(1-smooth((t-(r.work-.35))/.35)));r.flower.quaternion.copy(arms[1].quaternion).invert();}
 arms[0].rotation.set(left,0,.10*hold);arms[1].rotation.set(right,0,-.07*hold);feet();
 if(r.type==='plant')trowel.quaternion.copy(arms[1].quaternion).invert().multiply(new T.Quaternion().setFromEuler(new T.Euler(.15,0,0)));
 if(r.type==='water'){const pour=can.userData.pour;can.quaternion.copy(arms[1].quaternion).invert().multiply(new T.Quaternion().setFromEuler(new T.Euler(.60*pour,0,0)));garden.updateWorldMatrix(true,true);const tip=garden.worldToLocal(can.localToWorld(spoutEnd.clone())),floor=grounded(tip).y+.015;water.visible=pour>.08;drops.forEach((d,i)=>{const fall=((t-.5)*1.6+i/drops.length)%1;d.position.set(tip.x+Math.sin(i)*.008,tip.y+(floor-tip.y)*fall*fall,tip.z+fall*.07);d.scale.set(1,1.5,1)})}
 if(r.flower)r.flower.quaternion.copy(arms[1].quaternion).invert();
 }};
}
function typeBend(type){return type==='plant'?.32:type==='harvest'?.20:.08}
