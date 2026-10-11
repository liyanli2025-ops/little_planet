import {inflateSync,deflateSync} from 'node:zlib';
// Lossless inspection crops, not a redesign. Unsupported formats keep the full image.
export function reviewCrops(bytes){try{
 if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return [];
 let header,parts=[];
 for(let i=8;i+12<=bytes.length;){const n=bytes.readUInt32BE(i),name=bytes.toString('ascii',i+4,i+8),data=bytes.subarray(i+8,i+8+n);if(name==='IHDR')header=data;if(name==='IDAT')parts.push(data);i+=12+n;}
 if(!header||header[8]!==8||![2,6].includes(header[9])||header[12]!==0)return [];
 const w=header.readUInt32BE(0),h=header.readUInt32BE(4),bpp=header[9]===6?4:3;if(w<128||h<128||w>2048||h>2048)return [];
 const stride=w*bpp,raw=inflateSync(Buffer.concat(parts),{maxOutputLength:(stride+1)*h});if(raw.length!==(stride+1)*h)return [];
 const pixels=Buffer.alloc(stride*h),paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<h;y++){const filter=raw[y*(stride+1)];if(filter>4)return [];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=bpp?pixels[i-bpp]:0,b=y?pixels[i-stride]:0,c=y&&x>=bpp?pixels[i-stride-bpp]:0;pixels[i]=(raw[y*(stride+1)+x+1]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}}
 const crc=b=>{let n=0xffffffff;for(const v of b){n^=v;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;};
 const chunk=(name,data)=>{const type=Buffer.from(name),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([length,type,data,sum]);};
 const result=[];for(const [x,y] of [[0,0],[.5,0],[0,.5],[.5,.5]]){const cw=Math.floor(w/2),ch=Math.floor(h/2),row=cw*bpp,out=Buffer.alloc((row+1)*ch),x0=Math.floor(x*w),y0=Math.floor(y*h);for(let j=0;j<ch;j++)pixels.copy(out,j*(row+1)+1,(y0+j)*stride+x0*bpp,(y0+j)*stride+x0*bpp+row);const hdr=Buffer.from(header);hdr.writeUInt32BE(cw,0);hdr.writeUInt32BE(ch,4);result.push('data:image/png;base64,'+Buffer.concat([bytes.subarray(0,8),chunk('IHDR',hdr),chunk('IDAT',deflateSync(out)),chunk('IEND',Buffer.alloc(0))]).toString('base64'));}return result;
 }catch{return [];}}
