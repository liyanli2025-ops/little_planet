import {homeRoute} from './home-layout.js';
import * as T from './vendor/three.module.js';
import {height} from './surface-nav.js';
export const BEAR_GAP=.90;
export function contactDirection(a,b,room,sign=1){const d=a.clone().sub(b);if(room)d.y=0;else{const n=a.clone().normalize();d.addScaledVector(n,-d.dot(n))}if(d.lengthSq()<1e-8){d.set(sign,0,0);if(!room){const n=a.clone().normalize();d.addScaledVector(n,-d.dot(n))}if(d.lengthSq()<1e-8)d.set(0,0,sign)}return d.normalize()}
export function contactMove(p,delta,room,free){const q=p.clone().add(delta);if(room){if(free(q.x,q.z))return q;for(const c of [new T.Vector3(q.x,p.y,p.z),new T.Vector3(p.x,p.y,q.z)])if(free(c.x,c.z))return c;return p.clone()}return q.normalize().multiplyScalar(height(q.clone().normalize())+.002)}
export function createBearContact(){const velocity=new T.Vector3();return {reset(){velocity.set(0,0,0)},tick(local,peer,room,free,dt,sign=1){let p=local.clone();if(peer){const d=contactDirection(p,peer,room,sign),gap=room?Math.hypot(p.x-peer.x,p.z-peer.z):p.distanceTo(peer);if(gap<BEAR_GAP){p=contactMove(p,d.clone().multiplyScalar(BEAR_GAP-gap),room,free);velocity.copy(d).multiplyScalar(Math.min(1.1,(BEAR_GAP-gap)*5+.16))}}p=contactMove(p,velocity.clone().multiplyScalar(dt),room,free);velocity.multiplyScalar(Math.exp(-dt*12));return p}}}

export function routeAroundPeer(layout,floor,from,x,z,peer){if(peer?.visible&&!peer.sleeping){const [px,,pz]=peer.position,key=floor?'upper':'lower';layout={...layout,[key]:{...layout[key],rects:[...layout[key].rects,[px-.70,px+.70,pz-.70,pz+.70]]}}}return homeRoute(layout,floor,from,x,z)}
