import {STAIR_BOTTOM} from '../dist/cafe-upper-layout.js';
import {cafeRouteWalkable} from '../dist/cafe-navigation.js';
import {randomUUID} from 'node:crypto';
import {fail} from './store.mjs';
import {cafeMenu,cafeSeats,islandSky} from '../dist/cafe-catalog.js';
import {atCafeCounter,cafeServiceTiming,CAFE_COUNTER} from '../dist/cafe-service-state.js';
export function createCafe(db,{partner=()=>null,deliver=()=>{},profile=u=>({outfit:'plain'}),now=Date.now}={}){
 db.exec(`CREATE TABLE IF NOT EXISTS cafe_orders(account INTEGER NOT NULL, command TEXT NOT NULL, item TEXT NOT NULL, mode TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(account,command));CREATE TABLE IF NOT EXISTS cafe_pockets(account INTEGER PRIMARY KEY, state TEXT NOT NULL);`);
 if(!db.prepare('PRAGMA table_info(cafe_orders)').all().some(c=>c.name==='collected'))db.exec('ALTER TABLE cafe_orders ADD COLUMN collected INTEGER NOT NULL DEFAULT 1');
 const guests=new Map(),ttl=20000;
 function save(g){db.prepare('INSERT INTO cafe_pockets VALUES(?,?) ON CONFLICT(account) DO UPDATE SET state=excluded.state').run(g.id,JSON.stringify({order:g.order,held:g.held}))}
 function clean(){for(const [id,g]of guests)if(now()-g.seen>ttl)guests.delete(id)}
 function join(u){clean();let g=guests.get(u.id);if(g)return g;const peer=guests.get(partner(u)?.id);let room=peer?.room||1;
  fail(!peer||[...guests.values()].filter(g=>g.room===room).length<8,'对方所在的咖啡馆已满，稍后再来一起坐吧',409);
  while([...guests.values()].filter(g=>g.room===room).length>=8)room++;
  const count=[...guests.values()].filter(g=>g.room===room).length,pocket=JSON.parse(db.prepare('SELECT state FROM cafe_pockets WHERE account=?').get(u.id)?.state||'{}');
  g={id:u.id,name:u.nickname||u.username,avatar:u.avatar,room,x:-.9+(count%3)*.9,z:4.5+Math.floor(count/3)*.7,yaw:Math.PI,seat:null,floor:0,seen:now(),held:null,order:pocket.order||null,...profile(u)};if(g.held)g.held.pickedAt=Math.min(g.held.pickedAt,now()-1000);if(g.order){const used=new Set([...guests.values()].filter(o=>o.room===room&&o.order).map(o=>o.order.counterSlot));if(used.has(g.order.counterSlot))g.order.counterSlot=Array.from({length:8},(_,i)=>i).find(i=>!used.has(i))??0}g.service=g.order;guests.set(u.id,g);return g;
 }
 function view(u){clean();const own=guests.get(u.id);return {self:own?.id,room:own?.room,sky:islandSky(now()),guests:own?[...guests.values()].filter(g=>g.room===own.room).map(({seen,lastOrder,...g})=>g):[]}}
 function update(u,b){fail(b&&typeof b==='object','操作无效');clean();
  if(b.action==='leave'){const g=guests.get(u.id);if(g){g.held=null;g.dining=null;save(g)}guests.delete(u.id);return {left:true}}
  if(b.action==='join'){const g=join(u);if(b.fresh){g.held=null;g.dining=null;g.seat=null;g.floor=0;g.x=0;g.z=4.5;save(g)}return view(u)}
  const g=guests.get(u.id);fail(g,'请重新进入咖啡馆',409);g.seen=now();
  if(b.action==='sync'){
   g.moving=!!b.moving;
   if(b.ship){const v=b.ship;fail(['boarding','sailing','returning','disembarking'].includes(v.phase)&&[v.angle,v.time,v.speed].every(Number.isFinite)&&Math.abs(v.angle)<100000&&v.time>=0&&v.time<1e12&&v.speed>=0&&v.speed<=2,'航行状态无效');fail(Number.isFinite(v.deckY)&&v.deckY>=-.1&&v.deckY<=.8,'甲板位置无效');const vec=(a,n,max)=>Array.isArray(a)&&a.length===n&&a.every(x=>Number.isFinite(x)&&Math.abs(x)<=max);if(v.position||v.quaternion)fail(vec(v.position,3,20)&&vec(v.quaternion,4,1.01),'乘客位置无效');g.ship={phase:v.phase,angle:v.angle,time:v.time,speed:v.speed,deckY:v.deckY,position:v.position,quaternion:v.quaternion};}else g.ship=null;
   if(!g.seat&&(!g.handoff||now()>=g.handoff.endsAt)&&[b.x,b.z,b.yaw].every(Number.isFinite)){if(cafeRouteWalkable(b.x,b.z,g.floor)){g.x=b.x;g.z=b.z;}g.yaw=b.yaw%(Math.PI*2)}
  }else if(b.action==='floor'){
   fail([0,1].includes(b.floor)&&!g.seat&&Math.hypot(g.x-STAIR_BOTTOM.x,g.z-STAIR_BOTTOM.z)<.65,'请先走到楼梯入口',409);g.floor=b.floor;
  }else if(b.action==='seat'){
   fail(!g.handoff||now()>=g.handoff.endsAt,'先接好托盘再走吧',409);const s=cafeSeats.find(s=>s.id===b.seat);fail(s,'座位不存在');fail((s.floor||0)===(g.floor||0),'请先走到座位所在楼层',409);fail(![...guests.values()].some(o=>o.id!==u.id&&o.room===g.room&&o.seat===s.id),'这里已经有人坐了',409);if(g.seat!==s.id){g.dining=g.held?{startedAt:now(),items:[...g.held.items]}:null}Object.assign(g,{seat:s.id,x:s.x,z:s.z,yaw:s.yaw});
  }else if(b.action==='stand'){const s=cafeSeats.find(s=>s.id===g.seat);if(g.seat){g.held=null;g.dining=null;save(g)}g.seat=null;g.x=s?.approachX??g.x;g.z=s?.approachZ??g.z+.58;
  }else if(b.action==='eat'){
   fail(!g.handoff||now()>=g.handoff.endsAt,'先接好托盘吧',409);fail(g.held?.items?.includes(b.item),'托盘里没有这份餐食',409);fail(g.seat,'先找个座位坐下，慢慢享用吧',409);g.held.items=g.held.items.filter(id=>id!==b.item);if(!g.held.items.length)g.held=null;g.dining=g.held?{startedAt:now(),items:[...g.held.items]}:null;save(g);
  }else if(b.action==='pickup'){
   const receipt=db.prepare('SELECT * FROM cafe_orders WHERE account=? AND command=?').get(u.id,b.command);fail(receipt,'没有找到这份订单',404);if(receipt.collected)return {...view(u),pickedUp:true,takeaway:receipt.mode==='takeaway'};
   fail(g.order?.command===b.command,'请重新查看当前订单',409);fail(now()>=g.order.readyAt,'主理熊还在准备，请稍等',409);
   fail(!g.floor&&!g.seat&&Math.hypot(g.x-CAFE_COUNTER.x,g.z-CAFE_COUNTER.z)<.85,'请走到吧台取餐处',409);
   const order=g.order,held=g.held;
   db.exec('BEGIN IMMEDIATE');try{if(order.mode==='takeaway'){for(const id of order.items)deliver(u,cafeMenu.find(i=>i.id===id),randomUUID())}else{fail(!g.held,'先享用托盘里的餐食吧',409);g.held={items:[...order.items],pickedAt:now(),command:order.command}}
    g.order=null;save(g);db.prepare('UPDATE cafe_orders SET collected=1 WHERE account=? AND command=?').run(u.id,b.command);db.exec('COMMIT');g.service=null;g.handoff=null;
   }catch(e){g.order=order;g.held=held;db.exec('ROLLBACK');throw e}return {...view(u),pickedUp:true,takeaway:order.mode==='takeaway'};
  }else if(b.action==='order'){
   const items=Array.isArray(b.items)?b.items:[b.item];fail(items.length>=1&&items.length<=2&&new Set(items).size===items.length&&items.every(id=>cafeMenu.some(i=>i.id===id)),'请选择菜单里的餐食');
   fail(items.filter(id=>cafeMenu.find(i=>i.id===id).kind==='dessert').length<=1&&items.filter(id=>cafeMenu.find(i=>i.id===id).kind!=='dessert').length<=1,'每个托盘可放一杯饮品和一份甜品');
   fail(['here','takeaway'].includes(b.mode),'请选择在店享用或打包带走');fail(typeof b.command==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(b.command),'订单编号无效');
   const encoded=JSON.stringify(items),previous=db.prepare('SELECT * FROM cafe_orders WHERE account=? AND command=?').get(u.id,b.command);
   if(previous){fail((previous.item===encoded||items.length===1&&previous.item===items[0])&&previous.mode===b.mode,'订单编号已使用',409);return {...view(u),ordered:true}}
   fail(atCafeCounter(g),'先到吧台，主理熊会招呼你',409);fail(!g.order,'已经在为你准备了，请稍等',409);fail(!g.held,'先享用托盘里的这一份吧',409);
   const start=Math.max(now(),...[...guests.values()].filter(o=>o.room===g.room&&o.handoff).map(o=>o.handoff.endsAt),...[...guests.values()].filter(o=>o.room===g.room&&o.order).map(o=>o.order.readyAt));
   const used=new Set([...guests.values()].filter(o=>o.room===g.room&&o.order).map(o=>o.order.counterSlot));const counterSlot=Array.from({length:8},(_,i)=>i).find(i=>!used.has(i))??0;
   const order={counterSlot,command:b.command,items:[...items],item:items[0],mode:b.mode,...cafeServiceTiming(start,items.length)};
   db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO cafe_orders(account,command,item,mode,created,collected) VALUES(?,?,?,?,?,0)').run(u.id,b.command,encoded,b.mode,now());g.order=order;save(g);db.exec('COMMIT')}catch(e){g.order=null;db.exec('ROLLBACK');throw e}
   g.service=order;return {...view(u),ordered:true};
  }else fail(false,'操作不存在');
  return view(u);
 }
 return {update,view,has(id){clean();return guests.has(id)}};
}
