import {randomUUID} from 'node:crypto';
import {fail} from './store.mjs';
import {cafeMenu,cafeSeats,islandSky} from '../dist/cafe-catalog.js';
export function createCafe(db,{partner=()=>null,deliver=()=>{},profile=u=>({outfit:'plain'}),now=Date.now}={}){
 db.exec(`CREATE TABLE IF NOT EXISTS cafe_orders(account INTEGER NOT NULL, command TEXT NOT NULL, item TEXT NOT NULL, mode TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(account,command));`);
 const guests=new Map(),ttl=20000;
 function clean(){for(const [id,g]of guests)if(now()-g.seen>ttl)guests.delete(id)}
 function join(u){clean();let g=guests.get(u.id);if(g)return g;const peer=guests.get(partner(u)?.id);let room=peer?.room||1;
  fail(!peer||[...guests.values()].filter(g=>g.room===room).length<8,'对方所在的咖啡馆已满，稍后再来一起坐吧',409);
  while([...guests.values()].filter(g=>g.room===room).length>=8)room++;
  const count=[...guests.values()].filter(g=>g.room===room).length;
  g={id:u.id,name:u.nickname||u.username,avatar:u.avatar,room,x:-.9+(count%3)*.9,z:4.5+Math.floor(count/3)*.7,yaw:Math.PI,seat:null,seen:now(),held:null,...profile(u)};guests.set(u.id,g);return g;
 }
 function view(u){clean();const own=guests.get(u.id);return {self:own?.id,room:own?.room,sky:islandSky(now()),guests:own?[...guests.values()].filter(g=>g.room===own.room).map(({seen,...g})=>g):[]}}
 function update(u,b){fail(b&&typeof b==='object','操作无效');clean();
  if(b.action==='leave'){guests.delete(u.id);return {left:true}}
  if(b.action==='join'){join(u);return view(u)}
  const g=guests.get(u.id);fail(g,'请重新进入咖啡馆',409);g.seen=now();
  if(b.action==='sync'){
   if(!g.seat&&[b.x,b.z,b.yaw].every(Number.isFinite)){g.x=Math.max(-6.5,Math.min(6.9,b.x));g.z=Math.max(-4,Math.min(7.15,b.z));g.yaw=b.yaw%(Math.PI*2)}
  }else if(b.action==='seat'){
   const s=cafeSeats.find(s=>s.id===b.seat);fail(s,'座位不存在');fail(![...guests.values()].some(o=>o.id!==u.id&&o.room===g.room&&o.seat===s.id),'这里已经有人坐了',409);Object.assign(g,{seat:s.id,x:s.x,z:s.z,yaw:s.yaw});
  }else if(b.action==='stand'){const s=cafeSeats.find(s=>s.id===g.seat);g.seat=null;g.x=s?.approachX??g.x;g.z=s?.approachZ??g.z+.58;
  }else if(b.action==='eat'){fail(g.held&&g.held.readyAt<=now(),'还在制作中',409);g.held=null;
  }else if(b.action==='order'){
   const item=cafeMenu.find(i=>i.id===b.item);fail(item,'菜单中没有这款');fail(['here','takeaway'].includes(b.mode),'请选择在这吃或带走');fail(typeof b.command==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(b.command),'订单编号无效');
   const previous=db.prepare('SELECT * FROM cafe_orders WHERE account=? AND command=?').get(u.id,b.command);
   if(previous){fail(previous.item===b.item&&previous.mode===b.mode,'订单编号已使用',409);return {...view(u),ordered:true,takeaway:previous.mode==='takeaway'}}
   fail(!g.lastOrder||now()-g.lastOrder>=2000,'正在准备，请稍等一下',429);
   if(b.mode==='here')fail(!g.held,'先享用手里的这一份吧',409);
   db.exec('BEGIN IMMEDIATE');try{if(b.mode==='takeaway')deliver(u,item,randomUUID());db.prepare('INSERT INTO cafe_orders VALUES(?,?,?,?,?)').run(u.id,b.command,item.id,b.mode,now());db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
   g.lastOrder=now();g.service={item:item.id,startedAt:now()};if(b.mode==='here')g.held={item:item.id,readyAt:now()+3500};return {...view(u),ordered:true,takeaway:b.mode==='takeaway'};
  }else fail(false,'操作不存在');
  return view(u);
 }
 return {update,view,has(id){clean();return guests.has(id)}};
}
