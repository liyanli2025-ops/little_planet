export function weatherKind(code){
 if([71,73,75,77,85,86].includes(code))return {mode:'snow',icon:'❄',label:'下雪'};
 if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code))return {mode:'rain',icon:'☂',label:code>=95?'雷阵雨':[56,57,66,67].includes(code)?'冻雨':'下雨'};
 if([45,48].includes(code))return {mode:'sun',icon:'≋',label:'有雾',cloudy:true};
 if([2,3].includes(code))return {mode:'sun',icon:'☁',label:code===3?'阴天':'多云',cloudy:true};
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
