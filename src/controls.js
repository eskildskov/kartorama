/* eslint-disable no-console */
/* eslint-disable no-alert */
/* eslint-disable unicorn/consistent-function-scoping */
import L from "leaflet";

import "./vendor/leaflet-slider/leaflet-slider.js";
import "./vendor/leaflet.filelayer.js";
import "leaflet-groupedlayercontrol";
import "leaflet.locatecontrol";
import { overlayMaps, baseMaps, groupedOverlays } from "./layers.js";
import RouteHandler from "./routes.js";

// eslint-disable-next-line no-magic-numbers
const URKE_COORDINATES = [62.213_447_329_334_01, 6.566_903_178_568_401];
const DEFAULT_ZOOM_LEVEL = 10;

function initMap(map) {
  L.PM.setOptIn(true);

  map.state = {};

  const center = window.localStorage.getItem("currentCenter")
    ? JSON.parse(window.localStorage.getItem("currentCenter"))
    : URKE_COORDINATES;

  const zoom = window.localStorage.getItem("currentZoom") || DEFAULT_ZOOM_LEVEL;

  map.setView(center, zoom);
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
  const activeBaseLayerName =
    window.localStorage.getItem("activeBaseLayerName") || "Vektorkart";
  map.addLayer(baseMaps[activeBaseLayerName]);

  const activeOverlayName =
    window.localStorage.getItem("activeOverlayName") || "Helning";
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

  opacitySlider.slider.addEventListener("click", () => {
    localStorage.setItem("currentOpacity", opacitySlider.slider.valueAsNumber);
  });

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

export {
  initFileLoaderControl,
  initZoomControl,
  initLayerControl,
  initScaleControl,
  initLocateControl,
  initOpacityControl,
  initMap,
};
