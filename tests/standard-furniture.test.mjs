import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildStandardFurniture} from '../dist/standard-furniture.js';
import {createSeatedPose} from '../dist/seated-pose.js';
import {createStudioModels} from '../dist/studio-models.js';
test('lamp emits light, toggles without leaving seat; rug and sofa geometry are finite',()=>{
 const scene=new T.Group(),models=createStudioModels(scene);
 for(const type of ['sofa','lamp','rug']){
  const spec={id:type,standard:type,kind:type,width:1.8,depth:.8,height:type==='rug'?.03:1.2,seat:.65,tint:'#a9b29b',accent:'#ffe0ae',shape:'round',pattern:'check',x:0,z:0,floor:0,yaw:0};
  const g=buildStandardFurniture(spec),b=new T.Box3().setFromObject(g);assert.ok(Number.isFinite(b.min.x));assert.ok(b.max.y>0);
  if(type==='lamp'){assert.ok(g.userData.lamp.intensity>0);models.sync([spec]);assert.equal(models.toggle(type),true);assert.equal(scene.children[0].children[0].userData.lamp.intensity,0);models.sync([spec]);assert.equal(scene.children[0].children[0].userData.lamp.intensity,0);models.toggle(type);assert.ok(scene.children[0].children[0].userData.lamp.intensity>0);}
 }models.dispose();
});
test('sitting extends paws, lowers torso and recovers standing without cumulative deformation',()=>{
 const body=new T.Group(),legs=[new T.Group(),new T.Group()],pose=createSeatedPose(body,legs);
 for(let i=0;i<100;i++)pose(true,1/60);
 assert.ok(legs.every(l=>l.position.z>.15&&l.rotation.x<-1.45));assert.ok(body.scale.y<.91);
 for(let i=0;i<100;i++)pose(false,1/60);
 assert.equal(body.scale.y,1);assert.equal(legs[0].position.z,0);assert.equal(legs[0].position.y,.25);
});
