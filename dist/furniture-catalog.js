// Shared catalogue: the renderer, text tool and placement validator use the same types.
export const furnitureGroups={furniture:'家具',textile:'软装',decor:'装饰',plant:'植物'};
const item=(label,group,variants,mounts,size)=>({label,group,variants,mounts,size});
export const furnitureCatalog={
 sofa:item('沙发','furniture',['classic'],['floor'],[1.9,.95,.8]),
 table:item('茶几','furniture',['pedestal','tripod'],['floor'],[.8,.45,.6]),
 sideTable:item('边几','furniture',['pedestal','shelf'],['floor'],[.45,.6,.4]),
 nightstand:item('床头柜','furniture',['drawer','open'],['floor'],[.5,.58,.42]),
 stool:item('矮凳','furniture',['upholstered','wood'],['floor'],[.48,.42,.44]),
 lamp:item('落地灯','furniture',['classic'],['floor'],[.35,1.5,.35]),
 rug:item('地毯','textile',['classic'],['floor'],[1.5,.035,1]),
 cushion:item('靠垫','textile',['piped','tufted'],['sofa'],[.4,.36,.14]),
 blanket:item('毯子','textile',['fringe','knit'],['sofa'],[.48,.65,.38]),
 curtain:item('窗帘','textile',['drape','tieback'],['window'],[.38,1.3,.1]),
 vase:item('花器','decor',['bottle','bowl'],['table','desk'],[.22,.3,.22]),
 tray:item('托盘','decor',['oval','handled'],['table','desk'],[.38,.06,.25]),
 frame:item('相框','decor',['arch','rectangle'],['table','desk'],[.25,.3,.12]),
 sculpture:item('小摆件','decor',['bird','pebble'],['table','desk'],[.22,.24,.18]),
 wallArt:item('挂画','decor',['landscape','abstract'],['wall'],[.65,.5,.04]),
 clock:item('挂钟','decor',['round','pendulum'],['wall'],[.35,.5,.08]),
 plant:item('盆栽','plant',['leaf','flower'],['table','desk','floor'],[.25,.5,.25]),
 floorPlant:item('大型绿植','plant',['palm','ficus'],['floor'],[.5,1.1,.5]),
 hangingPlant:item('垂吊绿植','plant',['basket','ceramic'],['wall'],[.35,.65,.3])
};
export const standardKind=type=>type==='stool'?'seat':['sofa','lamp','rug'].includes(type)?type:'decor';
