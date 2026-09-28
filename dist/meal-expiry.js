export const TABLE_MEAL_TTL=24*60*60*1000;
// Legacy meals get a full day from migration; journal timestamps may precede serving.
export function expireTableMeals(state,now=Date.now()){
 let changed=false;
 for(const world of state.worlds){world.meals=world.meals.filter(meal=>{
  if(!Number.isSafeInteger(meal.servedAt)||meal.servedAt<0){meal.servedAt=now;changed=true;return true}
  if(now-meal.servedAt>=TABLE_MEAL_TTL){changed=true;return false}
  return true;
 })}return changed;
}
