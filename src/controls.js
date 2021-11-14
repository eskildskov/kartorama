import './vendor/leaflet.filelayer.js';
import 'leaflet-groupedlayercontrol';
import 'leaflet.locatecontrol';
import L from 'leaflet';
import {baseMaps, groupedOverlays} from './layers.js';
import routeHandler from './routes.js';

export const scaleControl = L.control.scale({imperial: false, maxWidth: 200});
export const zoomControl = L.control.zoom({
	position: 'bottomleft',
});

export const layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, {
	exclusiveGroups: ['Tillegg'],
	position: 'bottomright',
	collapsed: true,
});

export const locateControl = L.control.locate({
	position: 'bottomleft',
	initialZoomLevel: 15,
	icon: 'fa fa-map-marker-alt',
});

// FILE LOADER

L.Control.FileLayerLoad.LABEL = "<span class='fa fa-file-upload'></span>";

export const fileControl = L.Control.fileLayerLoad({
	layer: L.geoJson,
	layerOptions: {style: {className: 'route'}},
	position: 'topleft',
	fileSizeLimit: 4000,
});
