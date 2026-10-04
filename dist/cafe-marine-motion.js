// Forward is +Z, up is +Y. Follow the velocity tangent from emergence to re-entry.
export function marineLeap(time,period=17){
 const duration=3.4,q=((time%period)+period)%period,u=q/duration,height=2.8,depth=1.3,travel=6;
 const crossing=(1-Math.sqrt(1-depth/height))/2,launch=crossing*duration,land=(1-crossing)*duration;
 const splash=q>=land&&q<land+1.2?q-land:q>=launch&&q<launch+1.2?q-launch:-1;
 return {visible:q<duration,y:-depth+4*height*u*(1-u),z:(u-.5)*travel,pitch:-Math.atan2(4*height*(1-2*u),travel),roll:.06*Math.sin(u*Math.PI*2),splash,splashZ:((q>=land?1-crossing:crossing)-.5)*travel};
}
