import L from 'leaflet'
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
import {
  baseMaps,
  overlayMaps,
  groupedOverlays
} from './layers'

const localStorage = window.localStorage
const map = L.map('map', { zoomControl: false })

let activeOverlay
let selectedRouteLayer

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
const scaleControl = L.control.scale({ imperial: false, maxWidth: 200 })
const zoomControl = L.control.zoom({
  position: 'bottomleft'
})

const drawingOpts = {
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
const layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, {
  exclusiveGroups: ['Tillegg'],
  position: 'bottomright',
  collapsed: true
})

// hack: https://github.com/makinacorpus/Leaflet.FileLayer/issues/60
FileLayer(null, L, togeojson)
L.Control.FileLayerLoad.LABEL = "<span class='fa fa-file-upload'></span>"

const fileControl = L.Control.fileLayerLoad({
  layer: L.geoJson,
  layerOptions: { style: { color: 'red' } },
  position: 'topleft',
  fileSizeLimit: 4000
})

const locateControl = L.control
  .locate({
    position: 'bottomleft',
    initialZoomLevel: 15,
    icon: 'fa fa-map-marker-alt'
  })

scaleControl.addTo(map)
zoomControl.addTo(map)
opacitySlider.addTo(map)
layerControl.addTo(map)
fileControl.addTo(map)
locateControl.addTo(map)
map.pm.addControls(drawingOpts)

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

fileControl.loader.on('data:error', function (error) {
  console.error(error)
})

fileControl.loader.on('data:loaded', function (e) {
  Elevation.addElevationToLayer(e.layer).then(layerWithElevation => {
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
  routeLayers.eachLayer(function (layer) {
    hideElevationProfile(layer)
  })
})

function addTooltipToRoute (routeLayer) {
  const geojsonWithElevation = routeLayer.toGeoJSON()
  routeLayer.distance = turf.length(geojsonWithElevation).toFixed(1)
  routeLayer.controlElevationProfile = L.control.elevation(elevationOptions)
  routeLayer.controlElevationProfile.addTo(map).loadData(geojsonWithElevation)
  const { elevationGain, elevationLoss } = Elevation.sumElevation(geojsonWithElevation)

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
  console.log(JSON.stringify(geojson))
  const newLayer = L.geoJSON(Elevation.addPointsToLineString(geojson, 0.05))

  Elevation.addElevationToLayer(newLayer).then(layerWithElevation => {
    map.removeLayer(e.layer)
    map.addLayer(layerWithElevation)
    addTooltipToRoute(layerWithElevation)
  })
})

function hideElevationProfile (layer) {
  layer.controlElevationProfile._container.style.display = 'none'
  layer.controlElevationProfile.layer.remove()
}

function showElevationProfile (layer) {
  if (selectedRouteLayer) {
    hideElevationProfile(selectedRouteLayer)
  }
  layer.controlElevationProfile._container.style.display = 'block'
  layer.controlElevationProfile.layer.addTo(map)
  selectedRouteLayer = layer
}
