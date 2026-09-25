export const mediaLink=(value,kind='book',deep=false)=>{
 if(typeof value!=='string'||value.length>2048)return '';
 try{const u=new URL(value.trim());if(u.username||u.password)return '';if(deep&&kind==='book'&&u.protocol==='weread:')return u.href;
 if(u.protocol!=='https:'||u.port)return '';const root=kind==='book'?'weread.qq.com':'y.qq.com';return u.hostname===root||u.hostname.endsWith('.'+root)?u.href:''}catch{return ''}
};
const check=(ok,message,status=400)=>{if(!ok){const e=new Error(message);e.status=status;throw e}};
const text=(s,n,required=false)=>{check(typeof s==='string'&&s.length<=n&&(!required||s.trim()),'请填写有效的书名、歌曲名或留言');return s.trim()};
export function applyMedia(items,actor,paired,b,now=Date.now(),id=()=>crypto.randomUUID()){
 check(b&&[0,1].includes(b.world),'请选择星球');check(b.world===actor||paired,'请先配对',403);
 const kind=b.kind;check(['book','record'].includes(kind),'物品不存在');let event=null;
 const log=(title,body,shared,target=actor)=>event={id:id(),actor,world:b.world,target,title,body,shared,pending:false,kind:'life',created:now,weather:'',steps:[],comments:[]};
 if(b.type==='add'){
  check(kind!=='book'||b.world===actor,'请在自己的书架添加书',403);check(items.filter(x=>x.owner===b.world).length<1500,'书架和唱片架已满');
  const title=text(b.title,120,true),author=text(b.author||'',120),message=text(b.message||'',1000),url=mediaLink(b.url||'',kind);
  check(!b.url||url,'请填写 HTTPS 的微信读书或 QQ 音乐分享链接');check(kind!=='record'||url,'请粘贴 QQ 音乐分享链接');
  check(!b.shared||paired,'请先配对再分享',403);
  const shared=kind==='record'?!!paired:!!b.shared;
  items.push({id:id(),kind,owner:b.world,addedBy:actor,title,author,message,url,shared,created:now,source:'manual',received:false});
  log(kind==='book'?'把《'+title+'》放进书架':'留了一首《'+title+'》',kind==='book'?'书架上多了一本想读的书。':message||'听到这首歌的时候，想起了你。',shared,kind==='record'?b.world:actor);
 }else{
  const item=items.find(x=>x.id===b.id&&x.kind===kind&&x.owner===b.world&&(x.owner===actor||(paired&&x.shared)));
  check(item,'这件物品不存在或未分享',404);
  if(b.type==='share'){check(item.owner===actor,'只有主人可以分享书籍',403);check(typeof b.shared==='boolean','请选择分享状态');check(!b.shared||paired,'请先配对',403);item.shared=b.shared;if(!b.shared)item.shareProgress=false;}
  else if(b.type==='share-progress'){check(kind==='book'&&item.owner===actor,'只有主人可以分享阅读进度',403);check(typeof b.shared==='boolean','请选择分享状态');check(!b.shared||(paired&&item.shared),'请先分享这本书',403);item.shareProgress=b.shared;}
  else if(b.type==='remove'){check(item.addedBy===actor||item.owner===actor,'不能移走对方的物品',403);items.splice(items.indexOf(item),1);}
  else if(b.type==='note'){
   const body=text(b.message,1000,true);check(!b.shared||paired,'请先配对',403);
   log(kind==='book'?'读《'+item.title+'》时的一点感想':'听《'+item.title+'》时想说的话',body,!!b.shared,b.shared?b.world:actor);
  }else if(b.type==='receive'){
   check(kind==='record'&&item.owner===actor,'只能收下留给自己的唱片',403);check(!item.received,'已经收下这份心意了',409);item.received=true;
   log('收下了《'+item.title+'》这首留歌','谢谢你把听到的温柔留给我。',!!paired,actor);
  }else check(false,'操作不存在');
 }
 return event;
}
export const visibleMedia=(items,actor,paired)=>items.filter(x=>x.owner===actor||(paired&&x.shared)).map(x=>{const {readingLog,readUpdateTime,...visible}=x;if(x.owner===actor)return {...visible,readUpdateTime};if(x.shareProgress)return visible;const {progress,finished,...rest}=visible;return rest});

export function coverLink(value){if(typeof value!=='string'||value.length>2048)return '';try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port)return '';if(u.hostname!=='wfqqreader-1252317822.image.myqcloud.com'&&!['qpic.cn','qq.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return '';u.protocol='https:';return u.href}catch{return ''}}
