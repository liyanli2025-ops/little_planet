import {GLTFLoader} from './vendor/GLTFLoader.js';
import * as T from './vendor/three.module.js';
let environment;const materials=[];
export const iceAssetsReady=new GLTFLoader().loadAsync('./assets/aurora/ice-block.glb').then(gltf=>{let source;gltf.scene.traverse(o=>{if(o.isMesh)source=o.material});const faceTexture=texture=>{const t=texture.clone();t.repeat.set(.296,.296);t.offset.set(.041,.679);t.needsUpdate=true;return t};const color=faceTexture(source.map),normal=faceTexture(source.normalMap),rough=faceTexture(source.roughnessMap);for(const m of materials){m.map=color;m.normalMap=normal;m.normalScale.set(.18,.18);m.roughnessMap=rough;m.roughness=.21;m.transmission=.75;m.color.set(0xe3f7ff);m.needsUpdate=true}});

export function iceMaterial(){
 if(!environment){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,0,128);g.addColorStop(0,'#e4f6ff');g.addColorStop(.42,'#83b5ce');g.addColorStop(.53,'#eafcff');g.addColorStop(.64,'#587f9b');g.addColorStop(1,'#193d56');c.fillStyle=g;c.fillRect(0,0,256,128);const glow=c.createRadialGradient(65,43,0,65,43,40);glow.addColorStop(0,'rgba(255,240,209,.85)');glow.addColorStop(1,'rgba(255,240,209,0)');c.fillStyle=glow;c.fillRect(0,0,256,128);environment=new T.CanvasTexture(canvas);environment.mapping=T.EquirectangularReflectionMapping;environment.colorSpace=T.SRGBColorSpace}
 const material=new T.MeshPhysicalMaterial({color:0xb1dce7,roughness:.14,metalness:0,transmission:.55,thickness:.24,ior:1.31,attenuationColor:new T.Color(0x83c6d9),attenuationDistance:1.8,clearcoat:.65,clearcoatRoughness:.12,envMap:environment,envMapIntensity:.5});material.userData.sourceIce=true;materials.push(material);return material;
}
export function iceBrick(radius,start,span,low,high,thickness){
 const positions=[],indices=[],uvs=[];
 function point(u,v,w){const a=start+span*u,h=low+(high-low)*v,r=radius-thickness+thickness*w;return [-r*Math.cos(h)*Math.cos(a),r*Math.sin(h),r*Math.cos(h)*Math.sin(a)]}
 function face(axis,value,reverse){const base=positions.length/3,n=3;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){let q=axis===0?[value,i/n,j/n]:axis===1?[i/n,value,j/n]:[i/n,j/n,value];positions.push(...point(...q));uvs.push(i/n,j/n)}for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=base+j*(n+1)+i,b=a+n+1;if(reverse)indices.push(a,a+1,b,a+1,b+1,b);else indices.push(a,b,a+1,a+1,b,b+1)}}
 face(0,0,false);face(0,1,true);face(1,0,true);face(1,1,false);face(2,0,false);face(2,1,true);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
