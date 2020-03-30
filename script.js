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

let map = L.map('map', { zoomControl: false });
map.pm.setGlobalOptions({
  tooltips: false,
  allowSelfIntersection: false,
  markerStyle: { draggable: false },
});
let activeOverlay;

L.control.scale({ imperial: false, maxWidth: 200 }).addTo(map);
L.control
  .zoom({
    position: 'bottomleft',
  })
  .addTo(map);

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
  drawPolyline: true,
});

map.on('pm:drawstart', ({ workingLayer }) => {
  let currentDistance = 0;
  let tooltip = L.tooltip().setContent('sadsdf');
  workingLayer.bindTooltip(tooltip);

  workingLayer.on('pm:vertexadded', e => {
    lastPoint = e.latlng;
    lineGeoJSON = workingLayer.toGeoJSON();
    currentDistance = turf.length(lineGeoJSON);
    workingLayer.setTooltipContent(`${currentDistance.toFixed(1)} km`);
    workingLayer.openTooltip(e.latlng);

    map.on('mousemove', e => {
      let newDistance;
      let currentPoint = e.latlng;

      newDistance =
        map.distance(currentPoint, lastPoint) / 1000 + currentDistance;
      workingLayer.setTooltipContent(`${newDistance.toFixed(1)} km`);
      workingLayer.openTooltip(e.latlng);
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
  position: 'bottomright',
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
      position: 'bottomright',
      collapsed: false,
      syncSlider: true,
      title: 'Gjennomsiktighet',
      showValue: false,
      value: activeOverlay.options.opacity,
    }
  )
  .addTo(map);

L.control
  .groupedLayers(baseMaps, groupedOverlays, {
    exclusiveGroups: ['Tillegg'],
    position: 'bottomright',
    collapsed: true,
  })
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
  layerOptions: { style: { color: 'red' } },
  position: 'topleft',
}).addTo(map);

L.control.locate({ position: 'bottomleft', initialZoomLevel: 15 }).addTo(map);

let elevationLayer = L.nonTiledLayer.wcs(
  'https://openwms.statkart.no/skwms1/wcs.dtm?',
  {
    wcsOptions: {
      coverage: 'land_utm33_10m',
      colorScale: false,
    },
  }
);

map.on('pm:drawstart', () => elevationLayer.addTo(map));

map.on('pm:drawend', () => elevationLayer.remove());

map.on('pm:create', e => {
  let currentLayer = e.layer;

  // make linestring with point x?? meter
  let geoJSONLine = e.layer.toGeoJSON();
  let chunkedGeoJSONLine = turf.lineChunk(geoJSONLine, 0.5);
  chunkedGeoJSONLine = turf.lineString(turf.coordAll(chunkedGeoJSONLine));

  // add elevation to the Linestring
  turf.coordEach(chunkedGeoJSONLine, currentCoord => {
    let containerPoint = map.latLngToContainerPoint([
      currentCoord[1],
      currentCoord[0],
    ]);
    currentCoord.push(elevationLayer.getValueAtPoint(containerPoint));
  });

  let distance = turf.length(geoJSONLine).toFixed(1);
  let { elevationGain, elevationLoss } = sumElevation(chunkedGeoJSONLine);
  map.on('click', () => console.log('click outside'));

  var elevation_options = {
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
    responsive: true,
  };
  let controlElevation = L.control.elevation(elevation_options).addTo(map);
  controlElevation.loadData(chunkedGeoJSONLine);

  currentLayer.bindPopup(() => {
    return `Distanse: ${distance} km. Opp: ${elevationGain} m. Ned: ${elevationLoss} m.`;
  });

  map.on('click', () => {
    controlElevation._container.style.display = 'none';
    controlElevation.layer.remove();

    e.layer.on('click', () => {
      controlElevation._container.style.display = 'block';
      controlElevation.layer.addTo(map);
    });
  });
});

// TO DO
// Fix elevationlayer so that i covers whole track

function sumElevation(geoJSONLine) {
  let elevationGain = 0;
  let elevationLoss = 0;

  let elevations = geoJSONLine.geometry.coordinates.map(coord => coord[2]);
  let prevElevation = elevations.shift();

  elevations.forEach(elevation => {
    diff = elevation - prevElevation;

    if (diff > 0) {
      elevationGain += diff;
    } else {
      elevationLoss += diff;
    }

    prevElevation = elevation;
  });

  return {
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(-elevationLoss),
  };
}
