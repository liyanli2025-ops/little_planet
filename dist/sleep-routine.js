// Pure clock policy; no background timers or device timezone assumptions.
export function createSleepRoutine(now=Date.now()){
 let lastActivity=now,night=null,interrupted=false,automatic=false,returned=true;
 return {
 activity(at){lastActivity=at;if(night)interrupted=true},
 leave(){returned=true},
 decide({now,hour,date,sleeping,busy=false}){
  const isNight=hour>=22||hour<6;
  if(!isNight){night=null;interrupted=false;returned=false;const wake=automatic&&sleeping;automatic=false;return wake?'wake':null}
  // Use the previous date for the post-midnight part of the same sleep period.
  const day=new Date(date+'T12:00:00Z');if(hour<6)day.setUTCDate(day.getUTCDate()-1);
  const key=day.toISOString().slice(0,10);
  if(night!==key){night=key;interrupted=false}
  if(automatic&&!sleeping){automatic=false;interrupted=true}
  if(sleeping){returned=false;return null}
  if(busy)return null;
  if(returned||now-lastActivity>=(interrupted?3600000:60000)){
   returned=false;automatic=true;return 'sleep';
  }
  return null;
 }
 };
}
