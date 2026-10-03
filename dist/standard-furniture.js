import * as T from './vendor/three.module.js';
// Dimensions are built directly in room units; no external model or network fetch.
export function buildStandardFurniture(o){
 const root=new T.Group(),W=o.width,D=o.depth,H=o.height;
 const fabric=new T.MeshStandardMaterial({color:o.tint,roughness:.96}),accent=new T.MeshStandardMaterial({color:o.accent,roughness:.92}),wood=new T.MeshStandardMaterial({color:0x8b7052,roughness:.7});
 function mesh(geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
 function soft(mat,x,y,z,w,h,d){const geo=new T.SphereGeometry(1,40,24),p=geo.attributes.position;const power=o.shape==='square'?.35:.65;for(let i=0;i<p.count;i++)for(let j=0;j<3;j++){const n=p.array[i*3+j];p.array[i*3+j]=Math.sign(n)*Math.pow(Math.abs(n),power)*[w,h,d][j]/2;}geo.computeVertexNormals();return mesh(geo,mat,x,y,z);}
 if(o.standard==='sofa'){
  const seat=o.seat,back=Math.max(.22,H-seat);
  for(const x of [-W*.37,W*.37])for(const z of [-D*.30,D*.30])mesh(new T.CylinderGeometry(.035,.045,Math.max(.08,seat-.28),16),wood,x,(seat-.28)/2,z);
  soft(fabric,0,seat-.18,0,W,.28,D);
  for(const x of [-W*.23,W*.23])soft(fabric,x,seat-.06,D*.07,W*.43,.12,D*.72);
  soft(fabric,0,seat+back*.45,-D*.36,W*.91,back,D*.22);
  for(const x of [-W*.45,W*.45])soft(fabric,x,seat+.06,0,W*.11,.30,D*.93);
  for(const x of [-W*.28,W*.28]){const p=soft(accent,x,seat+.16,-D*.15,W*.23,.30,.12);p.rotation.x=-.16;p.rotation.z=x*.08;}
  if(o.pattern!=='plain'){for(let i=-2;i<=2;i++)soft(accent,i*W*.14,seat+back*.48,-D*.24,.015,back*.65,.012);if(o.pattern==='check')for(const f of [.28,.48,.68])soft(accent,0,seat+back*f,-D*.24,W*.73,.014,.012);}
 }else if(o.standard==='lamp'){
  const radius=Math.min(W,D)/2,shadeH=H*.24;
  mesh(new T.CylinderGeometry(radius*.65,radius*.75,.055,48),wood,0,.028,0);
  mesh(new T.CylinderGeometry(.014,.019,H-shadeH*.55,24),wood,0,(H-shadeH*.55)/2,0);
  const shade=new T.MeshStandardMaterial({color:o.tint,roughness:.9,side:T.DoubleSide,emissive:o.accent,emissiveIntensity:.10});
  mesh(new T.CylinderGeometry(radius*.64,radius,shadeH,o.shape==='round'?48:4,1,true),shade,0,H-shadeH/2,0);
  if(o.pattern!=='plain'&&o.shape==='round'){
   for(let i=0;i<16;i++){const a=i*Math.PI/8,points=[new T.Vector3(Math.cos(a)*radius,H-shadeH,Math.sin(a)*radius),new T.Vector3(Math.cos(a)*radius*.64,H,Math.sin(a)*radius*.64)];mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),1,.0025,6,false),accent,0,0,0);}
   if(o.pattern==='check')for(const f of [.3,.6]){const ring=mesh(new T.TorusGeometry(radius*(1-.36*f),.0025,6,48),accent,0,H-shadeH+shadeH*f,0);ring.rotation.x=Math.PI/2;}
  }
  const light=new T.PointLight(o.accent,1.7,5.5,2);light.position.set(0,H-shadeH*.75,0);light.layers.enable(1);root.add(light);root.userData.lamp=light;
  const bulb=mesh(new T.SphereGeometry(.045,20,12),new T.MeshBasicMaterial({color:o.accent}),0,H-shadeH*.72,0);bulb.name='lamp-bulb';
 }else{
  const geo=o.shape==='round'?new T.CylinderGeometry(1,1,H,80):new T.BoxGeometry(2,H,2,1,1,1);
  const rug=mesh(geo,fabric,0,H/2+.014,0);rug.scale.set(W/2,1,D/2);rug.castShadow=false;
  if(o.pattern!=='plain')for(let i=-3;i<=3;i++){
   const length=o.shape==='round'?W*Math.sqrt(1-(i/4)**2)*.92:W*.94;
   mesh(new T.BoxGeometry(length,.002,.018),accent,0,H+.016,i*D/8).castShadow=false;
   if(o.pattern==='check'){const l=o.shape==='round'?D*Math.sqrt(1-(i/4)**2)*.92:D*.94;mesh(new T.BoxGeometry(.018,.002,l),accent,i*W/8,H+.018,0).castShadow=false;}
  }
 }
 root.traverse(m=>{if(m.isMesh){m.userData.action=o.standard==='sofa'?'sit':o.standard==='lamp'?'lighting':'design-open';}});
 return root;
}
