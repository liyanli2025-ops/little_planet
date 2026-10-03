const spans={wardrobe:2.9,garden:3.5,seat:2.2,reading:2.2,cooking:2.4,social:3.1,hammock:3.7,bench:3.2,camp:4.5,basketball:5};
export function framingDistance(kind,fov,aspect,fallback){const span=spans[kind];return span?span/(2*Math.tan(fov*Math.PI/360)*Math.min(1,aspect)):fallback;}
export function roomPolar(value){return Math.max(.22,Math.min(1.35,value));}
export function createFramingMemory(){let current=null;const zooms=new Map();return {select(key,zoom){if(key===current)return zoom;if(current!==null)zooms.set(current,zoom);current=key;return zooms.get(key)??1;},reset(){current=null;zooms.clear();}};}
