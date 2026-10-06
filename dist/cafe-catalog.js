import {upperSeats} from './cafe-upper-layout.js';
import {beachSeats} from './beach-seats.js';
import {cinemaSeats} from './cinema-catalog.js';
// Shared public-island menu and seat coordinates; all prices are zero.
export const cafeMenu=[
 {id:'cafe_latte',name:'拿铁',kind:'drink',color:0xcaa581},
 {id:'cafe_americano',name:'冰美式',kind:'drink',color:0x684635},
 {id:'cafe_mocha',name:'摩卡',kind:'drink',color:0x92684d},
 {id:'cafe_seabreeze',name:'海风',kind:'cocktail',color:0x68bcb5},
 {id:'cafe_sunset',name:'日落橙',kind:'cocktail',color:0xeaa36f},
 {id:'cafe_berry',name:'莓果气泡',kind:'cocktail',color:0xc0778c},
 {id:'cafe_strawberry',name:'草莓蛋糕',kind:'dessert',display:'cake_strawberry',serving:'cake_strawberry_slice'},
 {id:'cafe_chocolate',name:'巧克力蛋糕',kind:'dessert',display:'cake_chocolate',serving:'cake_chocolate_slice'},
 {id:'cafe_cherry',name:'樱桃派',kind:'dessert',display:'pie_cherry',serving:'pie_cherry_slice'},
 {id:'cafe_cupcake',name:'草莓纸杯蛋糕',kind:'dessert',display:'cupcake',serving:'cupcake'},
 {id:'cafe_cinnamon',name:'肉桂卷',kind:'dessert',display:'cinnamon_roll',serving:'cinnamon_roll'},
 {id:'cafe_waffle',name:'奶油华夫饼',kind:'dessert',display:'waffle_stacked',serving:'waffle_stacked'}
];
export const cafeOutline=[[-7,0],[-6.6,-3.2],[-4.8,-4.7],[-1.3,-4.4],[1.2,-5],[4.3,-4.4],[6.7,-3.2],[7,0],[6.4,3.2],[4.6,4.6],[1.8,4.8],[0,3.9],[-2.4,4.8],[-5.8,4],[-7,1.6]];
export const cafeTables=[[-3.4,-.2],[-2.8,2.3],[0,2.5],[3.2,.9],[5.35,-.65]];
export const cafeSeats=cafeTables.flatMap(([x,z],table)=>[-1,1].map((side,i)=>({id:`t${table}-${i}`,table,x:x+side*.78,z,y:.68,yaw:side<0?Math.PI/2:-Math.PI/2}))).concat(
 [[-5.95,.6,-1.57],[-5.72,1.75,-1.30],[-5.1,2.85,-.95]].map(([x,z,yaw],i)=>({id:`window-${i}`,table:5,zone:'window',x,z,y:.68,yaw,approachX:x-Math.sin(yaw)*.65,approachZ:z-Math.cos(yaw)*.65})),
 [-3.65,-2.25,-.85].map((x,i)=>({id:`bar-${i}`,table:7,zone:'bar',x,z:-1.8,y:.95,avatarY:.79,yaw:Math.PI,approachX:x,approachZ:-1.05})),
 [2.8,4.2,5.6].map((x,i)=>({id:`terrace-${i}`,table:6,zone:'terrace',x,z:6.15,y:.68,yaw:0,approachZ:5.57}))
,cinemaSeats,beachSeats,upperSeats);
export function islandSky(now=Date.now()){
 const hour=((now/3600000+8)%24+24)%24;
 return {time:now,timezone:'Asia/Shanghai',hour,weather:'sun',night:hour<6||hour>=18,temperature:27};
}

// Keep walking inside the inset pavilion footprint, including the arrival deck.
export function cafeWalkable(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(x>=.65&&x<=6.9&&z>=5.0&&z<=7.15)return true;
 if(Math.abs(x)<1.25&&z>=3.5&&z<=6.2)return true;
 let inside=false;
 for(let i=0,j=cafeOutline.length-1;i<cafeOutline.length;j=i++){
  const [ax,az]=cafeOutline[i],[bx,bz]=cafeOutline[j];
  if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;
 }
 return inside&&Math.abs(x)<6.45&&z<4.05&&z>-3.8;
}
