export function footBottom(angle){
 return .25-.078*Math.cos(angle)-.022*Math.sin(angle)-Math.hypot(.167*Math.cos(angle),.144*Math.sin(angle));
}
export function groundedBody(angles){return -Math.min(...angles.map(footBottom))}
