import L from 'leaflet'
import { dynamicMapLayer } from 'esri-leaflet'

const attributionKartverket =
  '<a href="http://www.kartverket.no/">Kartverket</a>'
const subdomainsKartverket = ['opencache', 'opencache2', 'opencache3']

const attributionNVE = '<a href="https://www.nve.no/">NVE</a>'

export const rasterBaseMap = L.tileLayer(
  'https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster4&zoom={z}&x={x}&y={y}',
  {
    attribution: attributionKartverket,
    subdomains: subdomainsKartverket
  }
)

export const vectorBaseMap = L.tileLayer(
  'https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}',
  {
    attribution: attributionKartverket,
    subdomains: subdomainsKartverket
  }
)

export const kastOverlayMap = dynamicMapLayer(
  {
    url:
      'https://gis2.nve.no/arcgis/rest/services/wmts/KastWMTS/MapServer',
    layers: [0, 1, 2, 3]
  },
  {
    attribution: attributionNVE
  }
)

export const steepnessOverlayMap = L.tileLayer.wms(
  'https://gis3.nve.no/map/services/Bratthet/MapServer/WmsServer?',
  {
    layers: 'Bratthet_snoskred',
    format: 'image/png',
    transparent: 'true',
    attribution: attributionNVE
  }
)

export const baseMaps = {
  Vektorkart: vectorBaseMap,
  Rasterkart: rasterBaseMap
}

export const overlayMaps = {
  Helning: steepnessOverlayMap,
  AutoKAST: kastOverlayMap
}

export const groupedOverlays = {
  Tillegg: {
    Helning: steepnessOverlayMap,
    AutoKAST: kastOverlayMap
  }
}

export const layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, {
  exclusiveGroups: ['Tillegg'],
  position: 'bottomright',
  collapsed: true
})
