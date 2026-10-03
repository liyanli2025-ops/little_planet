import {buildStandardFurniture} from './standard-furniture.js';
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {releaseModel} from './model-resources.js';
export {releaseModel} from './model-resources.js';
import {isModelPlant} from './furniture-catalog.js';
import {loadPlantModel} from './plant-models.js';
export async function loadStudioModel(asset,signal){const r=await fetch('/api/studio/assets/'+asset,{credentials:'same-origin',signal,cache:'no-store'});if(!r.ok)throw Error('模型加载失败，请重试');const bytes=await r.arrayBuffer();if(signal?.aborted)throw Error('已取消加载');const gltf=await new GLTFLoader().parseAsync(bytes,'');const root=gltf.scene;const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());if(![size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>.0001)){releaseModel(root);throw Error('模型尺寸无法识别')}const pivot=new T.Group();pivot.add(root);root.position.sub(new T.Vector3(center.x,box.min.y,center.z));pivot.userData.size=size;const seen=new Set();root.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;for(const m of(Array.isArray(o.material)?o.material:[o.material])){m.userData.baseColor=m.color?.clone();for(const t of Object.values(m))if(t?.isTexture&&!seen.has(t)){seen.add(t);const image=t.image;if(image?.width>2048||image?.height>2048){const c=document.createElement('canvas'),ratio=2048/Math.max(image.width,image.height);c.width=Math.round(image.width*ratio);c.height=Math.round(image.height*ratio);c.getContext('2d').drawImage(image,0,0,c.width,c.height);t.image=c;t.needsUpdate=true;image.close?.()}}}});return pivot}
export function createStudioModels(indoor){const root=new T.Group();root.userData.dynamic=true;indoor.add(root);const entries=new Map();let level=0,floor=0,disposed=false;
 function sync(objects){
  const ids=new Set(objects.map(x=>x.id));
  for(const [id,e]of entries)if(!ids.has(id)){e.abort.abort();if(e.model)releaseModel(e.model);entries.delete(id)}
  for(const o of objects){
   let e=entries.get(o.id);const signature=o.standard?JSON.stringify(o):o.asset;
   if(e&&e.signature!==signature){e.abort.abort();if(e.model)releaseModel(e.model);entries.delete(o.id);e=null}
   if(!e){
    e={signature,abort:new AbortController(),spec:o};entries.set(o.id,e);
    const state=(value,message)=>globalThis.document?.dispatchEvent(new CustomEvent('studio-model-state',{detail:{id:o.id,state:value,message}}));
    if(o.standard&&!isModelPlant(o)){
     e.model=buildStandardFurniture({...o,windowSpan:o.standard==='curtain'?(o.z>-3?4.7:2.7):undefined});root.add(e.model);state('ready');
    }else{
     state('loading');
     (isModelPlant(o)?loadPlantModel(o,e.abort.signal):loadStudioModel(o.asset,e.abort.signal)).then(model=>{
      if(disposed||e.abort.signal.aborted||entries.get(o.id)!==e){releaseModel(model);return}
      e.model=model;root.add(model);paint(e);state('ready');
     }).catch(err=>{if(!e.abort.signal.aborted&&entries.get(o.id)===e){e.failed=true;state('failed',err.message)}});
    }
   }
   e.spec=o;if(e.model)paint(e);
  }
 }
 function paint(e){const o=e.spec,m=e.model,s=m.userData.size;m.position.set(o.x,o.floor*2.7+(o.y||0),o.z);m.rotation.y=o.yaw;if(o.standard){if(m.userData.lamp)m.userData.lamp.userData.targetIntensity=1.7*[1,1.6,2.3][level];m.visible=floor===2||o.floor===floor;return;}m.scale.set(o.width/s.x,o.height/s.y,o.depth/s.z);m.visible=floor===2||o.floor===floor;m.traverse(x=>{if(x.isMesh){x.userData.action=o.kind==='sofa'?'sit':o.kind==='seat'?'sit-ai-'+o.id:/灯|lamp|lantern|sconce|chandelier/i.test(o.name||'')?'lighting':'design-open';for(const mat of(Array.isArray(x.material)?x.material:[x.material]))if(mat.color)mat.color.copy(mat.userData.baseColor).multiply(new T.Color(o.tint))}})}
 function retry(){const specs=[...entries.values()].map(e=>e.spec);for(const [id,e]of entries)if(e.failed){e.abort.abort();entries.delete(id)}sync(specs)}
 globalThis.document?.addEventListener?.('studio-retry-model',retry);
 return {sync,lightLevel(v){level=v;entries.forEach(e=>{if(e.model)paint(e)})},tick(dt){entries.forEach(e=>{const l=e.model?.userData.lamp;if(l)l.intensity+=((l.userData.targetIntensity??1.7)-l.intensity)*(1-Math.exp(-dt*5))})},toggle(id){const light=entries.get(id)?.model?.userData.lamp;if(light){light.intensity=light.intensity?0:1.7;return true;}return false;},show(f){floor=f;entries.forEach(e=>{if(e.model)paint(e)})},dispose(){globalThis.document?.removeEventListener?.('studio-retry-model',retry);disposed=true;for(const e of entries.values()){e.abort.abort();if(e.model)releaseModel(e.model)}entries.clear();root.removeFromParent()}};
}
