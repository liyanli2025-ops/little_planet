import {applyKitchen} from './kitchen-state.js';
export const crops={rose:{name:'玫瑰',flower:true,color:0xd88896,seconds:120},tulip:{name:'郁金香',flower:true,color:0xe8b65d,seconds:120},sunflower:{name:'向日葵',flower:true,color:0xe5bc44,seconds:120},daisy:{name:'雏菊',flower:true,color:0xf3eace,seconds:120},lavender:{name:'薰衣草',flower:true,color:0x9c8ec4,seconds:120},hydrangea:{name:'绣球',flower:true,color:0x8faaca,seconds:120},lily:{name:'百合',flower:true,color:0xf2e4c5,seconds:120},tomato:{name:'番茄',color:0xd6674b,seconds:180},carrot:{name:'胡萝卜',color:0xe7a14b,seconds:180},strawberry:{name:'草莓',color:0xda6873,seconds:180}};
export const freshLife=()=>({plots:Array(6).fill(null),vase:[],outfit:'plain',wash:0,basket:{shots:0,made:0}});
const check=(ok,message,status=400)=>{if(!ok){const e=new Error(message);e.status=status;throw e}};
export function applyLife(state,actor,paired,b,now=Date.now(),id=()=>crypto.randomUUID(),names=['小禾','阿远']){
 check(b&&[0,1].includes(b.world),'请选择星球');const world=b.world;
 check(world===actor||paired,'请先配对再访问对方',403);
 state.worlds.forEach(w=>w.life??=freshLife());const life=state.worlds[world].life,bag=state.bags[actor];let title='',body='';
 if(b.type==='shared-meal-eat'){
  check(typeof b.item==='string','请选择餐点');const meal=state.worlds[world].meals.find(m=>m.id===b.item);check(meal,'这份饭已经吃完了',409);const gift=state.events.find(e=>e.id===meal.event);check(!gift?.pending||gift.target===actor,'这份礼物还在等收件人',403);state.worlds[world].meals=state.worlds[world].meals.filter(m=>m.id!==b.item);title='吃了一份桌上的饭';body='在小屋里，好好吃饭。';
 }else if(b.type?.startsWith('kitchen-')){title=applyKitchen(state,actor,b,id);body='在小屋里，给自己做了一顿饭。';
 }else if(['plant','water','harvest'].includes(b.type)){
  check((state.worlds[world].theme??world)===0,'这个星球没有花园');check(Number.isInteger(b.plot)&&b.plot>=0&&b.plot<6,'种植地不存在');const p=life.plots[b.plot];
  if(b.type==='plant'){check(!p,'这块地已经种了东西',409);check(Object.hasOwn(crops,b.crop),'请选择种子');const c=crops[b.crop];life.plots[b.plot]={crop:b.crop,plantedAt:now,readyAt:now+c.seconds*1000,watered:false,plantedBy:actor};title='种下了'+c.name;body='在第 '+(b.plot+1)+' 块地播种，等它慢慢长大。'}
  if(b.type==='water'){check(p,'先种下种子');check(!p.watered,'这株植物已经浇过水了',409);p.watered=true;p.readyAt=Math.max(now,p.readyAt-30000);title='给'+crops[p.crop].name+'浇了水';body='小水珠落进土里，生长时间缩短了 30 秒。'}
  if(b.type==='harvest'){check(p,'这块地还没有可采摘的植物',409);check(now>=p.readyAt,'还没有成熟，再等一会儿');if(crops[p.crop].flower){const flowers=state.worlds[actor].life.flowers??={};check((flowers[p.crop]||0)<999,'鲜花已经很多了');flowers[p.crop]=(flowers[p.crop]||0)+1}else{const fridge=state.worlds[actor].fridge;const item=fridge.find(i=>i.food===p.crop&&!i.event&&i.qty<999);if(item)item.qty++;else{check(fridge.length<190,'冰箱满了');fridge.push({id:id(),food:p.crop,qty:1})}}life.plots[b.plot]=null;title='采摘了'+crops[p.crop].name;body='蔬果收进冰箱，鲜花留着插进花瓶。'}
 }else if(b.type==='vase'){
  check(crops[b.crop]?.flower,'请选择采摘的花');const flowers=state.worlds[actor].life.flowers??={};check(flowers[b.crop]>0,'还没有采摘这朵花');check(life.vase.length<8,'花瓶已有八枝花，可以先整理花瓶');flowers[b.crop]--;life.vase.push(b.crop);title='把'+crops[b.crop].name+'插进花瓶';body='一层餐桌上，多了一朵亲手采来的花。';
 }else if(b.type==='clear-vase'){check(life.vase.length,'花瓶已经是空的');life.vase=[];title='整理了桌上的花瓶';body='把旧花收好，给下一束花留位置。';
 }else if(b.type==='outfit'){check(['plain','mint','amber'].includes(b.outfit),'请选择衣着');state.worlds[actor].life.outfit=b.outfit;title='换上了'+({plain:'日常装扮',mint:'薄荷围巾',amber:'暖橘围巾'})[b.outfit];body='在二层衣柜前，选了一点今天喜欢的颜色。';
 }else if(b.type==='wash'){check(['hands','brush'].includes(b.kind),'请选择洗漱方式');life.wash++;title=b.kind==='brush'?'认真刷了牙':'洗净了双手';body='在二层洗手间，照顾好自己。';
 }else if(b.type==='basket'){check((state.worlds[world].theme??world)===1,'这个星球没有篮球场');check(typeof b.made==='boolean','投篮结果不正确');life.basket.shots++;if(b.made)life.basket.made++;title=b.made?'投进了一颗篮球':'在篮球场练习投篮';body='球弹了几下，又回到手边。';
 }else check(false,'互动不存在');
 check(state.events.length<5000,'手账已满，请先整理');
 const eventId=id();if(b.type==='kitchen-serve'){const meal=state.worlds[world].meals.find(i=>i.id===b.item);meal.event=eventId;meal.servedAt=now;}
 state.events.unshift({id:eventId,actor,world,target:world,title:names[actor]+title,body,shared:!!paired,pending:false,kind:'life',created:now,weather:'',steps:[],comments:[]});
}
