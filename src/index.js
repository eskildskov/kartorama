/* eslint-disable import/no-unused-modules */
import {
  initFileLoaderControl,
  initScaleControl,
  initOpacityControl,
  initZoomControl,
  initLocateControl,
  initLayerControl,
  initMap,
} from "./controls.js";
import { RouteHandler, allUserRoutes } from "./routes.js";
import { initSaveRouteControl } from "./save-route.js";

const map = initMap();
const routeHandler = new RouteHandler(map);

initScaleControl(map);
initZoomControl(map);
initOpacityControl(map);
initLayerControl(map);
routeHandler.init(map);
initFileLoaderControl(map);
initLocateControl(map);
initSaveRouteControl(map);

export {
  initScaleControl,
  initZoomControl,
  initOpacityControl,
  initLayerControl,
  initLocateControl,
  initFileLoaderControl,
  initMap,
} from "./controls.js";

export { RouteHandler, allUserRoutes } from "./routes.js";

export { initSaveRouteControl } from "./save-route.js";
