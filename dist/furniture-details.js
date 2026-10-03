import * as T from './vendor/three.module.js';
// Small, smooth local meshes. AI chooses the structure and material parameters, never executable code.
export function buildFurnitureDetails(o){
 if(['sofa','lamp','rug'].includes(o.standard))return null;
 const g=new T.Group(),type=o.standard,v=o.variant,W=o.width,H=o.height,D=o.depth;
 const mat=new T.MeshStandardMaterial({color:o.tint,roughness:.82}),accent=new T.MeshStandardMaterial({color:o.accent,roughness:.85}),wood=new T.MeshStandardMaterial({color:0xa78967,roughness:.75});
 const leaf=new T.MeshStandardMaterial({color:o.accent,roughness:.88,side:T.DoubleSide});
 function add(geo,m,x=0,y=0,z=0){const q=new T.Mesh(geo,m);q.position.set(x,y,z);q.castShadow=q.receiveShadow=true;g.add(q);return q}
 const box=(m,x,y,z,w,h,d)=>{const r=Math.min(w,h,d)*.16,geo=new T.BoxGeometry(w,h,d,6,6,6),p=geo.attributes.position;for(let i=0;i<p.count;i++){const q=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)),c=q.clone().clamp(new T.Vector3(-w/2+r,-h/2+r,-d/2+r),new T.Vector3(w/2-r,h/2-r,d/2-r));q.sub(c).normalize().multiplyScalar(r).add(c);p.setXYZ(i,q.x,q.y,q.z);}geo.computeVertexNormals();return add(geo,m,x,y,z)};
 const oval=(m,x,y,z,w,h,d)=>{const q=add(new T.SphereGeometry(1,32,20),m,x,y,z);q.scale.set(w/2,h/2,d/2);return q};
 const cyl=(m,x,y,z,r1,r2,h)=>add(new T.CylinderGeometry(r1,r2,h,48),m,x,y,z);
 function tube(points,m=accent,r=.008){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,r,8,false),m)}
 function ring(x,y,z,r,th=.008){const q=add(new T.TorusGeometry(r,th,8,64),accent,x,y,z);return q}
 function cloth(w,h,fold=.015){const geo=new T.PlaneGeometry(w,h,32,32),p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,fold*Math.sin(x/w*Math.PI*10)+.007*Math.cos(y/h*8));}geo.computeVertexNormals();return geo}
 function pot(y,h,r){const pts=[[0,0],[r*.7,0],[r*.86,h*.1],[r,h*.9],[r*.97,h],[r*.85,h],[r*.85,h*.92],[r*.79,h*.13],[0,h*.13]].map(([x,z])=>new T.Vector2(x,z));return add(new T.LatheGeometry(pts,48),mat,0,y,0)}
 function foliage(height,radius,flower=false,palm=false){
  for(let i=0;i<(palm?9:7);i++){const a=i*2.399,tx=Math.sin(a)*radius,tz=Math.cos(a)*radius,y=height*(.58+(i%3)*.15);
   tube([[0,height*.2,0],[tx*.25,height*.52,tz*.25],[tx,y,tz]],wood,.006);
   if(flower){for(let j=0;j<6;j++){const b=j*Math.PI/3;oval(leaf,tx+Math.cos(b)*radius*.18,y+Math.sin(b)*radius*.18,tz,radius*.27,radius*.2,radius*.12)}oval(accent,tx,y,tz+.01,.035,.035,.025)}
   else{const lw=radius*(palm?.4:.85),lh=height*(palm?.4:.25),geo=new T.PlaneGeometry(lw,lh,10,18),p=geo.attributes.position;for(let k=0;k<p.count;k++){const u=p.getX(k)/lw*2,v=p.getY(k)/lh+.5;p.setXYZ(k,u*Math.sin(v*Math.PI)*lw/2,p.getY(k),lh*(.13*Math.sin(v*Math.PI)-.04*Math.abs(u)));}geo.computeVertexNormals();const q=add(geo,leaf,tx,y,tz);q.rotation.z=Math.sin(a)*.65;q.rotation.x=palm?-.7:.15;q.rotation.y=a;}
  }
 }
 if(['table','sideTable','nightstand','stool'].includes(type)){
  const top=H*.12,round=o.shape==='round';
  if(type==='stool'&&v==='upholstered')oval(mat,0,H-top/2,0,W,top*2,D);
  else if(round){const q=cyl(mat,0,H-top/2,0,W/2,W/2,top);q.scale.z=D/W}else box(mat,0,H-top/2,0,W,top,D);
  if(v==='pedestal'){cyl(wood,0,(H-top)/2,0,W*.11,W*.18,H-top);const q=cyl(wood,0,.03,0,W*.36,W*.4,.06);q.scale.z=D/W;}
  else if(type==='nightstand'){
   box(wood,-W*.46,H*.46,0,W*.08,H*.88,D);box(wood,W*.46,H*.46,0,W*.08,H*.88,D);box(wood,0,H*.08,0,W,H*.1,D);box(wood,0,H*.46,-D*.47,W,H*.84,D*.06);
   if(v==='drawer'){for(const y of [.32,.66]){box(mat,0,H*y,D*.47,W*.86,H*.29,D*.055);oval(accent,0,H*y,D*.51,W*.18,.018,.025)}}else box(wood,0,H*.45,0,W,H*.06,D);
  }else{
   for(let i=0;i<(v==='tripod'?3:4);i++){const a=i*Math.PI*2/(v==='tripod'?3:4)+Math.PI/4;const q=cyl(wood,Math.cos(a)*W*.36,(H-top)/2,Math.sin(a)*D*.36,.022,.032,H-top);q.rotation.z=-Math.cos(a)*.07;q.rotation.x=Math.sin(a)*.07;}
   if(v==='shelf')box(wood,0,H*.26,0,W*.85,H*.045,D*.85);
  }
 }else if(type==='cushion'){
  const q=oval(mat,0,H/2,0,W,H,D);if(o.shape==='square'){const p=q.geometry.attributes.position;for(let i=0;i<p.count;i++)for(let j=0;j<3;j++){const n=p.array[i*3+j];p.array[i*3+j]=Math.sign(n)*Math.pow(Math.abs(n),.4);}q.geometry.computeVertexNormals();}const pts=[];for(let i=0;i<=80;i++){const a=i*Math.PI/40;pts.push([Math.cos(a)*W*.47,H/2+Math.sin(a)*H*.47,0])}tube(pts,accent,.005);
  if(v==='tufted')for(const x of [-.22,.22])oval(accent,W*x,H*.5,D*.46,.02,.02,.009);
 }else if(type==='blanket'){
  mat.side=T.DoubleSide;const geo=new T.PlaneGeometry(W,H,40,40),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),t=(p.getY(i)/H+.5);p.setXYZ(i,x,H*(t>.5?.53+.08*Math.sin((t-.5)*Math.PI):t),D*(t>.5?-(t-.5)*2:.05)+.012*Math.sin(x/W*22));}geo.computeVertexNormals();add(geo,mat);
  if(v==='fringe')for(let i=0;i<17;i++)tube([[-W/2+i*W/16,.035,D*.05],[-W/2+i*W/16,.005,D*.05+.015]],accent,.003);
 }else if(type==='curtain'){
  mat.side=T.DoubleSide;for(const sign of [-1,1]){const q=add(cloth(W,H,.035),mat,sign*((o.windowSpan||2.7)/2+W*.32),H/2,0);if(v==='tieback'){const p=q.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)*(1-.5*Math.exp(-(((y+H*.12)/(.2*H))**2))));}q.geometry.computeVertexNormals();tube([[q.position.x-W*.38,H*.38,0],[q.position.x,H*.36,.05],[q.position.x+W*.38,H*.38,0]],accent,.009);}}
 }else if(type==='vase'){
  const profile=v==='bowl'?[[0,0],[.25,.01],[.44,.16],[.5,.55],[.46,.62],[.41,.62],[.43,.52],[.37,.2],[.2,.08],[0,.08]]:[[0,0],[.35,0],[.49,.15],[.45,.5],[.19,.75],[.18,1],[.12,1],[.12,.76],[.37,.45],[.35,.1],[0,.1]];
  const curve=new T.CatmullRomCurve3(profile.map(([x,y])=>new T.Vector3(x*W,y*H,0)),false,'centripetal');add(new T.LatheGeometry(curve.getPoints(100).map(p=>new T.Vector2(Math.max(0,p.x),p.y)),64),mat);const q=ring(0,H*(v==='bowl'?.62:1),0,W*(v==='bowl'?.445:.15),.005);q.rotation.x=Math.PI/2;
 }else if(type==='tray'){
  const q=cyl(mat,0,H*.2,0,W/2,W/2,H*.3);q.scale.z=D/W;const rim=ring(0,H*.5,0,W*.48,H*.22);rim.rotation.x=Math.PI/2;rim.scale.y=D/W;
  if(v==='handled')for(const s of [-1,1])tube([[s*W*.36,H*.4,-D*.18],[s*W*.47,H,0],[s*W*.36,H*.4,D*.18]],accent,.009);
 }else if(type==='frame'||type==='wallArt'){
  box(wood,0,H/2,0,W,H,D*.45);box(mat,0,H/2,D*.25,W*.85,H*.85,D*.06);
  for(const sign of [-1,1]){box(accent,sign*W*.46,H/2,D*.3,W*.08,H,D*.25);box(accent,0,H*(sign>0?.96:.04),D*.3,W,H*.08,D*.25)}
  if(v==='landscape'){oval(accent,-W*.23,H*.73,D*.3,W*.17,W*.17,D*.03);for(let i=0;i<3;i++)oval(i%2?wood:accent,(-.25+i*.23)*W,H*.30,D*.3,W*.45,H*.25,D*.04)}
  else{for(let i=0;i<3;i++){const q=oval(i%2?wood:accent,(i-1)*W*.2,H*(.35+i*.13),D*.3,W*.25,H*.40,D*.035);q.rotation.z=(i-1)*.45;}}
  if(type==='frame'){const q=box(wood,0,H*.24,-D*.3,W*.15,H*.5,D*.08);q.rotation.x=-.25;if(v==='arch'){const r=ring(0,H*.58,D*.34,W*.30,.008);r.scale.y=H/W;}}
 }else if(type==='clock'){
  const r=Math.min(W,H)*.48,q=cyl(mat,0,H*.65,0,r,r,D*.6);q.rotation.x=Math.PI/2;ring(0,H*.65,D*.33,r,.01);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;oval(accent,Math.sin(a)*r*.78,H*.65+Math.cos(a)*r*.78,D*.35,.012,.012,.006)}
  tube([[0,H*.65,D*.37],[r*.48,H*.65+r*.2,D*.37]],accent,.007);tube([[0,H*.65,D*.37],[-r*.2,H*.65+r*.57,D*.37]],wood,.006);
  if(v==='pendulum'){box(wood,0,H*.3,0,W*.38,H*.5,D*.5);tube([[0,H*.5,D*.3],[0,H*.12,D*.3]],accent,.006);oval(accent,0,H*.13,D*.31,W*.18,W*.18,D*.12)}
 }else if(type==='sculpture'){
  if(v==='bird'){oval(mat,0,H*.42,0,W*.85,H*.63,D*.9);oval(mat,W*.23,H*.8,0,W*.43,H*.4,D*.6);const beak=add(new T.ConeGeometry(W*.07,W*.2,24),accent,W*.48,H*.79,0);beak.rotation.z=-Math.PI/2;oval(accent,W*.3,H*.85,D*.25,.014,.014,.012);oval(wood,-W*.1,H*.48,D*.42,W*.45,H*.3,D*.1)}
  else for(let i=0;i<3;i++)oval(i%2?accent:mat,(i%2?.08:-.06)*W,H*(.13+i*.29),0,W*(1-i*.2),H*.31,D*(1-i*.15));
 }else if(['plant','floorPlant','hangingPlant'].includes(type)){
  if(type==='hangingPlant'){
   pot(H*.38,H*.22,W*.36);if(v==='basket'){for(let j=0;j<7;j++){const q=ring(0,H*(.405+j*.026),0,W*(.27+j*.012),.003);q.rotation.x=Math.PI/2;}for(let j=0;j<14;j++){const a=j*Math.PI/7;tube([[Math.cos(a)*W*.27,H*.40,Math.sin(a)*W*.27],[Math.cos(a)*W*.35,H*.59,Math.sin(a)*W*.35]],wood,.003);}}for(let i=0;i<3;i++){const a=i*Math.PI*2/3;tube([[Math.cos(a)*W*.34,H*.57,Math.sin(a)*D*.34],[0,H,0]],wood,.004)}
   for(let i=0;i<7;i++){const a=i*2.399,x=Math.sin(a)*W*.32,z=Math.cos(a)*D*.32;tube([[x,H*.59,z],[x*1.1,H*.35,z*1.1],[x,H*.04,z]],leaf,.004);for(let j=0;j<4;j++){const q=oval(leaf,x+(j%2?.03:-.03),H*(.09+j*.13),z,.06,.08,.015);q.rotation.z=j%2?.5:-.5;}}
  }else {pot(0,H*.28,W*.35);foliage(H,W*.48,v==='flower',v==='palm');}
 }else return null;
 // Keep the requested dimensions truthful; curtains intentionally span the existing window.
 if(type!=='curtain'){g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());for(const q of g.children){q.position.x-=c.x;q.position.y-=b.min.y;q.position.z-=c.z;}g.scale.set(W/s.x,H/s.y,D/s.z);}
 // Fine fabric weave / stripes are an actual texture, not floating bars.
 if(['cushion','blanket','curtain'].includes(type)&&globalThis.document){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=o.tint;ctx.fillRect(0,0,128,128);if(o.pattern!=='plain'){ctx.fillStyle=o.accent;for(let i=0;i<128;i+=32){ctx.fillRect(i,0,9,128);if(o.pattern==='check'){ctx.globalAlpha=.55;ctx.fillRect(0,i,128,9);ctx.globalAlpha=1;}}}ctx.strokeStyle='#ffffff18';ctx.lineWidth=1;for(let i=0;i<128;i+=4){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,128);ctx.moveTo(0,i);ctx.lineTo(128,i);ctx.stroke();}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);mat.color.set('#ffffff');mat.map=tex;}
 g.traverse(q=>{if(q.isMesh)q.userData.action=type==='stool'?'sit-ai-'+o.id:'design-open'});return g;
}
