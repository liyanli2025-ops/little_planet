// Offline residents use the owner's local clock, never the visitor's location.
export function residentHour(environment,now=Date.now()){
 const zone=environment?.snapshot?.timezone||environment?.timezone||'Asia/Shanghai';
 try{return Number(new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',hourCycle:'h23'}).format(now))}catch{return Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',hourCycle:'h23'}).format(now))}
}
export function residentPresence(owner,environment,outfit='plain',now=Date.now()){
 const hour=residentHour(environment,now),sleeping=hour>=22||hour<6;
 return {resident:true,actor:owner.slot,identity:owner.avatar,world:owner.slot,room:sleeping,floor:sleeping?1:0,sleeping,listening:false,outfit};
}
