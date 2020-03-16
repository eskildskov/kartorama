let attributionKartverket =
  '<a href="http://www.kartverket.no/">Kartverket</a>';
let attributionNVE = '<a href="https://www.nve.no/">NVE</a>';

let rasterBaseMap = L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster3&zoom={z}&x={x}&y={y}',
  {
    useCache: true,
    attribution: attributionKartverket,
  }
);

let vectorBaseMap = L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}',
  {
    useCache: true,
    attribution: attributionKartverket,
  }
);

let kastOverlayMap = L.esri.dynamicMapLayer(
  {
    url:
      'https://gis3.nve.no/map/rest/services/Mapservices/KlassifiseringSkredterreng/MapServer',
    layers: [4, 5, 6, 7],
  },
  {
    attribution: attributionNVE,
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
    attribution: attributionNVE,
  }
);

let baseMaps = {
  Vektorkart: vectorBaseMap,
  Rasterkart: rasterBaseMap,
};

let overlayMaps = {
  Bratthet: steepnessOverlayMap,
  AutoKAST: kastOverlayMap,
};

// let map = L.map('map').setView([62.6112822, 7.907181], 8);

let map = L.map('map', { layers: vectorBaseMap });
let activeOverlay;

function initMap() {
  let activeBaseLayerName = localStorage.getItem('activeBaseLayerName');
  if (activeBaseLayerName) {
    map.addLayer(baseMaps[activeBaseLayerName]);
  }

  let activeOverlayName = localStorage.getItem('activeOverlayName')
    ? localStorage.getItem('activeOverlayName')
    : 'Bratthet';
  map.addLayer(overlayMaps[activeOverlayName]);
  activeOverlay = overlayMaps[activeOverlayName];

  let center = localStorage.getItem('currentCenter')
    ? JSON.parse(localStorage.getItem('currentCenter'))
    : [62.5661863495104, 7.7187538146972665];

  let zoom = localStorage.getItem('currentZoom')
    ? localStorage.getItem('currentZoom')
    : 8;

  map.setView(center, zoom);
}

initMap();

let controlLayersOptions = {
  position: 'topleft',
  collapsed: false,
};

let groupedOverlays = {
  Tillegg: {
    Bratthet: steepnessOverlayMap,
    AutoKAST: kastOverlayMap,
  },
};

let groupLayersOptions = {
  exclusiveGroups: ['Tillegg'],
  position: 'topleft',
  collapsed: false,
};

L.control
  .groupedLayers(baseMaps, groupedOverlays, groupLayersOptions)
  .addTo(map);

function savePosition(e) {
  localStorage.setItem('currentCenter', JSON.stringify(map.getCenter()));
}

function saveZoom(e) {
  localStorage.setItem('currentZoom', map.getZoom());
}

function saveActiveBaseLayer(e) {
  localStorage.setItem('activeBaseLayerName', e.name);
}

function saveActiveOverlay(e) {
  localStorage.setItem('activeOverlayName', e.name);
}

map.on('baselayerchange', saveActiveBaseLayer);
map.on('overlayadd', saveActiveOverlay);
map.on('moveend', savePosition);
map.on('zoomend', saveZoom);

function changeOverlayControl(e) {
  activeOverlay = e.layer;
  if (slider.slider.value == 0) {
    let val = 0.2;
    activeOverlay.setOpacity(val);
    slider.slider.value = val;
  } else {
    activeOverlay.setOpacity(slider.slider.value);
  }
}

map.on('overlayadd', changeOverlayControl);

var slider = L.control
  .slider(
    function(value) {
      activeOverlay.setOpacity(value);
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
