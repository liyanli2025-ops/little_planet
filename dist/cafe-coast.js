import * as T from './vendor/three.module.js';

// Exterior details share the cafe's deck height and doorway; no separate scene.
export function buildCoast({root,roof,furniture,pick,box,cyl,ell,rounded,tube,timber,lamps}){
 const coast=new T.Group(),awning=new T.Group();root.add(coast);coast.add(awning);const wood=0x806044,brass=0xbca47c;
 // Rounded timber balcony, connected to the entrance on its left side.
 rounded(coast,0x584633,3.65,.02,6.0,7.1,.25,3.0,.8);
 rounded(coast,timber,3.65,.18,6.0,7.1,.08,3.0,.8);
 pick(box(coast,new T.MeshBasicMaterial({visible:false}),3.65,.25,6.0,6.8,.01,2.8),'ground');
 for(const [x,z]of [[.45,7.1],[1.75,7.36],[3.1,7.4],[4.5,7.4],[5.9,7.4],[6.85,7.08],[7.1,5.6]]){
  cyl(coast,wood,x,.76,z,.045,1.02);cyl(coast,0x55483a,x,-.3,z,.08,.90);
 }
 const edge=[[.45,1.25,7.1],[1.75,1.25,7.36],[3.1,1.25,7.4],[4.5,1.25,7.4],[5.9,1.25,7.4],[6.85,1.25,7.08],[7.1,1.25,5.6]];
 tube(coast,wood,edge,.045);for(const y of [.53,.82])tube(coast,0xc2ad85,edge.map(([x,_,z])=>[x,y,z]),.018);
 // Low counters allow the same supported sitting pose as indoor armchairs.
 for(const [x,z,w]of [[4.2,6.82,4.65]]){
  rounded(furniture,0xa17c53,x,1.01,z,w,.09,.44,.16);
  for(const side of [-1,1]){box(furniture,wood,x+side*(w/2-.18),.61,z,.075,.73,.26);}
  tube(furniture,brass,[[x-w/2+.15,.42,z-.15],[x+w/2-.15,.42,z-.15]],.022);
  for(const dx of [-w/3,0,w/3]){cyl(furniture,0xe5d5af,x+dx,1.105,z,.073,.13);cyl(furniture,0x76563a,x+dx,1.174,z,.057,.005);}
 }
 // Curved window counter follows the opposite bay, looking away from the terrace.
 const curve=new T.CatmullRomCurve3([new T.Vector3(-6.58,1.01,-.05),new T.Vector3(-6.53,1.01,.85),new T.Vector3(-6.26,1.01,2),new T.Vector3(-5.62,1.01,3.3)]);
 const verts=[],ix=[];for(let i=0;i<=64;i++){const p=curve.getPoint(i/64),t=curve.getTangent(i/64),n=new T.Vector3(-t.z,0,t.x).normalize();for(const y of [-.045,.045])for(const side of [-1,1]){const v=p.clone().addScaledVector(n,side*.23);verts.push(v.x,v.y+y,v.z)}if(i<64){const k=i*4;ix.push(k+2,k+6,k+3,k+3,k+6,k+7,k,k+1,k+4,k+1,k+5,k+4,k,k+4,k+2,k+2,k+4,k+6,k+1,k+3,k+5,k+3,k+7,k+5)}}const cg=new T.BufferGeometry();cg.setAttribute('position',new T.Float32BufferAttribute(verts,3));cg.setIndex(ix);cg.computeVertexNormals();const counter=new T.Mesh(cg,new T.MeshStandardMaterial({color:0xa17c53,roughness:.65,side:T.DoubleSide}));counter.castShadow=counter.receiveShadow=true;furniture.add(counter);
 for(const t of [.05,.45,.92]){const p=curve.getPoint(t);cyl(furniture,wood,p.x,.61,p.z,.045,.73);cyl(furniture,0xe5d5af,p.x,1.12,p.z,.07,.13);cyl(furniture,0x76563a,p.x,1.187,p.z,.056,.006)}
 // Slatted pergola shelters the rear of the balcony without blocking the sea.
 for(const [x,z]of [[1.5,4.85],[6.85,4.85],[1.5,6.95],[6.85,6.95]])cyl(coast,wood,x,1.75,z,.052,3.03);
 for(const z of [4.85,6.95])rounded(awning,wood,4.18,3.31,z,5.65,.13,.12,.045);
 for(let i=0;i<13;i++)box(awning,0xae926b,1.6+i*.435,3.39,5.73,.075,.08,1.8);
 const wire=[];for(let i=0;i<=16;i++){const x=1.5+i*.334,y=3.15-Math.sin(i/16*Math.PI)*.17;wire.push([x,y,6.94]);if(i%2===0){const bulb=ell(awning,new T.MeshStandardMaterial({color:0xffdc9c,emissive:0xffc17b,emissiveIntensity:.6}),x,y-.04,6.94,.025,.04,.025);lamps.push(bulb)}}tube(awning,wood,wire,.009);
 // Planter boxes sit beyond the clear circulation aisle.
 for(const [x,z]of [[.8,7],[6.9,5.1]]){rounded(coast,0x9b7855,x,.47,z,.65,.47,.48,.075);for(let i=0;i<7;i++){const a=i*.9;const leaf=ell(coast,0x84946b,x+Math.sin(a)*.18,.88+(i%2)*.1,z+Math.cos(a)*.12,.10,.31,.065);leaf.rotation.z=Math.sin(a)*.45;ell(coast,0xe1d1b4,x+Math.sin(a)*.18,1.17,z+Math.cos(a)*.12,.055,.04,.05)}}
 // Standing-seam roof lines follow the rounded roof instead of a flat blank lid.
 for(let x=-5.8;x<6;x+=.55){const zExtent=3.5-Math.max(0,Math.abs(x)-4)*.5;const points=[];for(let z=-zExtent;z<=zExtent;z+=.2){if(Math.pow((x-.3)/2.2,2)+Math.pow((z-.1)/1.4,2)<1.05){if(points.length>1)tube(roof,0x798778,points.splice(0),.012);continue}points.push([x,3.99,z])}if(points.length>1)tube(roof,0x798778,points,.012)}
 // Sandy cove, rocks, a modest jetty and a striped beach umbrella.
 for(let i=0;i<12;i++){const a=2.5+i*.12,x=Math.cos(a)*9,z=Math.sin(a)*7.5;const rock=ell(coast,i%2?0xb1ad98:0x9da797,x,-.05,z,.32+(i%3)*.1,.25,.35);rock.rotation.y=a;}
 for(let i=0;i<16;i++)box(coast,i%2?0xb79e77:0xc2aa83,-3.4,-.02,6.8+i*.19,1.4,.07,.175);
 for(const x of [-4,-2.8])for(const z of [7.2,8.3,9.4]){cyl(coast,wood,x,-.38,z,.055,.9);cyl(coast,0xd2c29c,x,.10,z,.075,.07);}
 const parasol=new T.Group();parasol.position.set(-6.5,.05,5.25);coast.add(parasol);cyl(parasol,wood,0,.85,0,.025,1.7);
 for(let i=0;i<10;i++){const geo=new T.ConeGeometry(1,.37,1,1,true,i*Math.PI/5,Math.PI/5);const m=new T.Mesh(geo,new T.MeshStandardMaterial({color:i%2?0xe7d9b9:0x94a797,side:T.DoubleSide,roughness:1}));m.position.y=1.66;m.castShadow=true;parasol.add(m)}
 const towel=box(coast,0xe2c19f,-6.4,.10,5.8,.8,.016,1.5);towel.rotation.y=-.35;
 for(const x of [-.9,.9]){cyl(coast,wood,x,.25,6.55,.065,.6);const light=ell(coast,new T.MeshStandardMaterial({color:0xffdfab,emissive:0xffc88c,emissiveIntensity:.6}),x,.63,6.55,.09,.13,.09);lamps.push(light)}
 // Boats and foam are tangent to the spherical sea, visible in the planet view.
 const planet=new T.Group();root.add(planet);const radius=17.83;
 function surface(x,z){const y=Math.sqrt(radius*radius-x*x-z*z),g=new T.Group();g.position.set(x,y-18.25,z);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(x,y,z).normalize());planet.add(g);return g}
 for(const [x,z,angle]of [[-11,12,.3],[14,-8,-.7]]){const boat=surface(x,z);boat.rotation.y+=angle;ell(boat,0xe0d2ae,0,.12,0,.35,.19,.80);ell(boat,0x776047,0,.24,0,.25,.03,.61);cyl(boat,wood,0,.95,0,.023,1.5);const sailShape=new T.Shape();sailShape.moveTo(.02,.1);sailShape.lineTo(.02,1.5);sailShape.lineTo(.78,.2);sailShape.closePath();const sail=new T.Mesh(new T.ShapeGeometry(sailShape),new T.MeshStandardMaterial({color:0xf1dfb9,side:T.DoubleSide,roughness:1}));sail.position.y=.3;boat.add(sail)}
 for(let i=0;i<52;i++){const a=i*2.399,r=11+(i%5)*1.05,x=Math.sin(a)*r,z=Math.cos(a)*r,g=surface(x,z);const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-.24,.015,0),new T.Vector3(0,.025,-.03),new T.Vector3(.24,.015,0)]),new T.LineBasicMaterial({color:0xd4eee0,transparent:true,opacity:.35}));g.add(line)}
 const foam=[];
 for(let i=0;i<170;i++){const y=1-2*(i+.5)/170,a=i*2.399963,r=Math.sqrt(1-y*y),normal=new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);if(y>.82)continue;const tangent=new T.Vector3().crossVectors(normal,new T.Vector3(0,1,0)).normalize(),across=new T.Vector3().crossVectors(normal,tangent);const point=t=>normal.clone().multiplyScalar(radius).addScaledVector(tangent,t).addScaledVector(across,Math.sin(t*5)*.035).normalize().multiplyScalar(radius+.025).add(new T.Vector3(0,-18.25,0));for(let j=0;j<4;j++){const a=point(-.3+j*.15),b=point(-.15+j*.15);foam.push(a.x,a.y,a.z,b.x,b.y,b.z)}}
 const foamGeometry=new T.BufferGeometry();foamGeometry.setAttribute('position',new T.Float32BufferAttribute(foam,3));planet.add(new T.LineSegments(foamGeometry,new T.LineBasicMaterial({color:0xd4eee0,transparent:true,opacity:.28})));
 return {planet,coast,awning};
}
