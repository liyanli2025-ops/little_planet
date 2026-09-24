import * as T from './vendor/three.module.js';
export function createRainGear({body,head,arms}){
 const yellow=new T.MeshStandardMaterial({color:0xe8ba47,roughness:.46}),seam=new T.MeshStandardMaterial({color:0xb89032,roughness:.7}),green=new T.MeshStandardMaterial({color:0x376e5e,roughness:.5,side:T.DoubleSide}),greenAlt=green.clone();greenAlt.color.set(0x447e6a);
 const gear=new T.Group(),hood=new T.Group(),umbrella=new T.Group();body.add(gear,umbrella);head.add(hood);gear.visible=hood.visible=umbrella.visible=false;
 function mesh(g,m,p,x=0,y=0,z=0){let o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
 let coat=mesh(new T.CylinderGeometry(.33,.38,.60,40),yellow,gear,0,.43,0);coat.scale.z=.84;
 mesh(new T.BoxGeometry(.009,.34,.01),seam,gear,0,.42,.295);
 for(let y of [.27,.37,.47])mesh(new T.SphereGeometry(.013,10,8),seam,gear,.024,y+.05,.30);
 for(let x of [-.12,.12])mesh(new T.BoxGeometry(.071,.045,.018),yellow,gear,x,.36,.30);
 // The hood is open toward the face (+Z); the rim follows the opening.
 let shell=mesh(new T.SphereGeometry(.315,40,24,0,Math.PI*2,1.0,Math.PI-1.0),yellow,hood,0,.015,-.012);shell.rotation.x=Math.PI/2;shell.scale.y=1.02;
 let rim=mesh(new T.TorusGeometry(.268,.015,10,48),yellow,hood,0,.015,.17);rim.scale.y=1.05;
 const canopy=new T.Group();umbrella.add(canopy);canopy.position.y=.79;
 for(let sector=0;sector<8;sector++){let positions=[],indices=[];for(let j=0;j<=8;j++){let r=j/8*.55;for(let k=0;k<=6;k++){let a=(sector+k/6)*Math.PI/4;positions.push(Math.cos(a)*r,.23*(1-(r/.55)**2),Math.sin(a)*r)}}for(let j=0;j<8;j++)for(let k=0;k<6;k++){let i=j*7+k;indices.push(i,i+7,i+1,i+1,i+7,i+8)}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,sector%2?green:greenAlt,canopy);
 const pts=[];for(let j=0;j<=16;j++){let r=j/16*.55,a=sector*Math.PI/4;pts.push(new T.Vector3(Math.cos(a)*r,.233*(1-(r/.55)**2)+.004,Math.sin(a)*r))}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),20,.004,5,false),seam,canopy);}
 mesh(new T.CylinderGeometry(.011,.011,1.04,12),seam,umbrella,0,.5,0);mesh(new T.SphereGeometry(.018,10,8),seam,umbrella,0,1.03,0);
 let handle=mesh(new T.TorusGeometry(.041,.012,8,20,Math.PI),seam,umbrella,-.041,-.055,0);handle.rotation.z=Math.PI;
 const sleeves=arms.map((a,i)=>{let g=new T.Group();a.add(g);let sleeve=mesh(new T.SphereGeometry(1,28,20),yellow,g,(i?1:-1)*.025,-.135,0);sleeve.scale.set(.132,.205,.14);sleeve.rotation.z=(i?1:-1)*.13;g.visible=false;return g});let enabled=false;
 return {set(v){enabled=v;sleeves.forEach(s=>s.visible=v);gear.visible=hood.visible=v;if(!v)umbrella.visible=false},tick(t,hold=true,shared=false){umbrella.visible=enabled&&hold;if(!enabled||!hold)return;arms[1].rotation.set(-1.13,0,-.11);arms[1].updateMatrix();umbrella.position.copy(new T.Vector3(0,-.30,.02).applyMatrix4(arms[1].matrix));umbrella.rotation.z=Math.sin(t*1.2)*.018;canopy.scale.set(shared?1.42:1,1,shared?1.42:1)},state(){return {raincoat:enabled,umbrella:umbrella.visible}}};
}

