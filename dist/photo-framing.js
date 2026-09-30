export const photoFrames={near:{height:1.45,width:1.05,y:.56,label:'近景'},half:{height:.95,width:.85,y:.76,label:'半身'},face:{height:.65,width:.70,y:.86,label:'特写'}};
export function frameDistance(frame,fov,aspect){const p=photoFrames[frame]||photoFrames.near,tan=Math.tan(fov*Math.PI/360);return Math.max(p.height/(2*tan),p.width/(2*tan*Math.max(.2,aspect)))}
