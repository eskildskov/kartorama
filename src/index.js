import L from "leaflet";
import "./vendor/leaflet-slider/leaflet-slider.js";
import { createClient } from "@supabase/supabase-js";
import {
	scaleControl,
	zoomControl,
	layerControl,
	locateControl,
	fileControl,
} from "./controls.js";
import stateHandler from "./state-handler.js";
import RouteHandler from "./routes.js";
import "./save-route.js";

const map = L.map("map", { zoomControl: false });
map.state = {};

stateHandler.initState(map);
stateHandler.addStateHandlers(map);
const routeHandler = RouteHandler(map);
routeHandler.init();

map.opacitySlider = L.control.slider(
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
scaleControl.addTo(map);
zoomControl.addTo(map);
map.opacitySlider.addTo(map);
layerControl.addTo(map);
routeHandler.addToMap();
fileControl.addTo(map);
locateControl.addTo(map);
L.Control.saveRoute().addTo(map);

//
// STATE
//

map.opacitySlider.slider.addEventListener("click", () => {
	localStorage.setItem(
		"currentOpacity",
		map.opacitySlider.slider.valueAsNumber
	);
});

function savePosition() {
	localStorage.setItem("currentCenter", JSON.stringify(map.getCenter()));
}

function saveZoom() {
	localStorage.setItem("currentZoom", map.getZoom());
}

function saveActiveBaseLayer(event) {
	localStorage.setItem("activeBaseLayerName", event.name);
}

function saveActiveOverlay(event) {
	localStorage.setItem("activeOverlayName", event.name);
}

map.on("baselayerchange", saveActiveBaseLayer);
map.on("overlayadd", saveActiveOverlay);
map.on("overlayadd", changeOverlayControl);
map.on("moveend", savePosition);
map.on("zoomend", saveZoom);

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

fileControl.loader.on("data:error", function (error) {
	alert(error);
});

fileControl.loader.on("data:loaded", function (event) {
	routeHandler.addElevationToLayer(event.layer);
});
