import routesData from './ex.json'
import L from 'leaflet'

export default class Routes {
  constructor (map) {
    this.map = map

    this.routesWithGeoJSON = routesData.filter(route => route.geojson !== '')
    this.routes = []
    this.routesWithGeoJSON.forEach(route => {
      route = new Route(route)
      this.routes.push(route)
    })
  }

  addRoutesToMap () {
    const style = {
      color: 'red'
    }

    this.routes.forEach(route => {
      console.log(route.geoJSON)
      const routeLayer = L.geoJSON(route.geoJSON, { style: style })
      routeLayer.bindPopup(route.summary())
      routeLayer.addTo(this.map)
    })
  }
}

class Route {
  constructor (routeData) {
    this.routeData = routeData
    this.geoJSON = this.routeData.geojson
  }

  summary () {
    const r = this.routeData
    return `<strong>Navn:</strong> ${r.Fjell} <br>
    <strong>Rute:</strong> ${r.Rute}`
  }
}
