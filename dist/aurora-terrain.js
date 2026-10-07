export function snowShore(phi){return 1.01+.11*Math.sin(phi*2+.7)+.065*Math.cos(phi*3-1)+.24*(1-Math.sin(phi))*.5}
export function snowRadius(theta,phi){return 10.055+.10*Math.sin(theta*3)*Math.sin(phi*3)**2}
