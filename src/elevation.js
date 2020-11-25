import * as turf from '@turf/turf'
import fetch from 'node-fetch'
import * as GeoTIFF from 'geotiff'

export default class Elevation {
  constructor (geojson) {
    this.geojson = geojson
  }

  static async addElevationToGeojson (geojson) {
    const elevation = new Elevation(geojson)
    await elevation.fetchElevationData()
    return elevation.addElevationToCoords()
  }

  async fetchElevationData () {
    // Return array with the elevation data
    this.url = this.generateWMSUrl(this.geojson)

    const response = await fetch(this.url)
    const arrayBuffer = await response.arrayBuffer()
    this.tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer)
    this.image = await this.tiff.getImage()

    this.geoTransform = this.generateGeotransform()

    const rasters = await this.image.readRasters()

    this.dataArray = new Array(this.image.getHeight())
    for (var j = 0; j < this.image.getHeight(); j++) {
      this.dataArray[j] = new Array(this.image.getWidth())
      for (var i = 0; i < this.image.getWidth(); i++) {
        this.dataArray[j][i] = rasters[0][i + j * this.image.getWidth()]
      }
    }

    return this.dataArray
  }

  async addElevationToCoords () {
    turf.coordEach(this.geojson, coord => {
      const elevation = this.elevationAtCoord(coord[0], coord[1])
      coord[2] = elevation
    })
    return this.geojson
  }

  elevationAtCoord (lon, lat) {
    const gt = this.geoTransform
    let Xpixel = Math.round((lon - gt[0]) / gt[1])
    let Ypixel = Math.round((lat - gt[3]) / gt[5])

    // A small hack when its on max bounds
    if (Xpixel === this.image.getWidth()) {
      Xpixel--
    }

    if (Ypixel === this.image.getHeight()) {
      Ypixel--
    }
    const elevation = this.dataArray[Ypixel][Xpixel]
    return elevation
  }

  // Height and weight-params should maybe be dynamic??
  generateWMSUrl () {
    const bbox = turf.bbox(this.geojson)
    const bboxString = bbox.join(',')
    return `https://openwms.statkart.no/skwms1/wcs.dtm?&SERVICE=WCS&REQUEST=GetCoverage&VERSION=1.0.0&COVERAGE=land_utm33_10m&FORMAT=GEOTIFF&COLORSCALE=false&CRS=EPSG:4326&WIDTH=700&HEIGHT=700&BBOX=${bboxString}`
  }

  generateGeotransform () {
    const tiepoint = this.image.getTiePoints()[0]
    const pixelScale = this.image.getFileDirectory().ModelPixelScale
    return [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1 * pixelScale[1]]
  }
}
