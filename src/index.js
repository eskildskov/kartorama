import L from 'leaflet'
import { dynamicMapLayer } from 'esri-leaflet'
import '@geoman-io/leaflet-geoman-free'
import './vendor/leaflet-slider/leaflet-slider'
import 'leaflet-groupedlayercontrol'
import * as FileLayer from 'leaflet-filelayer'
import 'leaflet.locatecontrol'
import './vendor/NonTiledLayer.WCS'
import * as turf from '@turf/turf' // needs slimming
import './styles/index.scss'
import togeojson from './vendor/togeojson'
import '@raruto/leaflet-elevation'
// import addElevationToGeoJSON from './add-elevation'

const localStorage = window.localStorage

const attributionKartverket =
  '<a href="http://www.kartverket.no/">Kartverket</a>'
const attributionNVE = '<a href="https://www.nve.no/">NVE</a>'

const rasterBaseMap = L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster4&zoom={z}&x={x}&y={y}',
  {
    attribution: attributionKartverket
  }
)

const vectorBaseMap = L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}',
  {
    attribution: attributionKartverket
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

const steepnessOverlayMap = L.tileLayer.wms(
  'https://gis3.nve.no/map/services/Bratthet/MapServer/WmsServer?',
  {
    layers: 'Bratthet_snoskred',
    format: 'image/png',
    transparent: 'true',
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

const map = L.map('map', { zoomControl: false })

map.pm.setGlobalOptions({
  tooltips: true,
  allowSelfIntersection: true,
  markerStyle: { draggable: false },
  finishOn: null
})

let activeOverlay
let selectedRouteLayer

L.control.scale({ imperial: false, maxWidth: 200 }).addTo(map)
L.control
  .zoom({
    position: 'bottomleft'
  })
  .addTo(map)

function initMap () {
  const activeBaseLayerName = localStorage.getItem('activeBaseLayerName')
    ? localStorage.getItem('activeBaseLayerName')
    : 'Vektorkart'
  if (activeBaseLayerName) {
    map.addLayer(baseMaps[activeBaseLayerName])
  }

  const activeOverlayName = localStorage.getItem('activeOverlayName')
    ? localStorage.getItem('activeOverlayName')
    : 'Helning'
  localStorage.removeItem('activeOverlayName')
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
}

initMap()

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

const groupedOverlays = {
  Tillegg: {
    Helning: steepnessOverlayMap,
    AutoKAST: kastOverlayMap
  }
}
var slider = L.control
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
map.on('moveend', savePosition)
map.on('zoomend', saveZoom)

function changeOverlayControl (e) {
  activeOverlay = e.layer
  if (slider.slider.value === 0) {
    const val = 0.2
    activeOverlay.setOpacity(val)
    slider.slider.value = val
  } else {
    activeOverlay.setOpacity(slider.slider.value)
  }
}

map.on('overlayadd', changeOverlayControl)

slider.slider.addEventListener('click', function () {
  localStorage.setItem('currentOpacity', slider.slider.value)
})

// hack: https://github.com/makinacorpus/Leaflet.FileLayer/issues/60
FileLayer(null, L, togeojson)

L.Control.FileLayerLoad.LABEL = ''

const fileLayer = L.Control.fileLayerLoad({
  layer: L.geoJson,
  layerOptions: { style: { color: 'red' } },
  position: 'topleft',
  fileSizeLimit: 4000
}).addTo(map)

fileLayer.loader.on('data:error', function (error) {
  console.error(error)
})

fileLayer.loader.on('data:loaded', function (e) {
  map.once('zoomend moveend', () => {
    elevationDataLayer.addTo(map)
    routeLayers.addLayer(e.layer)
    e.layer.on('click', e => {
      showElevationProfile(e.target)
    })

    const geoJSON = e.layer.toGeoJSON()
    console.log(geoJSON)
    elevationDataLayer.once('load', () => {
      turf.coordEach(geoJSON, coord => {
        const containerPoint = map.latLngToContainerPoint([coord[1], coord[0]])

        // TO DO: implement missing data handling!
        coord.push(elevationDataLayer.getValueAtPoint(containerPoint))
      })

      // TO DO refactor this to a function
      e.layer.controlElevationProfile = L.control.elevation(elevationOptions)
      e.layer.controlElevationProfile.addTo(map).loadData(geoJSON)

      e.layer.distance = turf.length(geoJSON).toFixed(1)

      // add this to e.layer
      const { elevationGain, elevationLoss } = sumElevation(geoJSON)

      e.layer
        .bindPopup(() => {
          return `Distanse: ${e.layer.distance} km. Opp: ${elevationGain} m. Ned: ${elevationLoss} m.`
        })
        .openPopup()
    })
  })
})

L.control
  .locate({
    position: 'bottomleft',
    initialZoomLevel: 15,
    icon: 'fa fa-map-marker-alt'
  })
  .addTo(map)

const elevationDataLayer = L.nonTiledLayer.wcs(
  'https://openwms.statkart.no/skwms1/wcs.dtm?',
  {
    wcsOptions: {
      coverage: 'land_utm33_10m',
      colorScale: false
    }
  }
)

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

map.on('pm:create', e => {
  routeLayers.addLayer(e.layer)
  let geoJSON = e.layer.toGeoJSON()
  geoJSON = addPointsToLineString(geoJSON, 0.2)
  e.layer.distance = turf.length(geoJSON).toFixed(1)

  const elevationData = new AddElevationToGeoJSON(geoJSON)
  elevationData.geoJSONWithElevation().then(geoJSONWithElevation => {
    // TO DO refactor this to a function
    e.layer.controlElevationProfile = L.control.elevation(elevationOptions)
    e.layer.controlElevationProfile.addTo(map).loadData(geoJSONWithElevation)
    const { elevationGain, elevationLoss } = sumElevation(geoJSONWithElevation)

    const popupElement = document.createElement('p')
    popupElement.innerHTML = `Distanse: ${e.layer.distance} km. Opp: ${elevationGain} m. Ned: ${elevationLoss} m. `

    const removeLayerLink = document.createElement('a')
    removeLayerLink.innerText = 'Slett spor'
    removeLayerLink.href = '#'
    removeLayerLink.onclick = () => {
      hideElevationProfile(e.layer)
      e.layer.remove()
    }
    popupElement.append(removeLayerLink)

    e.layer.bindPopup(popupElement).openPopup()
    routeLayers.eachLayer(layer => {
      console.log(layer.toGeoJSON())
    })
  })

  map.off('mousemove')
  map.fitBounds(e.layer.getBounds())
  e.layer.on('click', e => {
    showElevationProfile(e.target)
  })
})

function sumElevation (lineString) {
  let elevationGain = 0
  let elevationLoss = 0

  const elevations = turf.coordAll(lineString).map(coord => coord[2])
  let prevElevation = elevations.shift()

  elevations.forEach(elevation => {
    const diff = elevation - prevElevation

    if (diff > 0) {
      elevationGain += diff
    } else {
      elevationLoss += diff
    }

    prevElevation = elevation
  })

  return {
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(-elevationLoss)
  }
}

function addPointsToLineString (lineString, distance) {
  const chunkedLineString = turf.lineChunk(lineString, distance)
  const messyLineString = turf.lineString(turf.coordAll(chunkedLineString))
  return messyLineString
}

function hideElevationProfile (layer) {
  layer.controlElevationProfile._container.style.display = 'none'
  layer.controlElevationProfile.layer.remove()
  elevationDataLayer.remove()
}

function showElevationProfile (layer) {
  if (selectedRouteLayer) {
    hideElevationProfile(selectedRouteLayer)
  }
  layer.controlElevationProfile._container.style.display = 'block'
  layer.controlElevationProfile.layer.addTo(map)
  selectedRouteLayer = layer
}

class AddElevationToGeoJSON {
  constructor (geoJSON) {
    this.geoJSON = geoJSON
  }

  async geoJSONWithElevation () {
    const elevationData = await this.fetchElevationData()
    const geoJSONWithElevation = this.addElevationtoGeoJSON(
      this.geoJSON,
      elevationData
    )
    return geoJSONWithElevation
  }

  async fetchElevationData () {
    // Return FeatureCollection with the elevation data

    const url = this.generateWMSUrl(this.geoJSON)
    const response = await fetch(url)
    const txt = await response.text()
    const rows = txt.trim().split('\n')

    let points = []
    rows.forEach(string => {
      let lonLatEle = string.split(' ')
      lonLatEle = lonLatEle.map(string => parseFloat(string))
      points.push(turf.point(lonLatEle))
    })

    points = turf.featureCollection(points)
    return points
  }

  addElevationtoGeoJSON (geoJSON, points) {
    turf.coordEach(geoJSON, coord => {
      const elevation = this.elevationAt(coord[0], coord[1], points)
      coord[2] = elevation
    })
    return geoJSON
  }

  elevationAt (lon, lat, points) {
    const nearest = turf.nearestPoint(turf.point([lon, lat]), points)
    const elevation = turf.getCoord(nearest)[2]
    return elevation
  }

  generateWMSUrl (geoJSON) {
    const bbox = turf.bbox(geoJSON)
    const bboxString = bbox.join(',')
    return `https://openwms.statkart.no/skwms1/wcs.dtm?&SERVICE=WCS&REQUEST=GetCoverage&VERSION=1.0.0&COVERAGE=land_utm33_10m&FORMAT=xyz&COLORSCALE=false&CRS=EPSG:4326&WIDTH=200&HEIGHT=200&BBOX=${bboxString}`
  }
}
