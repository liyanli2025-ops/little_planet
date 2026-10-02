// Seat contact stays at the torso underside; paws project beyond the cushion.
export function createSeatedPose(body,legs){
 let blend=0;
 return (seated,dt=1/60)=>{
  blend+=(Number(seated)-blend)*(1-Math.exp(-Math.min(dt,.1)*12));
  if(blend<.001)blend=0;
  body.scale.set(1+.035*blend,1-.10*blend,1+.025*blend);
  legs.forEach((leg,i)=>{
   leg.position.set((i?1:-1)*(.145+.025*blend),.25-.015*blend,.16*blend);
   if(seated){leg.rotation.x=-.25-1.25*blend;leg.rotation.z=(i?-.06:.06)*blend;}
   else if(!blend)leg.rotation.z=0;
  });
 };
}
