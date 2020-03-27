let attributionKartverket =
  '<a href="http://www.kartverket.no/">Kartverket</a>';
let attributionNVE = '<a href="https://www.nve.no/">NVE</a>';

let rasterBaseMap = L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster3&zoom={z}&x={x}&y={y}',
  {
    attribution: attributionKartverket,
  }
);

let vectorBaseMap = L.tileLayer(
  'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}',
  {
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
  }
);

let steepnessOverlayMap = L.tileLayer.wms(
  'https://gis3.nve.no/map/services/Bratthet/MapServer/WmsServer?',
  {
    layers: 'Bratthet_snoskred',
    format: 'image/png',
    transparent: 'true',
    attribution: attributionNVE,
  }
);

let baseMaps = {
  Vektorkart: vectorBaseMap,
  Rasterkart: rasterBaseMap,
};

let overlayMaps = {
  Helning: steepnessOverlayMap,
  AutoKAST: kastOverlayMap,
};

let map = L.map('map');
let activeOverlay;

L.control.scale({ imperial: false, maxWidth: 200 }).addTo(map);

function initMap() {
  let activeBaseLayerName = localStorage.getItem('activeBaseLayerName')
    ? localStorage.getItem('activeBaseLayerName')
    : 'Vektorkart';
  if (activeBaseLayerName) {
    map.addLayer(baseMaps[activeBaseLayerName]);
  }

  let activeOverlayName = localStorage.getItem('activeOverlayName')
    ? localStorage.getItem('activeOverlayName')
    : 'Helning';
  localStorage.removeItem('activeOverlayName');
  map.addLayer(overlayMaps[activeOverlayName]);
  activeOverlay = overlayMaps[activeOverlayName];

  let currentOpacity = localStorage.getItem('currentOpacity')
    ? localStorage.getItem('currentOpacity')
    : 0;
  activeOverlay.setOpacity(currentOpacity);

  let center = localStorage.getItem('currentCenter')
    ? JSON.parse(localStorage.getItem('currentCenter'))
    : [62.5661863495104, 7.7187538146972665];

  let zoom = localStorage.getItem('currentZoom')
    ? localStorage.getItem('currentZoom')
    : 8;

  map.setView(center, zoom);
}

initMap();

map.pm.addControls({
  position: 'topleft',
  drawCircle: false,
  drawMarker: false,
  drawCircleMarker: false,
  drawRectangle: false,
  drawPolygon: false,
  dragMode: false,
  cutPolygon: false,
  removalMode: false,
});

let currentLine = [];

var pane = map.createPane('fixed', document.getElementById('map'));
let currentDistance = 0;

var popup = L.popup({
  pane: 'fixed',
  className: 'popup-fixed',
  autoPan: false,
  autoClose: false,
  closeOnClick: false,
  closeButton: false,
})
  .setLatLng([0, 0])
  .setContent('Trøkk et sted');

map.openPopup(popup);
let drawnLayers = [];
map.on('pm:drawstart', ({ workingLayer }) => {
  // only allow one drawing layer

  // if (drawingLayers.length > 0) {
  //   map.removeLayer(drawingLayers[0]);
  //   drawingLayers.splice(0, 1);
  // }

  workingLayer.on('pm:vertexadded', e => {
    lastPoint = e.latlng;
    lineGeoJSON = workingLayer.toGeoJSON();
    currentDistance = turf.length(lineGeoJSON);

    map.on('mousemove', e => {
      let newDistance;
      let currentPoint = e.latlng;
      newDistance =
        map.distance(currentPoint, lastPoint) / 1000 + currentDistance;
      newDistance = newDistance.toFixed(1);
      popup.setContent(`${newDistance} km`);
    });
  });
});

map.on('pm:create', e => {
  let currentLayer = e.layer;
  let distance = turf.length(currentLayer.toGeoJSON()).toFixed(1);
  currentLayer.bindPopup(`${distance} km`).openPopup();
});

map.on('pm:drawend', () => {
  map.off('mousemove');
});

let controlLayersOptions = {
  position: 'topleft',
  collapsed: false,
};

let groupedOverlays = {
  Tillegg: {
    Helning: steepnessOverlayMap,
    AutoKAST: kastOverlayMap,
  },
};
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
      value: activeOverlay.options.opacity,
    }
  )
  .addTo(map);

let groupLayersOptions = {
  exclusiveGroups: ['Tillegg'],
  position: 'bottomleft',
  collapsed: true,
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

slider.slider.addEventListener('click', function() {
  localStorage.setItem('currentOpacity', slider.slider.value);
});

var fileLayer = L.Control.fileLayerLoad({
  layer: L.geoJson,
  // See http://leafletjs.com/reference.html#geojson-options
  layerOptions: { style: { color: 'red' } },
}).addTo(map);
