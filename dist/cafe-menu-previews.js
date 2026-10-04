import * as T from './vendor/three.module.js';
import {cafeMenu} from './cafe-catalog.js';
import {makeCafeFood,disposeCafeObject} from './cafe-food.js';
let pending;
export function cafeMenuPreviews(){
 return pending??=(async()=>{
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setSize(160,112);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();scene.add(new T.HemisphereLight(0xfff5df,0x6b8075,2.5));const sun=new T.DirectionalLight(0xffffff,3);sun.position.set(-2,4,3);scene.add(sun);
  const camera=new T.OrthographicCamera(-.33,.33,.231,-.231,.01,10);camera.position.set(.7,.65,1);camera.lookAt(0,.13,0);const images={};
  try{for(const item of cafeMenu){const food=makeCafeFood(item.id);try{await food.userData.ready;scene.add(food);const bounds=new T.Box3().setFromObject(food),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),span=Math.max(size.x,size.z,size.y)*.70;camera.left=-span*160/112;camera.right=span*160/112;camera.top=span;camera.bottom=-span;camera.position.copy(center).add(new T.Vector3(.7,.65,1));camera.lookAt(center);camera.updateProjectionMatrix();renderer.render(scene,camera);images[item.id]=renderer.domElement.toDataURL('image/png')}finally{scene.remove(food);disposeCafeObject(food)}}return images}finally{renderer.dispose();renderer.forceContextLoss()}
 })().catch(()=>({}));
}
