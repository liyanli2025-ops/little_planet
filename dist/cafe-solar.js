// Shared island clock, fixed tropical 06:00–18:00 daylight (Beijing time).
export function cafeSolar(time){
 const hour=((time/3600000+8)%24+24)%24,a=(hour-6)/12*Math.PI;
 const raw=[Math.cos(a),Math.sin(a),-.32],length=Math.hypot(...raw),direction=raw.map(v=>v/length);
 const daylight=Math.max(0,Math.min(1,direction[1]*5)),twilight=Math.max(0,1-Math.abs(direction[1])/.28);
 return {hour,direction,daylight,twilight,above:direction[1]>-.025};
}
