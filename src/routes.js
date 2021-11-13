import '@geoman-io/leaflet-geoman-free';
import '@raruto/leaflet-elevation';
import L from 'leaflet';
import * as turf from '@turf/turf';
import Elevation from './elevation.js';

export default function routeHandler(map) {
	const elevationOptions = {
		theme: 'lime-theme',
		detached: false,
		autohide: true, // If (!detached) autohide chart profile on chart mouseleave
		collapsed: false, // If (!detached) initial state of chart profile control
		position: 'topright', // If (!detached) control position on one of map corners
		followMarker: false, // Autoupdate map center on chart mouseover.
		imperial: false, // Chart distance/elevation units.
		reverseCoords: false, // [Lat, Long] vs [Long, Lat] points. (leaflet default: [Lat, Long])
		summary: false,
		legend: false,
		width: 400,
		height: 150,
		responsive: true,
	};

	map.routeLayers = L.featureGroup();

	map.on('click', () => {
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

	function generateTooltip(data, routeLayer) {
		const popupElement = document.createElement('p');
		popupElement.innerHTML = `Distanse: ${data.distance} km. Opp: ${data.elevationGain} m. Ned: ${data.elevationLoss} m. `;

		const removeLayerLink = document.createElement('a');
		removeLayerLink.innerText = 'Slett spor';
		removeLayerLink.href = '#';
		removeLayerLink.addEventListener('click', () => {
			deactivateRoute(routeLayer);
			routeLayer.remove();
		});

		popupElement.append(removeLayerLink);

		return popupElement;
	}

	function addTooltipToRouteLayer(routeLayer) {
		const geojson = routeLayer.toGeoJSON();
		const distance = turf.length(geojson).toFixed(1);
		const {elevationGain, elevationLoss} = Elevation.sumElevation(geojson);
		const popupElement = generateTooltip(
			{
				elevationGain,
				elevationLoss,
				distance,
			},
			routeLayer,
		);

		routeLayer.bindPopup(popupElement).openPopup();
	}

	function initElevationLayer(layerWithElevation) {
		map.addLayer(layerWithElevation);

		const geojsonWithElevation = layerWithElevation.toGeoJSON();
		layerWithElevation.controlElevationProfile =
			L.control.elevation(elevationOptions);
		layerWithElevation.controlElevationProfile
			.addTo(map)
			.loadData(geojsonWithElevation);

		addTooltipToRouteLayer(layerWithElevation);
		map.routeLayers.addLayer(layerWithElevation);

		map.off('mousemove');
		map.fitBounds(layerWithElevation.getBounds());

		setActiveRoute(layerWithElevation);

		layerWithElevation.on('click', (event) => {
			setActiveRoute(event.target);
		});
	}

	// When finished drawing
	map.on('pm:create', (event) => {
		const geojson = event.layer.toGeoJSON();
		const newLayer = L.geoJSON(Elevation.addPointsToLineString(geojson, 0.05));

		Elevation.addElevationToLayer(newLayer).then((layerWithElevation) => {
			map.removeLayer(event.layer);
			initElevationLayer(layerWithElevation);
		});
	});

	function hideElevationProfile(layer) {
		layer.controlElevationProfile._container.style.display = 'none';
	}

	function showElevationProfile(layer) {
		layer.controlElevationProfile._container.style.display = 'block';
		layer.controlElevationProfile.addTo(map);
	}

	const drawingOptions = {
		position: 'bottomleft',
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

	map.pm.addControls(drawingOptions);

	map.on('pm:drawstart', ({workingLayer}) => {
		let currentDistance = 0;
		const tooltip = L.tooltip();
		workingLayer.bindTooltip(tooltip);

		workingLayer.on('pm:vertexadded', (event) => {
			const lastPoint = event.latlng;
			const lineGeoJSON = workingLayer.toGeoJSON();
			currentDistance = turf.length(lineGeoJSON);
			workingLayer.setTooltipContent(`${currentDistance.toFixed(1)} km`);
			workingLayer.openTooltip(event.latlng);

			map.on('mousemove', (event) => {
				const currentPoint = event.latlng;

				const newDistance =
					map.distance(currentPoint, lastPoint) / 1000 + currentDistance;
				workingLayer.setTooltipContent(`${newDistance.toFixed(1)} km`);
				workingLayer.openTooltip(event.latlng);
			});
		});
	});

	return {
		init() {
			map.pm.setGlobalOptions({
				tooltips: false,
				allowSelfIntersection: true,
				markerStyle: {draggable: false},
				finishOn: null,
			});
			map.pm.setLang('no');
		},
	};
}
