// Keep product constraints at the final 3D boundary, independent of LLM compliance.
export function generationPrompt(plan,scope){
 const subject=plan.description.trim();
 const rule=scope==='outfit'?'只生成这一件独立穿戴物品本身。禁止人物、人脸、头发、人体、熊、模特、人台、底座、背景、照片或展示卡片。模型须是真实立体物品，不是印有人像的平面。适合圆润玩具熊。':'只生成这一件独立家具本身。禁止人物、动物、房间、地板、底座、背景或展示卡片。';
 const attachment=scope==='outfit'&&plan.wearable?.slot==='hat'?'头部佩戴物：底部留出佩戴空间，中心对称，正面朝+Z。':'';
 const prompt=subject+'。'+rule+attachment;
 if(Buffer.byteLength(prompt)>1024)throw Object.assign(new Error('物品描述过长，请缩短细节后重试'),{status:422});
 return prompt;
}
export function initialPlacement(plan){
 if(plan.operation==='asset_create'&&plan.wearable?.slot==='hat')return {...plan,wearable:{...plan.wearable,x:0,y:0.24,z:0}};
 return plan;
}
