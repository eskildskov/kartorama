<template>
  <div class="mt-3">
    <section class="block">
      <b-field horizontal label="Retning">
        <b-checkbox v-model="aspect" native-value="N">Nord</b-checkbox>
        <b-checkbox v-model="aspect" native-value="Ø">Øst</b-checkbox>
        <b-checkbox v-model="aspect" native-value="S">Syd</b-checkbox>
        <b-checkbox v-model="aspect" native-value="V">Vest</b-checkbox>
      </b-field>

      <b-field horizontal label="KAST">
        <b-checkbox v-model="kast" native-value="1">1</b-checkbox>
        <b-checkbox v-model="kast" native-value="2">2</b-checkbox>
        <b-checkbox v-model="kast" native-value="3">3</b-checkbox>
      </b-field>

      <b-field horizontal label="Løsneområder">
        <b-checkbox v-model="no_avalanche_start_zones" native-value="True">Ingen obligatoriske</b-checkbox>
      </b-field>


      <b-field horizontal label="Laveste starthøyde">
        <b-slider v-model="min_start_altitude" size="is-small" :step="100" :min="0" :max="400" :tooltip="false" :ticks="false">
          <template v-for="val in [0, 100, 200, 300, 400]">
            <b-slider-tick :value="val" :key="val">{{ val }}</b-slider-tick>
          </template>
        </b-slider>
      </b-field>

      <b-field horizontal label="Sorter">
        <b-select size="is-small" v-model="sortBy" placeholder="Sorter">
          <option value="mountain_name">Fjell</option>
          <option value="max_start_altitude">Starthøyde</option>
          <option value="area">Område</option>
        </b-select>
      </b-field>
    </section>

    <section class="block">
      <div v-if="filteredRoutes.length">
        <RouteListItem
          v-for="route in filteredRoutes"
          :key="route.route_id"
          :route="route"
        />
      </div>
      <p v-else>
        Ingen treff
      </p>
    </section>
  </div>
</template>

<script>
import RouteListItem from './RouteListItem.vue'
import routes from '../data/routes.json'
import _ from 'lodash'
import EventBus from './EventBus'

export default {
  components: {
    RouteListItem
  },
  data () {
    return {
      routes: routes,
      aspect: [],
      kast: [],
      min_start_altitude: 0,
      no_avalanche_start_zones: false,
      sortBy: 'mountain_name',
    }
  },
  methods: {
    filterByAspect: function () {
      let filteredRoutes = []

      if (!this.aspect.length) {
        filteredRoutes = this.routes
      } else {
        filteredRoutes = this.routes.filter(r => {
          return this.aspect.every(a => {
            return r.aspect.some(aspectString => {
              return aspectString.includes(a)
            })
          })
        })
      }
      return filteredRoutes
    },

    filterByKAST: function () {
      let filteredRoutes = []

      if (!this.kast.length) {
        filteredRoutes = this.routes
      } else {
        filteredRoutes = this.routes.filter(r => {
          return this.kast.includes(r.kast.toString())
        })
      }

      return filteredRoutes
    },

    filterByAltitude: function () {
      return routes.filter(r => {
        return r.max_start_altitude > this.min_start_altitude
        })
    },

    filterByAvalancheZones: function() {
      console.log(this.no_avalanche_start_zones)
      if (this.no_avalanche_start_zones) { 
        return routes.filter(r => {
          console.log(r.avalanche_start_zones)
          return !r.avalanche_start_zones || !r.avalanche_start_zones.length
        } )
      }
      else {
        return routes
      }
    }
  },

  watch: {
    filteredRoutes (routes) {
      const routeIds = routes.map(r => r.route_id)
      EventBus.$emit('routes-filtered', routeIds)
    }
  },

  computed: {
    filteredRoutes: function () {
      const filteredRoutes = _.intersection(
        this.filterByKAST(),
        this.filterByAspect(),
        this.filterByAltitude(),
        this.filterByAvalancheZones()
      )
      return _.sortBy(filteredRoutes, this.sortBy)
    }
  }
}
</script>
