import * as T from './vendor/three.module.js';
// Render behind the network clock so uneven arrivals still form a continuous path.
export function createPoseBuffer(delay=350){
 const samples=[];return {push(p,time=performance.now(),key=''){if(samples.length&&samples.at(-1).key!==key)samples.length=0;samples.push({p,time,key});if(samples.length>12)samples.shift();},sample(now=performance.now()){if(!samples.length)return null;const t=now-delay;while(samples.length>2&&samples[1].time<=t)samples.shift();const a=samples[0],b=samples[1]||a,u=T.MathUtils.clamp((t-a.time)/Math.max(1,b.time-a.time),0,1);
 function blend(x,y){if(Array.isArray(x)&&Array.isArray(y))return x.map((v,i)=>typeof v==='number'?T.MathUtils.lerp(v,y[i],u):blend(v,y[i]));if(x&&y&&typeof x==='object')return Object.fromEntries(Object.keys(y).map(k=>[k,k==='yaw'&&Number.isFinite(x[k])?x[k]+Math.atan2(Math.sin(y[k]-x[k]),Math.cos(y[k]-x[k]))*u:k==='quaternion'?new T.Quaternion().fromArray(x[k]||y[k]).slerp(new T.Quaternion().fromArray(y[k]),u).toArray():blend(x[k],y[k])]));return typeof x==='number'&&typeof y==='number'?T.MathUtils.lerp(x,y,u):u<1?x:y;}
 return blend(a.p,b.p);}};
}
