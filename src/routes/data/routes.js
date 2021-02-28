import routesJSON from './routes.json'

export default class Routes {
  constructor () {

    this.routes = []

    routesJSON.forEach(r => {
      const route = new Route(r)
      this.routes.push(route)
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
