// Unequal fracture spans and restrained chips retain the large bay silhouette.
const TAU=Math.PI*2;
const random=i=>{const v=Math.sin(i*127.1+43.7)*43758.5453;return v-Math.floor(v)};
const fractureKnots=Array.from({length:65},(_,i)=>({angle:i===64?TAU:(i+(i?random(i)*.56-.28:0))/64*TAU,offset:(random(i+91)-.5)*.064}));
fractureKnots[64].offset=fractureKnots[0].offset;
export function snowShore(phi){
 const angle=((phi%TAU)+TAU)%TAU;
 let i=0;while(i<63&&fractureKnots[i+1].angle<angle)i++;
 const a=fractureKnots[i],b=fractureKnots[i+1],t=(angle-a.angle)/(b.angle-a.angle);
 // Linear sections create broken ice edges rather than sinusoidal scallops.
 const fracture=a.offset+(b.offset-a.offset)*t;
 return 1.01+.11*Math.sin(angle*2+.7)+.065*Math.cos(angle*3-1)+.24*(1-Math.sin(angle))*.5+fracture;
}
export function snowRadius(theta,phi){return 10.055+.10*Math.sin(theta*3)*Math.sin(phi*3)**2}
