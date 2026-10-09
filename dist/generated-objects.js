import * as T from './vendor/three.module.js';
export function disposeObject(root){root.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose()}});root.clear()}
function mesh(root,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o}
function cloth(color){return new T.MeshPhysicalMaterial({color,roughness:.94,sheen:.55,sheenRoughness:.85,sheenColor:0xf2ead9})}
function rounded(root,mat,x,y,z,w,h,d,r=.07){r=Math.min(r,w/3,h/3,d/3);const s=new T.Shape(),a=w/2-r,b=h/2-r;s.moveTo(-a,-b-r);s.lineTo(a,-b-r);s.quadraticCurveTo(a+r,-b-r,a+r,-b);s.lineTo(a+r,b);s.quadraticCurveTo(a+r,b+r,a,b+r);s.lineTo(-a,b+r);s.quadraticCurveTo(-a-r,b+r,-a-r,b);s.lineTo(-a-r,-b);s.quadraticCurveTo(-a-r,-b-r,-a,-b-r);const geo=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.45,bevelSegments:12,curveSegments:24});geo.translate(0,0,-(d-2*r)/2);return mesh(root,geo,mat,x,y,z)}
export function buildGeneratedSofa(root,v,seatTop=.70){const base=cloth(v.color),accent=cloth(v.accent),wood=new T.MeshStandardMaterial({color:0x816951,roughness:.8});root.userData.dynamic=true;root.userData.action='sit';const w=v.width,d=v.depth;
 for(const x of [-w*.38,w*.38])for(const z of [-d*.32,d*.32])rounded(root,wood,x,.11,z,.065,.22,.065,.012);
 rounded(root,base,0,seatTop-.25,0,w,.32,d,.09);
 const usable=w-2*v.armWidth-.07,cw=usable/v.cushions;
 for(let i=0;i<v.cushions;i++){const x=-usable/2+cw*(i+.5);rounded(root,base,x,seatTop-.085,.025,cw-.025,.17,d-.12,.065);const b=rounded(root,base,x,(v.backHeight+seatTop)/2,-d/2+.08,cw-.02,v.backHeight-seatTop+.22,.22,.075);b.rotation.x=-.075;}
 for(const side of [-1,1])rounded(root,base,side*(w/2-v.armWidth/2),seatTop+.035,0,v.armWidth,.36,d,.06);
 for(const side of [-1,1]){const p=rounded(root,accent,side*usable*.30,seatTop+.20,-d*.18,.31,.34,.15,.055);p.rotation.z=side*.13;p.rotation.x=-.13;}
 root.traverse(o=>{if(o.isMesh)o.userData.action='sit'});
}
export function createGeneratedSkirt(body,legs){const root=new T.Group();root.name='generated-skirt';root.userData.wardrobeSlot='garment';body.add(root);let key='',spec=null,clothMesh=null,rest=null,sleeping=false,rain=false;
 function set(v){const k=JSON.stringify(v||null);if(k===key)return;key=k;disposeObject(root);spec=v;clothMesh=null;rest=null;if(!v)return;
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=v.color;g.fillRect(0,0,256,256);g.fillStyle=v.accent;g.globalAlpha=.5;g.fillRect(0,0,128,256);g.fillRect(0,0,256,128);g.globalAlpha=.8;g.fillRect(57,0,7,256);g.fillRect(0,57,256,7);g.globalAlpha=.22;for(let i=0;i<256;i+=4){g.fillRect(i,0,1,256);g.fillRect(0,i,256,1)}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;tex.repeat.set(2*Math.PI*.38/(v.checkSize*2),v.length/(v.checkSize*2));const mat=cloth('#ffffff');mat.map=tex;mat.side=T.DoubleSide;
 const rows=24,segments=128,pos=[],uv=[],indices=[];for(let y=0;y<=rows;y++){const t=y/rows;for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,r=.347+v.flare*t+Math.sin(a*v.pleats)*.012*t;pos.push(Math.sin(a)*r,.455-v.length*t,Math.cos(a)*r*.86);uv.push(i/segments,1-t)}}for(let y=0;y<rows;y++)for(let i=0;i<segments;i++){const a=y*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();clothMesh=mesh(root,geo,mat);rest=Float32Array.from(pos);
 const band=mesh(root,new T.TorusGeometry(.347,.012,10,96),cloth(v.accent),0,.455,0);band.rotation.x=Math.PI/2;band.scale.y=.86;
 }
 function tick(){root.visible=!!spec&&!sleeping&&!rain;if(!clothMesh||!root.visible)return;const sit=T.MathUtils.clamp(-Math.min(...legs.map(l=>l.rotation.x))/1.15,0,1),p=clothMesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],t=(.455-y)/spec.length,front=T.MathUtils.smoothstep(z,-.03,.25);p.setXYZ(i,x,y+sit*t*front*.18,z+sit*t*front*.14)}p.needsUpdate=true;clothMesh.geometry.computeVertexNormals();clothMesh.geometry.computeBoundingSphere()}
 return {set,tick,sleep(v){sleeping=v},rain(v){rain=v}};
}
