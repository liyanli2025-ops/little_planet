import * as T from './vendor/three.module.js';
import {makeCafeFood,disposeCafeObject} from './cafe-food.js';
import {cafeSeats} from './cafe-catalog.js';
import {cafeMenu} from './cafe-catalog.js';
import {CAFE_SERVE,cafeServicePhase,cafeTrayPlace} from './cafe-service-state.js';
const down=new T.Vector3(0,-1,0),v=(x,y,z)=>new T.Vector3(x,y,z),ease=t=>t*t*(3-2*t),mix=(a,b,t)=>a.clone().lerp(b,ease(T.MathUtils.clamp(t,0,1)));
export function aimCafePaw(bear,index,world){const arm=bear.arms[index];arm.parent.updateWorldMatrix(true,false);const delta=arm.parent.worldToLocal(world.clone()).sub(arm.position);arm.quaternion.setFromUnitVectors(down,delta.clone().normalize());arm.userData.cafeReach=T.MathUtils.clamp(delta.length()/.34,.8,1.8);arm.scale.set(1,1,1);const skin=arm.children.find(o=>o.name==='continuous-arm');if(skin)skin.scale.y=arm.userData.cafeReach;arm.updateWorldMatrix(true,false)}
export function makeCafeTray(items){const tray=new T.Group(),mat=new T.MeshStandardMaterial({color:0xa77d50,roughness:.72});
 const base=new T.Mesh(new T.BoxGeometry(.82,.035,.49),mat);base.castShadow=base.receiveShadow=true;tray.add(base);
 for(const side of [-1,1]){const rim=new T.Mesh(new T.BoxGeometry(.82,.045,.022),mat);rim.position.set(0,.023,side*.235);tray.add(rim);const end=new T.Mesh(new T.BoxGeometry(.025,.045,.49),mat);end.position.set(side*.4,.023,0);tray.add(end)}
 const hit=new T.Mesh(new T.BoxGeometry(.86,.32,.53),new T.MeshBasicMaterial({visible:false}));hit.position.y=.14;tray.add(hit);
 for(const part of tray.children)part.userData.trayShell=true;
 const spoon=new T.Group();spoon.userData.utensil=true;const metal=new T.MeshStandardMaterial({color:0xbfc8c4,metalness:.6,roughness:.3}),handle=new T.Mesh(new T.CylinderGeometry(.008,.008,.15,8),metal);handle.rotation.x=Math.PI/2;spoon.add(handle);const bowl=new T.Mesh(new T.SphereGeometry(1,12,8),metal);bowl.scale.set(.027,.008,.038);bowl.position.z=.095;spoon.add(bowl);spoon.visible=false;tray.add(spoon);tray.userData.spoon=spoon;
 tray.userData.foods=items.map((id,i)=>{const food=makeCafeFood(id);food.scale.setScalar(.68);food.position.set(items.length===1?0:i===0?-.19:.19,.025,0);food.userData.trayPosition=food.position.clone();tray.add(food);return food});return tray;
}
export function poseCafeTray(bear,tray,time,sipItem=null,sip=0){
 const seated=!!bear.data?.seat,seat=cafeSeats.find(s=>s.id===bear.data?.seat);for(const part of tray.children)if(part.userData.trayShell)part.visible=!seated;
 bear.avatar.updateWorldMatrix(true,false);tray.position.set(0,seated?(seat?.zone==='cinema'?seat.avatarY+.21:seat?.zone==='bar'?1.34:1.015)-bear.avatar.position.y:.54,seated?.63:.45);tray.rotation.set(0,Math.PI,0);
 tray.updateWorldMatrix(true,false);if(!seated)for(let i=0;i<2;i++)aimCafePaw(bear,i,bear.avatar.localToWorld(tray.position.clone().add(v(i?.32:-.32,-.01,-.12))));

 for(const food of tray.userData.foods){food.position.copy(food.userData.trayPosition);food.rotation.set(0,0,0)}
 tray.userData.spoon.visible=false;
 if(sip>0){const food=tray.userData.foods.find(f=>f.userData.food===sipItem);if(food){const dessert=cafeMenu.find(i=>i.id===sipItem)?.kind==='dessert',arm=dessert?1:0,goal=bear.avatar.localToWorld(v(dessert?.11:-.12,.83,.36)),rest=tray.localToWorld(food.userData.trayPosition.clone());aimCafePaw(bear,arm,rest.lerp(goal,sip));bear.arms[arm].updateWorldMatrix(true,false);const paw=bear.arms[arm].localToWorld(v(0,-.34*(bear.arms[arm].userData.cafeReach||1),0));if(dessert){const spoon=tray.userData.spoon;spoon.visible=true;spoon.position.copy(tray.worldToLocal(paw));spoon.rotation.set(-sip*.25,Math.PI,0)}else{food.position.copy(tray.worldToLocal(paw));food.rotation.x=-sip*.45}}}

}
export function createHostService(building,bear){
 const trays=new Map();let working=null,handing=null,activeCommand=null,startPose=null;const home=v(.15,.77,-3.48),pitcher=new T.Mesh(new T.CylinderGeometry(.095,.075,.21,20),new T.MeshStandardMaterial({color:0xaab7b1,metalness:.65,roughness:.3}));
 const stream=new T.Mesh(new T.CylinderGeometry(.009,.009,.18,10),new T.MeshBasicMaterial({color:0xd3b78c}));building.add(pitcher,stream);
 function inWorld(point){building.updateWorldMatrix(true,false);return building.localToWorld(point.clone())}
 function handObject(object,index,point){aimCafePaw(bear,index,inWorld(point));bear.arms[index].add(object);object.position.set(0,-.34*(bear.arms[index].userData.cafeReach||1),0);object.quaternion.copy(bear.arms[index].getWorldQuaternion(new T.Quaternion())).invert();object.updateWorldMatrix(true,false)}
 function setBear(point,look,walking,time){bear.avatar.position.copy(point);bear.avatar.rotation.y=Math.atan2(look.x-point.x,look.z-point.z);bear.body.position.y=walking?Math.abs(Math.sin(time*10))*.022:0;bear.body.rotation.set(0,0,0);bear.legs.forEach((l,i)=>l.rotation.x=walking?Math.sin(time*10+i*Math.PI)*.3:0);bear.arms.forEach((a,i)=>{a.rotation.set(walking?Math.sin(time*10+i*Math.PI)*.24:-.12,0,0);a.scale.set(1,1,1);a.children.find(o=>o.name==='continuous-arm')?.scale.set(1,1,1)});bear.avatar.updateWorldMatrix(true,true)}
 function putTray(tray,position){if(tray.parent!==building)building.add(tray);tray.position.copy(position);tray.quaternion.identity();tray.scale.setScalar(1)}
 function restFood(food,tray){if(food.parent!==tray)tray.add(food);food.position.copy(food.userData.trayPosition);food.quaternion.identity();food.scale.setScalar(.68)}
 function tick(guests,time){const list=[...guests.values()].map(b=>b.data),orders=list.filter(g=>g.order).map(g=>g.order),handoff=list.find(g=>g.handoff&&time<g.handoff.endsAt)?.handoff;
  const ids=new Set(orders.map(o=>o.command));if(handoff)ids.add(handoff.command);
  for(const [id,tray]of trays)if(!ids.has(id)){for(const food of tray.userData.foods){food.removeFromParent();disposeCafeObject(food)}tray.removeFromParent();disposeCafeObject(tray);trays.delete(id)}
  for(const order of [...orders,...(handoff?[handoff]:[])]){let tray=trays.get(order.command);if(!tray){tray=makeCafeTray(order.items);trays.set(order.command,tray);building.add(tray)}tray.userData.pick={type:'pickup',value:order.command};tray.userData.ready=time>=order.readyAt;const place=cafeTrayPlace(order.counterSlot);putTray(tray,v(place.x,place.y,place.z));tray.visible=time>=order.startedAt;for(let i=0;i<tray.userData.foods.length;i++){const f=tray.userData.foods[i];restFood(f,tray);f.visible=!!handoff&&handoff.command===order.command||time>=order.startedAt+(i+1)*7000}}
  working=orders.filter(o=>time>=o.startedAt&&time<o.readyAt).sort((a,b)=>a.startedAt-b.startedAt)[0];pitcher.visible=stream.visible=false;const seconds=time/1000;
  if(handoff){handing=handoff.command;const p=(time-handoff.startedAt)/3000,tray=trays.get(handoff.command),place=cafeTrayPlace(handoff.counterSlot),source=v(place.x,place.y,place.z),from=v(place.x,.77,-3.45),to=v(CAFE_SERVE.x,.77,-3.12);
   const at=p<.25?mix(home,from,p/.25):mix(from,to,(p-.25)/.55);setBear(at,v(at.x,1,-2),p<.8,seconds);if(p>.25){bear.body.rotation.x=.45;bear.avatar.updateWorldMatrix(true,true);const extended=v(CAFE_SERVE.x,1.43,-2.18),target=p<.72?mix(source,extended,(p-.25)/.47):mix(extended,v(CAFE_SERVE.x,1.08,-2.18),(p-.72)/.16);putTray(tray,target);tray.visible=p<.88;for(let i=0;i<2;i++)aimCafePaw(bear,i,inWorld(target.clone().add(v(i?.32:-.32,-.015,-.12))))}return;
  }
  handing=null;if(!working){const visitor=list.filter(g=>g.z>=-2.2&&g.z<=-.8).sort((a,b)=>Math.abs(a.x-bear.avatar.position.x)-Math.abs(b.x-bear.avatar.position.x))[0],destination=visitor?v(T.MathUtils.clamp(visitor.x,-3.7,.4),.77,-3.12):home;const returning=bear.avatar.position.distanceTo(destination)>.03,point=bear.avatar.position.clone().lerp(destination,.07);setBear(point,visitor?v(visitor.x,1,visitor.z):v(home.x,1,-2),returning,seconds);bear.arms[0].rotation.x=-.12+Math.sin(seconds*1.8)*.035;return}
  if(activeCommand!==working.command){activeCommand=working.command;startPose=bear.avatar.position.clone()}
  const phase=cafeServicePhase(working,time),tray=trays.get(working.command),food=tray.userData.foods[phase.index],item=cafeMenu.find(i=>i.id===working.items[phase.index]),dessert=item.kind==='dessert',p=phase.progress;
  const source=dessert?v(2.9,1.39,-3.72):v(-2.6,1.46,-3.32),station=dessert?v(2.9,.77,-4.13):v(-2.6,.77,-3.75),place=cafeTrayPlace(working.counterSlot),finish=v(place.x,.77,-3.4);
  const at=p<.22?mix(phase.index>0?finish:startPose,station,p/.22):p<.6?station:mix(station,finish,(p-.6)/.24);setBear(at,p<.6?source:v(place.x,1,-2),p<.22||p>=.6&&p<.84,seconds);
  food.visible=p>.24;const isPresent=phase.present>0;
  if(isPresent){for(const f of tray.userData.foods){restFood(f,tray);f.visible=true}setBear(finish,v(place.x,1,-2),false,seconds);bear.body.rotation.x=.24;bear.avatar.updateWorldMatrix(true,true);for(let i=0;i<2;i++)aimCafePaw(bear,i,inWorld(v(place.x+(i?.32:-.32),place.y,place.z-.12)));return}
  if(p>.24&&p<.84){let hold=source.clone();if(p>=.6){bear.avatar.updateWorldMatrix(true,false);hold=building.worldToLocal(bear.avatar.localToWorld(v(-.12,.61,.40)))}handObject(food,0,hold);
   if(!dessert&&p<.32){aimCafePaw(bear,1,inWorld(v(-2.71,1.63,-3.38)))}else if(!dessert&&p<.6){pitcher.visible=true;handObject(pitcher,1,hold.clone().add(v(.18,.20,-.01)));pitcher.rotation.z=-.6-Math.sin((p-.24)/.36*Math.PI)*.25;stream.visible=p>.32&&p<.52;stream.position.copy(hold).add(v(.055,.19,0));}else aimCafePaw(bear,1,inWorld(hold.clone().add(v(.17,0,0))));
  }else if(p>=.84){const dest=v(place.x+food.userData.trayPosition.x,place.y+.025,place.z);bear.body.rotation.x=.24;bear.avatar.updateWorldMatrix(true,true);if(p<.98){const from=building.worldToLocal(bear.avatar.localToWorld(v(-.12,.61,.4)));handObject(food,0,mix(from,dest,(p-.84)/.14))}else{aimCafePaw(bear,0,inWorld(dest));restFood(food,tray)}food.visible=true;}
 }
 return {tick,pickables:()=>[...trays.values()].filter(t=>t.visible&&t.userData.ready),state:()=>({working:working?.command||null,handing,trays:trays.size})};
}
