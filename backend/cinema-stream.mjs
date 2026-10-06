import {Readable} from 'node:stream';
import {cinemaFilms} from '../dist/cinema-catalog.js';
import {fail} from './store.mjs';
export async function cinemaStream(req,res,id,{fetcher=fetch}={}){
 const film=cinemaFilms.find(f=>f.id===id);fail(film,'影片不存在',404);
 const range=req.headers.range;fail(!range||/^bytes=(?:\d+-\d*|-\d+)$/.test(range),'播放范围无效',416);
 const controller=new AbortController(),stop=()=>controller.abort();res.once('close',stop);
 const timer=setTimeout(stop,20000);let upstream;
 try{upstream=await fetcher(film.source,{method:req.method==='HEAD'?'HEAD':'GET',headers:range?{Range:range}:{},redirect:'error',signal:controller.signal});clearTimeout(timer);fail([200,206,416].includes(upstream.status),'片源暂时无法连接，请稍后重试',502);
 const headers={'Content-Type':'video/mp4','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'};for(const k of ['content-length','content-range','accept-ranges'])if(upstream.headers.get(k))headers[k]=upstream.headers.get(k);res.writeHead(upstream.status,headers);
 if(req.method==='HEAD'||!upstream.body)return res.end();await new Promise((resolve,reject)=>{const stream=Readable.fromWeb(upstream.body);stream.on('error',reject);res.once('finish',resolve);res.once('close',resolve);stream.pipe(res)});
 }catch(error){if(res.destroyed&&controller.signal.aborted)return;throw error}finally{clearTimeout(timer);res.removeListener('close',stop);if(!res.writableFinished)controller.abort()}
}
