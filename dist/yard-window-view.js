import * as T from './vendor/three.module.js';
import {normal,R} from './surface-nav.js';

export function createYardWindowView({renderer,scene,root,outdoor,indoor,ambient,light,fill,cozy}){
 const targets=Array.from({length:3},()=>new T.WebGLRenderTarget(512,320,{depthBuffer:true}));
 targets.forEach(t=>{t.texture.colorSpace=T.LinearSRGBColorSpace;t.texture.generateMipmaps=false});
 cozy.windowTextures(targets.map(t=>t.texture));
 const camera=new T.PerspectiveCamera(66,1.6,.04,45),up=normal(-.21,-.1),position=up.clone().multiplyScalar(R+.75);
 const basis=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),up),directions=[new T.Vector3(0,0,1),new T.Vector3(-1,0,0),new T.Vector3(1,0,0)].map(v=>v.applyQuaternion(basis));
 let elapsed=0,last=-99,cursor=0,revision='',frames=0;
 function renderOne(index,weather,night,floor){
  const saved={target:renderer.getRenderTarget(),bg:scene.background,fog:scene.fog,indoor:indoor.visible,outdoor:outdoor.visible,q:root.quaternion.clone(),ambient:ambient.intensity,li:light.intensity,fi:fill.intensity,lp:light.position.clone(),lt:light.target.position.clone(),cast:light.castShadow,shadow:renderer.shadowMap.autoUpdate};
  try{
   indoor.visible=false;outdoor.visible=true;root.quaternion.identity();root.updateMatrixWorld(true);
   const cloudy=['cloudy','rain','overcast','fog','haze'].includes(weather);
   scene.background=new T.Color(night?0x142638:weather==='rain'?0x78939b:weather==='snow'?0xd2dfe2:cloudy?0xaababc:0xc5dce3);
   scene.fog=new T.Fog(scene.background,night?5:7,night?17:24);
   ambient.intensity=night?.48:cloudy?1.65:2.35;light.intensity=night?.22:weather==='cloudy'?2.0:cloudy?.9:3.1;fill.intensity=night?.18:.65;
   light.position.copy(position).addScaledVector(up,8).add(new T.Vector3(-4,0,3));light.target.position.set(0,0,0);light.target.updateMatrixWorld();
   // No additional shadow-map pass is needed for each small window texture.
   renderer.shadowMap.autoUpdate=false;light.castShadow=false;
   const outward=directions[index];camera.position.copy(position).addScaledVector(up,floor*.35).addScaledVector(outward,1.12);camera.up.copy(up);camera.lookAt(camera.position.clone().addScaledVector(outward,3.2).addScaledVector(up,-2.8-floor*.50));
   renderer.setRenderTarget(targets[index]);renderer.clear();renderer.render(scene,camera);frames++;
  }finally{
   renderer.setRenderTarget(saved.target);scene.background=saved.bg;scene.fog=saved.fog;indoor.visible=saved.indoor;outdoor.visible=saved.outdoor;root.quaternion.copy(saved.q);root.updateMatrixWorld(true);ambient.intensity=saved.ambient;light.intensity=saved.li;fill.intensity=saved.fi;light.position.copy(saved.lp);light.target.position.copy(saved.lt);light.target.updateMatrixWorld();renderer.shadowMap.autoUpdate=saved.shadow;light.castShadow=saved.cast;
  }
 }
 return {tick(dt,active,weather,night,floor,world){if(!active)return;elapsed+=dt;const key=[weather,night,floor,world].join();if(key!==revision){revision=key;for(let i=0;i<3;i++)renderOne(i,weather,night,floor);last=elapsed}else if(elapsed-last>.5){last=elapsed;renderOne(cursor++%3,weather,night,floor)}},state(){return {frames,world:revision.split(',').at(-1),resolution:[512,320]}},dispose(){targets.forEach(t=>t.dispose())}};
}
