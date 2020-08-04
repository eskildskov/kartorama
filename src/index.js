import L from 'leaflet'
import { dynamicMapLayer } from 'esri-leaflet'
import '@geoman-io/leaflet-geoman-free'
import './vendor/leaflet-slider/leaflet-slider'
import 'leaflet-groupedlayercontrol'
import * as FileLayer from 'leaflet-filelayer'
import 'leaflet.locatecontrol'
import * as turf from '@turf/turf' // needs slimming
import './styles/index.scss'
import togeojson from './vendor/togeojson'
import '@raruto/leaflet-elevation'
import * as GeoTIFF from 'geotiff/dist-browser/geotiff'

// import AddElevationToGeoJSON from './add-elevation'

const localStorage = window.localStorage
const map = L.map('map', { zoomControl: false })
const attributionKartverket =
  '<a href="http://www.kartverket.no/">Kartverket</a>'
const attributionNVE = '<a href="https://www.nve.no/">NVE</a>'
// hack: https://github.com/makinacorpus/Leaflet.FileLayer/issues/60
FileLayer(null, L, togeojson)

//
// LAYERS
//

let activeOverlay
let selectedRouteLayer

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

L.Control.FileLayerLoad.LABEL = ''

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
  localStorage.setItem('currentOpacity', opacitySlider.slider.value)
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
map.on('moveend', savePosition)
map.on('zoomend', saveZoom)

function changeOverlayControl (e) {
  activeOverlay = e.layer
  if (opacitySlider.slider.value === 0) {
    const val = 0.2
    activeOverlay.setOpacity(val)
    opacitySlider.slider.value = val
  } else {
    activeOverlay.setOpacity(opacitySlider.slider.value)
  }
}

map.on('overlayadd', changeOverlayControl)

// FILE LOADER

fileLayer.loader.on('data:error', function (error) {
  console.error(error)
})

fileLayer.loader.on('data:loaded', function (e) {
  addRouteHandler(e.layer)
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

function addRouteHandler (routeLayer) {
  routeLayers.addLayer(routeLayer)
  let geojson = routeLayer.toGeoJSON()
  geojson = addPointsToLineString(geojson, 0.2)
  routeLayer.distance = turf.length(geojson).toFixed(1)

  Elevation.addElevationToGeojson(geojson).then(geojsonWithElevation => {
    routeLayer.controlElevationProfile = L.control.elevation(elevationOptions)
    routeLayer.controlElevationProfile.addTo(map).loadData(geojsonWithElevation)
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
    routeLayers.eachLayer(layer => {
      console.log(layer.toGeoJSON())
    })
  })

  map.off('mousemove')
  map.fitBounds(routeLayer.getBounds())
  routeLayer.on('click', e => {
    showElevationProfile(e.target)
  })
}

map.on('pm:create', e => {
  addRouteHandler(e.layer)
})

function sumElevation (lineString) {
  let elevationGain = 0
  let elevationLoss = 0

  const elevations = turf.coordAll(lineString).map(coord => coord[2])
  let prevElevation = elevations.shift()

  elevations.forEach(elevation => {
    const diff = elevation - prevElevation

    // I -10!!!
    if (diff > 7) {
      elevationGain += diff
    } else if (diff < -7) {
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
}

function showElevationProfile (layer) {
  if (selectedRouteLayer) {
    hideElevationProfile(selectedRouteLayer)
  }
  layer.controlElevationProfile._container.style.display = 'block'
  layer.controlElevationProfile.layer.addTo(map)
  selectedRouteLayer = layer
}

// import * as turf from '@turf/turf'
// import lineString from '@turf/helpers'

// // Example
// const fs = require('fs')
// let geojson = JSON.parse(fs.readFileSync('geojson.json', 'utf8'))
// Elevation.addElevationToGeojson(geojson).then(geojsonEle =>
//   console.log(geojsonEle)
// )

class Elevation {
  constructor (geojson) {
    this.geojson = geojson
  }

  static async addElevationToGeojson (geojson) {
    const elevation = new Elevation(geojson)
    await elevation.fetchElevationData()
    return elevation.addElevationToCoords()
  }

  async fetchElevationData () {
    // Return array with the elevation data
    this.url = this.generateWMSUrl(this.geojson)

    const response = await fetch(this.url)
    const arrayBuffer = await response.arrayBuffer()
    this.tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer)
    this.image = await this.tiff.getImage()

    this.geoTransform = this.generateGeotransform()

    const rasters = await this.image.readRasters()

    this.dataArray = new Array(this.image.getHeight())
    for (var j = 0; j < this.image.getHeight(); j++) {
      this.dataArray[j] = new Array(this.image.getWidth())
      for (var i = 0; i < this.image.getWidth(); i++) {
        this.dataArray[j][i] = rasters[0][i + j * this.image.getWidth()]
      }
    }

    return this.dataArray
  }

  async addElevationToCoords () {
    turf.coordEach(this.geojson, coord => {
      const elevation = this.elevationAtCoord(coord[0], coord[1])
      coord[2] = elevation
    })
    return this.geojson
  }

  elevationAtCoord (lon, lat) {
    const gt = this.geoTransform
    let Xpixel = Math.round((lon - gt[0]) / gt[1])
    let Ypixel = Math.round((lat - gt[3]) / gt[5])

    // A small hack when its on max bounds
    if (Xpixel === this.image.getWidth()) {
      Xpixel--
    }

    if (Ypixel === this.image.getHeight()) {
      Ypixel--
    }
    const elevation = this.dataArray[Ypixel][Xpixel]
    return elevation
  }

  generateWMSUrl () {
    const bbox = turf.bbox(this.geojson)
    const bboxString = bbox.join(',')
    return `https://openwms.statkart.no/skwms1/wcs.dtm?&SERVICE=WCS&REQUEST=GetCoverage&VERSION=1.0.0&COVERAGE=land_utm33_10m&FORMAT=GEOTIFF&COLORSCALE=false&CRS=EPSG:4326&WIDTH=200&HEIGHT=200&BBOX=${bboxString}`
  }

  generateGeotransform () {
    const tiepoint = this.image.getTiePoints()[0]
    const pixelScale = this.image.getFileDirectory().ModelPixelScale
    return [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1 * pixelScale[1]]
  }
}
