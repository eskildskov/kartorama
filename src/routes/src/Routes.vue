<template>
  <div class="mt-3">
    <section style="width:85%">
      <b-field horizontal label="Retning">
        <b-checkbox v-model="aspect" native-value="N">Nord</b-checkbox>
        <b-checkbox v-model="aspect" native-value="Ø">Øst</b-checkbox>
        <b-checkbox v-model="aspect" native-value="S">Syd</b-checkbox>
        <b-checkbox v-model="aspect" native-value="V">Vest</b-checkbox>
      </b-field>

      <b-field horizontal label="Sorter">
        <b-select size="is-small" v-model="sortBy" placeholder="Sorter">
          <option value="mountain_name">Fjell</option>
          <option value="max_start_altitude">Starthøyde</option>
          <option value="area">Område</option>
        </b-select>
      </b-field>
    </section>
    <section>
      <div v-if="matchedRoutes.length">
        <RouteListItem
          v-for="route in matchedRoutes"
          :key="route.id"
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

export default {
  components: {
    RouteListItem
  },
  data () {
    return {
      routes: routes,
      aspect: [],
      sortBy: 'mountain_name'
    }
  },
  computed: {
    matchedRoutes: function () {
      // if (!this.aspect.length) return []

      const filteredRoutes = routes.filter(r => {
        return this.aspect.every(a => {
          return r.aspect.some(aspectString => {
            return aspectString.includes(a)
          })
        })
      })

      return _.sortBy(filteredRoutes, this.sortBy)
    }
  }
}
</script>
