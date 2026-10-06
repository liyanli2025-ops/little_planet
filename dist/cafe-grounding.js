import {detailBeachY} from './cafe-water-surface.js';
export function buildingGroundY(x,z,overview=false,scale=.65){return overview?(-18.25+Math.sqrt(17.845**2-(x*scale)**2-(z*scale)**2))/scale:detailBeachY(x,z)}
export function entranceStepTop(i,overview=false){return .20+(buildingGroundY(0,9.2,overview)+.02-.20)*(i+1)/16}
