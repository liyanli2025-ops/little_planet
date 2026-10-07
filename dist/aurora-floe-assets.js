import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
export async function replaceFloeAssets(slots,world){
 const gltf=await new GLTFLoader().loadAsync('./assets/aurora/ice-glacier.glb');gltf.scene.updateMatrixWorld(true);let source;gltf.scene.traverse(o=>{if(o.isMesh)source=o});const g=source.geometry.clone().applyMatrix4(source.matrixWorld),p=g.attributes.position,indices=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i),parent=Array.from({length:p.count},(_,i)=>i),keys=new Map();
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i};const join=(a,b)=>parent[root(a)]=root(b);
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(n=>n.toFixed(4)).join(',');if(keys.has(key))join(i,keys.get(key));else keys.set(key,i)}
 for(let i=0;i<indices.length;i+=3){join(indices[i],indices[i+1]);join(indices[i],indices[i+2])}
 const groups=new Map();for(let i=0;i<indices.length;i+=3){const key=root(indices[i]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(...indices.slice(i,i+3))}
 const pieces=[];for(const faces of groups.values()){if(faces.length<24)continue;const geo=new T.BufferGeometry();for(const [name,a] of Object.entries(g.attributes)){const data=[];for(const idx of faces)for(let k=0;k<a.itemSize;k++)data.push(a.array[idx*a.itemSize+k]);geo.setAttribute(name,new T.Float32BufferAttribute(data,a.itemSize))}geo.computeBoundingBox();const size=geo.boundingBox.getSize(new T.Vector3()),center=geo.boundingBox.getCenter(new T.Vector3());geo.translate(-center.x,-geo.boundingBox.min.y,-center.z);pieces.push({geo,size,volume:size.x*size.y*size.z})}
 pieces.sort((a,b)=>a.volume-b.volume);
 if(!pieces.length)throw Error('No glacier pieces found');
 // Preserve the source silhouette, textures and aspect ratio for every component.
 const material=source.material.clone(),largest=pieces[pieces.length-1];
 const smallPieces=pieces.length>1?pieces.slice(0,-1):pieces;
 slots.forEach((old,i)=>{const piece=smallPieces[i%smallPieces.length],width=old.geometry.parameters.radiusTop*2,model=new T.Mesh(piece.geo,material),scale=width/Math.max(piece.size.x,piece.size.z);model.scale.setScalar(scale);model.position.y=-.04;model.rotation.copy(old.rotation);model.castShadow=model.receiveShadow=true;old.parent.add(model);old.removeFromParent()});
 // The tall glacier is a landmark in the outer bay, not another flattened floe.
 const anchor=new T.Group(),normal=new T.Vector3(-1,Math.sqrt(100-1-8.2*8.2),8.2).normalize();
 anchor.position.copy(normal).multiplyScalar(10);
 anchor.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),normal);
 const iceberg=new T.Mesh(largest.geo,material);
 iceberg.scale.setScalar(3.4/Math.max(largest.size.x,largest.size.z));
 iceberg.position.y=-.12;iceberg.rotation.y=.35;
 iceberg.castShadow=iceberg.receiveShadow=true;anchor.add(iceberg);world.add(anchor);
 anchor.name='source-glacier-landmark';
 return {pieces:pieces.length,placed:slots.length+1};
}
