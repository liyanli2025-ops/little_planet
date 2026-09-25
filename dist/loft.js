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
 // A tiled washroom occupies the rear-right corner.
 const bath=group(upper,1.48,0,-1.45);box(bath,0xd0ded3,0,.055,0,1.65,.07,1.25);for(let i=0;i<6;i++)box(bath,0xf2eee0,-.7+i*.28,.094,0,.012,.006,1.2);for(let i=0;i<5;i++)box(bath,0xf2eee0,0,.095,-.5+i*.25,1.6,.006,.012);
 box(bath,0xc0cdbd,-.85,.6,0,.08,1.2,1.35);box(bath,0xa6bca9,-.34,.42,-.25,.6,.75,.5);const basin=ball(bath,0xf5f0df,-.34,.81,-.25,.3,24);basin.scale.set(.34,.09,.26);const bowl=ball(bath,0xa3c6c1,-.34,.86,-.21,.2,24);bowl.scale.set(.23,.015,.16);cylinder(bath,0x88978b,-.34,1.0,-.43,.022,.022,.23);box(bath,0x88978b,-.34,1.11,-.36,.04,.035,.17);
 box(bath,0x94aa9c,-.34,1.44,-.66,.68,.69,.06);box(bath,0xc7dcd8,-.34,1.44,-.62,.57,.58,.02);
 cylinder(bath,0xece9dc,.47,.25,.06,.16,.21,.45);const seat=ball(bath,0xf5f0e4,.47,.48,.06,.24,20);seat.scale.set(.23,.065,.29);box(bath,0xf0ebdc,.47,.65,-.35,.44,.5,.19);tag(bath,'bathroom');
 const stream=cylinder(bath,0x9bd8d6,-.34,.97,-.29,.015,.015,.21);stream.visible=false;
 const wardrobe=group(upper,-2.3,0,1.25);box(wardrobe,0xb69572,0,.74,0,.82,1.48,.51);box(wardrobe,0x6f7964,0,.77,.27,.69,1.27,.015);const doors=[];for(const side of [-1,1]){const hinge=group(wardrobe,side*.4,0,.3);box(hinge,0xc2a580,-side*.195,.75,0,.39,1.4,.06);ball(hinge,0x8b7758,-side*.32,.8,.05,.025);doors.push(hinge)}for(const [i,c]of [0x82b3a0,0xd4a15c].entries())box(wardrobe,c,-.15+i*.3,.86,.28,.2,.62,.03);tag(wardrobe,'wardrobe');let opened=false,washLeft=0;
 // Exterior-side staircase leaves the ground-floor furniture intact.
 for(let i=0;i<15;i++){const h=(i+1)*2.7/15,z=1.65-i*.23;box(stairs,0xb49369,3.25,h/2,z,.9,h,.245);if(i%3===0){box(stairs,0x917353,3.68,h+.34,z,.045,.7,.045)}}
 box(stairs,0xb49369,2.85,2.6,-1.7,1.05,.2,.55);tag(stairs,'stairs');
 for(const x of [-2.6,-1.9,-1.2,-.5,.2,.9,1.6,2.3])box(upper,0xb6946a,x,.4,2.15,.045,.75,.045);
 box(upper,0xb6946a,-.15,.8,2.15,5.35,.055,.07);
 return {upper,cover,wardrobe(v){opened=v},wash(){washLeft=3},tick(dt){doors.forEach((g,i)=>g.rotation.y+=((opened?(i?1:-1)*1.3:0)-g.rotation.y)*.12);washLeft=Math.max(0,washLeft-dt);stream.visible=washLeft>0},show(floor){upper.visible=floor===1},sleep(v){cover.visible=v}};
}
