import fs from 'node:fs';
const cities=JSON.parse(fs.readFileSync(new URL('./geodata/cities.json',import.meta.url),'utf8'));
export function nearestPlace(lat,lon){if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;let best=null,min=Infinity;const rad=Math.PI/180;for(const [name,a,b] of cities){const d=2*6371*Math.asin(Math.sqrt(Math.min(1,Math.sin((a-lat)*rad/2)**2+Math.cos(a*rad)*Math.cos(lat*rad)*Math.sin((b-lon)*rad/2)**2)));if(d<min){min=d;best=name}}return min<=100?best+(min>15?'附近':''):null}

