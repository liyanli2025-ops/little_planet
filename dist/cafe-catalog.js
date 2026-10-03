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
export const cafeTables=[[-2.75,1.95],[0,1.95],[2.75,1.95],[-3.0,-.5],[3.0,-.5]];
export const cafeSeats=cafeTables.flatMap(([x,z],table)=>[-1,1].map((side,i)=>({id:`t${table}-${i}`,table,x:x+side*.78,z,y:.68,yaw:side<0?Math.PI/2:-Math.PI/2})));
export function islandSky(now=Date.now()){
 const hour=((now/3600000+8)%24+24)%24,slot=Math.floor(now/10800000),wet=((slot*17+13)%19+19)%19<3;
 return {time:now,timezone:'Asia/Shanghai',hour,weather:wet?'rain':'sun',night:hour<6||hour>=18.5,temperature:wet?24:27};
}
