// Import * as FileLayer from 'leaflet-filelayer'
// import togeojson from './vendor/togeojson'
import 'leaflet-groupedlayercontrol';
import 'leaflet.locatecontrol';
import L from 'leaflet';
import {baseMaps, groupedOverlays} from './layers.js';

export const scaleControl = L.control.scale({imperial: false, maxWidth: 200});
export const zoomControl = L.control.zoom({
	position: 'bottomleft',
});

export const layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, {
	exclusiveGroups: ['Tillegg'],
	position: 'bottomright',
	collapsed: true,
});

// Hack: https://github.com/makinacorpus/Leaflet.FileLayer/issues/60
// FileLayer(null, L, togeojson)
// L.Control.FileLayerLoad.LABEL = "<span class='fa fa-file-upload'></span>"

// export const fileControl = L.Control.fileLayerLoad({
//   layer: L.geoJson,
//   layerOptions: { style: { color: 'red' } },
//   position: 'topleft',
//   fileSizeLimit: 4000
// })

export const locateControl = L.control.locate({
	position: 'bottomleft',
	initialZoomLevel: 15,
	icon: 'fa fa-map-marker-alt',
});
