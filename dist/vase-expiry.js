export const VASE_TTL=72*60*60*1000;
// Keep the existing flower IDs for older renderers; timestamps belong to each stem.
export function expireVaseFlowers(state,now=Date.now()){
 let changed=false;
 for(const world of state.worlds){const life=world.life;if(!life?.vase)continue;const times=life.vasePlacedAt||[],flowers=[],kept=[];
 for(let i=0;i<life.vase.length;i++){let at=times[i];if(!Number.isSafeInteger(at)||at<0){at=now;changed=true}if(now-at>=VASE_TTL){changed=true;continue}flowers.push(life.vase[i]);kept.push(at)}
 if(times.length!==kept.length)changed=true;if(changed||life.vasePlacedAt){life.vase=flowers;life.vasePlacedAt=kept}
 }return changed;
}
