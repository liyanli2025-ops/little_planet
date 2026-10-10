import * as T from './vendor/three.module.js';
// The same centripetal pear profile used by teddy.js; clothing follows the actual bear.
const curve=new T.CatmullRomCurve3([[0,.16],[.19,.17],[.28,.23],[.325,.34],[.337,.46],[.312,.58],[.279,.70],[.282,.82],[.268,.92],[.207,1.005],[.11,1.047],[0,1.06]].map(([r,y])=>new T.Vector3(r,y,0)),false,'centripetal');
const samples=curve.getPoints(500);
export function bodyRadius(y){for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];if(y>=a.y&&y<=b.y){const t=(y-a.y)/(b.y-a.y||1);return Math.max(0,a.x+(b.x-a.x)*t);}}return 0;}

export function garmentRadius(y,ease=.014){return bodyRadius(y)*1.02+ease;}
export function frontSurface(x,y,ease=.014){const r=garmentRadius(y,ease);return Math.sqrt(Math.max(0,r*r-x*x))*.81;}
export function fittedSleeve(side){const curve=new T.CatmullRomCurve3([[.105,-.235],[.119,-.17],[.115,-.08],[.103,.005],[.083,.067],[.052,.105]].map(([r,y])=>new T.Vector3(r,y,0)),false,'centripetal');const g=new T.LatheGeometry(curve.getPoints(36).map(p=>new T.Vector2(p.x,p.y)),48),a=g.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i),u=T.MathUtils.smoothstep(y,-.24,.096);a.setX(i,a.getX(i)+side*(.035-.10*u));a.setZ(i,a.getZ(i)*1.08);}g.computeVertexNormals();return g;}
