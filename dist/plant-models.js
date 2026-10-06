import {cafeAssetBytes} from './cafe-asset-cache.js';
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {isModelPlant} from './furniture-catalog.js';
import {releaseModel} from './model-resources.js';
// Cache only bytes: every instance owns its geometry, materials and image resources.
const bytes=new Map();
async function loadPart(name,signal){
 let data=bytes.get(name);
 if(!data){data=await cafeAssetBytes(new URL('./assets/tiny-plants/'+name+'.glb',import.meta.url));if(signal?.aborted)throw new DOMException('已取消','AbortError');bytes.set(name,data)}
 const root=(await new GLTFLoader().parseAsync(data.slice(0),'')).scene;
 if(signal?.aborted){releaseModel(root);throw new DOMException('已取消','AbortError')}
 return root;
}
export async function loadPlantModel(o,signal){
 if(!isModelPlant(o))throw Error('植物品种不正确');
 const hanging=o.standard==='hangingPlant',large=o.standard==='floorPlant';
 const leaf=['cactus','succulent'].includes(o.variant)?o.variant+'_A':o.variant+'_plant_'+(large?'large':'small');
 const results=await Promise.allSettled([loadPart(leaf,signal),loadPart(o.planter==='ceramic'?'pot_B_small':'pot_A_small',signal)]);
 if(results.some(r=>r.status==='rejected')){results.forEach(r=>{if(r.status==='fulfilled')releaseModel(r.value)});throw results.find(r=>r.status==='rejected').reason}
 const [foliage,pot]=results.map(r=>r.value),root=new T.Group();root.add(pot,foliage);
 // The pot rim is at .4 and soil at .35 in the source. Bury roots, keep leaves above the support.
 if(large)pot.scale.setScalar(1.4);
 const soil=large?.49:.35;
 let leafScale=1;
 const bounds=new T.Box3().setFromObject(foliage);
 if(!hanging&&bounds.min.y<-.1)leafScale=Math.min(1,(soil-.03)/-bounds.min.y);
 foliage.scale.setScalar(leafScale);foliage.position.y=soil;
 pot.traverse(m=>{if(m.isMesh)m.material.color.multiply(new T.Color(o.tint))});
 if(hanging){const mat=new T.MeshStandardMaterial({color:0xb5a385,roughness:1});for(let i=0;i<3;i++){
  const angle=i*Math.PI*2/3,a=new T.Vector3(Math.cos(angle)*.2,.35,Math.sin(angle)*.2),b=new T.Vector3(0,.96,0),d=b.clone().sub(a);
  const rope=new T.Mesh(new T.CylinderGeometry(.008,.008,d.length(),8),mat);rope.position.copy(a).add(b).multiplyScalar(.5);rope.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());root.add(rope);
 }}
 const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 const scale=Math.min(o.width/size.x,o.height/size.y,o.depth/size.z);
 const pivot=new T.Group();pivot.add(root);root.position.set(-center.x,-box.min.y,-center.z);pivot.scale.setScalar(scale);
 // Bake the uniform scale into the wrapper so scene placement cannot distort leaf proportions.
 const result=new T.Group();result.add(pivot);result.userData.curatedPlant=true;
 result.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;m.userData.action='design-open'}});
 if(signal?.aborted){releaseModel(result);throw new DOMException('已取消','AbortError')}
 return result;
}
