import * as T from './vendor/three.module.js';
import {designColors} from './design-schema.js';
export function createDesignAccessories(body,head,legs){
 const hat=new T.Group(),jewel=new T.Group(),feet=legs.map(l=>{const g=new T.Group();l.add(g);return g});head.add(hat);body.add(jewel);
 let key='',hidden=false;const primary=new T.MeshStandardMaterial({roughness:.92}),trim=new T.MeshStandardMaterial({roughness:.85}),sole=new T.MeshStandardMaterial({color:0xe7ddc5,roughness:1});
 function ell(g,m,x,y,z,a,b,c){const o=new T.Mesh(new T.SphereGeometry(1,32,20),m);o.position.set(x,y,z);o.scale.set(a,b,c);o.castShadow=o.receiveShadow=true;g.add(o);return o}
 function tube(g,m,points,r){const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false),m);o.castShadow=true;g.add(o)}
 function clear(g){g.traverse(o=>{o.geometry?.dispose();if(o.material?.userData.customColor)o.material.dispose()});g.clear()}
 function set(v){const next=JSON.stringify(v);if(next===key)return;key=next;[hat,jewel,...feet].forEach(clear);primary.color.set(designColors[v.primary]||0x9eae91);trim.color.set(designColors[v.trim]||0x526e5c);
 if(v.hat==='beret'){const crown=ell(hat,primary,0,.278,-.024,.181,.068,.155);crown.rotation.z=.13;ell(hat,trim,0,.335,-.02,.012,.025,.012)}
 if(v.hat==='beanie'){ell(hat,primary,0,.267,-.016,.173,.11,.147);tube(hat,trim,[[-.15,.246,.018],[-.1,.247,.112],[0,.247,.142],[.1,.247,.112],[.15,.246,.018]],.016);ell(hat,trim,0,.372,-.016,.032,.033,.032)}
 if(v.shoes!=='none')feet.forEach(g=>{ell(g,primary,0,-.119,.041,.132,v.shoes==='boots'?.137:.107,.152);ell(g,sole,0,-.225,.043,.131,.025,.15);for(const y of [-.11,-.08])tube(g,trim,[[-.038,y,.17],[0,y-.004,.19],[.038,y,.17]],.004)});
 if(v.accessory==='bow'){for(const s of [-1,1]){const b=ell(jewel,trim,s*.038,.674,.245,.042,.026,.014);b.rotation.z=-s*.3}ell(jewel,primary,0,.674,.259,.013,.016,.01)}
 if(v.accessory==='brooch'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ell(jewel,trim,.125+Math.cos(a)*.019,.57+Math.sin(a)*.019,.287,.014,.014,.008)}ell(jewel,sole,.125,.57,.298,.01,.01,.006)}
 for(const [group,color] of [[hat,v.accessoryColors?.hat],[jewel,v.accessoryColors?.accessory],...feet.map(g=>[g,v.accessoryColors?.shoes])])if(color)group.traverse(o=>{if(o.material===primary||o.material===trim){o.material=o.material.clone();o.material.userData.customColor=true;o.material.color.set(color)}});
 hat.visible=!hidden;
 }
 return {set,hideHat(v){hidden=v;hat.visible=!v},sleep(v){feet.forEach(g=>g.visible=!v);hat.visible=!v&&!hidden}};
}
