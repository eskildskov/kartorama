import L from 'leaflet'
import { dynamicMapLayer } from 'esri-leaflet'
import '@geoman-io/leaflet-geoman-free'
import './vendor/leaflet-slider/leaflet-slider'
import 'leaflet-groupedlayercontrol'
import * as FileLayer from 'leaflet-filelayer'
import 'leaflet.locatecontrol'
import * as turf from '@turf/turf'
import './styles/index.scss'
import togeojson from './vendor/togeojson'
import '@raruto/leaflet-elevation'
import Elevation from './elevation'

const localStorage = window.localStorage
const map = L.map('map', { zoomControl: false })
const attributionKartverket =
  '<a href="http://www.kartverket.no/">Kartverket</a>'
const subdomainsKartverket = ['opencache', 'opencache2', 'opencache3']

const attributionNVE = '<a href="https://www.nve.no/">NVE</a>'

// hack: https://github.com/makinacorpus/Leaflet.FileLayer/issues/60
FileLayer(null, L, togeojson)

//
// LAYERS
//

let activeOverlay
let selectedRouteLayer

const rasterBaseMap = L.tileLayer(
  'https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster4&zoom={z}&x={x}&y={y}',
  {
    attribution: attributionKartverket,
    subdomains: subdomainsKartverket
  }
)

const vectorBaseMap = L.tileLayer(
  'https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}',
  {
    attribution: attributionKartverket,
    subdomains: subdomainsKartverket
  }
)

const kastOverlayMap = dynamicMapLayer(
  {
    url:
      'https://gis3.nve.no/map/rest/services/Mapservices/KlassifiseringSkredterreng/MapServer',
    layers: [4, 5, 6, 7]
  },
  {
    attribution: attributionNVE
  }
)

const steepnessOverlayMap = dynamicMapLayer(
  {
    url:
      'http://gis2.ngi.no/arcgistemp/rest/services/Skred/BratteOmrApp/MapServer',
    layers: [4, 5, 6, 7]
  },
  {
    attribution: attributionNVE
  }
)

const baseMaps = {
  Vektorkart: vectorBaseMap,
  Rasterkart: rasterBaseMap
}

const overlayMaps = {
  Helning: steepnessOverlayMap,
  AutoKAST: kastOverlayMap
}

const groupedOverlays = {
  Tillegg: {
    Helning: steepnessOverlayMap,
    AutoKAST: kastOverlayMap
  }
}

//
// INIT MAP AND LAYERS WITH SAVED STATE
//
const activeBaseLayerName = localStorage.getItem('activeBaseLayerName')
  ? localStorage.getItem('activeBaseLayerName')
  : 'Vektorkart'
if (activeBaseLayerName) {
  map.addLayer(baseMaps[activeBaseLayerName])
}

const activeOverlayName = localStorage.getItem('activeOverlayName')
  ? localStorage.getItem('activeOverlayName')
  : 'Helning'
map.addLayer(overlayMaps[activeOverlayName])
activeOverlay = overlayMaps[activeOverlayName]

const currentOpacity = localStorage.getItem('currentOpacity')
  ? localStorage.getItem('currentOpacity')
  : 0
activeOverlay.setOpacity(currentOpacity)

const center = localStorage.getItem('currentCenter')
  ? JSON.parse(localStorage.getItem('currentCenter'))
  : [62.5661863495104, 7.7187538146972665]

const zoom = localStorage.getItem('currentZoom')
  ? localStorage.getItem('currentZoom')
  : 8

map.setView(center, zoom)

// DRAWING OPTIONS
map.pm.setGlobalOptions({
  tooltips: false,
  allowSelfIntersection: true,
  markerStyle: { draggable: false },
  finishOn: null
})

// SET CONTROLS IN RIGHT ORDER
L.control.scale({ imperial: false, maxWidth: 200 }).addTo(map)
L.control
  .zoom({
    position: 'bottomleft'
  })
  .addTo(map)

map.pm.addControls({
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
})

const opacitySlider = L.control
  .slider(
    function (value) {
      activeOverlay.setOpacity(value)
    },
    {
      min: 0,
      max: 1.0,
      step: 0.01,
      position: 'bottomright',
      collapsed: false,
      syncSlider: true,
      title: 'Gjennomsiktighet',
      showValue: false,
      value: activeOverlay.options.opacity
    }
  )
  .addTo(map)

L.control
  .groupedLayers(baseMaps, groupedOverlays, {
    exclusiveGroups: ['Tillegg'],
    position: 'bottomright',
    collapsed: true
  })
  .addTo(map)

L.Control.FileLayerLoad.LABEL = "<span class='fa fa-file-upload'></span>"

const fileLayer = L.Control.fileLayerLoad({
  layer: L.geoJson,
  layerOptions: { style: { color: 'red' } },
  position: 'topleft',
  fileSizeLimit: 4000
}).addTo(map)

L.control
  .locate({
    position: 'bottomleft',
    initialZoomLevel: 15,
    icon: 'fa fa-map-marker-alt'
  })
  .addTo(map)

// DRAWING
// TO DO combine!
map.on('pm:drawstart', ({ workingLayer }) => {
  let currentDistance = 0
  const tooltip = L.tooltip()
  workingLayer.bindTooltip(tooltip)

  workingLayer.on('pm:vertexadded', e => {
    const lastPoint = e.latlng
    const lineGeoJSON = workingLayer.toGeoJSON()
    currentDistance = turf.length(lineGeoJSON)
    workingLayer.setTooltipContent(`${currentDistance.toFixed(1)} km`)
    workingLayer.openTooltip(e.latlng)

    map.on('mousemove', e => {
      const currentPoint = e.latlng

      const newDistance =
        map.distance(currentPoint, lastPoint) / 1000 + currentDistance
      workingLayer.setTooltipContent(`${newDistance.toFixed(1)} km`)
      workingLayer.openTooltip(e.latlng)
    })
  })
})

//
// SAVE STATE
//

opacitySlider.slider.addEventListener('click', function () {
  localStorage.setItem('currentOpacity', opacitySlider.slider.valueAsNumber)
})

function savePosition (e) {
  localStorage.setItem('currentCenter', JSON.stringify(map.getCenter()))
}

function saveZoom (e) {
  localStorage.setItem('currentZoom', map.getZoom())
}

function saveActiveBaseLayer (e) {
  localStorage.setItem('activeBaseLayerName', e.name)
}

function saveActiveOverlay (e) {
  localStorage.setItem('activeOverlayName', e.name)
}

map.on('baselayerchange', saveActiveBaseLayer)
map.on('overlayadd', saveActiveOverlay)
map.on('overlayadd', changeOverlayControl)
map.on('moveend', savePosition)
map.on('zoomend', saveZoom)

function changeOverlayControl (e) {
  activeOverlay = e.layer
  if (opacitySlider.slider.valueAsNumber === 0) {
    const val = 0.2
    activeOverlay.setOpacity(val)
    opacitySlider.slider.value = val
  } else {
    activeOverlay.setOpacity(opacitySlider.slider.value)
  }
}

// FILE LOADER

fileLayer.loader.on('data:error', function (error) {
  console.error(error)
})

fileLayer.loader.on('data:loaded', function (e) {
  addElevationToLayer(e.layer).then(layerWithElevation => {
    map.removeLayer(e.layer)
    map.addLayer(layerWithElevation)
    addTooltipToRoute(layerWithElevation)
  })
})

var elevationOptions = {
  theme: 'lime-theme',
  detached: false,
  // elevationDiv: '#elevationDiv', // if (detached), the elevation chart container
  autohide: true, // if (!detached) autohide chart profile on chart mouseleave
  collapsed: false, // if (!detached) initial state of chart profile control
  position: 'topright', // if (!detached) control position on one of map corners
  followMarker: false, // Autoupdate map center on chart mouseover.
  imperial: false, // Chart distance/elevation units.
  reverseCoords: false, // [Lat, Long] vs [Long, Lat] points. (leaflet default: [Lat, Long])
  summary: false,
  legend: false,
  width: 400,
  height: 150,
  responsive: true
}

const routeLayers = L.featureGroup()
map.on('click', () => {
  if (selectedRouteLayer) {
    routeLayers.eachLayer(function (layer) {
      hideElevationProfile(layer)
    })
  }
})

// return new layer with elevation
async function addElevationToLayer (routeLayer) {
  const geojson = routeLayer.toGeoJSON()
  const geojsonWithElevation = await Elevation.addElevationToGeojson(geojson)
  return L.geoJSON(geojsonWithElevation)
}

function addTooltipToRoute (routeLayer) {
  const geojsonWithElevation = routeLayer.toGeoJSON()
  routeLayer.distance = turf.length(geojsonWithElevation).toFixed(1)

  routeLayer.controlElevationProfile = L.control.elevation(elevationOptions)
  routeLayer.controlElevationProfile.addTo(map).loadData(geojsonWithElevation)

  console.log(Object.keys(routeLayer.controlElevationProfile._layers)[0])
  // routeLayer.controlElevationProfile.pathLayer =
  //   routeLayer.controlElevationProfile._layer[pathLayerKey]

  selectedRouteLayer = routeLayer

  const { elevationGain, elevationLoss } = sumElevation(geojsonWithElevation)

  const popupElement = document.createElement('p')
  popupElement.innerHTML = `Distanse: ${routeLayer.distance} km. Opp: ${elevationGain} m. Ned: ${elevationLoss} m. `

  const removeLayerLink = document.createElement('a')
  removeLayerLink.innerText = 'Slett spor'
  removeLayerLink.href = '#'
  removeLayerLink.onclick = () => {
    hideElevationProfile(routeLayer)
    routeLayer.remove()
  }
  popupElement.append(removeLayerLink)

  routeLayer.bindPopup(popupElement).openPopup()
  routeLayers.addLayer(routeLayer)

  map.off('mousemove')
  map.fitBounds(routeLayer.getBounds())
  routeLayer.on('click', e => {
    showElevationProfile(e.target)
  })
}

// When finished drawing
map.on('pm:create', e => {
  const geojson = e.layer.toGeoJSON()
  const newLayer = L.geoJSON(addPointsToLineString(geojson, 0.05))

  addElevationToLayer(newLayer).then(layerWithElevation => {
    map.removeLayer(e.layer)
    map.addLayer(layerWithElevation)
    addTooltipToRoute(layerWithElevation)
  })
})

function sumElevation (lineString) {
  let elevationGain = 0
  let elevationLoss = 0

  const elevations = turf.coordAll(lineString).map(coord => coord[2])
  let prevElevation = elevations.shift()

  elevations.forEach(elevation => {
    const diff = elevation - prevElevation

    if (diff > 10) {
      elevationGain += diff
      prevElevation = elevation
    } else if (diff < -10) {
      elevationLoss += diff
      prevElevation = elevation
    }
  })

  return {
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(-elevationLoss)
  }
}

function addPointsToLineString (lineString, distance) {
  const chunkedLineString = turf.lineChunk(lineString, distance)
  return turf.lineString(turf.coordAll(chunkedLineString))
}

function hideElevationProfile (layer) {
  layer.controlElevationProfile._container.style.display = 'none'
  const layers = layer.controlElevationProfile._layers._layers
  layers[Object.keys(layers)[0]].remove()
  selectedRouteLayer = null
}

function showElevationProfile (layer) {
  if (selectedRouteLayer) {
    hideElevationProfile(selectedRouteLayer)
  }
  layer.controlElevationProfile._container.style.display = 'block'
  const layers = layer.controlElevationProfile._layers._layers
  layers[Object.keys(layers)[0]].addTo(map)
  selectedRouteLayer = layer
}
