import {
  initFileLoaderControl,
  initScaleControl,
  initOpacityControl,
  initZoomControl,
  initLocateControl,
  initLayerControl,
  initLegendControl,
  initMap,
} from "./controls.js";
import { RouteHandler } from "./routes.js";
import { initSaveRouteControl } from "./save-route.js";

const map = initMap();
window.map = map;
const routeHandler = new RouteHandler(map);

initScaleControl(map);
initZoomControl(map);
initOpacityControl(map);
initLayerControl(map);
routeHandler.init(map);
initFileLoaderControl(map);
initLocateControl(map);
initSaveRouteControl(map);
initLegendControl(map);
