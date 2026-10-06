import {cafeAssetBytes} from './cafe-asset-cache.js';
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {cafeMenu} from './cafe-catalog.js';
const files=new Map();
export function makeCafeFood(id,{display=false}={}){
 const item=cafeMenu.find(i=>i.id===id);if(!item)throw Error('Unknown cafe item');const group=new T.Group();group.userData.food=id;
 const material=c=>new T.MeshStandardMaterial({color:c,roughness:.48});
 const add=(geo,color,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,material(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m};
 if(item.kind==='dessert'){
  const displayWidth=['cafe_strawberry','cafe_chocolate','cafe_cherry'].includes(id)?.64:id==='cafe_cupcake'?.34:id==='cafe_cinnamon'?.38:.48;add(new T.CylinderGeometry(display?displayWidth*.57:.23,display?displayWidth*.55:.22,.025,40),0xf2e9d8,0,.012,0);
  const name=display?item.display:item.serving,url='./assets/cafe-desserts/'+name+'.glb';
  if(!files.has(url))files.set(url,cafeAssetBytes(url).catch(e=>{files.delete(url);throw e}));
  group.userData.ready=files.get(url).then(bytes=>new GLTFLoader().parseAsync(bytes.slice(0),new URL('.',location.href).href)).then(gltf=>{
   const model=gltf.scene,b=new T.Box3().setFromObject(model),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3()),scale=(display?displayWidth:.34)/Math.max(s.x,s.z);model.scale.setScalar(scale);model.position.set(-c.x*scale,.028-b.min.y*scale,-c.z*scale);model.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});if(group.userData.disposed){disposeCafeObject(model);return}group.add(model);
  }).catch(()=>{group.userData.loadFailed=true});
 }else if(item.kind==='drink'){
  add(new T.CylinderGeometry(.135,.12,.018,40),0xf3ece0,0,.012);
  add(new T.LatheGeometry([[0,.023],[.07,.023],[.084,.04],[.097,.20],[.099,.214],[.087,.214],[.079,.06],[0,.06]].map(v=>new T.Vector2(...v)),40),0xe8e2d6);
  add(new T.CylinderGeometry(.087,.087,.005,40),item.color,0,.199);
  const h=add(new T.TorusGeometry(.045,.013,10,30),0xe8e2d6,.10,.13);h.rotation.y=0;
  if(id!=='cafe_americano')for(let i=0;i<5;i++){const p=add(new T.SphereGeometry(1,16,10),0xf8edd7,(i-2)*.014,.204,Math.sin(i)*.01);p.scale.set(.018,.003,.022)}
 }else{
  add(new T.CylinderGeometry(.09,.09,.015,32),0xcad6cb,0,.008);add(new T.CylinderGeometry(.012,.012,.11,16),0xcad6cb,0,.07);
  add(new T.LatheGeometry([[0,.12],[.07,.15],[.105,.28],[.11,.30],[.104,.303],[.065,.16],[0,.13]].map(v=>new T.Vector2(...v)),40),0xbfd6cf);
  add(new T.CylinderGeometry(.097,.065,.105,40),item.color,0,.235);
  const fruit=add(new T.CylinderGeometry(.049,.049,.012,24),0xf2c674,.085,.3,0);fruit.rotation.x=Math.PI/2;
  const straw=add(new T.CylinderGeometry(.006,.006,.21,12),0xe4dfca,-.04,.3);straw.rotation.z=.2;
 }
 return group;
}
export function disposeCafeObject(root){root.traverse(o=>{o.userData.disposed=true;o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose()}})}
