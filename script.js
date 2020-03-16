// let map = L.map('map').setView([62.6112822, 7.907181], 8);

// if (!map.restoreView()) {
//   map.setView([62.2587306, 6.3106444], 14);
// }

let attribution = '<a href="http://www.kartverket.no/">Kartverket</a>';

let rasterBaseMap = L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster3&zoom={z}&x={x}&y={y}',
  {
    useCache: true,
  }
);

let vectorBaseMap = L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}',
  {
    useCache: true,
  }
);

let kastOverlayMap = L.esri.dynamicMapLayer(
  {
    url:
      'https://gis3.nve.no/map/rest/services/Mapservices/KlassifiseringSkredterreng/MapServer',
    layers: [4, 5, 6, 7],
  },
  {
    useCache: true,
  }
);

let steepnessOverlayMap = L.tileLayer.wms(
  'https://gis3.nve.no/map/services/Bratthet/MapServer/WmsServer?',
  {
    layers: 'Bratthet_snoskred',
    format: 'image/png',
    transparent: 'true',
    useCache: true,
  }
);

let baseMaps = {
  Vektorkart: vectorBaseMap,
  Rasterkart: rasterBaseMap,
};

let overlayMaps = {
  Bratthetskart: steepnessOverlayMap,
  AutoKAST: kastOverlayMap,
};

// let map = L.map('map').setView([62.6112822, 7.907181], 8);

let map = L.map('map', {
  center: [62.6112822, 7.907181],
  zoom: 8,
  layers: vectorBaseMap,
});

let controlLayersOptions = {
  position: 'topleft',
  collapsed: false,
};

// L.control.layers(baseMaps, '', controlLayersOptions).addTo(map);

let groupedOverlays = {
  Tillegg: {
    Bratthet: steepnessOverlayMap,
    AutoKAST: kastOverlayMap,
  },
};

let groupLayersOptions = {
  // Make the "Landmarks" group exclusive (use radio inputs)
  exclusiveGroups: ['Tillegg'],
  // Show a checkbox next to non-exclusive group labels for toggling all
  // groupCheckboxes: true,
  position: 'topleft',
  collapsed: false,
};

L.control
  .groupedLayers(baseMaps, groupedOverlays, groupLayersOptions)
  .addTo(map);

if (!map.restoreView()) {
  map.setView([62.2587306, 6.3106444], 14);
}

let controlLayer = kastOverlayMap;

var slider = L.control
  .slider(
    function(value) {
      controlLayer.setOpacity(value);
    },
    {
      min: 0,
      max: 1.0,
      step: 0.01,
      position: 'topleft',
      collapsed: false,
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

L.control.scale({ imperial: false, maxWidth: 200 }).addTo(map);

function changeOverlayControl(e) {
  controlLayer = e.layer;
  if (slider.slider.value == 0) {
    let val = 0.2;
    controlLayer.setOpacity(val);
    slider.slider.value = val;
  } else {
    controlLayer.setOpacity(slider.slider.value);
  }
}

map.on('overlayadd', changeOverlayControl);
