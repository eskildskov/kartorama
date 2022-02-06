/* eslint-disable no-magic-numbers */
import L from "leaflet";
import { dynamicMapLayer } from "esri-leaflet";

const attributionKartverket =
  '<a href="http://www.kartverket.no/">Kartverket</a>';
const subdomainsKartverket = ["opencache", "opencache2", "opencache3"];
const attributionNVE = '<a href="https://www.nve.no/">NVE</a>';

const Papirkart = L.tileLayer(
  "https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster4&zoom={z}&x={x}&y={y}",
  {
    attribution: attributionKartverket,
    subdomains: subdomainsKartverket,
  }
);

const Vektorkart = L.tileLayer(
  "https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}",
  {
    attribution: attributionKartverket,
    subdomains: subdomainsKartverket,
  }
);

const Utløp = dynamicMapLayer(
  {
    url: "https://gis2.nve.no/arcgis/rest/services/wmts/KastWMTS/MapServer",
    layers: [0, 1, 2, 3],
  },
  {
    attribution: attributionNVE,
  }
);

const Helning = L.tileLayer.wms(
  "https://gis3.nve.no/map/services/Bratthet/MapServer/WmsServer?",
  {
    layers: "Bratthet_snoskred",
    format: "image/png",
    transparent: "true",
    attribution: attributionNVE,
  }
);

const baseMaps = {
  Vektorkart,
  Papirkart,
};

const overlayMaps = {
  Helning,
  Utløp,
};

const groupedOverlays = {
  Tillegg: overlayMaps,
};

export { groupedOverlays, overlayMaps, baseMaps };
