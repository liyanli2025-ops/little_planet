import {createWearableModels} from './wearable-models.js';
import * as T from './vendor/three.module.js';
import {createTeddy} from './teddy.js';
export function createOutfitPreview(id='design-fitting'){
 const el=document.createElement('div');el.id=id;el.hidden=true;el.setAttribute('aria-label','装扮三维预览，拖动旋转，双指缩放');document.body.append(el);
 let conceptId=null;const conceptStates=new Map();
 let renderer,bear,scene,camera,frame,conceptModels,conceptRoot,zoom=1,rotation=.12;
 function render(){if(!renderer||el.hidden)return;const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(0,.65,(id==='wardrobe-fitting'?Math.max(2.5,1.05/(2*Math.tan(Math.PI/10)*camera.aspect)):2.5)/zoom);camera.lookAt(0,.59,0);camera.updateProjectionMatrix();bear.avatar.rotation.y=rotation;conceptRoot.rotation.y=rotation;renderer.render(scene,camera)}
 function init(){if(renderer)return;renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;el.append(renderer.domElement);scene=new T.Scene();scene.add(new T.HemisphereLight(0xfff9e8,0x728273,2.4));const light=new T.DirectionalLight(0xfff6e6,3);light.position.set(-3,4,5);scene.add(light);camera=new T.PerspectiveCamera(36,1,.1,20);bear=createTeddy(scene);conceptRoot=new T.Group();scene.add(conceptRoot);conceptModels=createWearableModels(null,null,{conceptRoot,onChange:(o,state)=>{conceptStates.set(o.id,state);bear.avatar.visible=!conceptId||conceptStates.get(conceptId)!=='ready';requestAnimationFrame(render)}});}
 const pointers=new Map();let priorDistance;
 el.onpointerdown=e=>{el.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);priorDistance=null;};
 el.onpointermove=e=>{const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1)rotation+=(e.clientX-old[0])*.012;else{const [a,b]=[...pointers.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(priorDistance)zoom=Math.max(.7,Math.min(1.8,zoom*d/priorDistance));priorDistance=d}render()};
 el.onpointerup=el.onpointercancel=e=>{pointers.delete(e.pointerId);priorDistance=null};
 el.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.7,Math.min(1.8,zoom*Math.exp(-e.deltaY*.001)));render()},{passive:false});
 document.addEventListener('studio-model-state',()=>{if(!el.hidden)requestAnimationFrame(render)});
 new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(render)}).observe(el);
 return {show(design,identity){el.hidden=false;try{init();bear.setIdentity(identity);bear.design(design);const last=design.wearables?.at(-1),concept=last?.slot==='garment'?last:null;conceptId=concept?.id||null;conceptModels.sync(concept?[concept]:[]);bear.avatar.visible=!concept||conceptStates.get(concept.id)!=='ready';render()}catch{el.textContent='预览暂时无法加载，请刷新重试'}},hide(){el.hidden=true;pointers.clear();}};
}
