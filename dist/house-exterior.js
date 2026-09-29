import * as T from './vendor/three.module.js';
import {designColors} from './design-schema.js';

// Both facades share the established entry footprint, but have independent silhouettes.
export function createHouseExterior(parent){
 const owned=new Set();const roots=[],materials=[],geometries=new Map(),roofs=[],windows=[];let theme=0,night=false,weather='sun',roofColor='original';
 const material=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.87,...extra});materials.push(m);return m};
 const plaster=material(0xeee4ce),cream=material(0xf4ecd9),sage=material(0x718a76),wood=material(0x9a7451),dark=material(0x4d5147),stone=material(0xb4ad98),leaf=material(0x70865b),flower=material(0xd6a69d),brass=material(0xbca16a,{metalness:.35,roughness:.46});
 const glass=material(0x9daf9f,{emissive:0xffcb7c,emissiveIntensity:.04,roughness:.24,metalness:.12});windows.push(glass);
 const lit=material(0xe4c99a,{emissive:0xffc16d,emissiveIntensity:.1});windows.push(lit);
 const walnut=material(0x72563e),cedar=material(0xa58765),charcoal=material(0x404d48),linen=material(0xc4c4aa);
 const roofA=material(0x668675),roofB=material(0x455650);roofs.push(roofA,roofB);
 function group(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
 function mesh(p,geo,m,x=0,y=0,z=0){owned.add(geo);const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o}
 function box(p,m,x,y,z,w,h,d,r=.009){const key=[w,h,d,r].join('|');let geo=geometries.get(key);if(!geo){r=Math.min(r,w/3,h/3,d/3);const s=new T.Shape(),a=w/2,b=h/2;s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);geo=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:2,curveSegments:5});geo.translate(0,0,-d/2+r);geometries.set(key,geo)}return mesh(p,geo,m,x,y,z)}
 const sphere=new T.SphereGeometry(1,20,14);geometries.set('sphere',sphere);
 function ell(p,m,x,y,z,a,b,c){const o=mesh(p,sphere,m,x,y,z);o.scale.set(a,b,c);return o}
 function arch(p,m,x,y,z,w,h,d){const r=w/2,s=new T.Shape();s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.lineTo(-r,0);const geo=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:2,curveSegments:24});return mesh(p,geo,m,x,y,z)}
 function pane(p,x,y,z,w,h,frame=cream){box(p,frame,x,y,z,w+.065,h+.065,.048);box(p,glass,x,y,z+.027,w,h,.018);for(const side of [-1,1]){box(p,linen,x+side*(w/2-.037),y,z+.042,.054,h-.025,.009);box(p,frame,x+side*w/2,y,z+.052,.022,h+.03,.035)}box(p,frame,x,y-h/2,z+.065,w+.09,.026,.085);box(p,frame,x,y+h/2,z+.05,w+.05,.023,.033)}
 function planter(p,x,y,z,w=.45){box(p,sage,x,y,z,w,.105,.15,.02);box(p,wood,x,y+.052,z,w-.035,.007,.105);for(let i=0;i<5;i++){const xx=x+(i-2)*w/5;ell(p,leaf,xx,y+.1,z,.055,.056,.045);for(let j=0;j<4;j++){const a=j*Math.PI/2;ell(p,flower,xx+Math.cos(a)*.018,y+.14+Math.sin(a)*.018,z+.017,.019,.018,.014)}ell(p,cream,xx,y+.14,z+.03,.009,.01,.009)}}
 function lantern(p,x,y,z){box(p,dark,x,y,z,.09,.15,.08,.008);box(p,lit,x,y,z+.043,.061,.103,.017,.006);box(p,brass,x,y+.09,z,.12,.023,.105);box(p,brass,x,y-.09,z,.1,.017,.095)}
 function base(p,w,d,m){box(p,stone,0,.015,0,w,.12,d,.035);for(let i=0;i<12;i++)box(p,m,(i-5.5)*(w-.08)/12,.086,.0,(w-.1)/12-.009,.034,d-.05,.004);for(let i=0;i<3;i++)box(p,stone,-.35,.075-i*.037,.78+i*.12,.62,.075,.17,.014)}
 // Garden home: two storeys of plaster, an arched doorway and scalloped green tiles.
 const a=group(parent);a.name='garden-exterior';roots.push(a);base(a,1.76,1.43,wood);
 box(a,plaster,0,.81,-.045,1.51,1.43,1.16,.035);box(a,cream,0,.23,.55,1.55,.21,.11,.017);
 const tri=new T.Shape();tri.moveTo(-.77,0);tri.lineTo(.77,0);tri.lineTo(0,.58);tri.closePath();mesh(a,new T.ExtrudeGeometry(tri,{depth:1.2,bevelEnabled:true,bevelSize:.014,bevelThickness:.014,bevelSegments:2}),plaster,0,1.52,-.65);
 for(const s of [-1,1]){const slab=box(a,roofA,s*.43,1.82,-.04,1.08,.058,1.48,.012);slab.rotation.z=-s*.646;for(let row=0;row<5;row++)for(let col=0;col<9;col++){const x=s*(.09+row*.171),y=2.195-Math.abs(x)*.755;const tile=box(a,roofA,x,y,-.68+col*.16,.205,.025,.17,.01);tile.rotation.z=-s*.646;}const fascia=box(a,cream,s*.43,1.79,.72,1.10,.045,.055);fascia.rotation.z=-s*.646;}
 for(let i=0;i<10;i++)ell(a,roofA,0,2.202,-.73+i*.153,.054,.043,.09);
 box(a,stone,.49,1.91,-.31,.18,.65,.20,.017);for(let i=0;i<5;i++)box(a,cream,.49,1.64+i*.11,-.204,.185,.012,.009);box(a,cream,.49,2.26,-.31,.25,.055,.26,.018);
 arch(a,cream,-.35,.105,.55,.49,.96,.075);arch(a,sage,-.35,.115,.631,.386,.854,.024);for(let i=0;i<4;i++)box(a,wood,-.477+i*.083,.43,.662,.009,.57,.008,.002);ell(a,brass,-.225,.54,.684,.019,.019,.016);
 arch(a,cream,.34,.72,.558,.5,.66,.065);arch(a,glass,.34,.752,.628,.405,.555,.012);box(a,cream,.34,1.02,.654,.021,.52,.027);box(a,cream,.34,.99,.655,.40,.022,.025);planter(a,.34,.685,.69,.55);
 for(const x of [.19,.49])box(a,linen,x,.96,.647,.065,.35,.016,.006);
 arch(a,cream,0,1.50,.579,.36,.43,.07);arch(a,glass,0,1.527,.653,.285,.345,.015);box(a,cream,0,1.69,.68,.018,.31,.024);box(a,cream,0,1.66,.68,.29,.017,.023);
 const porch=box(a,roofA,-.35,1.21,.84,.76,.055,.53,.016);porch.rotation.x=.15;for(const x of [-.70,0]){box(a,cream,x,.65,1.035,.04,1.1,.04);box(a,cream,x,.15,1.035,.075,.11,.075)}lantern(a,-.68,.99,.69);
 for(const side of [-1,1]){const wing=group(a,side*.766,0,-.01);wing.rotation.y=side*Math.PI/2;pane(wing,0,.73,.01,.53,.52);pane(wing,0,1.30,.01,.48,.26);planter(wing,0,.42,.1,.58)}
 const back=group(a,0,0,-.637);back.rotation.y=Math.PI;pane(back,0,.87,.01,.62,.62);pane(back,0,1.63,.01,.27,.28);for(const x of [-.59,.59]){box(a,cream,x,.82,-.66,.045,1.42,.04)}
 // Study home: cedar cladding, broad corner windows and a quiet asymmetric metal roof.
 const b=group(parent);b.name='study-exterior';roots.push(b);base(b,1.78,1.43,walnut);
 box(b,walnut,0,.81,-.035,1.54,1.44,1.17,.018);for(let i=0;i<17;i++){const x=-.72+i*.09;box(b,cedar,x,.83,.563,.069,1.4,.035,.004);box(b,cedar,x,.83,-.635,.069,1.4,.024,.004)}
 for(const side of [-1,1])for(let i=0;i<13;i++)box(b,cedar,side*.781,.83,-.58+i*.09,.024,1.4,.069,.004);
 box(b,charcoal,0,1.035,.587,1.59,.095,.082);box(b,charcoal,0,.20,.596,1.59,.15,.07);for(const x of [-.77,.77])box(b,charcoal,x,.86,.60,.045,1.40,.08);
 box(b,charcoal,-.47,.60,.604,.40,.80,.08);box(b,walnut,-.47,.59,.651,.32,.70,.026);box(b,glass,-.47,.76,.67,.22,.22,.011);box(b,brass,-.365,.53,.683,.017,.12,.022,.005);
 pane(b,.27,.67,.611,.76,.53,charcoal);box(b,charcoal,.27,.67,.67,.026,.53,.025);
 pane(b,0,1.30,.611,1.35,.33,charcoal);for(const x of [-.38,.38])box(b,charcoal,x,1.3,.666,.021,.34,.027);
 box(b,walnut,0,1.157,.675,1.27,.016,.034);for(let i=0;i<5;i++){const book=box(b,i%2?sage:wood,-.48+i*.039,1.19+(i%3)*.008,.681,.027,.06+(i%3)*.016,.018,.002);book.rotation.z=i===4?-.17:0}box(b,brass,.42,1.21,.68,.01,.10,.014,.002);ell(b,linen,.42,1.266,.687,.049,.026,.024);
 for(const side of [-1,1]){const wing=group(b,side*.802,0,-.04);wing.rotation.y=side*Math.PI/2;pane(wing,0,.67,.001,.83,.53,charcoal);pane(wing,0,1.3,.001,.86,.33,charcoal);box(wing,charcoal,0,.68,.054,.025,.52,.032)}
 const rear=group(b,0,0,-.65);rear.rotation.y=Math.PI;pane(rear,-.26,1.3,.01,.76,.33,charcoal);pane(rear,.28,.67,.01,.52,.51,charcoal);
 const slope=.14,roof=box(b,roofB,0,1.637,-.04,1.84,.086,1.48,.014);roof.rotation.z=slope;for(let i=0;i<11;i++){const x=-.84+i*.168;const seam=box(b,roofB,x,1.691+x*Math.tan(slope),-.04,.012,.02,1.48,.004);seam.rotation.z=slope}for(const z of [-.80,.72]){const edge=box(b,charcoal,0,1.623,z,1.87,.07,.035);edge.rotation.z=slope}
 // Fill under the mono-pitch roof, avoiding an open triangular gap at either end.
 const wedge=new T.Shape();wedge.moveTo(-.78,0);wedge.lineTo(.78,0);wedge.lineTo(.78,.23);wedge.lineTo(-.78,.01);wedge.closePath();mesh(b,new T.ExtrudeGeometry(wedge,{depth:1.18,bevelEnabled:false}),walnut,0,1.45,-.63);
 const awning=box(b,charcoal,-.42,1.055,.87,.71,.042,.5,.008);box(b,walnut,-.75,.60,1.05,.04,.90,.04);lantern(b,-.735,.84,.697);
 box(b,walnut,.32,.26,.80,.65,.075,.19);for(const x of [.06,.57])box(b,charcoal,x,.17,.80,.035,.18,.14);
 box(b,stone,.68,.26,.96,.19,.28,.19,.028);for(let i=0;i<6;i++){const ang=i*Math.PI/3;ell(b,leaf,.68+Math.cos(ang)*.055,.48+(i%2)*.035,.96+Math.sin(ang)*.055,.045,.11,.035)}
 // Bake each facade independently: selecting styles never recolors unrelated scenery.
 function batch(root){root.updateMatrixWorld(true);const inv=root.matrixWorld.clone().invert(),by=new Map(),old=[];root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inv.clone().multiply(o.matrixWorld));const list=by.get(o.material)||[];list.push(g);by.set(o.material,list);old.push(o)});old.forEach(o=>o.removeFromParent());for(const [m,list]of by){const geo=new T.BufferGeometry();for(const name of ['position','normal']){const arr=new Float32Array(list.reduce((n,g)=>n+g.attributes[name].array.length,0));let offset=0;for(const g of list){arr.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length}geo.setAttribute(name,new T.BufferAttribute(arr,3))}geo.computeBoundingSphere();mesh(root,geo,m);list.forEach(g=>g.dispose())}}
 roots.forEach(batch);
 function lighting(n,w){night=n;weather=w;glass.color.set(n?0xe0b67f:w==='rain'?0x90a7a0:0x9daf9f);glass.emissiveIntensity=n?.7:.045;lit.emissiveIntensity=n?1.4:.12;roofs.forEach((m,i)=>{m.color.set(w==='snow'?0xe2e5d9:designColors[roofColor]||(i?0x455650:0x668675));m.roughness=w==='rain'?.48:.87})}
 function select(i,color='original'){theme=i===1?1:0;roots.forEach((g,j)=>g.visible=j===theme);roofColor=color;lighting(night,weather)}select(0);
 return {select,lighting,roots,state:()=>({style:theme?'study':'garden',night,weather,drawCalls:roots[theme].children.filter(o=>o.isMesh).length}),dispose(){const gs=new Set([...geometries.values(),...owned]);parent.traverse(o=>{if(o.geometry)gs.add(o.geometry)});gs.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}};
}
