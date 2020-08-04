import * as turf from '@turf/turf'
import fetch from 'node-fetch'

export default class AddElevationToGeoJSON {
  constructor (geoJSON) {
    this.geoJSON = geoJSON
  }

  async geoJSONWithElevation () {
    const elevationData = await this.fetchElevationData()
    const geoJSONWithElevation = this.addElevationtoGeoJSON(
      this.geoJSON,
      elevationData
    )
    return geoJSONWithElevation
  }

  async fetchElevationData () {
    // Return FeatureCollection with the elevation data

    const url = this.generateWMSUrl(this.geoJSON)
    const response = await fetch(url)
    const txt = await response.text()
    const rows = txt.trim().split('\n')

    let points = []
    rows.forEach(string => {
      let lonLatEle = string.split(' ')
      lonLatEle = lonLatEle.map(string => parseFloat(string))
      points.push(turf.point(lonLatEle))
    })

    points = turf.featureCollection(points)
    return points
  }

  addElevationtoGeoJSON (geoJSON, points) {
    turf.coordEach(geoJSON, coord => {
      const elevation = this.elevationAt(coord[0], coord[1], points)
      coord[2] = elevation
    })
    return geoJSON
  }

  elevationAt (lon, lat, points) {
    const nearest = turf.nearestPoint(turf.point([lon, lat]), points)
    const elevation = turf.getCoord(nearest)[2]
    return elevation
  }

  generateWMSUrl (geoJSON) {
    const bbox = turf.bbox(geoJSON)
    const bboxString = bbox.join(',')
    return `https://openwms.statkart.no/skwms1/wcs.dtm?&SERVICE=WCS&REQUEST=GetCoverage&VERSION=1.0.0&COVERAGE=land_utm33_10m&FORMAT=xyz&COLORSCALE=false&CRS=EPSG:4326&WIDTH=200&HEIGHT=200&BBOX=${bboxString}`
  }
}
