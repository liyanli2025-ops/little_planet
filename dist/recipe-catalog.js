// The same recipe IDs are used by the kitchen, rendered meals and save validation.
const rows=[
 ['omelet','番茄蛋包饭','🍛',{rice:1,egg:1,tomato:1},'meal','stir'],['toast','暖心蒸蛋','🍲',{egg:1},'pudding','stir'],['milk','热草莓牛奶','🥛',{milk:1},'milk','warm'],
 ['friedrice','蛋炒饭','🍚',{rice:1,egg:1,peas:1},'rice','stir'],['beefrice','牛肉饭','🍛',{rice:1,beef:1,carrot:1},'meal','stir'],['chickenrice','鸡肉饭','🍱',{rice:1,chicken:1,broccoli:1},'chickenmeal','stir'],['shrimprice','鲜虾炒饭','🍤',{rice:1,shrimp:1,egg:1},'rice','stir'],
 ['tomatonoodles','番茄鸡蛋面','🍜',{flour:1,tomato:1,egg:1},'noodles','pull'],['beefnoodles','牛肉拉面','🍜',{flour:1,beef:1,lettuce:1},'noodles','pull'],['shrimpnoodles','鲜虾拉面','🍜',{flour:1,shrimp:1,mushroom:1},'noodles','pull'],['mushroomnoodles','菌菇拉面','🍜',{flour:1,mushroom:1,lettuce:1},'noodles','pull'],
 ['porkdumplings','猪肉蔬菜饺子','🥟',{flour:1,pork:1,lettuce:1},'dumplings','fold'],['shrimpdumplings','鲜虾饺子','🥟',{flour:1,shrimp:1,egg:1},'dumplings','fold'],['vegdumplings','三鲜素饺','🥟',{flour:1,mushroom:1,carrot:1,egg:1},'dumplings','fold'],['steamedbao','鲜肉包子','🥟',{flour:1,pork:1},'bao','fold'],
 ['skewers','烤肉串','🍢',{beef:1,pepper:1},'skewers','stir'],['roujiamo','肉夹馍','🥙',{flour:1,pork:1,pepper:1},'roujiamo','fold'],['salad','缤纷蔬菜沙拉','🥗',{lettuce:1,tomato:1,cucumber:1},'salad','mix'],['fruitsalad','酸奶水果碗','🥣',{yogurt:1,strawberry:1,blueberry:1},'salad','mix'],
 ['sandwich','鸡蛋三明治','🥪',{bread:1,egg:1,lettuce:1},'sandwich','mix'],['sushi','鲜虾寿司','🍣',{rice:1,shrimp:1,cucumber:1},'sushi','fold'],['fishmeal','香煎鱼排','🐟',{fish:1,lemon:1,butter:1},'fish','stir'],['beefstew','番茄炖牛肉','🍲',{beef:1,tomato:1,carrot:1},'meal','stir'],['tofusoup','菌菇豆腐汤','🍲',{tofu:1,mushroom:1},'rice','stir'],['pudding','焦糖布丁','🍮',{milk:1,egg:1},'pudding','stir'],['cake','草莓小蛋糕','🍰',{flour:1,egg:1,cream:1,strawberry:1},'cake','mix']
];
export const recipes=Object.fromEntries(rows.map(([id,name,icon,needs,model,animation])=>[id,{id,name,icon,needs,model,animation}]));
