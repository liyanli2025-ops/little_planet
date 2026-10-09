import * as T from './vendor/three.module.js';
// Preserve the original closed arm, its UVs and material; add deformation joints.
export function createTeddyArmRig(source,parent){
 const root=new T.Group(),geometry=source.geometry.clone(),position=geometry.attributes.position,indices=new Uint16Array(position.count*4),weights=new Float32Array(position.count*4);
 for(let i=0;i<position.count;i++){const y=position.getY(i),elbow=1-T.MathUtils.smoothstep(y,-.24,-.14),wrist=1-T.MathUtils.smoothstep(y,-.35,-.28);indices.set([0,1,2,0],i*4);weights.set([1-elbow,elbow*(1-wrist),elbow*wrist,0],i*4);}
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const shoulder=new T.Bone(),elbow=new T.Bone(),hand=new T.Bone();shoulder.name='shoulder';elbow.name='elbow';hand.name='hand';elbow.position.y=-.20;hand.position.y=-.14;shoulder.add(elbow);elbow.add(hand);root.add(shoulder);
 const mesh=new T.SkinnedMesh(geometry,source.material);mesh.name='continuous-arm';mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;root.add(mesh);parent?.add(root);root.updateWorldMatrix(true,true);mesh.bind(new T.Skeleton([shoulder,elbow,hand]));
 return {root,mesh,bones:[shoulder,elbow,hand],bend(value){elbow.rotation.x=value;hand.rotation.x=-value*.25;root.updateWorldMatrix(true,true);}};
}
export function ensureTeddyArmRigs(bear){return bear.snowArmRigs??=bear.arms.map(group=>{const source=group.getObjectByName('continuous-arm');if(!source)throw Error('Original teddy arm missing');const rig=createTeddyArmRig(source,group);source.removeFromParent();return rig;});}
export function poseTeddySnowArms(bear,working,push){for(const rig of ensureTeddyArmRigs(bear))rig.bend(working?-.22*T.MathUtils.clamp(push,0,1):0);}
