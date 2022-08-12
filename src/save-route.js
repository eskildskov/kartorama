/* eslint-disable no-alert */
import L from "leaflet";
import togpx from "togpx";
import { RouteHandler, getLastUserRoute } from "./routes.js";
import { saveAs } from "file-saver";

function createButton(container) {
  const button = L.DomUtil.create(
    "a",
    "save-route-button leaflet-control-zoom-in",
    container
  );
  button.href = "#";
  button.title = "Lagre rute";
  button.innerHTML = "<span class='fa fa-save'></span>";
  return button;
}

L.Control.SaveRoute = L.Control.extend({
  options: {
    position: "topleft",
  },

  initialize(options) {
    L.Util.setOptions(this, options);
  },

  initContainer() {
    const container = L.DomUtil.create(
      "div",
      "leaflet-control-save-route leaflet-bar"
    );

    this._button = createButton(container);

    L.DomEvent.on(this._button, "dblclick", L.DomEvent.stop, this)
      .on(this._button, "click", L.DomEvent.stop, this)
      .on(this._button, "click", this._saveRoute, this);

    return container;
  },

  onAdd(map) {
    this._isLoading = false;
    this._map = map;
    this._routeHandler = new RouteHandler(this._map);

    return this.initContainer();
  },

  onRemove() {
    this._isActive = false;
    this._isLoading = false;
    L.DomUtil.removeClass(this._button, "active");
    L.DomUtil.removeClass(this._button, "loading");
  },

  _saveRoute() {
    L.DomUtil.addClass(this._button, "loading");
    const geojson = getLastUserRoute(this._map);
    this.downloadRoute(geojson);
  },

  downloadRoute(geojson) {
    const xmlString = togpx(geojson);
    const gpxBlob = new Blob([xmlString], { type: "text/xml" });
    saveAs(gpxBlob, "route.gpx");
    try {
    } catch (error) {
      alert(error);
    }
  },
});

L.Control.saveRoute = () => new L.Control.SaveRoute();

function initSaveRouteControl(map) {
  L.Control.saveRoute().addTo(map);
}

export { initSaveRouteControl };
