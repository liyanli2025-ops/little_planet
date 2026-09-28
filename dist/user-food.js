import * as T from './vendor/three.module.js';
import {models} from './assets/user-food/models.js';
const textures=new Map();
function array(data,Type){const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));return new Type(bytes.buffer)}
export function makeUserAsset(name,size){const group=new T.Group();group.userData.asset='user-'+name;
 for(const source of models[name].meshes){const geo=new T.BufferGeometry();for(const key of ['position','normal','uv','color'])if(source[key])geo.setAttribute(key,new T.BufferAttribute(array(source[key].data,Float32Array),source[key].size));geo.setIndex(new T.BufferAttribute(array(source.index,Uint32Array),1));geo.scale(size,size,size);
 const material=new T.MeshStandardMaterial({color:new T.Color(...source.colorFactor),roughness:Math.max(.65,source.roughness??.8),metalness:0,side:T.DoubleSide});
 if(source.texture&&typeof document!=='undefined'){let handle=textures.get(source.texture);if(!handle){const texture=new T.TextureLoader().load(new URL('./assets/user-food/'+source.texture,import.meta.url).href);texture.flipY=false;texture.colorSpace=T.SRGBColorSpace;handle={texture,refs:0};textures.set(source.texture,handle)}handle.refs++;material.map=handle.texture;let released=false;material.addEventListener('dispose',()=>{if(released)return;released=true;if(--handle.refs===0){handle.texture.dispose();textures.delete(source.texture)}})}
 const mesh=new T.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh)}return group}
export function makeUserFood(id){if(!['skewers','dumplings','noodles'].includes(id))return null;const group=new T.Group();group.userData.food=id;group.userData.asset='user-'+id;
 if(id==='noodles'){group.add(makeUserAsset('ramen',.49));return group}
 const plate=new T.Mesh(new T.CylinderGeometry(.26,.235,.024,48),new T.MeshStandardMaterial({color:0xf3e9d8,roughness:.65}));plate.position.y=.012;plate.castShadow=plate.receiveShadow=true;group.add(plate);
 if(id==='skewers')for(let i=0;i<2;i++){const food=makeUserAsset('skewer',.43);food.position.set(0,.025,(i-.5)*.13);food.rotation.y=(i-.5)*.12;group.add(food)}
 else for(let i=0;i<5;i++){const angle=i/5*Math.PI*2;const food=makeUserAsset('dumpling',.19);food.position.set(Math.cos(angle)*.135,.025,Math.sin(angle)*.135);food.rotation.y=-angle+Math.PI/2;group.add(food)}return group}
