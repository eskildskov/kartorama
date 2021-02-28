// import routes from './routes.json'
import L from 'leaflet'

export default function addRoutesToMap (map, routes) {
    const style = {
      color: 'red'
    }

    const routesWithGeoJSON = routes.filter(route => route.geoJSON !== '')

    routesWithGeoJSON.forEach(route => {
      const routeLayer = L.geoJSON(route.geoJSON, { style: style })
      routeLayer.addTo(map)
    })
}
