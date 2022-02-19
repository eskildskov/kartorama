/* eslint-disable no-alert */
import L from "leaflet";

import { RouteHandler, getLastUserRoute } from "./routes.js";

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

  loadGeojsonString(geojsonString) {
    const geojson = JSON.parse(geojsonString);
    const layer = L.geoJSON(geojson);
    this._routeHandler.addElevationAndReplace(layer);
  },

  onAdd(map) {
    this._isLoading = false;
    this._map = map;
    this._routeHandler = new RouteHandler(this._map);
    const routeId = this.getRouteIdFromUrl();

    if (routeId) {
      this.loadRoute(routeId);
    }

    map.loadGeojsonString = this.loadGeojsonString.bind(this);

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
    this._postRoute(geojson);
  },

  generatePath(routeId) {
    return `/?routeid=${routeId}`;
  },

  async _postRoute(geojson) {
    try {
      const response = await fetch(
        `https://kartorama-directus.eskildskov.no/items/routes/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geojson }),
        }
      );

      if (!response.ok) throw await response.json();

      const data = await response.json();
      const path = this.generatePath(data.data.id);
      history.replaceState(undefined, "", path);
      alert(`Ruten er lagret på ${window.location.origin + path}`);
    } catch (error) {
      alert(error);
    }
  },

  getRouteIdFromUrl() {
    const urlParameters = new URLSearchParams(window.location.search);
    const parameters = Object.fromEntries(urlParameters.entries());
    return parameters.routeid || undefined;
  },

  async loadRoute(routeId) {
    try {
      const response = await fetch(
        `https://kartorama-directus.eskildskov.no/items/routes/${routeId}`
      );

      if (!response.ok) throw await response.json();

      const data = await response.json();

      const layer = L.geoJSON(data.data.geojson);
      this._routeHandler.addElevationAndReplace(layer);
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
