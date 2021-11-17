import L from "leaflet";
import { createClient } from "@supabase/supabase-js";
import RouteHandler from "./routes.js";

L.Control.SaveRoute = L.Control.extend({
	options: {
		position: "topleft",
	},

	initialize(options) {
		L.Util.setOptions(this, options);
	},

	onAdd(map) {
		this._isLoading = false;

		this._map = map;
		this._routeHandler = RouteHandler(this._map);

		const routeId = this.getRouteIdFromUrl();
		if (routeId) {
			this.loadRoute(routeId);
		}

		const container = L.DomUtil.create(
			"div",
			"leaflet-control-save-route leaflet-bar"
		);

		this._button = L.DomUtil.create(
			"a",
			"save-route-button leaflet-control-zoom-in",
			container
		);
		this._button.href = "#";
		this._button.title = "Lagre rute";
		this._button.innerHTML = "<span class='fa fa-save'></span>";

		L.DomEvent.on(this._button, "dblclick", L.DomEvent.stop, this)
			.on(this._button, "click", L.DomEvent.stop, this)
			.on(this._button, "click", this._saveRoute, this);

		return container;
	},

	onRemove(map) {
		this._isActive = false;
		this._isLoading = false;

		L.DomUtil.removeClass(this._button, "active");
		L.DomUtil.removeClass(this._button, "loading");
	},

	_saveRoute() {
		L.DomUtil.addClass(this._button, "loading");
		// Routes.this.on(
		// 	"geojson:loaded",
		// 	function (e) {
		// 		L.DomUtil.removeClass(this._button, "loading");
		// 		this._isLoading = false;
		// 	},
		// 	this
		// );

		const geojson = this._routeHandler.allUserRoutes();
		if (geojson.length > 0) {
			this._postRoute(geojson);
		}

		console.log(geojson);
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
				history.replaceState(null, "", path);
				alert(`Ruten er lagret på ${window.location.origin + path}`);
				console.log(data);
			}
		} catch (error) {
			alert(error.message);
		}
	},

	getRouteIdFromUrl() {
		const urlParameters = new URLSearchParams(window.location.search);
		const parameters = Object.fromEntries(urlParameters.entries());
		let routeId = null;
		if (parameters && parameters.routeid) {
			routeId = parameters.routeid;
		}

		return routeId;
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

			if (error && status !== 406) throw error;
			if (data) {
				for (const feature of data.geojson) {
					const layer = L.geoJSON(feature).addTo(this._map);
					this._routeHandler.addElevationToLayer(layer);
				}
			}
		} catch (error) {
			alert(error.message);
		}
	},
});

L.Control.saveRoute = function () {
	return new L.Control.SaveRoute();
};
