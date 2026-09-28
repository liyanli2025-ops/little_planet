import * as T from './vendor/three.module.js';
// All dimensions are in scene units. Pieces are baked into a few vertex-coloured
// meshes so the finer silhouettes do not require hundreds of mobile draw calls.
const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide});
const V=(x,y,z)=>new T.Vector3(x,y,z);
function surface(fn,cols=10,rows=10){const p=[],uv=[],idx=[];for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){p.push(...fn(i/cols,j/rows));uv.push(i/cols,j/rows)}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i;idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g}
function builder(){const parts=[];return {
 add(geo,color,x=0,y=0,z=0,scale=[1,1,1],rotation=[0,0,0]){const q=rotation.isQuaternion?rotation:new T.Quaternion().setFromEuler(new T.Euler(...rotation));geo.applyMatrix4(new T.Matrix4().compose(V(x,y,z),q,V(...scale)));parts.push({geo,color});},
 oval(c,x,y,z,sx,sy,sz,rot=[0,0,0]){this.add(new T.SphereGeometry(1,16,10),c,x,y,z,[sx,sy,sz],rot)},
 rod(c,a,b,r=.009){const delta=V(...b).sub(V(...a));this.add(new T.CylinderGeometry(r*.75,r,delta.length(),7),c,...V(...a).add(V(...b)).multiplyScalar(.5).toArray(),[1,1,1],new T.Quaternion().setFromUnitVectors(V(0,1,0),delta.normalize()))},
 leaf(c,a,b,width=.035){const delta=V(...b).sub(V(...a)),length=delta.length(),q=new T.Quaternion().setFromUnitVectors(V(0,1,0),delta.normalize());this.add(surface((u,t)=>[(u*2-1)*width*Math.pow(Math.sin(Math.PI*t),.8),length*t,width*.4*(1-(u*2-1)**2)*Math.sin(Math.PI*t)],6,8),c,...a,[1,1,1],q);this.rod(0x76954b,a,b,.002)},
 finish(parent){const positions=[],normals=[],colors=[];for(const {geo,color}of parts){const flat=geo.index?geo.toNonIndexed():geo,c=new T.Color(color);positions.push(...flat.attributes.position.array);normals.push(...flat.attributes.normal.array);for(let i=0;i<flat.attributes.position.count;i++)colors.push(c.r,c.g,c.b);if(flat!==geo)flat.dispose();geo.dispose()}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const m=new T.Mesh(g,material);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
}}
function rose(b,x,y,z,size=1){for(let layer=0;layer<4;layer++){const count=[7,6,5,3][layer],r=.09-layer*.019;for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+layer*.64;b.add(surface((u,t)=>{const side=u*2-1;return [side*r*.57*Math.sin(Math.PI*t*.82),.053*t+layer*.008+.012*side*side*Math.sin(Math.PI*t),.006+r*Math.sin(t*Math.PI/2)*(.98-.23*t)]},10,12),[0xdd879d,0xe89fb0,0xd87996,0xcd6b8b][(layer+i%2)%4],x,y,z,[size,size,size],[0,angle,0])}}b.oval(0xd9869f,x,y+.047*size,z,.011*size,.018*size,.012*size)}
function tulip(b,x,y,z,size=1){for(let i=0;i<6;i++){const a=i*Math.PI/3;b.add(surface((u,t)=>{const theta=(u-.5)*1.52,r=.014+.05*Math.sin(t*Math.PI*.76);return [Math.sin(theta)*r,.115*t-.016*Math.abs(u-.5)*2,Math.cos(theta)*r]},9,12),i%2?0xf0b384:0xe79983,x,y,z,[size,size,size],[0,a,0])}}
function sunflower(b,x,y,z,size=1){const head=new T.Quaternion().setFromEuler(new T.Euler(-.58,0,0));const transform=p=>V(...p).multiplyScalar(size).applyQuaternion(head).add(V(x,y,z));for(let ring=0;ring<2;ring++)for(let i=0;i<15;i++){const a=i/15*Math.PI*2+ring*.2,start=transform([Math.sin(a)*.032,Math.cos(a)*.032,0]),end=transform([Math.sin(a)*(.113-ring*.014),Math.cos(a)*(.113-ring*.014),-.007]);b.leaf(ring?0xf2c458:0xe8ac37,start.toArray(),end.toArray(),.019*size)}b.oval(0x765334,x,y,z,.052*size,.052*size,.017*size,[-.58,0,0]);for(let i=0;i<42;i++){const a=i*2.4,r=.043*Math.sqrt(i/42),p=transform([Math.sin(a)*r,Math.cos(a)*r,.017]);b.oval(i%3?0x9b7540:0xc69b54,...p.toArray(),.004*size,.004*size,.003*size)}}
function strawberry(b,x,y,z,size=1){const geometry=surface((u,t)=>{const a=u*Math.PI*2,r=.051*Math.sin(Math.PI*t)*(.72+.5*t);return [Math.cos(a)*r,(t-.5)*.115,Math.sin(a)*r]},16,14);b.add(geometry,0xd85361,x,y,z,[size,size,size]);for(let i=0;i<21;i++){const t=.19+(i%5)*.14,a=i*2.4,r=.051*Math.sin(Math.PI*t)*(.72+.5*t);b.oval(0xf4d09a,x+Math.cos(a)*r*size,y+(t-.5)*.115*size,z+Math.sin(a)*r*size,.0025*size,.004*size,.0025*size)}for(let i=0;i<5;i++){const a=i*1.256;b.leaf(0x648b43,[x,y+.045*size,z],[x+Math.cos(a)*.042*size,y+.061*size,z+Math.sin(a)*.042*size],.012*size)}}
function daisy(b,x,y,z,s=1){for(let i=0;i<12;i++){const a=i*Math.PI/6;b.oval(0xf9f2dd,x+Math.cos(a)*.049*s,y,z+Math.sin(a)*.049*s,.036*s,.009*s,.014*s,[0,-a,0])}b.oval(0xe8ba54,x,y+.012*s,z,.024*s,.015*s,.024*s)}
function lavender(b,x,y,z,s=1){for(let j=0;j<7;j++)for(let k=0;k<3;k++){const a=k*2.094+j*.7,r=(.026-j*.002)*s;b.oval(j%2?0x9982b7:0xb19bc9,x+Math.cos(a)*r,y+j*.017*s,z+Math.sin(a)*r,.016*s,.013*s,.011*s)}}
function hydrangea(b,x,y,z,s=1){for(let i=0;i<26;i++){const a=i*2.4,r=.074*Math.sqrt(i/26)*s,yy=y+Math.sqrt(Math.max(0,.008*s*s-r*r));for(let k=0;k<4;k++){const t=k*Math.PI/2;b.oval(i%3?0x91acce:0xbbbfdf,x+Math.cos(a)*r+Math.cos(t)*.014*s,yy,z+Math.sin(a)*r+Math.sin(t)*.014*s,.015*s,.008*s,.013*s)}}}
function lily(b,x,y,z,s=1){for(let i=0;i<6;i++){const a=i*Math.PI/3;b.add(surface((u,t)=>[(u*2-1)*.031*Math.sin(Math.PI*t),.025*Math.sin(Math.PI*t)-.025*t*t,.10*t],8,10),0xf7edda,x,y,z,[s,s,s],[0,a,0]);b.rod(0xd4a55c,[x,y,z],[x+Math.sin(a)*.025*s,y+.04*s,z+Math.cos(a)*.025*s],.002)} }
export function createPlant(parent,type,cut=false){const g=new T.Group();parent.add(g);const leaves=builder(),flowers=builder(),green=new T.Group(),bloom=new T.Group();g.add(green,bloom);
 if(['rose','tulip','sunflower','daisy','lavender','hydrangea','lily'].includes(type)){
  const stems=cut?[[0,0,1]]:type==='sunflower'?[[0,0,1],[-.10,.06,.74]]:[[-.075,.04,.8],[.066,.06,.9],[.006,-.067,1.06]];
  stems.forEach(([x,z,s],i)=>{const h=(type==='sunflower'?.46:type==='tulip'?.32:.29)*s;leaves.rod(0x597d43,[x,0,z],[x+.018,h,z],type==='sunflower'?.012:.007);
   for(let j=0;j<(cut?2:4);j++){const side=j%2?1:-1,y=.06+j*.045,end=[x+side*.08*s,y+.055,z+.025*(j%2?1:-1)];leaves.leaf(j%2?0x6e994e:0x4e7f47,[x,y,z],end,type==='tulip'?.022:.035);if(type==='tulip')leaves.leaf(0x71a16a,[x+side*.015,.018,z],[x+side*.074,h*.9,z-.028],.027)}
   ({rose,tulip,sunflower,daisy,lavender,hydrangea,lily}[type])(flowers,x+.018,h,z,s*(cut?.88:1));
  });
 }else if(type==='tomato'){
  leaves.rod(0x5d8543,[0,0,0],[.014,.39,0],.012);leaves.rod(0xb49b6b,[.045,0,-.025],[.045,.46,-.025],.008);
  for(let i=0;i<5;i++){const a=i*2.4,y=.11+i*.047,x=Math.sin(a)*.11,z=Math.cos(a)*.10;leaves.rod(0x648a44,[0,y,0],[x,y+.025,z],.006);for(let j=0;j<3;j++)leaves.leaf(j%2?0x70964b:0x4b7940,[x*.6,y+.012,z*.6],[x+(j-1)*.035,y+.07+j*.012,z+.045],.027);if(i<4){flowers.oval(i===3?0xe59a4a:0xce5b46,x,y-.035,z,.045,.039,.045);for(let k=0;k<5;k++){const a=k*1.256;flowers.leaf(0x5e8141,[x,y+.008,z],[x+Math.sin(a)*.034,y+.016,z+Math.cos(a)*.034],.009)}}}
 }else if(type==='carrot'){
  for(const [x,z]of [[-.08,.045],[.075,.055],[0,-.075]]){flowers.add(new T.CylinderGeometry(.028,.007,.095,12),0xe39a43,x,.015,z);for(let i=0;i<5;i++){const a=i*1.256,top=[x+Math.sin(a)*.078,.20+(i%2)*.035,z+Math.cos(a)*.078];leaves.rod(0x588b45,[x,.045,z],top,.004);for(let j=1;j<4;j++)for(const side of [-1,1]){const t=j/4,p=[x+(top[0]-x)*t,.045+(top[1]-.045)*t,z+(top[2]-z)*t];leaves.leaf(j%2?0x77a157:0x5e934c,p,[p[0]+side*.033,p[1]+.035,p[2]+.015],.012)}}}
 }else if(type==='strawberry'){
  for(let i=0;i<7;i++){const a=i*2.4,x=Math.sin(a)*.083,z=Math.cos(a)*.083;leaves.rod(0x6e9145,[0,0,0],[x,.1,z],.004);for(let j=0;j<3;j++){const angle=a+(j-1)*.85;leaves.leaf(j%2?0x659046:0x4b7d45,[x,.085,z],[x+Math.sin(angle)*.064,.12,z+Math.cos(angle)*.064],.036)}}for(const [x,y,z]of [[-.09,.072,.08],[.075,.065,.075],[.075,.08,-.08]])strawberry(flowers,x,y,z,.8);
 }
 leaves.finish(green);const blossom=flowers.finish(bloom);blossom.geometry.computeBoundingBox();const center=blossom.geometry.boundingBox.getCenter(new T.Vector3());g.userData.grow=f=>{g.scale.setScalar(.35+.65*f);const size=Math.max(.035,Math.min(1,(f-.35)/.65));bloom.scale.setScalar(size);bloom.position.copy(center).multiplyScalar(1-size);bloom.visible=f>.28};return g;
}
export function createGardenBeds(garden){const b=builder(),beds=[];
 const spots=[[-.51,-.27],[-.04,-.42],[.49,-.25],[-.58,.26],[-.04,.17],[.48,.32]];
 spots.forEach(([x,z],i)=>{const g=new T.Group();g.position.set(x,.09,z);garden.add(g);beds.push(g);b.oval(0x80664a,x,.035,z,.23,.047,.22);
 for(let j=0;j<11;j++){const a=j/11*Math.PI*2,r=.222+Math.sin(j*4+i)*.013;b.oval(j%3?0xb7b39a:0xd0c8af,x+Math.cos(a)*r,.045,z+Math.sin(a)*r,.043,.032,.035,[0,a,0])}
 for(let j=0;j<16;j++){const a=j*2.4,r=.18*Math.sqrt(j/16);b.oval(0x997e59,x+Math.sin(a)*r,.078,z+Math.cos(a)*r,.009,.003,.006)}
 const hit=new T.Mesh(new T.CylinderGeometry(.25,.25,.06,20),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.y=.02;hit.userData.plot=i;g.add(hit);
 const ring=new T.Mesh(new T.TorusGeometry(.255,.009,5,40),new T.MeshBasicMaterial({color:0xf3d892}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;ring.visible=false;g.add(ring);g.userData.selection=ring;
 });
 for(let i=0;i<5;i++)b.oval(i%2?0xb6b29a:0xcac1a4,-.72+i*.35,.012,.66+Math.sin(i)*.03,.105,.023,.07,[0,i*.7,0]);
 b.finish(garden);return beds;
}
