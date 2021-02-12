import { overlayMaps, baseMaps } from './layers'

export default class StateHandler {
  constructor (map) {
    this.map = map
  }

  initState () {
    this.activeBaseLayerName = window.localStorage.getItem('activeBaseLayerName')
      ? window.localStorage.getItem('activeBaseLayerName')
      : 'Vektorkart'
    if (this.activeBaseLayerName) {
      this.map.addLayer(baseMaps[this.activeBaseLayerName])
    }

    this.activeOverlayName = window.localStorage.getItem('activeOverlayName')
      ? window.localStorage.getItem('activeOverlayName')
      : 'Helning'
    this.map.addLayer(overlayMaps[this.activeOverlayName])
    this.activeOverlay = overlayMaps[this.activeOverlayName]

    this.currentOpacity = window.localStorage.getItem('currentOpacity')
      ? window.localStorage.getItem('currentOpacity')
      : 0
    this.activeOverlay.setOpacity(this.currentOpacity)

    this.center = window.localStorage.getItem('currentCenter')
      ? JSON.parse(window.localStorage.getItem('currentCenter'))
      : [62.5661863495104, 7.7187538146972665]

    this.zoom = window.localStorage.getItem('currentZoom')
      ? window.localStorage.getItem('currentZoom')
      : 8

    this.map.setView(this.center, this.zoom)
  }

  addStateHandlers () {
    function savePosition (e) {
      console.log(this)
      window.localStorage.setItem('currentCenter', JSON.stringify(this.map.getCenter()))
    }
    this.map.on('moveend', savePosition)

    function saveZoom (e) {
      window.localStorage.setItem('currentZoom', this.map.getZoom())
    }
    this.map.on('zoomend', saveZoom)

    function saveActiveBaseLayer (e) {
      window.localStorage.setItem('activeBaseLayerName', e.name)
    }
    this.map.on('baselayerchange', saveActiveBaseLayer)

    function saveActiveOverlay (e) {
      window.localStorage.setItem('activeOverlayName', e.name)
    }
    this.map.on('overlayadd', saveActiveOverlay)

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
    this.map.on('overlayadd', changeOverlayControl)
  }
}
