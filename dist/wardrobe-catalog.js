import {outfits} from './outfits.js';
export const wardrobeCategories={dress:'裙装',top:'上衣',set:'套装',accessory:'配饰'};
export function wardrobeCatalog(saved=[],gifts=[]){
 const rows=[],seen=new Set();
 function add(key,name,category,patch,look,slot='body',wearable=true){const signature=JSON.stringify([patch,slot]);if(seen.has(signature))return;seen.add(signature);rows.push({key,name,category,patch,look,slot,wearable});}
 for(const [id,o]of Object.entries(outfits))add('base:'+id,o.name,o.kind==='scarf'?'accessory':id==='denim'?'set':'top',{garment:id,tailoring:null,creation:null},{kind:o.kind||'top',color:'#'+(o.color??0xe6d6b7).toString(16).padStart(6,'0')},'body');
 for(const item of [...saved,...gifts]){
  const v=item.values;if(!v)continue;const prefix=item.key||item.id;
  if(v.tailoring){const t=v.tailoring;add(prefix+':tailoring',t.name,['dress','skirt'].includes(t.kind)?'dress':t.kind==='set'?'set':'top',{garment:'plain',tailoring:t,creation:null},t);}
  else if(v.creation)add(prefix+':creation',v.creation.name,'dress',{garment:'plain',tailoring:null,creation:v.creation},{kind:'dress',color:v.creation.color||'#d8c2b8'});
  else if(v.garment&&v.garment!=='original'&&v.garment!=='plain')add(prefix+':garment',item.name||outfits[v.garment]?.name||'衣服',v.garment==='denim'?'set':'top',{garment:v.garment,creation:null,tailoring:null,primary:v.primary,trim:v.trim,motif:v.motif},{kind:'top',color:'#b9a787'});
  if(v.headwear)add(prefix+':headwear',v.headwear.name,'accessory',{headwear:v.headwear,hat:'none'},v.headwear,'hat');
  for(const part of ['hat','shoes','accessory'])if(v[part]&&v[part]!=='none')add(prefix+':'+part,({hat:'帽子',shoes:'鞋子',accessory:'配饰'})[part],'accessory',{[part]:v[part],...(part==='hat'?{headwear:null}:{}),accessoryColors:{[part]:v.accessoryColors?.[part]||'#b9a787'}},{kind:part,color:v.accessoryColors?.[part]||'#b9a787'},part);
  for(const w of v.wearables||[])add(prefix+':'+w.id,w.name,w.slot==='garment'?'dress':'accessory',{wearables:[w]},{kind:w.slot==='hat'?'hat':'dress',color:w.tint},w.slot,w.slot!=='garment');
 }
 return rows;
}
export function wardrobeOutfit(current,item){
 const p=item.patch,v={...current,...p};
 v.accessoryColors={...current.accessoryColors,...p.accessoryColors};
 const slot=item.slot==='body'?'garment':item.slot;
 v.wearables=[...(current.wearables||[]).filter(w=>w.slot!==slot),...(p.wearables||[])];
 return v;
}
