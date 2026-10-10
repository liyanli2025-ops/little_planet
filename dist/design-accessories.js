import {clothSurface} from './cloth-surface.js';
import {frontSurface} from './garment-fit.js';
import * as T from './vendor/three.module.js';
import {designColors} from './design-schema.js';
export function createDesignAccessories(body,head,legs){
 const hat=new T.Group(),jewel=new T.Group(),feet=legs.map(l=>{const g=new T.Group();l.add(g);return g});hat.userData.wardrobeSlot="hat";jewel.userData.wardrobeSlot="accessory";feet.forEach(g=>g.userData.wardrobeSlot="shoes");head.add(hat);body.add(jewel);
 let key='',hidden=false;const primary=new T.MeshStandardMaterial({roughness:.92}),trim=new T.MeshStandardMaterial({roughness:.85}),sole=new T.MeshStandardMaterial({color:0xe7ddc5,roughness:1});
 function ell(g,m,x,y,z,a,b,c){const o=new T.Mesh(new T.SphereGeometry(1,32,20),m);o.position.set(x,y,z);o.scale.set(a,b,c);o.castShadow=o.receiveShadow=true;g.add(o);return o}
 function tube(g,m,points,r){const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false),m);o.castShadow=true;g.add(o)}
 function clear(g){g.traverse(o=>{o.geometry?.dispose();if(o.material?.userData.customColor)o.material.dispose()});g.clear()}
 function set(v){const next=JSON.stringify(v);if(next===key)return;key=next;[hat,jewel,...feet].forEach(clear);primary.color.set(designColors[v.primary]||0x9eae91);trim.color.set(designColors[v.trim]||0x526e5c);
 if(v.hat==='beret'){const crown=ell(hat,primary,0,.278,-.024,.181,.068,.155);crown.rotation.z=.13;ell(hat,trim,0,.335,-.02,.012,.025,.012)}
 if(v.hat==='beanie'){ell(hat,primary,0,.267,-.016,.173,.11,.147);tube(hat,trim,[[-.15,.246,.018],[-.1,.247,.112],[0,.247,.142],[.1,.247,.112],[.15,.246,.018]],.016);ell(hat,trim,0,.372,-.016,.032,.033,.032)}
 if(v.shoes!=='none')feet.forEach(g=>{ell(g,primary,0,-.119,.041,.132,v.shoes==='boots'?.137:.107,.152);ell(g,sole,0,-.225,.043,.131,.025,.15);for(const y of [-.11,-.08])tube(g,trim,[[-.038,y,.17],[0,y-.004,.19],[.038,y,.17]],.004)});
 if(v.accessory==='bow'){for(const s of [-1,1]){const b=new T.Mesh(clothSurface((u,v)=>{const x=s*(.009+u*.065),y=.657+(v-.5)*(.016+.039*Math.sin(u*Math.PI/2)),z=frontSurface(x,y)+.013+.020*Math.sin(u*Math.PI);return [x,y,z]},24,16),trim);trim.side=T.DoubleSide;jewel.add(b)}ell(jewel,primary,0,.657,frontSurface(0,.657)+.024,.012,.017,.010)}
 if(v.accessory==='brooch'){const mount=new T.Group();mount.position.set(.125,.57,frontSurface(.125,.57)+.008);jewel.add(mount);const bezel=new T.Mesh(new T.TorusGeometry(.029,.0025,10,48),trim);mount.add(bezel);const stone=new T.Mesh(new T.IcosahedronGeometry(.016,1),new T.MeshPhysicalMaterial({color:primary.color,metalness:.25,roughness:.18,clearcoat:1}));stone.scale.z=.45;stone.position.z=.011;mount.add(stone);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ell(jewel,trim,.125+Math.cos(a)*.019,.57+Math.sin(a)*.019,frontSurface(.125,.57)+.005,.012,.012,.006)}ell(jewel,sole,.125,.57,frontSurface(.125,.57)+.014,.008,.008,.004)}
 for(const [group,color] of [[hat,v.accessoryColors?.hat],[jewel,v.accessoryColors?.accessory],...feet.map(g=>[g,v.accessoryColors?.shoes])])if(color)group.traverse(o=>{if(o.material===primary||o.material===trim){o.material=o.material.clone();o.material.userData.customColor=true;o.material.color.set(color)}});
 hat.visible=!hidden;
 }
 return {set,hideHat(v){hidden=v;hat.visible=!v},sleep(v){feet.forEach(g=>g.visible=!v);hat.visible=!v&&!hidden}};
}
