import {foodCatalog} from './food-catalog.js';

// Merge display units only. Keep every inventory ID and gift permission intact.
export function fridgeLayout(items, selected) {
 const groups=new Map();
 for(const item of items){
  if(!(item.qty>0)||!foodCatalog[item.food])continue;
  const key=item.food+'|'+(item.reserved?'reserved':item.gift?'gift':'own');
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(item);
 }
 const units=[...groups.values()].map(members=>({...members.find(i=>i.id===selected)||members[0],members,qty:members.reduce((s,i)=>s+i.qty,0)}));
 const cold=units.filter(i=>foodCatalog[i.food].zone!=='freezer'),frozen=units.filter(i=>foodCatalog[i.food].zone==='freezer');
 const rack=cold.filter(i=>['乳品饮料','酱料小菜'].includes(foodCatalog[i.food].category));
 const overflow=rack.splice(12);const shelves=[...cold.filter(i=>!rack.includes(i)&&!overflow.includes(i)),...overflow].sort((a,b)=>Number(['水果','果蔬食材'].includes(foodCatalog[a.food].category))-Number(['水果','果蔬食材'].includes(foodCatalog[b.food].category)));
 const result=[];
 function pack(list,area,rows,width,depth){
  const cols=Math.min(area==='rack'?4:6,Math.max(area==='rack'?2:3,Math.ceil(list.length/rows)));
  const layers=Math.max(1,Math.ceil(list.length/(rows*cols)));
  const scale=Math.min(1.1,width/cols/.55,depth/layers/.44);
  list.forEach((item,n)=>{
   const countPerRow=Math.ceil(list.length/rows),row=Math.floor(n/countPerRow),slot=n%countPerRow,layer=Math.floor(slot/cols),col=slot%cols;
   const x=(col-(cols-1)/2)*width/cols;
   const z=(layer-(layers-1)/2)*depth/layers;
   result.push({item,area,zone:area==='freezer'?'freezer':'chill',scale,single:scale<.95,
    position:area==='rack'?[-1.04+x,.24+row*.835,-.29-z]:[x,area==='freezer'?.16+row*.46:3.16-row*.63,.13+z]});
  });
 }
 pack(shelves,'shelf',4,1.86,.78);pack(rack,'rack',3,1.70,.44);pack(frozen,'freezer',2,1.86,.78);
 return result;
}
