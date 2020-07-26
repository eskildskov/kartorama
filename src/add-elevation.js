import * as turf from '@turf/turf'

export default class AddElevationToGeoJSON {
  static async fromString (geoJSONString) {
    const elevation = new AddElevationToGeoJSON(geoJSONString)
    elevation.generateWMSUrl()
    elevation
      .getElevationData(elevation._url)
      .then(() => elevation.addElevation())
    return elevation.geoJSONString
  }

  constructor (geoJSONString) {
    this.geoJSONString = geoJSONString
  }

  async getElevationData (url) {
    const response = await fetch(url)
    const txt = await response.text()
    const rows = txt.trim().split('\n')
    this.points = []
    rows.forEach(string => {
      let lonLatEle = string.split(' ')
      lonLatEle = lonLatEle.map(string => parseFloat(string))
      this.points.push(turf.point(lonLatEle))
    })
    this.points = turf.featureCollection(this.points)

    return this
  }

  elevationAt (lon, lat) {
    const nearest = turf.nearestPoint(turf.point([lon, lat]), this.points)
    const elevation = turf.getCoord(nearest)[2]

    return elevation
  }

  addElevation () {
    turf.coordEach(this.geoJSONString, coord => {
      const elevation = this.elevationAt(coord[0], coord[1])
      coord[2] = elevation
    })
  }

  generateWMSUrl () {
    const bbox = turf.bbox(this.geoJSONString)
    const bboxString = bbox.join(',')
    this._url = `https://openwms.statkart.no/skwms1/wcs.dtm?&SERVICE=WCS&REQUEST=GetCoverage&VERSION=1.0.0&COVERAGE=land_utm33_10m&FORMAT=xyz&COLORSCALE=false&CRS=EPSG:4326&WIDTH=200&HEIGHT=200&BBOX=${bboxString}`
  }
}
