export const weatherLabels={sun:['☀','晴天'],cloudy:['🌤','多云'],overcast:['☁','阴天'],fog:['≋','雾'],haze:['≋','霾'],rain:['☂','雨天'],snow:['❄','雪天'],night:['☾','夜晚']};
// PM is a model estimate, not an official local haze observation.
export function environmentKind(snapshot,now=Date.now()){
 const k=weatherKind(snapshot.code),a=snapshot.airQuality;
 const polluted=!!a&&Math.abs(now-a.observedAt)<3*3600000&&(a.pm25>=75||a.pm10>=150);
 return {...k,mask:polluted,...(polluted&&!['rain','snow','fog'].includes(k.mode)?{mode:'haze',icon:'≋',label:'霾感 · 颗粒物偏高'}:{})};
}
export function weatherKind(code){
 if([71,73,75,77,85,86].includes(code))return {mode:'snow',icon:'❄',label:'下雪'};
 if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code))return {mode:'rain',icon:'☂',label:code>=95?'雷阵雨':[56,57,66,67].includes(code)?'冻雨':'下雨'};
 if([45,48].includes(code))return {mode:'fog',icon:'≋',label:'有雾',cloudy:true};
 if([2,3].includes(code))return {mode:code===3?'overcast':'cloudy',icon:'☁',label:code===3?'阴天':'多云',cloudy:true};
 return {mode:'sun',icon:'☀',label:[0,1].includes(code)?'晴朗':'天气未知'};
}
export function localParts(now=Date.now(),timezone){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(now);
 return Object.fromEntries(parts.map(p=>[p.type,p.value]));
}
export function skyTime(snapshot,now=Date.now()){
 const p=localParts(now,snapshot?.timezone),date=p.year+'-'+p.month+'-'+p.day;
 const solar=snapshot?.solar?.find(s=>{const d=localParts(s.rise,snapshot.timezone);return d.year+'-'+d.month+'-'+d.day===date});
 const night=solar?now<solar.rise||now>=solar.set:Number(p.hour)<6||Number(p.hour)>=18;
 return {text:p.hour+':'+p.minute,date,night,estimated:!solar};
}
