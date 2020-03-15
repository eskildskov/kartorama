var map = L.map('map').setView([62.6112822, 7.907181], 8);

L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster3&zoom={z}&x={x}&y={y}',
  {
    attribution: '<a href="http://www.kartverket.no/">Kartverket</a>',
  }
).addTo(map);

if (!map.restoreView()) {
  map.setView([62.2587306, 6.3106444], 14);
}

var wmsLayer = L.esri
  .dynamicMapLayer({
    url:
      'https://gis3.nve.no/map/rest/services/Mapservices/KlassifiseringSkredterreng/MapServer',
    layers: [4, 5, 6, 7],
    opacity: 0.5,
  })
  .addTo(map);

var slider = L.control
  .slider(
    function(value) {
      wmsLayer.setOpacity(value);
    },
    {
      min: 0,
      max: 1.0,
      step: 0.01,
      position: 'topleft',
      collapsed: false,
      getValue: wmsLayer.opacity,
      syncSlider: true,
      title: 'Gjennomsiktighet',
      showValue: false,
      value: 0,
    }
  )
  .addTo(map);

var fileLayer = L.Control.fileLayerLoad({
  layer: L.geoJson,
  // See http://leafletjs.com/reference.html#geojson-options
  layerOptions: { style: { color: 'red' } },
}).addTo(map);

L.control
  .measure({
    position: 'topleft',
    lineDashArray: '1,0',
    lineColor: 'blue',
    lineWeight: 3,
  })
  .addTo(map);
