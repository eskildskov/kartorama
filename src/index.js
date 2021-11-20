import L from "leaflet";

import {
  initFileLoaderControl,
  initScaleControl,
  initOpacityControl,
  initZoomControl,
  initLocateControl,
  initLayerControl,
  initMap,
} from "./controls.js";
import RouteHandler from "./routes.js";
import "./save-route.js";

const map = L.map("map", { zoomControl: false, pmIgnore: false });

initMap(map);
const routeHandler = new RouteHandler(map);
routeHandler.init();

initScaleControl(map);
initZoomControl(map);
initOpacityControl(map);
initLayerControl(map);
routeHandler.addToMap();
initFileLoaderControl(map);
initLocateControl(map);
L.Control.saveRoute().addTo(map);
