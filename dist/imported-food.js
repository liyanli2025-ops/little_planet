import * as T from './vendor/three.module.js';
import {models} from './assets/styloo/models.js';
export const assetFoodMap={butter:'buttersingle',cheese:'cheeseslice',cookie:'cookie',cake:'cakewhite',bread:'paindemiestack',strawberry:'strawberry',tomato:'tomato',lemon:'lemon',beef:'meatraw',flour:'flourbagwithoutfloor',noodles:'ramenbowlall',sushi:'SushisSalmon',icecream:'icecreamStrawberrywithtop'};
const sizes={flour:.32,noodles:.50,cake:.33,sushi:.32,icecream:.32,strawberry:.23,bread:.32};
const textureCache=new Map();
function acquireTexture(file){let e=textureCache.get(file);if(!e){const texture=new T.TextureLoader().load(new URL('./assets/styloo/'+file.replace(/\.png$/i,'.webp'),import.meta.url).href);texture.flipY=false;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;e={texture,refs:0};textureCache.set(file,e)}e.refs++;return {texture:e.texture,release(){if(--e.refs===0){e.texture.dispose();textureCache.delete(file)}}}}
export function assetTextureStats(){return {textures:textureCache.size,references:[...textureCache.values()].reduce((n,e)=>n+e.refs,0)}}
export function makeAsset(name,size=.3){
 const source=models[name];if(!source)throw Error('Unknown food asset '+name);const g=new T.Group();g.name='styloo-'+name;g.userData.asset=name;
 for(const data of source.meshes){const geometry=new T.BufferGeometry();for(const [key,n]of [['position',3],['normal',3],['uv',2]])geometry.setAttribute(key,new T.Float32BufferAttribute(data[key],n));geometry.setIndex(data.index);geometry.scale(size,size,size);const c=data.color,material=new T.MeshStandardMaterial({color:new T.Color(c[0],c[1],c[2]),roughness:.88,metalness:0,side:T.DoubleSide,alphaTest:data.alpha});if(data.texture&&typeof document!=='undefined'){const handle=acquireTexture(data.texture);material.map=handle.texture;material.userData.foodAsset=true;let disposed=false;material.addEventListener('dispose',()=>{if(!disposed){disposed=true;handle.release()}});}const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh)}return g;
}

function piece(parent,name,size,x,y,z,turn=0){const m=makeAsset(name,size);m.position.set(x,y,z);m.rotation.y=turn;parent.add(m);return m}
function solid(parent,geo,color,x,y,z){const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.78}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
function bowl(parent){piece(parent,'ramenbowl',.4,0,0,0);solid(parent,new T.CylinderGeometry(.174,.174,.009,32),0xcaa668,0,.168,0)}
function shrimp(parent,x,y,z){const pts=Array.from({length:15},(_,j)=>new T.Vector3(x+Math.cos(j*.23)*.035,y+Math.sin(j*.23)*.008,z+Math.sin(j*.23)*.036));solid(parent,new T.TubeGeometry(new T.CatmullRomCurve3(pts),18,.012,8,false),0xeead89,0,0,0)}
export function makeNoodleDish(kind){const g=new T.Group();bowl(g);for(let i=0;i<3;i++)piece(g,'ramennoodles',.265,Math.sin(i*2.1)*.02,.155+i*.012,Math.cos(i*2.1)*.02,i*1.3);piece(g,'ramenEggHalf',.11,.075,.20,-.045,.3);piece(g,'ramengreenthing',.072,-.085,.2,-.06);
 if(kind==='beefnoodles')for(let i=0;i<3;i++)piece(g,'meatcookedslice',.11,-.07+i*.055,.21,.06,i*.4);
 else if(kind==='shrimpnoodles')for(let i=0;i<3;i++)shrimp(g,-.08+i*.067,.225,.055);
 else if(kind==='mushroomnoodles')for(let i=0;i<3;i++){solid(g,new T.CylinderGeometry(.012,.018,.045,12),0xe7d4ae,-.08+i*.064,.225,.06);const cap=solid(g,new T.SphereGeometry(.038,16,10),0xa8784f,-.08+i*.064,.25,.06);cap.scale.y=.45;}
 else for(let i=0;i<3;i++)piece(g,'tomatoslice',.083,-.08+i*.055,.216,.065,i*.9);g.userData.importedDish=kind;return g}
export function makeImportedFood(id){
 if(id==='salad'){const g=new T.Group();bowl(g);for(let i=0;i<8;i++){const a=i*2.4;const leaf=piece(g,'salad',.155,Math.sin(a)*.085,.18+(i%3)*.022,Math.cos(a)*.08,a);leaf.rotation.z=Math.sin(a)*.35}for(let i=0;i<3;i++){piece(g,'tomatoslice',.075,Math.sin(i*2.1)*.09,.25,Math.cos(i*2.1)*.075,i);piece(g,'cumcumberslice',.068,Math.sin(i*2.1+1)*.075,.245,Math.cos(i*2.1+1)*.09,i)}g.userData.food=id;return g}
 if(id==='cucumber'){const g=new T.Group();piece(g,'plate',.31,0,0,0);for(let i=0;i<4;i++)piece(g,'cumcumberslice',.13,(i-1.5)*.045,.024+i*.005,0,.2);g.userData.food=id;return g}
 const name=assetFoodMap[id];if(!name)return null;const g=makeAsset(name,sizes[id]||.28);g.userData.food=id;if(id==='flour'){const flour=solid(g,new T.SphereGeometry(1,24,16),0xf1e6c9,0,.22,0);flour.scale.set(.088,.023,.053)}return g;
}
export function makeSushiDish(){const g=new T.Group();piece(g,'plate',.46,0,0,0);for(let i=0;i<3;i++){const x=(i-1)*.125;piece(g,'shushisRiceOnly',.125,x,.028,0,Math.PI/2);shrimp(g,x,.098,0)}g.userData.importedDish='sushi';return g}
