/* eslint-disable no-alert */
import L from "leaflet";
import { createClient } from "@supabase/supabase-js";

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

    map.loadGeojsonString = (geojsonString) => {
      this.loadGeojsonString(geojsonString);
    };

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
    const supabase = createClient(
      "https://cvkrixhyrwhqqvrekwgz.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjkwNTE2MCwiZXhwIjoxOTUyNDgxMTYwfQ.H_zIyV0rN9nGxS5jVjSoo49UHdKw5n3fpQ6SZq21Z1g"
    );

    try {
      const { data, error } = await supabase.from("routes").insert([
        {
          geojson,
        },
      ]);

      if (error) throw error;

      if (data) {
        const path = this.generatePath(data[0].id);
        history.replaceState(undefined, "", path);
        alert(`Ruten er lagret på ${window.location.origin + path}`);
      }
    } catch (error) {
      alert(error.message);
    }
  },

  getRouteIdFromUrl() {
    const urlParameters = new URLSearchParams(window.location.search);
    const parameters = Object.fromEntries(urlParameters.entries());
    return parameters.routeid || undefined;
  },

  async loadRoute(routeId) {
    const supabase = createClient(
      "https://cvkrixhyrwhqqvrekwgz.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjkwNTE2MCwiZXhwIjoxOTUyNDgxMTYwfQ.H_zIyV0rN9nGxS5jVjSoo49UHdKw5n3fpQ6SZq21Z1g"
    );

    try {
      const { data, error, status } = await supabase
        .from("routes")
        .select("id, geojson")
        .eq("id", routeId)
        .single();

      // eslint-disable-next-line no-magic-numbers
      if (error && status !== 406) throw error;

      if (data.geojson) {
        const layer = L.geoJSON(data.geojson);
        this._routeHandler.addElevationAndReplace(layer);
      }
    } catch (error) {
      alert(error.message);
    }
  },
});

L.Control.saveRoute = () => new L.Control.SaveRoute();

function initSaveRouteControl(map) {
  L.Control.saveRoute().addTo(map);
}

export { initSaveRouteControl };
