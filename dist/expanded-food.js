import * as T from './vendor/three.module.js';
import {models} from './assets/food-expansion/models.js';
const textures=new Map();
const decode=(s,C)=>new C(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer);
export function makeExpansionAsset(name,size=.3){
 const g=new T.Group();g.userData.asset='expansion-'+name;
 for(const source of models[name].meshes){
  const geo=new T.BufferGeometry();for(const key of ['position','normal','uv','color'])if(source[key])geo.setAttribute(key,new T.BufferAttribute(decode(source[key].data,Float32Array),source[key].size));
  geo.setIndex(new T.BufferAttribute(decode(source.index,Uint32Array),1));geo.scale(size,size,size);
  const m=new T.MeshStandardMaterial({color:new T.Color(...source.colorFactor),roughness:.8,side:T.DoubleSide,vertexColors:!!source.color});
  if(source.texture&&typeof document!=='undefined'){
   let entry=textures.get(source.texture);if(!entry){const t=new T.TextureLoader().load(new URL('./assets/food-expansion/'+source.texture,import.meta.url).href);t.flipY=!name.startsWith('kenney-');t.wrapS=t.wrapT=T.RepeatWrapping;if(name.startsWith('kenney-')){t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter}t.colorSpace=T.SRGBColorSpace;entry={texture:t,refs:0};textures.set(source.texture,entry)}
   entry.refs++;m.map=entry.texture;let released=false;m.addEventListener('dispose',()=>{if(released)return;released=true;if(--entry.refs===0){entry.texture.dispose();textures.delete(source.texture)}});
  }
  const mesh=new T.Mesh(geo,m);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);
 }
 return g;
}
export const expandedFoodMap={sauce:'kenney-bottle-ketchup',bao:'bao',rice:'rice',noodles:'noodles',apple:'kenney-apple',orange:'kenney-orange',grapes:'kenney-grapes',carrot:'kenney-carrot',broccoli:'kenney-broccoli',pepper:'kenney-paprika',mushroom:'kenney-mushroom',sandwich:'kenney-sandwich',pudding:'kenney-pudding',egg:'kenney-egg'};
export function makeExpandedFood(id){
 const name=expandedFoodMap[id];if(!name)return null;
 if(id==='egg'){const tray=makeExpansionAsset('kenney-plate',.33);for(let i=0;i<4;i++){const egg=makeExpansionAsset(name,.12);egg.position.set((i%2-.5)*.11,.02,(Math.floor(i/2)-.5)*.10);tray.add(egg)}tray.userData.food=id;return tray}
 const g=makeExpansionAsset(name,['bao','noodles','rice'].includes(id)?.48:id==='sandwich'?.38:id==='carrot'?.34:.27);g.userData.food=id;return g;
}
export const expansionTextureStats=()=>({textures:textures.size,references:[...textures.values()].reduce((n,v)=>n+v.refs,0)});
