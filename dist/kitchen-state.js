import {recipes} from './recipe-catalog.js';
import {foodCatalog} from './food-catalog.js';
const check=(ok,msg)=>{if(!ok){const e=new Error(msg);e.status=400;throw e}};
export function migrateStorage(state,id){for(let actor=0;actor<2;actor++){const w=state.worlds[actor];w.life??={};w.life.flowers??={};for(const [food,qty]of Object.entries(state.bags[actor]||{})){if(!qty)continue;if(foodCatalog[food]){let left=qty;for(const i of w.fridge.filter(i=>i.food===food&&!i.event)){const n=Math.min(left,999-i.qty);i.qty+=n;left-=n}while(left>0){const n=Math.min(999,left);w.fridge.push({id:id(),food,qty:n});left-=n}delete state.bags[actor][food]}else if(['rose','tulip','sunflower'].includes(food)){w.life.flowers[food]=(w.life.flowers[food]||0)+qty;delete state.bags[actor][food]}}}}
export function recipesForFood(food){return Object.keys(recipes).filter(key=>!food||recipes[key].needs[food]||(['dumplings','bao'].includes(food)&&recipes[key].model===food))}
export function applyKitchen(state,actor,b,id){const w=state.worlds[b.world];
 if(b.type==='kitchen-cook'){const r=recipes[b.recipe];check(r,'没有这道菜');check(typeof b.item==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(b.item),'餐点编号不正确');check(!w.fridge.some(i=>i.id===b.item)&&!w.meals.some(i=>i.id===b.item),'这份饭已经做好了');check(w.fridge.length<190,'冰箱满了');const source=b.source?w.fridge.find(i=>i.id===b.source&&i.qty>0):null;
  if(b.source){check(source&&foodCatalog[source.food]?.ready===false,'请选择需要烹饪的食材');const gift=state.events.find(e=>e.id===source.event);check(!gift?.pending||gift.target===actor,'这份食材留给了对方');check(recipesForFood(source.food).includes(b.recipe),'这道菜不使用所选食材')}
  // Missing ingredients are supplied automatically; reserved gifts are never used.
  const usedSource=source?.food;if(source)source.qty--;
  for(const [f,q]of Object.entries(r.needs)){let left=q-(usedSource===f?1:0);for(const i of w.fridge.filter(i=>i.food===f&&!i.event)){const n=Math.min(left,i.qty);i.qty-=n;left-=n}}
  w.fridge=w.fridge.filter(i=>i.qty>0);w.fridge.push({id:b.item,food:'cooked_'+b.recipe,qty:1});return '做了'+r.name;
 }
 if(b.type==='kitchen-serve'){const i=w.fridge.find(i=>i.id===b.item&&i.qty>0);check(i&&i.food.startsWith('cooked_'),'这份饭已经不在冰箱里');check(w.meals.length<100,'餐桌满了');check(!w.meals.some(m=>m.id===b.item),'这份饭已经在餐桌上');const event=state.events.find(e=>e.id===i.event);check(!event?.pending||event.target===actor,'这份饭留给了对方');i.qty--;w.fridge=w.fridge.filter(i=>i.qty>0);w.meals.push({id:b.item,recipe:i.food.slice(7),owner:actor,together:false});return '把热乎乎的饭端上桌'}
 if(b.type==='kitchen-eat'){const i=w.meals.find(i=>i.id===b.item);check(i&&i.owner===actor,'这不是自己的餐点');w.meals=w.meals.filter(i=>i.id!==b.item);return '吃完了'+recipes[i.recipe].name}
 check(false,'厨房操作不存在');
}
