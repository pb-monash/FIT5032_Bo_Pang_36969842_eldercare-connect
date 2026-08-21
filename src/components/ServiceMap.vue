<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  services: { type: Array, required: true },
})

const mapSearch = ref('')
const selectedServiceId = ref(props.services[0]?.id || null)
const userLocation = ref(null)
const locationStatus = ref('Use my location for a personalised trip estimate.')

const claytonCampus = { lat: -37.9132, lng: 145.1349 }

const selectedService = computed(() => props.services.find(service => service.id === selectedServiceId.value) || props.services[0])
const mappedServices = computed(() => props.services.filter(service => service.coordinates))
const filteredServices = computed(() => {
  const keyword = mapSearch.value.trim().toLowerCase()
  if (!keyword) return mappedServices.value
  return mappedServices.value.filter(service => `${service.name} ${service.suburb} ${service.type}`.toLowerCase().includes(keyword))
})

function degreesToRadians(value) {
  return value * Math.PI / 180
}

function distanceKm(start, end) {
  const radius = 6371
  const latDelta = degreesToRadians(end.lat - start.lat)
  const lngDelta = degreesToRadians(end.lng - start.lng)
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(degreesToRadians(start.lat)) * Math.cos(degreesToRadians(end.lat)) * Math.sin(lngDelta / 2) ** 2
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const routeStart = computed(() => userLocation.value || claytonCampus)
const selectedDistance = computed(() => selectedService.value?.coordinates ? distanceKm(routeStart.value, selectedService.value.coordinates) : 0)
const tripEstimate = computed(() => ({
  drive: Math.max(4, Math.round(selectedDistance.value / 30 * 60)),
  walk: Math.max(8, Math.round(selectedDistance.value / 4.5 * 60)),
}))
const routeUrl = computed(() => {
  if (!selectedService.value?.coordinates) return 'https://www.openstreetmap.org/'
  const start = routeStart.value
  const end = selectedService.value.coordinates
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${start.lat}%2C${start.lng}%3B${end.lat}%2C${end.lng}`
})

function markerStyle(service) {
  return {
    left: `${service.mapPosition?.x || 50}%`,
    top: `${service.mapPosition?.y || 50}%`,
  }
}

function selectService(service) {
  selectedServiceId.value = service.id
}

function locateUser() {
  if (!navigator.geolocation) {
    locationStatus.value = 'Your browser does not support geolocation.'
    return
  }
  locationStatus.value = 'Requesting location permission...'
  navigator.geolocation.getCurrentPosition(position => {
    userLocation.value = { lat: position.coords.latitude, lng: position.coords.longitude }
    locationStatus.value = 'Using your current location for trip estimates.'
  }, () => {
    locationStatus.value = 'Location permission was not granted. Trip estimates use Clayton as the starting point.'
  }, { enableHighAccuracy: true, timeout: 6000 })
}
</script>

<template>
  <section class="page-section map-section">
    <div class="container">
      <p class="eyebrow">Geo location</p>
      <h1>Find nearby support on the map.</h1>
      <p class="lead narrow">Search services, compare trip estimates and open route planning for the selected support location.</p>
      <div class="map-layout">
        <div class="map-panel" role="img" aria-label="Map-style panel showing local services around Clayton, Oakleigh, Chadstone and Hughesdale">
          <div class="map-road road-one"></div><div class="map-road road-two"></div><div class="map-road road-three"></div>
          <button v-for="service in filteredServices" :key="service.id" type="button" class="map-marker" :class="{ active: selectedService?.id === service.id }" :style="markerStyle(service)" :aria-label="`Select ${service.name}`" @click="selectService(service)"><span>{{ service.id }}</span></button>
        </div>
        <aside class="map-sidebar">
          <label>Search place or service<input v-model="mapSearch" type="search" placeholder="Clayton, physio, garden..." /></label>
          <div class="map-results" aria-label="Map search results">
            <button v-for="service in filteredServices" :key="service.id" type="button" :class="{ active: selectedService?.id === service.id }" @click="selectService(service)"><strong>{{ service.name }}</strong><span>{{ service.suburb }} - {{ service.type }}</span></button>
          </div>
          <div v-if="selectedService" class="trip-card">
            <span class="tag">{{ selectedService.type }}</span>
            <h2>{{ selectedService.name }}</h2>
            <p>{{ selectedService.suburb }} - {{ selectedService.distance }} from Clayton</p>
            <dl><div><dt>Drive</dt><dd>{{ tripEstimate.drive }} min</dd></div><div><dt>Walk</dt><dd>{{ tripEstimate.walk }} min</dd></div><div><dt>Distance</dt><dd>{{ selectedDistance.toFixed(1) }} km</dd></div></dl>
            <button type="button" class="button secondary wide" @click="locateUser">Use my location</button>
            <p class="form-message">{{ locationStatus }}</p>
            <a class="button primary wide" :href="routeUrl" target="_blank" rel="noreferrer">Open route in OpenStreetMap</a>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>
