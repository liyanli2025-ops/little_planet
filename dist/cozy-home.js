import * as T from './vendor/three.module.js';
// Two original dollhouse interiors. Keep interaction footprints and paths stable.
export function createCozyHome({indoor,upper,sofa,cooker,desk,record,table,bookcase,fridge}){
 const palettes=[{wood:0xc59b70,trim:0xf5e9d3,wall:0xf2e7d5,accent:0x8da990,fabric:0xe2b7a2,metal:0xb58a49},{wood:0x78573e,trim:0xa77c50,wall:0xd7c3a0,accent:0x46675e,fabric:0xb7774f,metal:0xb68b50}];
 const materialCache=new Map(),geomCache=new Map();const mats=c=>{if(!materialCache.has(c))materialCache.set(c,new T.MeshStandardMaterial({color:c,roughness:.83}));return materialCache.get(c)};
 function roundGeo(w,h,d,r=Math.min(w,h,d)*.12){const key=[w,h,d,r].join();if(geomCache.has(key))return geomCache.get(key);r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);if(r<=0)return new T.BoxGeometry(w,h,d);const x=-w/2+r,y=-h/2+r,W=w-2*r,H=h-2*r,s=new T.Shape();s.moveTo(x,y);s.lineTo(x+W,y);s.lineTo(x+W,y+H);s.lineTo(x,y+H);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:8});g.translate(0,0,-d/2+r);geomCache.set(key,g);return g}
 function mesh(p,g,c,x=0,y=0,z=0){const o=new T.Mesh(g,typeof c==='number'?mats(c):c);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o}
 function box(p,c,x,y,z,w,h,d,r){return mesh(p,roundGeo(w,h,d,r),c,x,y,z)}
 function ell(p,c,x,y,z,a,b,d){const m=mesh(p,new T.SphereGeometry(1,24,16),c,x,y,z);m.scale.set(a,b,d);return m}
 function cyl(p,c,x,y,z,a,b,h){return mesh(p,new T.CylinderGeometry(a,b,h,32),c,x,y,z)}
 function tube(p,c,points,r=.012){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),24,r,8,false),c)}
 upper.traverse(o=>{if(o.isPointLight)o.visible=false;});
 const original=[];indoor.traverse(o=>{if(!o.isMesh)return;const c=o.material.color?.getHex();if(c===undefined)return;original.push([o,c]);o.material=o.material.clone();if(o.geometry.type==='BoxGeometry'){const {width,height,depth}=o.geometry.parameters;o.geometry=roundGeo(width,height,depth)}});
 // Replace slab cushions with softly filled, piped upholstery.
 upper.children.filter(g=>Math.abs(g.position.x-.1)<.001).forEach(g=>g.children.filter(o=>o.position.y>=.7).forEach(o=>o.visible=false));
 desk.children.filter(o=>o.position.x===.37).forEach(o=>o.visible=false);
 const cushions=sofa.children.filter(o=>o.position.x===.1||o.position.x===.15);cushions.forEach(o=>o.visible=false);
 const themes=[],lights=[],sunPatches=[],windows=[];
 function plant(p,x,y,z,scale=1,flower=false){const g=new T.Group();p.add(g);g.position.set(x,y,z);g.scale.setScalar(scale);cyl(g,0xb88561,0,.085,0,.105,.075,.17);cyl(g,0x574a36,0,.17,0,.09,.09,.01);for(let i=0;i<5;i++){const a=i*2.4;const px=Math.cos(a)*.12,pz=Math.sin(a)*.1;const leaf=ell(g,i%2?0x76936b:0x526f54,px,.26+i*.022,pz,.055,.14,.022);leaf.rotation.set(.3, a,.6*Math.cos(a));if(flower)for(let j=0;j<5;j++){const b=j*1.256;ell(g,0xebceaa,px+Math.cos(b)*.035,.4+i*.022,pz+Math.sin(b)*.035,.028,.017,.028)}}}
 function frame(p,c,x,y,z,w,h,botanical){box(p,c.wood,x,y,z,w,h,.055);box(p,0xf2e6ce,x,y,z+.035,w-.08,h-.08,.016);if(botanical){tube(p,0x728563,[[x,y-h*.32,z+.05],[x-.04,y,z+.05],[x+.03,y+h*.30,z+.05]],.006);for(let i=0;i<4;i++){const s=i%2?1:-1,m=ell(p,0x83906b,x+s*.045,y-h*.2+i*h*.12,z+.055,.045,.075,.007);m.rotation.z=s*.7}}else{for(let i=0;i<3;i++){let o=box(p,[0x82928b,0xacb6a0,0xc8a975][i],x+(i-1)*w*.19,y+(i-1)*h*.12,z+.06,w*.20,h*.24,.012);o.rotation.z=.2}}}
 function lamp(p,c,x,y,z,style=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);cyl(g,c.metal,0,.025,0,.13,.16,.05);cyl(g,c.metal,0,.19,0,.018,.018,.34);const shade=new T.MeshStandardMaterial({color:style?0xd8af70:0xffe4b9,roughness:1,emissive:0xffc16a,emissiveIntensity:.25,side:T.DoubleSide});mesh(g,new T.CylinderGeometry(style?.14:.10,.23,.25,32,1,true),shade,0,.4,0);ell(g,0xffe7ba,0,.37,0,.045,.06,.045);const light=new T.PointLight(0xffc888,1.5,3.1,2);light.position.set(x,y+.37,z);p.add(light);lights.push(light)}
 function window(p,c,cx,cy,z,style){const g=new T.Group();p.add(g);g.position.set(cx,cy,z);box(g,c.trim,0,0,0,1.68,1.42,.12);const glass=new T.MeshStandardMaterial({color:0xcce1d8,emissive:0xb4d4ce,emissiveIntensity:.4,roughness:.35});box(g,glass,0,0,.075,1.49,1.23,.03);windows.push(glass);box(g,c.trim,0,0,.11,.055,1.27,.06);box(g,c.trim,0,0,.11,1.51,.055,.06);box(g,c.wood,0,-.76,.16,1.92,.09,.35);cyl(g,c.metal,0,.83,.16,.018,.018,2.08).rotation.z=Math.PI/2;
 for(const side of [-1,1]){if(style===0){for(let j=0;j<5;j++){const x=side*(.81+j*.047);cyl(g,j%2?0xe7cbb3:0xf3dec5,x,-.02,.14,.045,.045,1.54)}box(g,0x9bac91,side*.9,-.2,.22,.28,.045,.06)}else{box(g,0x49685e,side*.91,0,.1,.25,1.52,.12);for(let j=0;j<7;j++)box(g,c.wood,side*.91,-.56+j*.18,.18,.24,.035,.08)}}plant(g,-.5,-.73,.18,.65,true);
 }
 for(let theme=0;theme<2;theme++){const c=palettes[theme],low=new T.Group(),high=new T.Group();low.userData.floor=0;indoor.add(low);upper.add(high);themes.push([low,high]);
 // Wainscot and picture rails give the rooms a designed architectural envelope.
 for(const [g,width,back,side] of [[low,5.65,-2.09,-2.76],[high,5.65,-2.09,-2.76]]){
 box(g,theme?c.accent:0xd8decb,0,.37,back,width,.68,.06);box(g,c.trim,0,.73,back+.03,width,.055,.075);box(g,c.trim,0,.11,back+.03,width,.12,.08);
 for(let i=0;i<18;i++)box(g,theme?c.wood:c.trim,-2.65+i*.31,.38,back+.04,.023,.56,.026);
 box(g,theme?c.accent:0xd8decb,side,.37,0,.06,.68,4.3);box(g,c.trim,side+.03,.73,0,.075,.055,4.3);box(g,c.trim,side+.03,.11,0,.08,.12,4.3);
 for(let i=0;i<14;i++)box(g,theme?c.wood:c.trim,side+.04,.38,-2+i*.30,.026,.56,.023);
 box(g,c.trim,0,g===high?2.015:2.34,back,5.7,.09,.1);
 }
 // Alternative floor detailing: pale cottage boards / dark parquet inlay.
 if(theme)for(let row=0;row<10;row++)for(let col=0;col<7;col++){const tile=box(low,(row+col)%2?0x9b7753:0xa7835c,-2.38+col*.78,.024,-1.89+row*.42,.74,.012,.39);}
 window(low,c,-.5,1.49,-1.97,theme);window(high,c,-.5,1.28,-1.97,theme);
 const stairDetail=new T.Group();stairDetail.userData.action='stairs';low.add(stairDetail);for(let i=0;i<15;i++){const h=(i+1)*2.7/15,z=1.65-i*.23;box(stairDetail,c.wood,3.25,h+.007,z,.92,.025,.245);if(i%3===0)ell(stairDetail,c.metal,3.68,h+.70,z,.037,.037,.037)}tube(stairDetail,c.wood,[[3.68,.93,1.65],[3.68,3.45,-1.57]],.035);
 // Rugs differ in shape, edging and motifs.
 const rug=theme?box(low,0x8d5e45,.15,.074,.61,2.38,.025,1.89):cyl(low,0xe3c5ad,.15,.076,.61,1.18,1.18,.025);if(!theme)rug.scale.z=.82;
 if(theme){for(const x of [-.98,1.28])box(low,0xd9b984,x,.091,.61,.045,.005,1.73);for(const z of [-.22,1.44])box(low,0xd9b984,.15,.091,z,2.21,.005,.045);for(let i=0;i<10;i++)for(const z of [-.36,1.58])box(low,0xd8c09b,-.9+i*.23,.084,z,.015,.008,.13)}else{const ring=mesh(low,new T.TorusGeometry(1.04,.012,6,64),0xf7dfc3,.15,.094,.61);ring.rotation.x=Math.PI/2;ring.scale.y=.82;}
 // Plump cushions and contrasting throw; these are placed in the existing sofa footprint.
 const upholstery=new T.Group();upholstery.userData.action='sit';sofa.add(upholstery);themes[theme].push(upholstery);for(const z of [-.37,.31]){box(upholstery,theme?0xa36c49:0xc6d1b1,.07,.64,z,.82,.25,.61,.105);const p=box(upholstery,theme?0xd4b179:0xf1d3bf,-.18,.89,z,.22,.43,.5,.085);p.rotation.z=-.2;for(const y of [.83,.96])ell(upholstery,theme?0xb3915a:0xdab7a2,-.039,y,z,.011,.01,.01)}for(let i=0;i<8;i++)box(upholstery,theme?0x4d6f62:0xeadcc3,.22+i*.037,.785,-.57,.031,.022,.3);
 // Kitchen backsplash, shelf and tiny useful utensils.
 box(low,theme?0xb9c8b5:0xf2e9cf,1.28,1.25,-2.105,1.77,.51,.045);for(let i=0;i<7;i++)box(low,0xd7d3bc,.49+i*.255,1.25,-2.075,.013,.5,.015);for(const y of [1.06,1.23,1.40])box(low,0xd7d3bc,1.28,y,-2.075,1.77,.012,.015);
 box(low,c.wood,1.30,1.89,-1.98,1.77,.065,.33);for(let i=0;i<3;i++){cyl(low,[0xb2bd99,0xd7ae7a,0xc49378][i],.78+i*.30,2.03,-1.96,.085,.09,.22);cyl(low,c.wood,.78+i*.30,2.16,-1.96,.09,.09,.035)}plant(low,1.92,1.94,-1.98,.65);tube(low,c.metal,[[1.85,1.05,-1.81],[1.85,1.31,-1.81],[1.70,1.33,-1.77],[1.66,1.24,-1.74]],.018);
 // Each style gets a different feature wall and display objects.
 if(!theme){frame(low,c,-2.05,1.91,-2.04,.64,.65,true);frame(low,c,2.44,1.60,-2.05,.40,.55,true);plant(low,-2.47,1.62,-1.57,.75);for(let i=0;i<3;i++){const m=ell(low,0xe8c9a5,-2.69,1.36+i*.23,.16,.075,.09,.07);} }
 else{const clock=mesh(low,new T.CylinderGeometry(.30,.30,.075,48),c.wood,-2.12,1.98,-2.01);clock.rotation.x=Math.PI/2;const face=mesh(low,new T.CircleGeometry(.254,48),0xecd9b4,-2.12,1.98,-1.963);tube(low,0x514c3d,[[-2.12,2.15,-1.95],[-2.12,1.98,-1.95],[-1.98,1.93,-1.95]],.011);frame(low,c,2.43,1.64,-2.05,.42,.57,false);for(let i=0;i<6;i++){box(low,[0x61786b,0xa2674d,0xc4ac79][i%3],-2.47+i*.073,1.83,-1.54,.06,.35,.23)} }
 // Side wall art faces into the room, never blocks walking paths.
 const art=new T.Group();art.position.set(-2.73,1.65,.53);art.rotation.y=Math.PI/2;low.add(art);frame(art,c,0,0,0,theme?1.18:.85,theme?.75:1.02,!theme);
 lamp(low,c,1.98,.86,.73,theme);lamp(low,c,-1.20,1.02,-1.82,theme);
 // Warm upper floor accents: framed art, a woven runner, towel rails, vanity lighting.
 frame(high,c,-2.05,1.50,-2.035,.58,.72,!theme);box(high,theme?0x5c7566:0xddbda5,.5,.083,.97,2.02,.026,1.05);for(let i=0;i<8;i++)box(high,c.trim,-.42+i*.25,.10,.97,.018,.007,.87);
 box(high,c.metal,2.35,1.09,-2.04,.55,.03,.055);box(high,theme?0xbfae8c:0xf0dcc9,2.35,.85,-1.99,.4,.45,.04);for(let i=0;i<3;i++)box(high,c.trim,2.20+i*.14,.85,-1.961,.012,.41,.009);plant(high,1.83,.81,.53,.58);lamp(high,c,.10,.58,-1.25,theme);lamp(high,c,1.92,.82,.51,theme);
 // Window light pools on each floor; mullion-shaped gaps retain the window silhouette.
 for(const [g,y] of [[low,.055],[high,.058]]){const rays=new T.Group();g.add(rays);for(let ix=0;ix<2;ix++)for(let iz=0;iz<2;iz++){const m=new T.MeshBasicMaterial({color:0xffe6ab,transparent:true,opacity:.19,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});const pane=mesh(rays,new T.PlaneGeometry(.57,.65),m,.48+ix*.64,y+.047,.85+iz*.72);pane.rotation.x=-Math.PI/2;pane.rotation.z=-.28;pane.castShadow=false;}sunPatches.push(rays);}
 const sun=new T.SpotLight(0xffe6b4,8,8,.70,.65,1.5);sun.position.set(-.45,2.3,-1.7);sun.target.position.set(.3,.02,1.3);low.add(sun,sun.target);sun.userData.sun=true;lights.push(sun);
 }
 // Old flat window panels/curtains are hidden behind the new framed openings.
 for(const [o]of original){if(o.parent===indoor&&o.position.y===1.42)o.visible=false;if(o.parent===upper&&[1.15,1.17].includes(o.position.y))o.visible=false;}
 let identity=0,night=false,weather='sun';
 function select(i){identity=i;indoor.scale.x=i===1?-1:1;themes.forEach((groups,j)=>groups.forEach(g=>g.visible=i===j));for(const [o,c]of original){let v=c;if(i===1){const map={0xb68c62:0x80593d,0xbaa385:0x6c503a,0xb69572:0x775840,0xc2a580:0x597568,0xb8cbb4:0x668c81,0xe6d8ba:0xc9b794,0xe9dcc1:0xd7c4a5,0xc7ac81:0x96724f,0xf0e1c8:0xd3bf9d,0xe4dac3:0xc5b592,0xd2b98e:0xa3835c,0xc8ae84:0x997550,0x819880:0x8b6146,0x6e866d:0x71533e,0x788d72:0x77553e,0xa0b4a0:0x4d7064,0xc4d1b6:0x638477,0xc0cdb2:0x648274,0xc6b48f:0x557565,0xb7a781:0x648471,0x8fa99b:0x617e70,0xcbb597:0xa37c53};v=map[c]??c;}o.material.color.set(v)}lighting(night,weather);}
 function lighting(n,w){night=n;weather=w;const clear=['sun','cloudy'].includes(w);sunPatches.forEach(g=>g.visible=!n&&clear);lights.forEach(l=>l.intensity=l.userData.sun?(!n&&clear?7:0):(n?2.2:1.1));windows.forEach(m=>{m.color.set(n?0x3e6072:0xc6dfd5);m.emissive.set(n?0x304956:0xb4d4ce);m.emissiveIntensity=n?.18:.4})}

 // Batch decorative meshes per material while retaining dynamic windows, light objects and sun patches.
 indoor.updateMatrixWorld(true);for(const groups of themes)for(const g of groups){const inv=g.matrixWorld.clone().invert(),batch=new Map(),remove=[];g.traverse(o=>{if(!o.isMesh)return;let p=o,action=g.userData.action;while(p&&p!==g){if(sunPatches.includes(p))return;action=p.userData.action||action;p=p.parent}const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));const key=o.material.uuid+'|'+(action||'');const entry=batch.get(key)||{material:o.material,action,geos:[]};entry.geos.push(geo);batch.set(key,entry);remove.push(o)});remove.forEach(o=>o.removeFromParent());for(const {material,action,geos}of batch.values()){const geometry=new T.BufferGeometry();for(const key of ['position','normal']){let length=geos.reduce((n,g)=>n+g.attributes[key].array.length,0),array=new Float32Array(length),offset=0;for(const geo of geos){array.set(geo.attributes[key].array,offset);offset+=geo.attributes[key].array.length}geometry.setAttribute(key,new T.BufferAttribute(array,3));}geometry.computeBoundingSphere();const m=new T.Mesh(geometry,material);if(action)m.userData.action=action;m.castShadow=m.receiveShadow=true;g.add(m);geos.forEach(g=>g.dispose());}}
 select(0);return {select,lighting};
}
