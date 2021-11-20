import { overlayMaps, baseMaps } from "./layers.js";

// eslint-disable-next-line no-magic-numbers
const URKE_COORDINATES = [62.213_447_329_334_01, 6.566_903_178_568_401];
const DEFAULT_ZOOM_LEVEL = 10;

const stateHandler = {
  initState(map) {
    const activeBaseLayerName =
      window.localStorage.getItem("activeBaseLayerName") || "Vektorkart";
    map.addLayer(baseMaps[activeBaseLayerName]);

    const activeOverlayName =
      window.localStorage.getItem("activeOverlayName") || "Helning";
    map.addLayer(overlayMaps[activeOverlayName]);

    map.state.overlay = overlayMaps[activeOverlayName];
    const currentOpacity = window.localStorage.getItem("currentOpacity") || 0;
    map.state.overlay.setOpacity(currentOpacity);

    const center = window.localStorage.getItem("currentCenter")
      ? JSON.parse(window.localStorage.getItem("currentCenter"))
      : URKE_COORDINATES;

    const zoom =
      window.localStorage.getItem("currentZoom") || DEFAULT_ZOOM_LEVEL;
    map.setView(center, zoom);
  },

  addStateHandlers(map) {
    function savePosition() {
      window.localStorage.setItem(
        "currentCenter",
        JSON.stringify(map.getCenter())
      );
    }

    map.on("moveend", savePosition);

    function saveZoom() {
      window.localStorage.setItem("currentZoom", map.getZoom());
    }

    map.on("zoomend", saveZoom);

    function saveActiveBaseLayer(event) {
      window.localStorage.setItem("activeBaseLayerName", event.name);
    }

    map.on("baselayerchange", saveActiveBaseLayer);

    function saveActiveOverlay(event) {
      window.localStorage.setItem("activeOverlayName", event.name);
    }

    map.on("overlayadd", saveActiveOverlay);

    function changeOverlayControl(event) {
      map.state.overlay = event.layer;

      if (map.opacitySlider.slider.valueAsNumber === 0) {
        const value = 0.2;
        map.state.overlay.setOpacity(value);
        map.opacitySlider.slider.value = value;
      } else {
        map.state.overlay.setOpacity(map.opacitySlider.slider.value);
      }
    }

    map.on("overlayadd", changeOverlayControl);
  },
};

export default stateHandler;
