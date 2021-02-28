<template>
  <article class="media mt-2 pt-2"> 
    <div class="media-content">
      <div class="content">
        <p>
          <strong>{{ route.mountain_name }}</strong>
          <small v-if="route.route_name != 'Normalveien'">{{ route.route_name }}</small>
          <i class="iconify ml-2" data-icon="mdi-car"></i> <small>{{ route.max_start_altitude }} moh</small>
          <i class="iconify ml-2" data-icon="mdi:compass-outline"></i> <small>{{ route.aspect.join(', ') }}</small>
          <i class="iconify ml-2" data-icon="bi:globe"></i> <small>{{ route.area }}</small>

        </p>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  props: {
    route: {
      type: Object,
      required: true
    }
  }
}
</script>
