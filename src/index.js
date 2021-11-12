import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import './vendor/leaflet-slider/leaflet-slider'
import { scaleControl, zoomControl, layerControl, locateControl, drawingOpts } from './controls'
import * as turf from '@turf/turf'
import StateHandler from './state-handler'
import '@raruto/leaflet-elevation'
import Elevation from './elevation'
import {
  baseMaps,
  overlayMaps
} from './layers'

const localStorage = window.localStorage
const map = L.map('map', { zoomControl: false })
map.state = {}

let selectedRouteLayer

const stateHandler = StateHandler()
stateHandler.initState(map)
stateHandler.addStateHandlers(map)

map.opacitySlider = L.control.slider(
  function (value) {
    map.state.overlay.setOpacity(value)
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
    value: map.state.overlay.options.opacity
  }
)

// DRAWING OPTIONS
map.pm.setGlobalOptions({
  tooltips: false,
  allowSelfIntersection: true,
  markerStyle: { draggable: false },
  finishOn: null
})

scaleControl.addTo(map)
zoomControl.addTo(map)
map.opacitySlider.addTo(map)
layerControl.addTo(map)
// fileControl.addTo(map)
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
// STATE
//

map.opacitySlider.slider.addEventListener('click', function () {
  localStorage.setItem('currentOpacity', map.opacitySlider.slider.valueAsNumber)
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
  map.state.overlay = e.layer
  if (map.opacitySlider.slider.valueAsNumber === 0) {
    const val = 0.2
    map.state.overlay.setOpacity(val)
    map.opacitySlider.slider.value = val
  } else {
    map.state.overlay.setOpacity(map.opacitySlider.slider.value)
  }
}

// FILE LOADER

// fileControl.loader.on('data:error', function (error) {
//   console.error(error)
// })

// fileControl.loader.on('data:loaded', function (e) {
//   Elevation.addElevationToLayer(e.layer).then(layerWithElevation => {
//     map.removeLayer(e.layer)
//     map.addLayer(layerWithElevation)
//     addTooltipToRoute(layerWithElevation)
//   })
// })

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

