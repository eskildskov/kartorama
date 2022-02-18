/* eslint-disable no-magic-numbers */
import L from "leaflet";

const attributionKartverket =
  '<a href="https://www.kartverket.no/">Kartverket</a>';
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

const Utløp = L.tileLayer(
  "https://{s}.nve.no/arcgis/rest/services/wmts/KastWMTS/MapServer/tile/{z}/{y}/{x}",
  {
    layers: [0, 1, 2, 3],
    subdomains: ["gis2", "gis3", "gis4"],
    attribution: attributionNVE,
  }
);

const Helning = L.tileLayer.wms(
  "https://nve.geodataonline.no/arcgis/services/Bratthet/MapServer/WmsServer",
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
