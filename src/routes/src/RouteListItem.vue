<template>
  <article @click="onClick" class="media mt-0 pb-2 pt-2"> 
    <div class="media-content">
      <div class="content">
        <p>
          <strong>{{ route.mountain_name }}</strong>
          <small v-if="route.route_name != 'Normalveien'">{{ route.route_name }}</small>
          <i class="iconify ml-2" data-icon="mdi-car"></i> <small>{{ route.max_start_altitude }} moh</small>
          <i class="iconify ml-2" data-icon="mdi:compass-outline"></i> <small>{{ route.aspect.join(', ') }}</small>
          <i class="iconify ml-2" data-icon="bi:globe"></i> <small>{{ route.area }}</small>
          <span v-if="isActive"><br/>
            <span v-if="route.avalanche_start_zones.length">
              <i class="iconify" data-icon="mdi:angle-acute"></i>
              <span v-for="z in route.avalanche_start_zones">
                {{ z[0] }}: {{z[1]}}°.
              </span>

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
</style>