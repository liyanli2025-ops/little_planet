import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createHomeWindows} from '../dist/home-windows.js';
import {createYardWindowView} from '../dist/yard-window-view.js';

test('window weather keeps rain and snow inside glass and preserves night independently',()=>{
 const windows=createHomeWindows(),m=windows.material(2),side=windows.material(1,2),maps=[new T.Texture(),new T.Texture(),new T.Texture()];
 windows.connect(maps);assert.equal(side.uniforms.yard.value,maps[2]);
 windows.set(true,'rain');assert.equal(m.uniforms.wet.value,1);assert.equal(m.uniforms.dark.value,1);assert.equal(m.uniforms.snowy.value,0);
 windows.tick(.5);assert.equal(m.uniforms.clock.value,.5);windows.set(false,'snow');assert.equal(m.uniforms.wet.value,0);assert.equal(m.uniforms.snowy.value,1);windows.set(false,'haze');assert(m.uniforms.mist.value<.2);assert.equal(windows.state().source,'planet');windows.dispose();maps.forEach(t=>t.dispose());
});
test('yard renders current world and restores the interior after success or failure',()=>{
 const scene=new T.Scene(),root=new T.Group(),outdoor=new T.Group(),indoor=new T.Group();scene.add(root);root.add(outdoor,indoor);outdoor.visible=false;root.rotation.z=.25;
 const ambient=new T.HemisphereLight(0xffffff,0x333333,1.7),light=new T.DirectionalLight(0xffffff,2),fill=new T.DirectionalLight(0xffffff,.4);light.castShadow=true;light.position.set(3,8,9);scene.add(ambient,light,fill);
 let current=null,fail=false;const renderer={shadowMap:{autoUpdate:true},getRenderTarget:()=>current,setRenderTarget:t=>current=t,clear(){},render(){if(fail)throw Error('test failure');assert.equal(indoor.visible,false);assert.equal(outdoor.visible,true)}};
 const cozy={windowTextures(maps){assert.equal(maps.length,3)}},view=createYardWindowView({renderer,scene,root,outdoor,indoor,ambient,light,fill,cozy});
 view.tick(.1,true,'sun',false,0,5);assert.equal(view.state().frames,3);assert.equal(view.state().world,'5');assert.equal(current,null);assert.equal(indoor.visible,true);assert.equal(outdoor.visible,false);assert.equal(ambient.intensity,1.7);assert.equal(light.castShadow,true);assert(Math.abs(root.rotation.z-.25)<1e-8);
 view.tick(1,false,'rain',true,1,6);assert.equal(view.state().frames,3);view.tick(.1,true,'rain',true,1,6);assert.equal(view.state().frames,6);assert.equal(view.state().world,'6');
 fail=true;assert.throws(()=>view.tick(1,true,'sun',false,0,7),/test failure/);assert.equal(indoor.visible,true);assert.equal(outdoor.visible,false);assert.equal(current,null);assert.equal(light.castShadow,true);assert.deepEqual(light.position.toArray(),[3,8,9]);view.dispose();
});
