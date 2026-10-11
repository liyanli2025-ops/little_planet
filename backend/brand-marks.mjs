import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../dist/assets/brand-marks.json',import.meta.url),'utf8'));
const normalize=v=>String(v).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const names=new Map(Object.entries(catalog).flatMap(([slug,v])=>[[normalize(slug),slug],[normalize(v.title),slug]]));
export const brandMark=name=>typeof name==='string'?names.get(normalize(name)):undefined;
