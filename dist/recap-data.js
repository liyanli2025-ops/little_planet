export function recapKind(title=''){
 if(/送来.*装扮/.test(title))return 'gift';
 if(/睡|休息|被子/.test(title))return 'sleep';
 if(/单词|书|阅读/.test(title))return 'read';
 if(/歌|音乐|唱片/.test(title))return 'music';
 if(/做|烹饪|端|煮/.test(title))return 'cook';
 if(/吃|喝|餐/.test(title))return 'eat';
 if(/种|浇|采摘|花|收获/.test(title))return 'garden';
 if(/洗|刷牙/.test(title))return 'wash';
 if(/散步|遛|走/.test(title))return 'walk';
 return 'moment';
}
export function recapEvents(events,actor,since,until=Date.now()){
 if(!Number.isFinite(since)||since<=0)return [];
 const seen=new Set();return events.filter(e=>e&&e.world===actor&&[0,1].includes(e.actor)&&e.actor!==actor&&!e.pending&&(e.shared||e.target===actor)&&Number.isFinite(e.created)&&e.created>since&&e.created<=until&&typeof e.id==='string'&&!seen.has(e.id)&&seen.add(e.id)).sort((a,b)=>a.created-b.created||a.id.localeCompare(b.id)).map(e=>({id:e.id,actor:e.actor,world:e.world,created:e.created,title:e.title,kind:recapKind(e.title)}));
}
