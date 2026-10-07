import {snowShore} from './aurora-terrain.js';
const ease=x=>x*x*(3-2*x),lerp=(a,b,u)=>a+(b-a)*u;
export function polarBearRoute(time){
 const q=((time%120)+120)%120,home=[-3.9,2.8],phi=Math.atan2(home[1],home[0]),start=Math.asin(Math.hypot(...home)/10),edge=snowShore(phi);
 let th=start,ph=phi,water=0,state='sniff',walking=false;
 if(q<60){const segment=Math.floor(q/12),local=q%12,points=[home,[-4.2,4.2],[-2.8,5],[-2.4,3.9],[-3.1,3]],from=points[segment],to=points[(segment+1)%5],u=ease(Math.min(local/8,1));return {x:lerp(from[0],to[0],u),z:lerp(from[1],to[1],u),water:0,state:local<8?'amble':segment%2?'look-around':'sniff',walking:local<8}}
 if(q<75){state='approach-water';walking=true;th=lerp(start,edge-.035,ease((q-60)/15))}
 else if(q<80){state='enter-water';walking=true;const u=ease((q-75)/5);th=lerp(edge-.035,edge+.12,u);water=u}
 else if(q<103){state='swim';water=1;const u=(q-80)/23;ph=phi+.20*Math.sin(u*Math.PI*2);th=snowShore(ph)+.12+.10*(1-Math.cos(u*Math.PI*2))}
 else if(q<108){state='climb-out';walking=true;const u=ease((q-103)/5);th=lerp(edge+.12,edge-.035,u);water=1-u}
 else{state=q<118?'amble':'shake-dry';walking=q<118;th=lerp(edge-.035,start,ease(Math.min((q-108)/10,1)))}
 return {x:10*Math.sin(th)*Math.cos(ph),z:10*Math.sin(th)*Math.sin(ph),water,state,walking};
}
