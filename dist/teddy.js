import {createRainGear} from './rain-gear.js?v=6';
import * as T from './vendor/three.module.js';
export function createTeddy(parent,identity=0){
 const avatar=new T.Group(),body=new T.Group();parent.add(avatar);avatar.add(body);body.name='body';
 const fur=new T.MeshStandardMaterial({color:0xdcb987,roughness:1}),cloth=new T.MeshStandardMaterial({color:0xb8777a,roughness:.95});
 const noiseCanvas=document.createElement('canvas');noiseCanvas.width=noiseCanvas.height=128;const noiseCtx=noiseCanvas.getContext('2d'),noiseData=noiseCtx.createImageData(128,128);let seed=17;for(let i=0;i<noiseData.data.length;i+=4){seed=(seed*16807)%2147483647;const v=90+seed%120;noiseData.data.set([v,v,v,255],i)}noiseCtx.putImageData(noiseData,0,0);fur.bumpMap=new T.CanvasTexture(noiseCanvas);fur.bumpMap.wrapS=fur.bumpMap.wrapT=T.RepeatWrapping;fur.bumpMap.repeat.set(3,3);fur.bumpScale=.003;
 const cream=new T.MeshStandardMaterial({color:0xf4dfbc,roughness:1}),dark=new T.MeshStandardMaterial({color:0x382c26,roughness:.48});
 const materials=new Map();const m=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return materials.get(c)};
 function ell(p,material,x,y,z,sx,sy,sz){let o=new T.Mesh(new T.SphereGeometry(1,24,16),typeof material==='number'?m(material):material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
 function box(p,c,x,y,z,w,h,d){let o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='number'?m(c):c);o.position.set(x,y,z);p.add(o);o.castShadow=true;return o}
 function cyl(p,c,x,y,z,r1,r2,h){let o=new T.Mesh(new T.CylinderGeometry(r1,r2,h,32),typeof c==='number'?m(c):c);o.position.set(x,y,z);p.add(o);o.castShadow=true;return o}
 const torso=cyl(body,cloth,0,.405,0,.142,.19,.32);ell(body,fur,0,.37,0,.165,.21,.13);
 // Coat remains in front of the plush torso.
 torso.renderOrder=0;torso.scale.z=.9;
 const legs=[],arms=[];
 for(let i=0;i<2;i++){let side=i?1:-1,g=new T.Group();body.add(g);g.position.set(side*.085,.27,0);g.name='leg-'+i;ell(g,fur,0,-.09,0,.069,.14,.072);ell(g,fur,0,-.21,.036,.082,.06,.106);ell(g,0xa88262,0,-.231,.09,.043,.023,.034);legs.push(g)}
 for(let i=0;i<2;i++){let side=i?1:-1,g=new T.Group();body.add(g);g.position.set(side*.18,.5,0);g.name='arm-'+i;ell(g,cloth,side*.012,-.075,0,.071,.12,.077);ell(g,fur,0,-.208,.007,.067,.078,.062);ell(g,0xad7b54,0,-.21,.065,.03,.037,.009);for(let j=0;j<3;j++)ell(g,fur,(j-1)*.026,-.258,.029,.02,.023,.025);arms.push(g)}
 const head=new T.Group();body.add(head);head.position.y=.75;
 const face=ell(head,fur,0,0,0,.23,.217,.2);
 for(let s of [-1,1]){ell(head,fur,s*.183,.157,0,.09,.093,.064);ell(head,0xbf956c,s*.183,.158,.053,.052,.057,.016);ell(head,fur,s*.19,-.058,.055,.052,.074,.075)}
 ell(head,cream,0,-.068,.166,.12,.089,.074);
 ell(head,dark,0,-.047,.237,.041,.03,.023);
 for(let x of [-.077,.077]){ell(head,dark,x,.017,.184,.022,.03,.018);ell(head,0xffffff,x-.006,.027,.199,.007,.009,.004)}
 let smile=new T.Mesh(new T.TorusGeometry(.037,.0045,8,24,Math.PI),dark);smile.position.set(0,-.105,.229);smile.rotation.z=Math.PI;head.add(smile);box(head,dark,0,-.078,.239,.006,.025,.006);
 // Small tufts break up the silhouette without replacing the soft face.
 const tuftGeo=new T.SphereGeometry(1,7,5),tufts=new T.InstancedMesh(tuftGeo,fur,110),matrix=new T.Matrix4(),q=new T.Quaternion();head.add(tufts);tufts.visible=false;tufts.castShadow=true;
 for(let i=0;i<110;i++){let y=1-2*(i+.5)/110,a=i*2.39996,r=Math.sqrt(1-y*y),x=Math.cos(a)*r,z=Math.sin(a)*r;const pos=new T.Vector3(x*.227,y*.212,z*.196);if(z>.7)pos.multiplyScalar(.97);matrix.compose(pos,q,new T.Vector3(z>.25?0:.011,z>.25?0:.017,z>.25?0:.009));tufts.setMatrixAt(i,matrix)}
 const girl=new T.Group(),boy=new T.Group();body.add(girl,boy);const girlHat=new T.Group(),boyHat=new T.Group();head.add(girlHat,boyHat);
 // Girl: cream fur, rose coat, scalloped collar and a small side bow.
 for(let s of [-1,1]){ell(girl,0xf3e3bd,s*.052,.545,.133,.065,.039,.02);box(girl,0x965e66,s*.12,.35,.155,.065,.075,.018)}
 for(let y of [.46,.38,.3])ell(girl,0xebd5ab,0,y,.177,.018,.018,.009);
 let beret=ell(girlHat,0xab6672,0,.208,-.018,.218,.074,.19);beret.rotation.z=-.12;ell(girlHat,0x81545e,.02,.279,0,.015,.022,.015);
 for(let s of [-1,1])ell(girlHat,0xe8b6a5,.187+s*.029,.112,.08,.037,.027,.019);ell(girlHat,0xf5d7b8,.187,.112,.103,.013,.017,.008);
 // Boy: honey fur, blue duffle coat, wooden toggles and rust hat.
 for(let y of [.48,.39,.3]){box(boy,0xc2a171,0,y,.176,.17,.012,.014);for(let x of [-.065,.065]){let toggle=cyl(boy,0xad7a43,x,y,.19,.012,.012,.043);toggle.rotation.z=Math.PI/2}}
 for(let s of [-1,1])box(boy,0x416977,s*.12,.32,.156,.074,.083,.016);
 cyl(boyHat,0x9c4c38,0,.218,0,.264,.272,.023);cyl(boyHat,0xb25a40,0,.267,-.005,.14,.19,.11);cyl(boyHat,0x783d30,0,.23,0,.185,.192,.022);
 const rainGear=createRainGear({body,head,arms});let rainy=false,currentIdentity=identity;
 function setIdentity(i){currentIdentity=i;const female=i===0;fur.color.set(female?0xd9b783:0xb77a43);cloth.color.set(female?0xb77880:0x3c7184);girl.visible=girlHat.visible=female&&!rainy;boy.visible=boyHat.visible=!female&&!rainy;if(rainy)cloth.color.set(0xe8ba47);face.scale.set(female?.23:.24,female?.217:.225,female?.2:.205);avatar.userData.identity=i}
 setIdentity(identity);return {avatar,body,legs,arms,setIdentity,rain(v){if(rainy!==v){rainy=v;rainGear.set(v);setIdentity(currentIdentity)}},rainTick(t,hold=true,shared=false){rainGear.tick(t,hold,shared)},rainState:rainGear.state};
}

