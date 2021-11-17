import "@geoman-io/leaflet-geoman-free";
import "@raruto/leaflet-elevation";
import L from "leaflet";
import * as turf from "@turf/turf";
import Elevation from "./elevation.js";

const pathOptions = { className: "route" };

const elevationOptions = {
	theme: "kartorama-theme",
	detached: false,
	autohide: true, // If (!detached) autohide chart profile on chart mouseleave
	collapsed: false, // If (!detached) initial state of chart profile control
	position: "topright", // If (!detached) control position on one of map corners
	followMarker: false, // Autoupdate map center on chart mouseover.
	imperial: false, // Chart distance/elevation units.
	reverseCoords: false, // [Lat, Long] vs [Long, Lat] points. (leaflet default: [Lat, Long])
	summary: false,
	legend: false,
	ruler: false,
	width: 400,
	height: 150,
	responsive: true,
};

const drawingOptions = {
	position: "bottomleft",
	drawCircle: false,
	drawMarker: false,
	drawCircleMarker: false,
	drawRectangle: false,
	drawPolygon: false,
	dragMode: false,
	cutPolygon: false,
	rotateMode: false,
	removalMode: false,
	editMode: false,
	drawPolyline: true,
};

function addTooltipToRouteLayer(layer) {
	const geojson = layer.toGeoJSON();
	const distance = turf.length(geojson).toFixed(1);
	const { elevationGain, elevationLoss } = Elevation.sumElevation(geojson);
	const popupElement = generateTooltip(
		{
			elevationGain,
			elevationLoss,
			distance,
		},
		layer
	);

	layer.bindPopup(popupElement).openPopup();
}

function generateTooltip(data, layer) {
	const popupElement = document.createElement("p");
	popupElement.innerHTML = `Distanse: ${data.distance} km. Opp: ${data.elevationGain} m. Ned: ${data.elevationLoss} m. `;

	const removeLayerLink = document.createElement("a");
	removeLayerLink.textContent = "Slett spor";
	removeLayerLink.href = "#";
	removeLayerLink.addEventListener("click", () => {
		deactivateRoute(layer);
		layer.remove();
	});

	// PopupElement.append(removeLayerLink);

	return popupElement;
}

export default function RouteHandler(map) {
	function allUserRoutes() {
		// Returns a feature collection with all the routes in the map
		let geojsons = [];
		map.routeLayers.eachLayer((routeLayer) => {
			const geojson = routeLayer.toGeoJSON();
			geojsons = [...geojsons, ...geojson.features];
		});

		return geojsons;
	}

	map.on("click", () => {
		if (map.state.activeRouteLayer) {
			deactivateRoute(map.state.activeRouteLayer);
		}
	});

	function deactivateRoute(routeLayer) {
		hideElevationProfile(routeLayer);
		deactivateElevationLine(routeLayer);
		map.state.activeRouteLayer = null;
	}

	function setActiveRoute(routeLayer) {
		if (map.state.activeRouteLayer) {
			deactivateRoute(map.state.activeRouteLayer);
		}

		activateElevationLine(routeLayer);
		showElevationProfile(routeLayer);
		map.state.activeRouteLayer = routeLayer;
	}

	function activateElevationLine(routeLayer) {
		const elevationLine = getElevationLine(routeLayer);
		if (Object.keys(elevationLine).length > 0) {
			Object.values(elevationLine)[0].addTo(map);
		}
	}

	function deactivateElevationLine(routeLayer) {
		const elevationLine = getElevationLine(routeLayer);
		if (Object.keys(elevationLine).length > 0) {
			Object.values(elevationLine)[0].remove();
		}
	}

	function getElevationLine(routeLayer) {
		return routeLayer.controlElevationProfile._layers._layers;
	}

	function initElevationLayer(layer) {
		layer.setStyle(pathOptions);
		map.addLayer(layer);

		const geojsonWithElevation = layer.toGeoJSON();
		layer.controlElevationProfile = L.control.elevation(elevationOptions);
		layer.controlElevationProfile.addTo(map).loadData(geojsonWithElevation);
		addTooltipToRouteLayer(layer);
		map.routeLayers.addLayer(layer);

		map.off("mousemove");
		map.fitBounds(layer.getBounds());

		setActiveRoute(layer);

		layer.on("click", (event) => {
			setActiveRoute(event.target);
		});
	}

	async function addElevationToLayer(layer) {
		const geojson = layer.toGeoJSON();
		const newLayer = L.geoJSON(Elevation.addPointsToLineString(geojson, 0.05));

		const layerWithElevation = await Elevation.addElevationToLayer(newLayer);
		map.removeLayer(layer);
		initElevationLayer(layerWithElevation);
	}

	function hideElevationProfile(layer) {
		layer.controlElevationProfile._container.style.display = "none";
	}

	function showElevationProfile(layer) {
		layer.controlElevationProfile._container.style.display = "block";
		layer.controlElevationProfile.addTo(map);
	}

	return {
		init() {
			map.routeLayers = L.layerGroup();

			map.pm.setGlobalOptions({
				tooltips: false,
				allowSelfIntersection: true,
				markerStyle: { draggable: false },
				finishOn: null,
				templineStyle: { className: "route is-drawing" },
				hintlineStyle: { className: "route is-drawing" },
				pathOptions,
			});
			map.pm.setLang("no");

			map.on("pm:create", async (event) => {
				addElevationToLayer(event.layer);
			});

			map.on("pm:drawstart", ({ workingLayer }) => {
				let currentDistance = 0;
				const tooltip = L.tooltip();
				workingLayer.bindTooltip(tooltip);

				workingLayer.on("pm:vertexadded", (event) => {
					const lastPoint = event.latlng;
					const lineGeoJSON = workingLayer.toGeoJSON();
					currentDistance = turf.length(lineGeoJSON);
					workingLayer.setTooltipContent(`${currentDistance.toFixed(1)} km`);
					workingLayer.openTooltip(event.latlng);

					map.on("mousemove", (event) => {
						const currentPoint = event.latlng;

						const newDistance =
							map.distance(currentPoint, lastPoint) / 1000 + currentDistance;
						workingLayer.setTooltipContent(`${newDistance.toFixed(1)} km`);
						workingLayer.openTooltip(event.latlng);
					});
				});
			});
		},
		addToMap() {
			map.pm.addControls(drawingOptions);
		},
		addElevationToLayer,
		allUserRoutes,
	};
}
