import * as T from './vendor/three.module.js';
import {drawArtwork} from './garment-surface.js';
import {garmentReferences} from './garment-references.js';
import {loadReferenceImage} from './brand-reference-images.js';
// Project a front graphic onto the actual crown instead of stretching the lathe UVs.
export function addHeadwearPrint(root,curve,v){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
 const material=new T.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.95,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const points=curve.getPoints(160),width=.046,height=.08,center=.275,positions=[],uv=[],indices=[],cols=16,rows=24;
 function radius(y){for(let i=1;i<points.length;i++)if(points[i].y>=y){const a=points[i-1],b=points[i],t=(y-a.y)/(b.y-a.y||1);return T.MathUtils.lerp(a.x,b.x,t);}return points.at(-1).x;}
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const x=(i/cols-.5)*width,y=center+(j/rows-.5)*height,r=radius(y),z=Math.sqrt(Math.max(0,1-(x/(r*1.25))**2))*r*1.02-.018+.0015;positions.push(x,y,z);uv.push(i/cols,j/rows);}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,material);mesh.name='headwear-front-print';root.add(mesh);
 let disposed=false;map.addEventListener('dispose',()=>{disposed=true;});
 function paint(source){if(disposed)return;const ctx=source.getContext('2d'),pixels=ctx.getImageData(0,0,source.width,source.height).data;let x0=source.width,y0=source.height,x1=-1,y1=-1;for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(pixels[(y*source.width+x)*4+3]>24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1>=x0){const w=x1-x0+1,h=y1-y0+1,scale=Math.min(240/w,490/h);canvas.getContext('2d').drawImage(source,x0,y0,w,h,(256-w*scale)/2,(512-h*scale)/2,w*scale,h*scale);map.needsUpdate=true;}}
 if(v.artwork){const draw=()=>{if(disposed)return;const source=document.createElement('canvas');source.width=source.height=512;drawArtwork(source.getContext('2d'),v.artwork,512);paint(source);};const image=garmentReferences[v.artwork.reference]?.image;if(image)loadReferenceImage(image).then(draw).catch(()=>{});else draw();}
 else if(v.texture){const image=new Image();image.onload=()=>{if(disposed)return;const source=document.createElement('canvas');source.width=source.height=512;const ctx=source.getContext('2d');ctx.drawImage(image,0,0,512,512);const p=ctx.getImageData(0,0,512,512),background=[p.data[0],p.data[1],p.data[2]];for(let i=0;i<p.data.length;i+=4){const delta=Math.sqrt(background.reduce((n,c,k)=>n+(p.data[i+k]-c)**2,0));p.data[i+3]*=Math.max(0,Math.min(1,(delta-30)/55));}ctx.putImageData(p,0,0);paint(source);};image.src='/api/studio/textures/'+v.texture.id;}
 return mesh;
}
