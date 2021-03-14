<template>
  <article
    @click="onClick"
    class="media mt-0 pb-2 pt-2"
    v-bind:class="{ active: isActive }"
  > 
    <div class="media-content">
      <div class="content">
        <p>
          <strong class="mountain-name">{{ route.mountain_name }}</strong>
          <small v-if="route.route_name != 'Normalveien'">{{ route.route_name }}</small>

          <span v-show="isActive === false">
            <i class="iconify ml-2" data-icon="mdi-car"></i> <small>{{ route.max_start_altitude }} moh</small>
            <i class="iconify ml-2" data-icon="mdi:compass-outline"></i> <small>{{ route.aspect.join(', ') }}</small>
          </span>

          <span v-show="isActive">
            <br />
            <i class="iconify mr-1" data-icon="fa-solid:traffic-light"></i>
            <strong>KAST: </strong>{{ route.kast }}. <strong>Eksponering: </strong>{{ route.exposure }}. <strong>Vanskelighetsgrad: </strong>{{ route.difficulty }}.


            <br />
            <i class="iconify mr-1" data-icon="mdi-car"></i><strong>Parkering:</strong>
            <template v-if="route.start_location">{{route.start_location}}, </template>

{{ route.max_start_altitude }} moh
            <br />
            <i class="iconify mr-1" data-icon="mdi:compass-outline"></i><strong>Retning:</strong> {{ route.aspect.join(', ') }}
            <br />
            <i class="iconify mr-1" data-icon="bi:globe"></i><strong>Område:</strong>
<span>{{ route.area }}</span>

            <span v-if="route.avalanche_start_zones.length">
              <br />
              <i class="iconify" data-icon="mdi:angle-acute"></i>
              <strong>Løsneområder: </strong>
              <span class="mr-1" v-for="z in route.avalanche_start_zones">
                {{ z[0] }} moh: {{z[1]}}°.
              </span>
            </span>

            <span v-if="route.dangers">
              <br />
              <i class="iconify" data-icon="jam:triangle-danger-f"></i>
              <strong>Farer: </strong><span>{{ route.dangers }}</span>
            </span>

            <span v-if="route.equipment">
              <br />
              <i class="iconify" data-icon="whh:pickaxe"></i>
              <strong>Utstyr: </strong><span>{{ route.equipment }}</span>
            </span>


            <span v-if="route.comment">
              <br />
              <i class="iconify" data-icon="fa-solid:lightbulb"></i>
              <strong>Kommentar: </strong><span>{{ route.comment }}</span>
            </span>

          </span>
        </p>

      </div>
    </div>
  </article>
</template>

<script>
import EventBus from './EventBus'

export default {
  props: {
    route: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isActive: false
    }
  },
  methods: {
   onClick() {
     EventBus.$emit('route-selected', this.route.route_id);
   }
  },
  mounted() { 
    EventBus.$on('route-selected', routeId => {
      if (this.route.route_id == routeId) {
        this.isActive = true
        this.$el.scrollIntoView()
      }
      else {
        this.isActive = false
      }
    })
  }


}
</script>
<style scoped>
article:hover {
  background: rgb(240, 240, 240);
  cursor: pointer;
}

article.active {
  background:rgb(240, 240, 240);
  cursor:auto;
  font-size: 1.1em;
}

.active .mountain-name {
  font-size:1.2em
}
</style>