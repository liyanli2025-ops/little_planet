import * as T from './vendor/three.module.js';
// Bake the static source transforms once; deform only limb regions in normalized local space.
export function createRunningDeer(source){
 source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),center=bounds.getCenter(new T.Vector3()),scale=1.15/(bounds.max.y-bounds.min.y),group=new T.Group(),parts=[];
 source.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.scale(scale,scale,scale);geometry.computeBoundingBox();const mesh=new T.Mesh(geometry,o.material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);parts.push({geometry,rest:geometry.attributes.position.array.slice()})});
 let stride=0;
 return {group,tick(dt,speed,index){stride+=dt*(3.5+speed*5);const strength=T.MathUtils.smoothstep(speed,0,.35);
 for(const {geometry,rest} of parts){const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2],leg=1-T.MathUtils.smoothstep(y,.26,.59),front=z<0,phase=stride+index*.65+(front?0:1.8)+(x>0?.62:0),angle=Math.sin(phase)*.65*strength*leg;
 const hip=.52,dy=y-hip;let py=hip+dy*Math.cos(angle),pz=z+dy*Math.sin(angle);py+=Math.max(0,Math.cos(phase))*.07*leg*strength;const head=T.MathUtils.smoothstep(y,.75,1.1);py+=Math.sin(stride*2)*.012*head*strength;p.setXYZ(i,x,py,pz)}p.needsUpdate=true;geometry.computeVertexNormals()}
 group.position.y=Math.max(0,Math.sin(stride*2))*.045*strength;group.rotation.x=Math.sin(stride*2)*.025*strength;
 }};
}
