export const MIN_ZOOM=.5,MAX_ZOOM=10;
export const clampZoom=v=>Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Number.isFinite(v)?v:1));
