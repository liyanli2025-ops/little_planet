import * as T from './vendor/three.module.js';
import {outfits} from './outfits.js';
export function createClothing(body,arms){
 const root=new T.Group();body.add(root);let current='',parts=[];
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:1});
 function mesh(p,geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o}
 function ell(p,m,x,y,z,a,b,c){const o=mesh(p,new T.SphereGeometry(1,32,24),m,x,y,z);o.scale.set(a,b,c);return o}
 function tube(p,m,points,r){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),32,r,10,false),m)}
 function clear(){for(const g of [root,...parts]){g.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});if(g!==root)g.removeFromParent()}root.clear();parts=[]}
 function set(id){if(id===current)return;current=id;clear();const d=outfits[id];if(!d||id==='plain'||d.kind==='scarf')return;const cloth=mat(d.color),trim=mat(0xeee3cd);
 const profile=d.kind==='overalls'?[[.329,.245],[.35,.32],[.35,.46],[.347,.50]]:[[.329,.245],[.35,.32],[.35,.46],[.33,.57],[.297,.65],[.286,.685]];const geo=new T.LatheGeometry(new T.CatmullRomCurve3(profile.map(([r,y])=>new T.Vector3(r,y,0))).getPoints(48).map(v=>new T.Vector2(v.x,v.y)),56);geo.scale(1,1,.84);mesh(root,geo,cloth);
 for(const y of d.kind==='overalls'?[.26]:[.26,.67]){const ring=mesh(root,new T.TorusGeometry(y<.3?.335:.289,.012,10,56),trim,0,y,0);ring.rotation.x=Math.PI/2;ring.scale.y=.84}
 if(d.kind!=='overalls')for(const [i,arm]of arms.entries()){const g=new T.Group();arm.add(g);parts.push(g);ell(g,cloth,(i?1:-1)*-.012,-.095,.001,.111,.18,.12)}
 if(d.kind==='stripe')for(const y of [.32,.40,.48,.56]){const r=y>.5?.33:.352;const ring=mesh(root,new T.TorusGeometry(r,.015,8,56),trim,0,y,0);ring.rotation.x=Math.PI/2;ring.scale.y=.84}
 if(d.kind==='knit')for(let i=-3;i<=3;i++)tube(root,trim,[[i*.054,.31,.283-Math.abs(i)*.007],[i*.054+.006,.43,.299-Math.abs(i)*.007],[i*.05,.59,.269-Math.abs(i)*.007]],.003);
 if(d.kind==='cardigan'){tube(root,trim,[[0,.26,.289],[0,.45,.3],[0,.65,.26]],.013);for(const y of [.34,.43,.52,.61])ell(root,trim,.025,y,.303,.009,.009,.006)}
 if(d.kind==='hoodie'){ell(root,cloth,0,.65,-.218,.245,.115,.075);for(const x of [-.075,.075])tube(root,trim,[[x,.67,.25],[x,.54,.29]],.006);ell(root,cloth,0,.36,.285,.15,.06,.022)}
 if(d.kind==='overalls'){const bib=ell(root,cloth,0,.58,.26,.19,.10,.035);for(const side of [-1,1]){tube(root,trim,[[side*.17,.47,.288],[side*.19,.65,.235],[side*.21,.68,.03],[side*.17,.58,-.235]],.022);ell(root,trim,side*.16,.60,.29,.014,.014,.008)}ell(root,trim,0,.49,.295,.063,.039,.006)}
 }
 return {set,get id(){return current},dispose:clear};
}
