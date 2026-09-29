import * as T from './vendor/three.module.js';
import {makeFood} from './food-models.js';
import {makeAsset} from './imported-food.js';
import {makeExpansionAsset as asset} from './expanded-food.js';

function fit(g,size){const b=new T.Box3().setFromObject(g),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3()),scale=size/Math.max(s.x,s.y,s.z);const a=new T.Group();g.position.sub(new T.Vector3(c.x,b.min.y,c.z));a.add(g);a.scale.setScalar(scale);return a}
function put(g,item,size,x,y,z,turn=0){const a=fit(item,size);a.position.set(x,y,z);a.rotation.y=turn;g.add(a);return a}
function height(g){return new T.Box3().setFromObject(g).max.y}
function solid(g,geo,color,x,y,z){const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.8}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}
function loose(id){const g=makeFood(id);const discarded=g.children.slice(0,5);for(const m of discarded){g.remove(m);m.geometry?.dispose()}const used=new Set(g.children.map(m=>m.material));for(const material of new Set(discarded.map(m=>m.material)))if(!used.has(material))material.dispose();return g}
function bowl(fill){const g=asset('kenney-bowl-soup',.46);if(fill){const top=solid(g,new T.CylinderGeometry(.166,.166,.006,48),fill,0,.159,0);top.name='soup-surface'}return g}
function garnish(g,y){for(let i=0;i<7;i++){const a=i*2.4;const m=solid(g,new T.BoxGeometry(.018,.005,.009),0x719257,Math.cos(a)*.105,y+(i%2)*.005,Math.sin(a)*.09);m.rotation.y=a}}

export function makeKitchenDish(id){
 let g;
 if(['friedrice','beefrice','chickenrice','shrimprice'].includes(id)){
  g=asset('rice',.47);const y=height(g)-.016;
  if(id==='friedrice'){put(g,asset('kenney-egg-cooked'),.17,-.05,y,.02);for(let i=0;i<10;i++)solid(g,new T.BoxGeometry(.015,.012,.014),i%2?0xe2a75d:0x8fa76d,Math.cos(i*2.4)*.1,y+.009,Math.sin(i*2.4)*.1)}
  if(id==='beefrice'||id==='chickenrice')for(let i=0;i<3;i++)put(g,id==='beefrice'?makeAsset('meatcookedslice'):asset('kenney-meat-cooked'),.16,-.065+i*.065,y+(i%2)*.014,0,i*.25);
  if(id==='chickenrice')put(g,asset('kenney-broccoli'),.11,.09,y,-.075);
  if(id==='shrimprice')for(let i=0;i<3;i++)put(g,loose('shrimp'),.11,(i-1)*.085,y,.01,i*.7);
  garnish(g,y+.025);
 }else if(id.endsWith('noodles')){
  g=asset('noodles',.48);const y=height(g)-.025;
  if(id==='tomatonoodles'){put(g,makeAsset('tomatoslice'),.14,-.08,y,0,.6);put(g,asset('kenney-egg-cooked'),.17,.07,y,.02)}
  if(id==='beefnoodles')for(let i=0;i<3;i++)put(g,makeAsset('meatcookedslice'),.13,(i-1)*.07,y,-.04,i*.3);
  if(id==='shrimpnoodles')for(let i=0;i<3;i++)put(g,loose('shrimp'),.12,(i-1)*.085,y,0,i*.6);
  if(id==='mushroomnoodles')for(let i=0;i<4;i++)put(g,asset('kenney-mushroom'),.085,Math.cos(i*1.8)*.085,y,Math.sin(i*1.8)*.065,i);
  garnish(g,y+.018);
 }else if(id==='steamedbao')g=asset('bao',.49);
 else if(id==='pudding'){g=asset('kenney-plate',.39);put(g,asset('kenney-pudding'),.28,0,.03,0)}
 else if(id==='sandwich'){g=asset('kenney-plate',.49);put(g,asset('kenney-sandwich'),.36,0,.026,0,.25)}
 else if(id==='beefstew'){g=bowl(0x995b37);for(let i=0;i<4;i++)put(g,makeAsset('meatcookedslice'),.10,Math.cos(i*1.7)*.085,.16,Math.sin(i*1.7)*.075,i);put(g,makeAsset('tomatoslice'),.10,-.045,.14,.07);garnish(g,.16)}
 else if(id==='tofusoup'){g=bowl(0xdbceb1);for(let i=0;i<4;i++){solid(g,new T.BoxGeometry(.065,.048,.06),0xf6edda,(i%2-.5)*.12,.18,(Math.floor(i/2)-.5)*.11)}put(g,asset('kenney-mushroom'),.08,.09,.13,0);garnish(g,.18)}
 else if(id==='toast'){g=bowl(0xe9d995);garnish(g,.169)}
 else if(id==='omelet'){g=asset('kenney-plate',.49);const egg=solid(g,new T.SphereGeometry(1,40,24),0xe8bf59,0,.074,0);egg.scale.set(.17,.065,.11);for(let i=0;i<4;i++){const stripe=solid(g,new T.CapsuleGeometry(.009,.12,6,10),0xb95944,(i-1.5)*.064,.131,0);stripe.rotation.x=Math.PI/2}put(g,asset('kenney-broccoli'),.10,-.14,.028,.1);put(g,makeAsset('tomatoslice'),.1,.12,.03,.1)}
 else if(id==='fruitsalad'){g=bowl(0xf1e9d8);put(g,makeAsset('strawberryhalf'),.095,-.07,.16,.015);put(g,asset('kenney-orange'),.08,.055,.16,-.045);put(g,loose('blueberry'),.13,.055,.14,.065)}
 else return null;
 g.userData.importedDish=id;return g;
}
