// Exercises the same language tool contract as the webpage; no 3D request or persistent user writes.
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {resolveDesignEnv} from './ai-provider.mjs';
import {createDesignService} from './design.mjs';
import {createStudio} from './studio.mjs';
const env=resolveDesignEnv(process.env);
if(!env.AI_API_KEY||env.AI_BASE_URL!=='https://tokenhub.tencentmaas.com/v1'){
 console.error('尚未启用腾讯文字服务，请检查 TENCENT_3D_API_KEY 和 AI_TEXT_PROVIDER');process.exit(1);
}
console.log('文字服务：腾讯 TokenHub；模型：'+env.AI_MODEL);
console.log('仅验证一次文字设计流程（失败格式最多补试一次），不生成 3D、不保存到用户账号。按文字接口额度计费。');
const db=new DatabaseSync(':memory:');
try{
 const design=createDesignService(db,{env});
 const s=createStudio(db,{env,design,theme:()=>0,partner:()=>null});
 const j=await s.start(1,{scope:'outfit',version:0,prompt:'设计一条浅蓝色条纹半身裙',requestId:randomUUID()});
 const p=s.get(1,j.job).result;
 if(!p?.values?.tailoring)throw Error('缺少服饰参数');
 console.log('通过：腾讯已返回完整服饰参数，并通过网页使用的方案校验。');
}catch(e){console.error(String(e.message).replaceAll(env.AI_API_KEY,'[隐藏]'));process.exitCode=1}finally{db.close()}
