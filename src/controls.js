import * as FileLayer from 'leaflet-filelayer'
import togeojson from './vendor/togeojson'
import 'leaflet-groupedlayercontrol'
import 'leaflet.locatecontrol'
import { baseMaps, groupedOverlays } from './layers'
import L from 'leaflet'

export const scaleControl = L.control.scale({ imperial: false, maxWidth: 200 })
export const zoomControl = L.control.zoom({
  position: 'bottomleft'
})

export const drawingOpts = {
  position: 'bottomleft',
  drawCircle: false,
  drawMarker: false,
  drawCircleMarker: false,
  drawRectangle: false,
  drawPolygon: false,
  dragMode: false,
  cutPolygon: false,
  removalMode: false,
  editMode: false,
  drawPolyline: true
}

export const layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, {
  exclusiveGroups: ['Tillegg'],
  position: 'bottomright',
  collapsed: true
})

// hack: https://github.com/makinacorpus/Leaflet.FileLayer/issues/60
FileLayer(null, L, togeojson)
L.Control.FileLayerLoad.LABEL = "<span class='fa fa-file-upload'></span>"

export const fileControl = L.Control.fileLayerLoad({
  layer: L.geoJson,
  layerOptions: { style: { color: 'red' } },
  position: 'topleft',
  fileSizeLimit: 4000
})

export const locateControl = L.control.locate({
  position: 'bottomleft',
  initialZoomLevel: 15,
  icon: 'fa fa-map-marker-alt'
})
