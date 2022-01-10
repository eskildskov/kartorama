import "@geoman-io/leaflet-geoman-free";
import "@raruto/leaflet-elevation";
import L from "leaflet";
import { length } from "@turf/turf";

import { addAltitudeToLayer, getElevationGainAndLoss } from "./elevation.js";

const pathOptions = { className: "route" };

const pmOptions = {
  tooltips: false,
  allowSelfIntersection: true,
  markerStyle: { draggable: false },
  // eslint-disable-next-line unicorn/no-null
  finishOn: null,
  templineStyle: { className: "route is-drawing" },
  hintlineStyle: { className: "route is-drawing" },
  pathOptions,
};

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

function generateTooltip(data, layer) {
  const popupElement = document.createElement("p");
  popupElement.innerHTML = `Distanse: ${data.distance} km. Opp: ${data.elevationGain} m. Ned: ${data.elevationLoss} m. `;

  // const removeLayerLink = document.createElement("a");
  // removeLayerLink.textContent = "Slett spor";
  // removeLayerLink.href = "#";
  // removeLayerLink.addEventListener("click", () => {
  //   deactivateRoute(layer);
  //   layer.remove();
  // });

  // PopupElement.append(removeLayerLink);

  return popupElement;
}

function addTooltipToRouteLayer(layer) {
  const geojson = layer.toGeoJSON();
  const distance = length(geojson).toFixed(1);
  const { elevationGain, elevationLoss } = getElevationGainAndLoss(geojson);
  const popupElement = generateTooltip(
    {
      elevationGain,
      elevationLoss,
      distance,
    },
    layer
  );

  layer.bindPopup(popupElement);
}

function getElevationLine(routeLayer) {
  return routeLayer.controlElevationProfile._layers._layers;
}

function deactivateElevationLine(routeLayer) {
  const elevationLine = getElevationLine(routeLayer);
  if (Object.keys(elevationLine).length > 0) {
    Object.values(elevationLine)[0].remove();
  }
}

function hideElevationProfile(layer) {
  layer.controlElevationProfile._container.style.display = "none";
}

function allUserRoutes(map) {
  let geojsons = [];
  map.routeLayers.eachLayer((routeLayer) => {
    const geojson = routeLayer.toGeoJSON();
    geojsons = [...geojsons, ...geojson.features];
  });

  return geojsons;
}

function getLastUserRoute(map) {
  const layers = map.routeLayers.getLayers();
  return layers.pop().toGeoJSON();
}

function RouteHandler(map) {
  function showElevationProfile(layer) {
    layer.controlElevationProfile._container.style.display = "block";
    layer.controlElevationProfile.addTo(map);
  }

  function activateElevationLine(routeLayer) {
    const elevationLine = getElevationLine(routeLayer);
    if (Object.keys(elevationLine).length > 0) {
      Object.values(elevationLine)[0].addTo(map);
    }
  }

  function deactivateRoute(routeLayer) {
    hideElevationProfile(routeLayer);
    deactivateElevationLine(routeLayer);
    map.state.activeRouteLayer = undefined;
  }

  function setActiveRoute(routeLayer) {
    if (map.state.activeRouteLayer) {
      deactivateRoute(map.state.activeRouteLayer);
    }

    activateElevationLine(routeLayer);
    showElevationProfile(routeLayer);
    routeLayer.openPopup();
    map.state.activeRouteLayer = routeLayer;
  }

  function initElevationLayer(layer) {
    const geojsonWithElevation = layer.toGeoJSON();
    layer.controlElevationProfile = L.control.elevation(elevationOptions);
    layer.controlElevationProfile.addTo(map).loadData(geojsonWithElevation);
    addTooltipToRouteLayer(layer);

    // map.off("mousemove");
    map.fitBounds(layer.getBounds());

    layer.setStyle(pathOptions);
    map.addLayer(layer);
    map.routeLayers.addLayer(layer);
    setActiveRoute(layer);

    layer.on("click", (event) => {
      setActiveRoute(event.target);
    });
  }

  function distanceInKm(latlng1, latlng2) {
    const METERS_IN_KM = 1000;

    return map.distance(latlng1, latlng2) / METERS_IN_KM;
  }

  function initDrawingTooltip() {
    map.on("pm:drawstart", ({ workingLayer }) => {
      let totalDistance = 0;
      const tooltip = L.tooltip();
      workingLayer.bindTooltip(tooltip);

      workingLayer.on("pm:vertexadded", (event) => {
        const lastLatlng = event.latlng;
        const lineGeoJSON = workingLayer.toGeoJSON();
        totalDistance = length(lineGeoJSON);
        workingLayer.setTooltipContent(`${totalDistance.toFixed(1)} km`);
        workingLayer.openTooltip(event.latlng);

        map.on("mousemove", (event) => {
          const currentLatlng = event.latlng;
          const currentDistance =
            distanceInKm(lastLatlng, currentLatlng) + totalDistance;
          workingLayer.setTooltipContent(`${currentDistance.toFixed(1)} km`);
          workingLayer.openTooltip(event.latlng);
        });
      });
    });
  }

  async function addElevationAndReplace(layer) {
    const layerWithElevation = await addAltitudeToLayer(layer);
    map.removeLayer(layer);
    initElevationLayer(layerWithElevation);
  }

  return {
    init() {
      map.on("click", () => {
        if (map.state.activeRouteLayer) {
          deactivateRoute(map.state.activeRouteLayer);
        }
      });

      map.routeLayers = L.layerGroup();

      map.pm.setGlobalOptions(pmOptions);
      map.pm.setLang("no");
      map.pm.addControls(drawingOptions);

      map.on("pm:create", (event) => {
        console.log(JSON.stringify(event.layer.toGeoJSON()));
        addElevationAndReplace(event.layer);
      });

      initDrawingTooltip();
    },

    addElevationAndReplace,
  };
}

export { RouteHandler, getLastUserRoute };
