import {fail} from './store.mjs';
import {auroraMenu} from '../dist/aurora-menu.js';
export function createAuroraLodgeService({now=Date.now}={}){
 const guests=new Map();
 function prune(){for(const [id,g] of guests)if(now()-g.at>1800000)guests.delete(id)}
 return {view(u){prune();const g=guests.get(u.id);return {guests:g?[structuredClone(g)]:[],sky:{night:true,weather:'晴天'}}},
 update(u,b){prune();let g=guests.get(u.id);
 if(b.action==='leave'){guests.delete(u.id);return {guests:[]}}
 if(b.action==='join'){if(!g){fail(guests.size<500,'冰屋暂时客满，请稍后再来',429);g={id:u.id,at:now(),order:null,held:null};guests.set(u.id,g)}}
 fail(!!g,'请先进入冰屋',409);g.at=now();
 if(b.action==='order'){fail(!g.order&&!g.held,'你已经有一杯饮品了，先慢慢享用吧',409);fail(b.mode==='here'&&Array.isArray(b.items)&&b.items.length===1&&auroraMenu.some(x=>x.id===b.items[0]),'请选择冰屋菜单上的一杯饮品');g.order={items:b.items,startedAt:now(),readyAt:now()+6500}}
 else if(b.action==='take'){fail(g.order&&now()>=g.order.readyAt,'凛灯还在准备，请稍等',409);g.held=g.order;g.order=null}
 else if(b.action==='finish'){g.held=null}
 else fail(['join','status'].includes(b.action),'操作无效');
 return this.view(u);
 }};
}
