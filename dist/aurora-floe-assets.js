import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
export async function replaceFloeAssets(slots){
 const gltf=await new GLTFLoader().loadAsync('./assets/aurora/ice-glacier.glb');gltf.scene.updateMatrixWorld(true);let source;gltf.scene.traverse(o=>{if(o.isMesh)source=o});const g=source.geometry.clone().applyMatrix4(source.matrixWorld),p=g.attributes.position,indices=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i),parent=Array.from({length:p.count},(_,i)=>i),keys=new Map();
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i};const join=(a,b)=>parent[root(a)]=root(b);
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(n=>n.toFixed(4)).join(',');if(keys.has(key))join(i,keys.get(key));else keys.set(key,i)}
 for(let i=0;i<indices.length;i+=3){join(indices[i],indices[i+1]);join(indices[i],indices[i+2])}
 const groups=new Map();for(let i=0;i<indices.length;i+=3){const key=root(indices[i]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(...indices.slice(i,i+3))}
 const pieces=[];for(const faces of groups.values()){if(faces.length<24)continue;const geo=new T.BufferGeometry();for(const [name,a] of Object.entries(g.attributes)){const data=[];for(const idx of faces)for(let k=0;k<a.itemSize;k++)data.push(a.array[idx*a.itemSize+k]);geo.setAttribute(name,new T.Float32BufferAttribute(data,a.itemSize))}geo.computeBoundingBox();const size=geo.boundingBox.getSize(new T.Vector3()),center=geo.boundingBox.getCenter(new T.Vector3());geo.translate(-center.x,-geo.boundingBox.min.y,-center.z);pieces.push({geo,size,volume:size.x*size.y*size.z})}
 pieces.sort((a,b)=>a.volume-b.volume);const usable=pieces.length>2?pieces.slice(0,-1):pieces;
 if(!usable.length)throw Error('No glacier pieces found');
 const material=source.material.clone();material.color.set(0xc9e8ee);material.roughness=.48;
 slots.forEach((old,i)=>{const piece=usable[i%usable.length],width=old.geometry.parameters.radiusTop*2,model=new T.Mesh(piece.geo,material),scale=width/Math.max(piece.size.x,piece.size.z);model.scale.set(scale,Math.min(scale,width*.22/piece.size.y),scale);model.position.y=-.04;model.rotation.copy(old.rotation);model.castShadow=model.receiveShadow=true;old.parent.add(model);old.removeFromParent()});
 return {pieces:usable.length,placed:slots.length};
}
