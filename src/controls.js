/* eslint-disable no-console */
/* eslint-disable no-alert */
/* eslint-disable unicorn/consistent-function-scoping */
import L from "leaflet";

import "leaflet-groupedlayercontrol";
import "leaflet.locatecontrol";
import { baseMaps, groupedOverlays, overlayMaps } from "./layers.js";
import { RouteHandler } from "./routes.js";
import "./vendor/leaflet-slider/leaflet-slider.js";
import "./vendor/leaflet.filelayer.js";
import "./vendor/leaflet.legend.js";

// eslint-disable-next-line no-magic-numbers
const URKE_COORDINATES = [62.213_447_329_334_01, 6.566_903_178_568_401];
const DEFAULT_ZOOM_LEVEL = 10;

function initMap() {
  const map = L.map("map", { zoomControl: false, pmIgnore: false });

  L.PM.setOptIn(true);

  map.state = {};

  const center = window.localStorage.getItem("currentCenter")
    ? JSON.parse(window.localStorage.getItem("currentCenter"))
    : URKE_COORDINATES;

  const zoom = window.localStorage.getItem("currentZoom") || DEFAULT_ZOOM_LEVEL;

  map.setView(center, zoom);

  return map;
}

function initZoomControl(map) {
  function saveZoom() {
    localStorage.setItem("currentZoom", map.getZoom());
  }

  L.control
    .zoom({
      position: "bottomleft",
    })
    .addTo(map);

  map.on("zoomend", saveZoom);
}

function initScaleControl(map) {
  L.control.scale({ imperial: false, maxWidth: 200 }).addTo(map);
}

function initLayers(map) {
  const storedBaseLayer = window.localStorage.getItem("activeBaseLayerName");
  const activeBaseLayerName =
    storedBaseLayer in baseMaps ? storedBaseLayer : "Vektorkart";
  map.addLayer(baseMaps[activeBaseLayerName]);

  const storedOverlay = window.localStorage.getItem("activeOverlayName");
  const activeOverlayName =
    storedOverlay in overlayMaps ? storedOverlay : "Helning";
  map.addLayer(overlayMaps[activeOverlayName]);

  map.state.overlay = overlayMaps[activeOverlayName];
}

function initLayerControl(map) {
  initLayers(map);

  L.control
    .groupedLayers(baseMaps, groupedOverlays, {
      exclusiveGroups: ["Tillegg"],
      position: "bottomright",
      collapsed: true,
    })
    .addTo(map);

  function saveActiveBaseLayer(event) {
    localStorage.setItem("activeBaseLayerName", event.name);
  }

  function saveActiveOverlay(event) {
    localStorage.setItem("activeOverlayName", event.name);
  }

  map.on("baselayerchange", saveActiveBaseLayer);
  map.on("overlayadd", saveActiveOverlay);
}

function initLocateControl(map) {
  L.control
    .locate({
      position: "bottomleft",
      initialZoomLevel: 15,
      icon: "fa fa-map-marker-alt",
    })
    .addTo(map);

  function savePosition() {
    localStorage.setItem("currentCenter", JSON.stringify(map.getCenter()));
  }

  map.on("moveend", savePosition);
}

function initFileLoaderControl(map) {
  L.Control.FileLayerLoad.LABEL = "<span class='fa fa-file-upload'></span>";

  const fileControl = L.Control.fileLayerLoad({
    layer: L.geoJson,
    layerOptions: { style: { className: "route" } },
    position: "topleft",
    fileSizeLimit: 4000,
  });

  fileControl.addTo(map);

  fileControl.loader.on("data:error", (error) => {
    alert("Feil! Sjekk konsollen");
    console.log(error);
  });

  fileControl.loader.on("data:loaded", (event) => {
    const routeHandler = new RouteHandler(map);
    routeHandler.addElevationAndReplace(event.layer);
  });
}

function initOpacityControl(map) {
  if (!map.state.overlay) initLayers(map);

  const currentOpacity = window.localStorage.getItem("currentOpacity") || 0;
  map.state.overlay.setOpacity(currentOpacity);

  const opacitySlider = L.control.slider(
    (value) => {
      map.state.overlay.setOpacity(value);
      window.localStorage.setItem("currentOpacity", value);
    },
    {
      min: 0,
      max: 1,
      step: 0.01,
      position: "bottomright",
      collapsed: false,
      syncSlider: true,
      title: "Gjennomsiktighet",
      showValue: false,
      value: map.state.overlay.options.opacity,
    }
  );

  opacitySlider.addTo(map);

  function setOpacity(event) {
    map.state.overlay = event.layer;
    if (opacitySlider.slider.valueAsNumber === 0) {
      const value = 0.2;
      map.state.overlay.setOpacity(value);
      opacitySlider.slider.value = value;
    } else {
      map.state.overlay.setOpacity(opacitySlider.slider.value);
    }
  }

  map.on("overlayadd", setOpacity);
}

function initLegendControl(map) {
  L.control
    .legend({
      title: "Forklaring",
      position: "topright",
      collapsed: true,
      symbolWidth: 24,
      opacity: 1,
      column: 1,

      legends: [
        {
          label: "27-30°",
          type: "polygon",
          sides: 4,
          fillColor: "#1f6402",
          color: "#000",
          weight: 1,
        },
        {
          label: "30-35°",
          type: "polygon",
          sides: 4,
          fillColor: "#ffff0b",
        },
        {
          label: "35-40°",
          type: "polygon",
          sides: 4,
          fillColor: "#fd9909",
        },
        {
          label: "40-45°",
          type: "polygon",
          sides: 4,
          fillColor: "#fb3d08",
        },
        {
          label: "45-50°",
          type: "polygon",
          sides: 4,
          fillColor: "#fb0007",
        },
        {
          label: "Korte utløp (α = 32°)",
          type: "polygon",
          sides: 4,
          fillColor: "#053897",
        },
        {
          label: "Middels utløp (α = 27°)",
          type: "polygon",
          sides: 4,
          fillColor: "#0953fe",
        },
      ],
    })
    .addTo(map);
}

export {
  initLegendControl,
  initFileLoaderControl,
  initZoomControl,
  initLayerControl,
  initScaleControl,
  initLocateControl,
  initOpacityControl,
  initMap,
};
