import * as T from './vendor/three.module.js';
import {foodCatalog} from './food-catalog.js';

// A single model is used on the shelf and in the paw. The drinking version removes
// the cap/existing straw so the rigid, mouth-aligned straw has one attachment point.
export function makeBeverage(id,{drinking=false}={}){
 const f=foodCatalog[id],g=new T.Group(),mats=new Map();
 const material=(color,metalness=0,roughness=.46)=>{const key=[color,metalness,roughness].join(':');if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,metalness,roughness}));return mats.get(key)};
 const add=(geo,color,x=0,y=0,z=0,metalness=0)=>{const m=new T.Mesh(geo,material(color,metalness));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
 const lathe=(profile,color,metalness=0)=>add(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),40),color,0,0,0,metalness);
 const ring=(r,y,color,thickness=.004)=>{const o=add(new T.TorusGeometry(r,thickness,8,40),color,0,y,0,.35);o.rotation.x=Math.PI/2;return o};
 const disc=(r,y,color,h=.005)=>add(new T.CylinderGeometry(r,r,h,40),color,0,y,0,.25);
 const tube=(points,color,r=.005)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,8,false),color);
 let opening;
 if(f.shape==='can'){
  lathe([[0,0],[.066,0],[.074,.006],[.078,.02],[.084,.035],[.084,.276],[.079,.295],[.073,.306],[.073,.318],[0,.318]],f.color,.28);
  ring(.074,.009,0xbcc6c1);ring(.076,.317,0xdde2dc);disc(.072,.316,0xc8d2ca);
  const hole=disc(.017,.32,0x384c45);hole.position.z=.029;hole.scale.z=1.25;
  const tab=add(new T.TorusGeometry(.018,.004,6,20),0xe8eae2,0,.325,-.006,.5);tab.rotation.x=Math.PI/2;tab.scale.y=1.35;
  // Cream swoosh and small raised bubbles read clearly even at fridge scale.
  tube([[-.055,.108,.064],[-.025,.126,.081],[.025,.15,.081],[.06,.18,.061]],0xf5e7cb,.009);
  for(const [x,y,r]of [[-.035,.22,.009],[.01,.246,.014],[.044,.226,.008]]){const b=add(new T.SphereGeometry(r,12,8),0xf4e7cc,x,y,Math.sqrt(.084**2-x*x)+.002);b.scale.z=.2;}
  opening=new T.Vector3(0,.32,.029);
 }else if(f.shape==='bottle'){
  lathe([[0,0],[.061,0],[.075,.012],[.079,.035],[.079,.255],[.075,.283],[.044,.335],[.032,.349],[.032,.4],[.025,.4],[.025,.348]],f.color);
  ring(.078,.041,f.color,.003);ring(.078,.255,f.color,.003);
  add(new T.CylinderGeometry(.080,.080,.118,40),0xf7edd7,0,.157,0);
  const label=add(new T.SphereGeometry(.025,20,14),id==='water'?0x729dba:id==='tea'?0xd9b64c:0xb9644e,0,.157,.081);label.scale.set(1,1.25,.12);
  ring(.033,.389,0xe5ddc9,.004);
  if(!drinking){add(new T.CylinderGeometry(.037,.037,.03,32),0xe4ddc9,0,.411,0);for(let i=0;i<24;i++){const a=i/24*Math.PI*2;add(new T.CylinderGeometry(.001,.001,.023,5),0xc9c6b6,Math.cos(a)*.037,.411,Math.sin(a)*.037)}}
  opening=new T.Vector3(0,.4,0);
 }else if(f.shape==='carton'){
  const outline=new T.Shape();outline.moveTo(-.105,0);outline.lineTo(.105,0);outline.lineTo(.105,.326);outline.lineTo(0,.405);outline.lineTo(-.105,.326);outline.closePath();
  add(new T.ExtrudeGeometry(outline,{depth:.17,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,steps:1}),0xf5eedc,0,.005,-.085);
  add(new T.BoxGeometry(.204,.238,.005),f.color,0,.158,.092);
  add(new T.BoxGeometry(.009,.015,.178),f.color,0,.413,0);
  const motif=add(new T.SphereGeometry(.042,24,16),id==='juice'?0xf7d38a:0xfff8e9,0,.168,.097);motif.scale.set(1,1.1,.1);
  tube([[-.065,.075,.097],[0,.067,.098],[.065,.078,.097]],0xfff7e3,.004);
  opening=new T.Vector3(.045,.365,.045);
  const cap=add(new T.CylinderGeometry(.02,.02,.012,24),drinking?0x8d997e:0xf5eadd,opening.x,opening.y,opening.z);cap.rotation.z=-.64;
 }else{
  lathe([[0,0],[.068,0],[.076,.008],[.098,.27],[.103,.283],[.092,.283],[.084,.26],[.065,.018],[0,.018]],f.color);
  ring(.101,.281,0xf4ecd9,.006);disc(.103,.283,0xf7eddc,.012);ring(.102,.294,0xd4cbb5,.003);
  add(new T.CylinderGeometry(.094,.085,.10,40),0xefe5ce,0,.148,0);
  const bean=add(new T.SphereGeometry(.025,20,14),0x805b44,0,.15,.09);bean.scale.set(.7,1.1,.13);bean.rotation.z=.3;
  opening=new T.Vector3(.028,.296,0);
  if(!drinking)tube([[.028,.29,0],[.028,.40,0],[.062,.433,0],[.092,.437,0]],0xf0d6b6,.006);
 }
 g.userData.food=id;g.userData.opening=opening.toArray();return g;
}
