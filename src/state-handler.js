import { overlayMaps, baseMaps } from './layers'

export default function StateHandler () {

  function initState(map) {
    const activeBaseLayerName = window.localStorage.getItem('activeBaseLayerName')
      ? window.localStorage.getItem('activeBaseLayerName')
      : 'Vektorkart'
    map.addLayer(baseMaps[activeBaseLayerName])
    
    const activeOverlayName = window.localStorage.getItem('activeOverlayName')
      ? window.localStorage.getItem('activeOverlayName')
      : 'Helning'
    map.addLayer(overlayMaps[activeOverlayName])
    map.state.overlay = overlayMaps[activeOverlayName]

    const currentOpacity = window.localStorage.getItem('currentOpacity')
      ? window.localStorage.getItem('currentOpacity')
      : 0
    map.state.overlay.setOpacity(currentOpacity)

    const center = window.localStorage.getItem('currentCenter')
      ? JSON.parse(window.localStorage.getItem('currentCenter'))
      : [62.5661863495104, 7.7187538146972665]

    const zoom = window.localStorage.getItem('currentZoom')
      ? window.localStorage.getItem('currentZoom')
      : 8

    map.setView(center, zoom)
  };

  function addStateHandlers (map) {
    function savePosition (e) {
      window.localStorage.setItem('currentCenter', JSON.stringify(map.getCenter()))
    }
    map.on('moveend', savePosition)

    function saveZoom (e) {
      window.localStorage.setItem('currentZoom', map.getZoom())
    }
    map.on('zoomend', saveZoom)

    function saveActiveBaseLayer (e) {
      window.localStorage.setItem('activeBaseLayerName', e.name)
    }
    map.on('baselayerchange', saveActiveBaseLayer)

    function saveActiveOverlay (e) {
      window.localStorage.setItem('activeOverlayName', e.name)
    }
    map.on('overlayadd', saveActiveOverlay)

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
    map.on('overlayadd', changeOverlayControl)
  }

  return {
    initState: initState,
    addStateHandlers: addStateHandlers
  }

}
