import * as T from './vendor/three.module.js';
import {normal,height,distance,step,route,walkable} from './surface-nav.js';
export function createPet({outdoor,box,ball,cylinder,group,place,obstacles,onEvent}){
 const home=normal(.12,.16),dog=group(outdoor),body=group(dog),paws=[];
 const coat=0xc9a06d;let trunk=ball(body,coat,0,.23,0,.2,18);trunk.scale.multiply(new T.Vector3(.8,.75,1.3));ball(body,0xf2dfb9,0,.2,.18,.12,16);
 const head=group(body,0,.34,.23);ball(head,coat,0,0,0,.13,20);let muzzle=ball(head,0xf3e1bf,0,-.03,.095,.095,16);muzzle.scale.multiply(new T.Vector3(1,.68,1));ball(head,0x42352c,0,-.013,.181,.033,12);
 for(let s of [-1,1]){let ear=ball(head,0x99734d,s*.124,-.035,-.014,.08,16);ear.scale.multiply(new T.Vector3(.58,1.5,.72));ball(head,0x3d332b,s*.053,.028,.108,.017,10);ball(head,0xfff8df,s*.056,.034,.122,.005,8)}
 for(let x of [-.105,.105])for(let z of [-.14,.14]){let leg=group(body,x,.18,z);cylinder(leg,coat,0,-.067,0,.034,.043,.15);ball(leg,0xeed8b5,0,-.125,.025,.05,12);paws.push(leg)}
 const tail=group(body,0,.27,-.21);let tailMesh=ball(tail,coat,0,.06,-.055,.055,12);tailMesh.scale.multiply(new T.Vector3(.62,1.45,1.2));tail.rotation.x=-.45;
 cylinder(body,0x708f8b,0,.31,.17,.105,.105,.045);ball(body,0xc7a559,0,.27,.254,.024,10);
 const bed=place(outdoor,.12,.16);let cushion=ball(bed,0x9dae92,0,.025,0,.29,20);cushion.scale.y=.16;
 const bowlFrame=place(outdoor,.22,.15),bowl=cylinder(bowlFrame,0x7f9c94,0,.045,0,.12,.09,.09),kibble=group(bowlFrame);
 for(let i=0;i<10;i++)ball(kibble,0x98734c,Math.cos(i*2.4)*.07,.077,Math.sin(i*2.4)*.07,.019,8);kibble.visible=false;
 const toy=group(outdoor),ballToy=ball(toy,0xd3955d,0,0,0,.07,16),disc=cylinder(toy,0x6faaa8,0,0,0,.13,.13,.022);toy.visible=false;
 let n=home.clone(),heading=new T.Vector3(0,0,1),path=[],mode='idle',observedMode='idle',kind='ball',timer=0,repath=0,target=null,throwFrom=null,returnTo=null,moved=0;
 const matrix=new T.Matrix4(),up=new T.Vector3(0,1,0);
 function position(g,v,lift=0){g.position.copy(v).multiplyScalar(height(v)+lift)}
 function travel(dt){if(!path.length)return false;const d=distance(n,path[0]);if(d<.04){n.copy(path.shift());return !!path.length}heading.copy(path[0]).addScaledVector(n,-path[0].dot(n)).normalize();const amount=Math.min(d,dt*1.7);const next=step(n,heading,amount);if(!walkable(next,obstacles)){path=route(n,target||home,obstacles);return false}n.copy(next);moved+=amount;return true}
 function go(v){target=v.clone();path=route(n,v,obstacles)}
 function back(){kibble.scale.setScalar(1);head.rotation.x=0;head.position.set(0,.34,.23);mode='home';toy.visible=false;kibble.visible=false;go(home)}
 function done(type){onEvent(type)}
 const api={command(action,player){
 if(['throw','fetch','return','feed-approach','feeding'].includes(mode))return false;
 if(action==='walk'){mode='walk';repath=0;return true}
 if(action==='home'){back();return true}
 if(action==='feed'){mode='feed-approach';go(normal(.22,.08));kibble.visible=true;return true}
 if(action==='ball'||action==='disc'){
  let dir=new T.Vector3(n.y,-n.x,0).normalize(),goal=null;
  for(let s of [1,-1])for(let length of [2.1,1.5,.9]){let v=step(player,dir.clone().multiplyScalar(s),length);if(walkable(v,obstacles)&&route(n,v,obstacles).length){goal=v;break}if(goal)break}
  if(!goal)return false;kind=action;returnTo=player.clone();throwFrom=player.clone();target=goal;mode='throw';timer=0;toy.visible=true;ballToy.visible=kind==='ball';disc.visible=kind==='disc';return true}
 return false},reset(){head.rotation.x=0;head.position.set(0,.34,.23);kibble.scale.setScalar(1);mode='idle';n.copy(home);path=[];toy.visible=false;kibble.visible=false;moved=0},stop(){back()},focus(){return ['feed-approach','feeding'].includes(mode)?dog.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.25,0)):null},state(){return {mode,kind,normal:n.toArray(),home:home.toArray(),moving:path.length>0,distance:moved}},tick(dt,t,player,indoors){
 if(indoors&&mode!=='idle'&&mode!=='home')back();
 let walking=false;
 if(mode==='walk'){repath-=dt;if(repath<=0){repath=.65;if(distance(n,player)>.95){const behind=n.clone().addScaledVector(player,-n.dot(player)).normalize();go(step(player,behind,.85))}else path=[]}walking=travel(dt)}
 else if(mode==='throw'){timer+=dt;let a=Math.min(1,timer/.7),v=throwFrom.clone().lerp(target,a).normalize();position(toy,v,.12+Math.sin(a*Math.PI)*(kind==='disc'?.7:1));toy.rotation.y=t*8;if(a===1){mode='fetch';go(target)}}
 else if(['home','fetch','return','feed-approach'].includes(mode)){walking=travel(dt);if(!path.length){if(mode==='home'){mode='idle'}else if(mode==='fetch'){mode='return';go(returnTo)}else if(mode==='return'){toy.visible=false;mode='idle-away';timer=0;done('fetch-'+kind)}else{mode='feeding';timer=0;heading.copy(normal(.22,.15)).addScaledVector(n,-normal(.22,.15).dot(n)).normalize()}}}
 else if(mode==='idle-away'){timer+=dt;if(timer>5)back()}
 else if(mode==='feeding'){timer+=dt;head.position.set(0,.20,.16);head.rotation.x=.65+Math.sin(t*6)*.06;kibble.scale.setScalar(Math.max(.02,1-timer/3.5));if(timer>3.5){head.rotation.x=0;head.position.set(0,.34,.23);kibble.visible=false;kibble.scale.setScalar(1);back();done('fed')}}
 if(mode==='return'){position(toy,n,.39);toy.position.addScaledVector(heading,.34);toy.rotation.set(0,t*2,0)}
 heading.addScaledVector(n,-heading.dot(n)).normalize();if(heading.lengthSq()<.1)heading.set(0,0,1).addScaledVector(n,-n.z).normalize();let right=new T.Vector3().crossVectors(n,heading).normalize();matrix.makeBasis(right,n,heading);dog.quaternion.setFromRotationMatrix(matrix);position(dog,n,.025);body.position.y=walking?Math.abs(Math.sin(t*11))*.02:Math.sin(t*2)*.004;
 if(observedMode!==mode){observedMode=mode;done('status')}
 paws.forEach((p,i)=>p.rotation.x=walking?Math.sin(t*11+(i===0||i===3?0:Math.PI))*.55:0);tail.rotation.z=Math.sin(t*(mode==='idle'?3:9))*.5;
 }};
 api.reset();return api;
}

