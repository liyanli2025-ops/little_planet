import {fail} from './store.mjs';
import {auroraMenu} from '../dist/aurora-menu.js';
export function createAuroraLodgeService({now=Date.now,sculptures=null,profile=()=>({})}={}){
 const guests=new Map();
 function prune(){for(const [id,g] of guests)if(now()-g.at>60000)guests.delete(id)}
 return {has(id){prune();return guests.has(id)},view(u){prune();return {self:u.id,sculptures:sculptures?.list()||[],guests:[...guests.values()].map(g=>g.id===u.id?structuredClone(g):{id:g.id,avatar:g.avatar,nickname:g.nickname,room:g.room,position:g.position,quaternion:g.quaternion,seated:g.seated,animation:g.animation,vehicle:g.vehicle,snowPlay:g.snowPlay,appearance:g.appearance,outfit:g.outfit}),sky:{night:true,weather:'晴天',time:now()}}},
 update(u,b){prune();let g=guests.get(u.id);
 if(b.action==='leave'){guests.delete(u.id);return {guests:[]}}
 if(b.action==='join'){if(!g){fail(guests.size<500,'冰屋暂时客满，请稍后再来',429);g={...profile(u),id:u.id,avatar:u.avatar===1?1:0,nickname:String(u.nickname||'访客').slice(0,24),at:now(),room:b.room==='outside'?'outside':'inside',position:null,quaternion:null,seated:false,order:null,held:null};guests.set(u.id,g)}}
 fail(!!g,'请先进入冰屋',409);g.at=now();if(b.action==='join'&&['inside','outside'].includes(b.room))g.room=b.room;
 if(b.action==='sync'){
  fail(['outside','inside'].includes(b.room),'位置无效');
  fail(Array.isArray(b.position)&&b.position.length===3&&b.position.every(x=>Number.isFinite(x)&&Math.abs(x)<30),'位置无效');
  fail(Array.isArray(b.quaternion)&&b.quaternion.length===4&&b.quaternion.every(x=>Number.isFinite(x)&&Math.abs(x)<=1.01),'方向无效');
  if(b.animation){const a=b.animation,vec=(v,n,limit)=>Array.isArray(v)&&v.length===n&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<=limit);fail(vec(a.bodyPosition,3,3)&&vec(a.bodyRotation,3,7)&&['arms','legs'].every(k=>Array.isArray(a[k])&&a[k].length===2&&a[k].every(v=>vec(v,3,7))),'动作无效');g.animation={bodyPosition:a.bodyPosition,bodyRotation:a.bodyRotation,arms:a.arms,legs:a.legs,drinking:!!a.drinking};}
  if(b.vehicle){const v=b.vehicle,vec=(a,n,max)=>Array.isArray(a)&&a.length===n&&a.every(x=>Number.isFinite(x)&&Math.abs(x)<=max);fail(v.kind==='sleigh'&&vec(v.position,3,30)&&vec(v.quaternion,4,1.01)&&vec(v.rotation,3,7)&&Number.isFinite(v.speed)&&v.speed>=0&&v.speed<=2,'载具无效');g.vehicle={kind:'sleigh',position:v.position,quaternion:v.quaternion,rotation:v.rotation,speed:v.speed};}else g.vehicle=null;
  if(b.snowPlay){const s=b.snowPlay,vec=v=>Array.isArray(v)&&v.length===3&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<30);fail(b.room==='outside'&&['ball','duck'].includes(s.tool)&&vec(s.ball)&&Number.isFinite(s.radius)&&s.radius>=0&&s.radius<=.4&&(!s.base||vec(s.base)),'制作动作无效');g.snowPlay={tool:s.tool,ball:s.ball,radius:s.radius,rolling:!!s.rolling,clamping:Math.max(0,Math.min(1,Number(s.clamping)||0)),base:s.base||null,baseRadius:Number.isFinite(s.baseRadius)?Math.max(0,Math.min(.38,s.baseRadius)):0};}else g.snowPlay=null;
  g.room=b.room;g.position=b.position;g.quaternion=b.quaternion;g.seated=!!b.seated;
 }

 if(b.action==='sculpture'){fail(!!sculptures,'制作尚未开放',503);sculptures.save(u,b,g,[...guests.values()]);}
 else if(b.action==='order'){fail(!g.order&&!g.held,'你已经有一杯饮品了，先慢慢享用吧',409);fail(b.mode==='here'&&Array.isArray(b.items)&&b.items.length===1&&auroraMenu.some(x=>x.id===b.items[0]),'请选择冰屋菜单上的一杯饮品');g.order={items:b.items,startedAt:now(),readyAt:now()+6500}}
 else if(b.action==='take'){fail(g.order&&now()>=g.order.readyAt,'凛灯还在准备，请稍等',409);g.held=g.order;g.order=null}
 else if(b.action==='finish'){g.held=null}
 else fail(['join','status','sync'].includes(b.action),'操作无效');
 return this.view(u);
 }};
}
