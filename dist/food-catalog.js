import {recipes} from './recipe-catalog.js';
// Shared by inventory validation, stocking UI and the 3D food models.
const rows=[
 ['cola','可乐','🥤','乳品饮料','can',0xc75042],
 ['milk','草莓牛奶','🥛','乳品饮料','carton',0xe4b2b5],['yogurt','酸奶','🥛','乳品饮料','cup',0xb9d4ce],['cheese','奶酪','🧀','乳品饮料','cheese',0xe9bf63],['butter','黄油','🧈','乳品饮料','wrapped',0xe8d69c],['cream','淡奶油','🥛','乳品饮料','carton',0xe4d9bc],['juice','橙汁','🧃','乳品饮料','carton',0xe8b254],['soymilk','豆奶','🥛','乳品饮料','carton',0xbfd0a5],['water','矿泉水','💧','乳品饮料','bottle',0xa6cbd8],['tea','柠檬茶','🍋','乳品饮料','bottle',0xc7b277],['soda','气泡水','🥤','乳品饮料','can',0xb6cdb1],['coffee','冰咖啡','☕','乳品饮料','cup',0xb3967b],
 ['flour','面粉','🌾','果蔬食材','wrapped',0xe7d9bd,false],
 ['egg','鸡蛋','🥚','果蔬食材','egg',0xecd6b7,false],['tomato','番茄','🍅','果蔬食材','tomato',0xd96c54],['carrot','胡萝卜','🥕','果蔬食材','carrot',0xe7a051],['cucumber','黄瓜','🥒','果蔬食材','longveg',0x6a9560],['lettuce','生菜','🥬','果蔬食材','leaves',0x9bb674],['broccoli','西兰花','🥦','果蔬食材','broccoli',0x71945b,false],['pepper','彩椒','🫑','果蔬食材','pepper',0xe5b454],['mushroom','蘑菇','🍄','果蔬食材','mushroom',0xc6a17e,false],['tofu','豆腐','◻','果蔬食材','tray',0xf0e5cb,false],
 ['strawberry','草莓','🍓','水果','berry',0xd96d76],['apple','苹果','🍎','水果','apple',0xcc6e53],['orange','橙子','🍊','水果','orange',0xe7a550],['grapes','葡萄','🍇','水果','grapes',0x9582ac],['blueberry','蓝莓','🫐','水果','berries',0x697f9b],['lemon','柠檬','🍋','水果','lemon',0xe9c95f],['watermelon','西瓜切块','🍉','水果','melon',0xd97970],['peach','桃子','🍑','水果','peach',0xe5b0a0],
 ['pudding','焦糖布丁','🍮','甜点点心','pudding',0xe4c07a],['cookie','黄油曲奇','🍪','甜点点心','cookies',0xc59d65],['cake','小蛋糕','🍰','甜点点心','cake',0xe8cdb0],['sandwich','三明治','🥪','甜点点心','sandwich',0xdcb986],['bread','吐司面包','🍞','甜点点心','bread',0xe4c697],
 ['rice','米饭','🍚','熟食便当','rice',0xf2e8d0],['noodles','面条','🍜','熟食便当','noodles',0xe6c479],['skewers','烤肉串','🍢','熟食便当','skewers',0xac7248],['roujiamo','肉夹馍','🥙','熟食便当','roujiamo',0xdcb980],['salad','蔬菜沙拉','🥗','熟食便当','salad',0x9bb66b],['sushi','寿司','🍣','熟食便当','sushi',0xedaa8c],['chickenmeal','鸡肉便当','🍱','熟食便当','meal',0xc89762],
 ['jam','草莓果酱','🍓','酱料小菜','jar',0xb56768],['pickles','腌黄瓜','🥒','酱料小菜','jar',0x829a66],['sauce','番茄酱','🍅','酱料小菜','bottle',0xbe6550],
 ['icecream','冰淇淋','🍨','冷冻食品','icecream',0xe6c5c0],['dumplings','速冻饺子','🥟','冷冻食品','dumplings',0xe8dfca,false],['bao','速冻包子','🥟','冷冻食品','bao',0xece0c8,false],['shrimp','虾仁','🦐','冷冻食品','shrimp',0xe5ac94,false],['fish','鱼排','🐟','冷冻食品','fish',0xd3b9a0,false],['beef','牛肉','🥩','冷冻食品','meat',0xb77973,false],['chicken','鸡胸肉','🍗','冷冻食品','meat',0xe4b3a1,false],['pork','猪肉','🥩','冷冻食品','meat',0xd39b92,false],['peas','豌豆玉米粒','🌽','冷冻食品','peas',0x9fb366,false]
];
export const foodCatalog=Object.fromEntries(rows.map(([id,name,emoji,category,shape,color,ready=true])=>[id,{id,name,emoji,category,shape,color,ready,zone:category==='冷冻食品'?'freezer':'chill'}]));
for(const r of Object.values(recipes))foodCatalog['cooked_'+r.id]={id:'cooked_'+r.id,name:r.name,emoji:r.icon,category:'做好的饭菜',shape:r.model,ready:true,zone:'chill',recipe:r.id};
export const foodCategories=[...new Set(rows.map(r=>r[3]))];
export const foodLabels=Object.fromEntries(Object.values(foodCatalog).map(f=>[f.id,[f.name,f.emoji]]));

export const drinkFoods=new Set(['cola','milk','juice','soymilk','water','tea','soda','coffee']);
