import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import './vendor/leaflet-slider/leaflet-slider'
import { scaleControl, zoomControl, layerControl, fileControl, locateControl, drawingOpts } from './controls'
import * as turf from '@turf/turf'
import '@raruto/leaflet-elevation'
import Elevation from './elevation'
// import './vendor/leaflet-sidebar/L.Control.Sidebar'
import Vue from 'vue'
import Buefy from 'buefy'
import Routes from './routes/src/Routes.vue'
import routesData from './routes/data/routes.json'
import EventBus from './routes/src/EventBus'

import {
  baseMaps,
  overlayMaps
} from './layers'
// import Routes from './routes/routes'

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

const opacitySlider = L.control.slider(
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

// DRAWING OPTIONS
map.pm.setGlobalOptions({
  tooltips: false,
  allowSelfIntersection: true,
  markerStyle: { draggable: false },
  finishOn: null
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
// STATE
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

// const sidebar = L.control.sidebar('sidebar', {
//   position: 'right'
// })

// map.addControl(sidebar)
// sidebar.show()


Vue.use(Buefy)

const vm = new Vue({
  el: '#sidebar-content',
  template: '<Routes/>',
  components: { Routes }
})

const style = {
  color: 'red',
}

const routesWithGeoJSON = routesData.filter(route => route.geoJSON != '')

const routeArr = {}
routesWithGeoJSON.forEach(r => {
  const routeL = L.geoJSON(r.geoJSON, { style: style })
  routeL.routeId = r.route_id
  routeArr[r.route_id] = routeL
})


const geoJSONLayerGroup = L.layerGroup(Object.values(routeArr))
geoJSONLayerGroup.addTo(map)

geoJSONLayerGroup.eachLayer(layer => {
  layer.on('click', layer => {
    console.log(layer.target.routeId)
    EventBus.$emit('route-selected', layer.target.routeId)

  })
})


EventBus.$on('route-selected', routeId => {
  if (selectedRouteLayer) {
    selectedRouteLayer.resetStyle()
  }


  selectedRouteLayer = routeArr[routeId]
  selectedRouteLayer.setStyle({ color: 'yellow' })
  map.fitBounds(selectedRouteLayer.getBounds())

})




