export const CAFE_COUNTER={x:.35,z:-1.55,yaw:Math.PI};
export const CAFE_SERVE={x:.35,y:1.38,z:-2.57};
export const CAFE_ITEM_TIME=7000,CAFE_PRESENT_TIME=1800;
export function atCafeCounter(g){return !!g&&!g.floor&&g.z>=-2.2&&g.z<=-.85&&g.x>=-4.6&&g.x<=4.7}
export function cafeServiceTiming(start,count){return {startedAt:start,readyAt:start+count*CAFE_ITEM_TIME+CAFE_PRESENT_TIME}}
export function cafeServicePhase(service,time){const elapsed=time-service.startedAt,index=Math.min(service.items.length-1,Math.max(0,Math.floor(elapsed/CAFE_ITEM_TIME)));return {queued:elapsed<0,ready:time>=service.readyAt,index,progress:Math.max(0,Math.min(1,(elapsed-index*CAFE_ITEM_TIME)/CAFE_ITEM_TIME)),present:Math.max(0,Math.min(1,(elapsed-service.items.length*CAFE_ITEM_TIME)/CAFE_PRESENT_TIME))}}

export function cafeTrayPlace(slot=0){return {x:.35-(slot%5)*.85,y:1.38,z:slot<5?-2.66:-3.05}}
