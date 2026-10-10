export const SLEEP_HALF_GAP=.32;
const poses=new WeakMap();
export function sleepEmbrace(bear,side,dt,t){
 const k=1-Math.exp(-dt*3),b= Math.sin(t*.9)*.008;
 let pose=poses.get(bear);if(!pose){pose={y:bear.body.rotation.y,z:bear.body.rotation.z,arms:bear.arms.map(a=>({x:a.rotation.x,z:a.rotation.z}))};poses.set(bear,pose);}
 pose.y+=(side*.22-pose.y)*k;bear.body.rotation.y=pose.y;
 pose.z+=(side*.08-pose.z)*k;bear.body.rotation.z=pose.z;
 bear.arms.forEach((arm,i)=>{const inward=(i===0? -1:1)===-side;
  const x=inward?-.88+b:-.12,z=inward?(i?-.50:.50):(i?-.18:.18);
  pose.arms[i].x+=(x-pose.arms[i].x)*k;pose.arms[i].z+=(z-pose.arms[i].z)*k;arm.rotation.x=pose.arms[i].x;arm.rotation.z=pose.arms[i].z;
 });
}
export function sleepingQuiltHeight(x,z){
 const torso=Math.max(...[-SLEEP_HALF_GAP,SLEEP_HALF_GAP].map(cx=>Math.exp(-Math.pow((x-cx)/.40,4)-Math.pow((z+.30)/.76,6))));
 return .68+.49*torso-.20*Math.pow(Math.abs(x)/1.06,8)+.008*Math.sin(x*18+z*7);
}

export function resetSleepEmbrace(bear){poses.delete(bear);}
