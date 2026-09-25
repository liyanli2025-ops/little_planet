import * as T from './vendor/three.module.js';
export function createLoft({indoor,box,ball,cylinder,group,tag}){
 const upper=group(indoor,0,2.7,0),stairs=group(indoor);upper.visible=false;
 box(upper,0xb59873,0,-.1,0,5.8,.2,4.6);
 for(let i=0;i<14;i++)box(upper,i%2?0xd2b98e:0xc8ae84,0,0,-2.05+i*.31,5.65,.04,.285);
 box(upper,0xf0e1c8,0,1,-2.2,5.8,2.05,.13);box(upper,0xe4dac3,-2.85,1,0,.13,2.05,4.5);
 // A broad window, curtains and warm bedside lights.
 box(upper,0x78988d,-.5,1.15,-2.1,1.55,1.2,.07);box(upper,0xc5dfdd,-.5,1.15,-2.05,1.38,1.03,.04);
 box(upper,0xf6efdc,-.5,1.15,-2.01,.04,1.06,.035);box(upper,0xf6efdc,-.5,1.15,-2.01,1.4,.04,.035);
 for(const x of [-1.4,.4])box(upper,0xe5c6ad,x,1.17,-1.97,.26,1.45,.12);
 const bed=group(upper,-1.2,0,-.55);
 for(const x of [-.72,.72])for(const z of [-.88,.88])cylinder(bed,0x9b7856,x,.19,z,.07,.07,.34);
 box(bed,0xb68c62,0,.32,0,1.68,.22,2.1);box(bed,0xdbcbb0,0,.48,0,1.58,.16,2.0);
 box(bed,0xbaa385,0,.69,-1.03,1.74,1.05,.12);
 box(bed,0x8fa99b,0,.58,.23,1.62,.12,1.48);
 for(const x of [-.39,.39]){const pillow=ball(bed,0xf7edda,x,.63,-.71,.3,20);pillow.scale.set(.34,.095,.22)}
 for(let i=0;i<5;i++)box(bed,0xaec2ae,-.65+i*.32,.647,.47,.025,.008,.96);
 tag(bed,'bed');
 const cover=ball(upper,0x9db7a8,-1.2,1.04,.07,.5,24);cover.scale.set(.56,.15,.48);cover.visible=false;
 const nightstand=group(upper,.1,0,-1.25);box(nightstand,0xbd9e74,0,.29,0,.57,.55,.53);box(nightstand,0xe1cfa9,0,.31,.28,.45,.32,.02);ball(nightstand,0x8e7554,0,.32,.31,.035);
 cylinder(nightstand,0xb89963,0,.7,0,.025,.025,.28);cylinder(nightstand,0xf3db9b,0,.91,0,.14,.24,.24);tag(nightstand,'bed');
 const lamp=new T.PointLight(0xffd6a0,.7,4);lamp.position.set(.1,1,-1.25);upper.add(lamp);
 const rug=box(upper,0xcbb597,.7,.04,.9,2.15,.035,1.2);
 const writing=group(upper,1.5,0,.7);box(writing,0xb3936d,0,.72,0,1.2,.1,.65);
 for(const x of [-.48,.48])for(const z of [-.25,.25])box(writing,0x9a7b56,x,.35,z,.07,.7,.07);
 box(writing,0x708d79,-.14,.8,.06,.42,.05,.29);box(writing,0xf7ebd5,-.14,.835,.06,.37,.018,.25);tag(writing,'journal');
 const shelf=group(upper,1.62,0,-1.75);for(const x of [-.48,.48])box(shelf,0xac8b62,x,.7,0,.06,1.4,.4);for(const y of [.1,.65,1.2]){box(shelf,0xbd9c73,0,y,0,1.04,.07,.42);for(let i=0;i<6;i++)box(shelf,[0x8ba39a,0xc3a16e,0xbf8f7b][i%3],-.34+i*.12,y+.2,0,.09,.32,.22)}tag(shelf,'journal');
 // Exterior-side staircase leaves the ground-floor furniture intact.
 for(let i=0;i<15;i++){const h=(i+1)*2.7/15,z=1.65-i*.23;box(stairs,0xb49369,3.25,h/2,z,.9,h,.245);if(i%3===0){box(stairs,0x917353,3.68,h+.34,z,.045,.7,.045)}}
 box(stairs,0xb49369,2.85,2.6,-1.7,1.05,.2,.55);tag(stairs,'stairs');
 for(const x of [-2.6,-1.9,-1.2,-.5,.2,.9,1.6,2.3])box(upper,0xb6946a,x,.4,2.15,.045,.75,.045);
 box(upper,0xb6946a,-.15,.8,2.15,5.35,.055,.07);
 return {upper,cover,show(floor){upper.visible=floor===1},sleep(v){cover.visible=v}};
}
