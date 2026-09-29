import {outfits} from '../dist/outfits.js';
import {fail} from './store.mjs';
export function createPresence(clock=Date.now){
 const people=new Map();const vector=(a,n,limit)=>Array.isArray(a)&&a.length===n&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<=limit);
 function update(user,b){
  if(b.hidden===true){people.delete(user.id);return}
  fail([0,1].includes(b.world)&&typeof b.room==='boolean'&&[0,1].includes(b.floor),'位置不正确');
  fail(vector(b.position,3,15)&&vector(b.quaternion,4,1.01)&&Math.abs(Math.hypot(...b.quaternion)-1)<.02,'姿态不正确');
  fail(vector(b.bodyPosition,3,3)&&vector(b.bodyRotation,3,7)&&Array.isArray(b.arms)&&b.arms.length===2&&b.arms.every(x=>vector(x,3,7))&&Array.isArray(b.legs)&&b.legs.length===2&&b.legs.every(x=>vector(x,3,7)),'姿态不正确');
  people.set(user.id,{space:user.space,at:clock(),actor:user.slot,identity:user.avatar,world:b.world,room:b.room,floor:b.floor,position:b.position,quaternion:b.quaternion,bodyPosition:b.bodyPosition,bodyRotation:b.bodyRotation,arms:b.arms,legs:b.legs,available:b.available!==false,sleeping:!!b.sleeping,listening:!!b.listening,outfit:Object.hasOwn(outfits,b.outfit)?b.outfit:'plain'});
  if(people.size>1000)for(const [id,p]of people)if(clock()-p.at>10000)people.delete(id);
 }
 return {update,remove:id=>people.delete(id),peer(user,partner){if(!partner)return null;const p=people.get(partner.id);return p&&p.space===user.space&&clock()-p.at<10000?p:null}};
}
