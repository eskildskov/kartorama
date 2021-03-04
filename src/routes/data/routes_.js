import routes from '../../routes_/routes.json'
import L from 'leaflet'

export default class Routes {
  constructor (map) {
    this.map = map

    this.routes = []

    routes.forEach(route => {
      route = new Route(route)
      this.routes.push(route)
    })
  }

  addRoutesToMap () {
    const style = {
      color: 'red'
    }

    const routesWithGeoJSON = this.routes.filter(route => route.geojson !== '')

    routesWithGeoJSON.forEach(route => {
      const routeLayer = L.geoJSON(route.geoJSON, { style: style })
      routeLayer.bindPopup(route.summary())
      routeLayer.addTo(this.map)
    })
  }
}

export const Route = (routeData) => {
  const data = routeData

  return {
    data: data,
    geoJSON: data.geoJSON,
    summary: () => {
      const r = routeData
      return `<strong>Navn:</strong> ${r.mountain_name} <br>
      <strong>Rute:</strong> ${r.route_name} <br>
      <strong>Himmelretning:</strong> ${r.aspect} `
    }
  }
}

// class Route {
//   constructor (routeData) {
//     this.routeData = routeData
//     this.geoJSON = routeData.geojson
//   }

//   summary () {
//     const r = this.routeData
//     return `<strong>Navn:</strong> ${r.mountain_name} <br>
//     <strong>Rute:</strong> ${r.route_name} <br>
//     <strong>Himmelretning:</strong> ${r.aspect} `
//   }
// }
