/* eslint-disable no-magic-numbers */

import { lineChunk, lineString, bbox } from "@turf/turf";
import { coordEach, coordAll } from "@turf/meta";
import { fromArrayBuffer } from "geotiff";
import L from "leaflet";

function addPointsToLineString(geojson, distance) {
  const chunkedLineString = lineChunk(geojson, distance);
  return lineString(coordAll(chunkedLineString));
}

function generateGeotransform(image) {
  const [tiepoint] = image.getTiePoints();
  const pixelScale = image.getFileDirectory().ModelPixelScale;
  return [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1 * pixelScale[1]];
}

function generateWMSUrl(geojson) {
  const WMS_URL =
    "https://openwms.statkart.no/skwms1/wcs.dtm?&SERVICE=WCS&REQUEST=GetCoverage&VERSION=1.0.0&COVERAGE=land_utm33_10m&FORMAT=GEOTIFF&COLORSCALE=false&CRS=EPSG:4326&WIDTH=700&HEIGHT=700";
  const boundingbox = bbox(geojson);
  const boundingBoxString = boundingbox.join(",");
  return `${WMS_URL}&BBOX=${boundingBoxString}`;
}

async function fetchImage(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const tiff = await fromArrayBuffer(arrayBuffer);
  return tiff.getImage();
}

async function arrayFromImage(image) {
  const rasters = await image.readRasters();
  const dataArray = [];

  for (let heightIndex = 0; heightIndex < image.getHeight(); heightIndex += 1) {
    dataArray[heightIndex] = [];

    for (let widthIndex = 0; widthIndex < image.getWidth(); widthIndex += 1) {
      dataArray[heightIndex][widthIndex] =
        rasters[0][widthIndex + heightIndex * image.getWidth()];
    }
  }

  return dataArray;
}

async function altitudeService(geojson) {
  const image = await fetchImage(generateWMSUrl(geojson));
  const dataArray = await arrayFromImage(image);
  const geotransform = generateGeotransform(image);

  function altitudeAtCoord(lon, lat) {
    let Xpixel = Math.round((lon - geotransform[0]) / geotransform[1]);
    let Ypixel = Math.round((lat - geotransform[3]) / geotransform[5]);

    if (Xpixel === image.getWidth()) {
      Xpixel -= 1;
    }

    if (Ypixel === image.getHeight()) {
      Ypixel -= 1;
    }

    return dataArray[Ypixel][Xpixel];
  }

  return {
    altitudeAtCoord,
  };
}

async function addAltitudeToGeojson(geojson) {
  const altitude = await altitudeService(geojson);
  const geojsonWithAltitude = JSON.parse(JSON.stringify(geojson));

  coordEach(geojsonWithAltitude, (coord) => {
    const elevation = altitude.altitudeAtCoord(coord[0], coord[1]);
    coord[2] = elevation;
  });

  return geojsonWithAltitude;
}

async function addAltitudeToLayer(layer) {
  const geojson = layer.toGeoJSON();
  const chunkedGeojson = addPointsToLineString(geojson, 0.05);
  const geojsonWithAltitude = await addAltitudeToGeojson(chunkedGeojson);
  return L.geoJSON(geojsonWithAltitude);
}

function sumAltitudes(altitudes, treshold) {
  let elevationGain = 0;
  let elevationLoss = 0;
  let previousAltitude = altitudes.shift();

  for (const currentAltitude of altitudes) {
    const diff = currentAltitude - previousAltitude;

    if (diff > treshold) {
      elevationGain += diff;
      previousAltitude = currentAltitude;
    }

    if (diff < -treshold) {
      elevationLoss += diff;
      previousAltitude = currentAltitude;
    }
  }

  return {
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(-elevationLoss),
  };
}

function getElevationGainAndLoss(geojson) {
  const ALTITUDE_TRESHOLD = 10;
  const altitudes = coordAll(geojson).map((coord) => coord[2]);
  return sumAltitudes(altitudes, ALTITUDE_TRESHOLD);
}

export { getElevationGainAndLoss, addAltitudeToLayer };
