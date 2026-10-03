import {clothSurface} from './cloth-surface.js';
import * as T from './vendor/three.module.js';
import {designColors,defaultDesign} from './design-schema.js';
import {outfits} from './outfits.js';
export function createClothing(body,arms,legs=[]){
 const root=new T.Group();body.add(root);let current='',parts=[],design=defaultDesign().outfit;
 let weave=null;if(typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#999';ctx.fillRect(0,0,128,128);for(let y=0;y<128;y+=8)for(let x=0;x<128;x+=6){ctx.strokeStyle='#b5b5b5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3,y+5);ctx.lineTo(x+6,y);ctx.stroke()}weave=new T.CanvasTexture(canvas);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(3,3)}
 const mat=c=>new T.MeshPhysicalMaterial({color:c,roughness:.96,sheen:.5,sheenRoughness:.88,sheenColor:0xe5d8c5,bumpMap:weave,bumpScale:.00065});
 function mesh(p,geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o}
 function ell(p,m,x,y,z,a,b,c){const o=mesh(p,new T.SphereGeometry(1,32,24),m,x,y,z);o.scale.set(a,b,c);return o}
 function tube(p,m,points,r){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),32,r,10,false),m)}
 function clear(){for(const g of [root,...parts]){g.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});if(g!==root)g.removeFromParent()}root.clear();parts=[]}
 function set(id){if(id===current)return;current=id;clear();const d=outfits[id];if(!d||id==='plain'||d.kind==='scarf')return;const cloth=mat(designColors[design.primary]||d.color),trim=mat(designColors[design.trim]||0xeee3cd);
 const profile=d.kind==='overalls'?[[.329,.245],[.35,.32],[.35,.46],[.347,.50]]:[[.329,.245],[.35,.32],[.35,.46],[.33,.57],[.297,.65],[.286,.685]];const geo=new T.LatheGeometry(new T.CatmullRomCurve3(profile.map(([r,y])=>new T.Vector3(r,y,0))).getPoints(48).map(v=>new T.Vector2(v.x,v.y)),56);geo.scale(1,1,.84);if(d.kind!=='overalls')mesh(root,geo,cloth);else{geo.dispose();cloth.side=T.DoubleSide;const shell=clothSurface((u,v)=>{const a=u*Math.PI*2,c=Math.cos(a),front=T.MathUtils.smoothstep(c,.70,.89),back=T.MathUtils.smoothstep(-c,.7,.92),top=.425+.24*front+.13*back,y=.245+(top-.245)*v,r=y>.5?.35-(y-.5)*.30:.35;return [Math.sin(a)*r,y,Math.cos(a)*r*.86]});mesh(root,shell,cloth);}
 for(const y of d.kind==='overalls'?[]:[.26,.67]){const ring=mesh(root,new T.TorusGeometry(y<.3?.335:.289,.012,10,56),trim,0,y,0);ring.rotation.x=Math.PI/2;ring.scale.y=.84}
 if(d.kind!=='overalls')for(const [i,arm]of arms.entries()){const g=new T.Group();arm.add(g);parts.push(g);const profile=[new T.Vector2(.111,-.23),new T.Vector2(.115,-.17),new T.Vector2(.109,-.08),new T.Vector2(.09,.005),new T.Vector2(.059,.067)];const geo=new T.LatheGeometry(profile,40),a=geo.attributes.position;for(let j=0;j<a.count;j++){const u=T.MathUtils.smoothstep(a.getY(j),-.24,.096);a.setX(j,a.getX(j)+(i?1:-1)*(.035-.10*u));a.setZ(j,a.getZ(j)*1.08)}geo.computeVertexNormals();mesh(g,geo,cloth);const cuff=mesh(g,new T.TorusGeometry(.111,.007,10,40),cloth,(i?1:-1)*.034,-.23,0);cuff.rotation.x=Math.PI/2;cuff.scale.y=1.08}
 if(d.kind==='stripe')for(const y of [.32,.40,.48,.56]){const r=y>.5?.33:.352;const ring=mesh(root,new T.TorusGeometry(r,.015,8,56),trim,0,y,0);ring.rotation.x=Math.PI/2;ring.scale.y=.84}
 if(d.kind==='knit')for(let i=-3;i<=3;i++)tube(root,trim,[[i*.054,.31,.283-Math.abs(i)*.007],[i*.054+.006,.43,.299-Math.abs(i)*.007],[i*.05,.59,.269-Math.abs(i)*.007]],.003);
 if(d.kind==='cardigan'){for(const side of [-1,1]){ell(root,cloth,side*.15,.35,.27,.065,.047,.016);tube(root,trim,[[side*.15-.05,.387,.28],[side*.15,.391,.293],[side*.15+.05,.387,.28]],.002)}tube(root,trim,[[0,.26,.289],[0,.45,.3],[0,.65,.26]],.013);for(const y of [.34,.43,.52,.61])ell(root,trim,.025,y,.303,.009,.009,.006)}
 if(d.kind==='hoodie'){ell(root,cloth,0,.65,-.218,.245,.115,.075);for(const x of [-.075,.075])tube(root,trim,[[x,.67,.25],[x,.54,.29]],.006);ell(root,cloth,0,.36,.285,.15,.06,.022)}
 if(d.kind==='overalls'){
  // Separate trouser legs follow the bear's leg pivots, including seated poses.
  for(const leg of legs){const g=new T.Group();g.name='overall-trouser-leg';leg.add(g);parts.push(g);
   const profile=[new T.Vector2(.126,-.175),new T.Vector2(.139,-.10),new T.Vector2(.144,-.015),new T.Vector2(.137,.075)];
   const trouser=mesh(g,new T.LatheGeometry(profile,40),cloth,0,0,.02);trouser.scale.z=1.13;
   const cuff=mesh(g,new T.TorusGeometry(.126,.008,8,40),trim,0,-.175,.02);cuff.rotation.x=Math.PI/2;cuff.scale.y=1.13;
  }
 for(const side of [-1,1]){
  const path=new T.CatmullRomCurve3([new T.Vector3(side*.13,.637,.262),new T.Vector3(side*.24,.735,.16),new T.Vector3(side*.305,.745,0),new T.Vector3(side*.24,.70,-.18),new T.Vector3(side*.13,.55,-.26)]);const strap=clothSurface((u,v)=>{const p=path.getPoint(v);return [p.x+(u-.5)*.037,p.y,p.z]},8,48);mesh(root,strap,cloth);
  ell(root,trim,side*.13,.63,.255,.009,.009,.004);
 }
 const pocket=new T.Shape();pocket.moveTo(-.078,.585);pocket.lineTo(.078,.585);pocket.lineTo(.074,.514);pocket.quadraticCurveTo(0,.475,-.074,.514);pocket.closePath();const pg=new T.ExtrudeGeometry(pocket,{depth:.004,bevelEnabled:true,bevelSize:.003,bevelThickness:.002,bevelSegments:3,curveSegments:16});const pos=pg.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),r=y>.5?.35-(y-.5)*.34:.35;pos.setZ(i,pos.getZ(i)+Math.sqrt(r*r-x*x)*.86+.004)}pg.computeVertexNormals();mesh(root,pg,cloth);
 tube(root,trim,[[-.073,.582,.282],[0,.582,.289],[.073,.582,.282]],.0015);
 }

 if(design.motif!=='none'){const g=new T.Group();root.add(g);g.position.set(0,.55,.30);const ink=trim; if(design.motif==='flower'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ell(g,ink,Math.sin(a)*.026,Math.cos(a)*.026,0,.016,.020,.006)}ell(g,cloth,0,0,.007,.012,.012,.005)}else{const shape=new T.Shape();if(design.motif==='star'){for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2?.018:.040;const x=Math.sin(a)*rr,y=Math.cos(a)*rr;i?shape.lineTo(x,y):shape.moveTo(x,y)}shape.closePath()}else{shape.moveTo(0,-.035);shape.bezierCurveTo(-.07,.005,-.035,.065,0,.025);shape.bezierCurveTo(.035,.065,.07,.005,0,-.035)}mesh(g,new T.ShapeGeometry(shape,24),ink)}}
 }
 return {set,design(v){const next=v||defaultDesign().outfit;if(JSON.stringify(next)===JSON.stringify(design))return;design=next;const id=current;current='';set(id)},get id(){return current},dispose(){clear();weave?.dispose()}};
}
