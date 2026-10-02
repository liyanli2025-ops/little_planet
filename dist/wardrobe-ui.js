import {createOutfitPreview} from './outfit-preview.js';
import {wardrobeCatalog,wardrobeOutfit} from './wardrobe-catalog.js';
import {defaultDesign} from './design-schema.js';
export function createWardrobeUI({context,cloud,toast,onOutfit,wearBase,dock}){
 const fitting=createOutfitPreview('wardrobe-fitting'),bar=document.createElement('section');bar.id='wardrobe-confirm';bar.hidden=true;
 const title=document.createElement('p'),back=document.createElement('button'),confirm=document.createElement('button');back.textContent='返回衣柜';confirm.textContent='确定换装';bar.append(title,back,confirm);document.body.append(bar);
 const css=document.createElement('link');css.rel='stylesheet';css.href='/wardrobe.css';document.head.append(css);
 let catalog=wardrobeCatalog(),data=null,proposal=null,selected=null,busy=false,epoch=0;
 function hide(){epoch++;proposal=null;selected=null;fitting.hide();bar.hidden=true;}
 async function open(){hide();catalog=wardrobeCatalog();context().visual?.wardrobeItems(catalog);if(!cloud)return;const token=epoch;try{data=await cloud.design();if(token!==epoch)return;catalog=data.wardrobe||catalog;context().visual?.wardrobeItems(catalog);}catch(e){toast(e.message)}}
 async function pick(index){if(busy)return;const item=catalog[index];if(!item)return;if(!item.wearable){toast('这件旧模型尚未适配，暂时不能试穿');return;}const token=++epoch;selected=item;proposal=null;busy=true;bar.hidden=false;title.textContent=item.name;confirm.disabled=true;back.disabled=false;
 try{if(cloud){data=await cloud.design();const result=await cloud.design({action:'wardrobePreview',key:item.key,version:data.version});if(token!==epoch)return;proposal=result;fitting.show(result.values,context().visual?.readState().identity??context().actor);}else fitting.show(wardrobeOutfit(defaultDesign().outfit,item),context().actor);if(token===epoch)confirm.disabled=false;}catch(e){if(token===epoch){hide();toast(e.message)}}finally{busy=false;}}
 back.onclick=()=>hide();
 confirm.onclick=async()=>{if(busy||!selected)return;busy=true;confirm.disabled=back.disabled=true;try{if(cloud){await cloud.design({action:'accept',id:proposal.id,version:proposal.base});await onOutfit();const v=context().visual;if(v?.changeOutfit(context().state.worlds[context().actor].life?.outfit||'plain'))v.finishOutfit(true);else v?.wardrobe(false);}else await wearBase(selected.key.slice(5));hide();dock('');}catch(e){toast(e.message);confirm.disabled=back.disabled=false;}finally{busy=false;}};
 setInterval(()=>{if(!bar.hidden&&!context().visual?.readState().wardrobeInspect)hide()},250);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!busy)hide()});
 return {open,pick,hide,page(category,dir){context().visual?.wardrobePage(category,dir)},get active(){return !bar.hidden}};
}
