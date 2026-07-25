<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeUser: { type: Object, default: null },
  services: { type: Array, required: true },
})

defineEmits(['rate'])

const search = defineModel('search', { default: '' })
const filter = defineModel('filter', { default: 'All' })
const sortOrder = defineModel('sortOrder', { default: 'nearest' })

const serviceTypes = computed(() => ['All', ...new Set(props.services.map(service => service.type))])
const filteredServices = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  const matchingServices = props.services.filter(service => (
    (filter.value === 'All' || service.type === filter.value)
    && (!keyword || `${service.name} ${service.suburb} ${service.type}`.toLowerCase().includes(keyword))
  ))
  return [...matchingServices].sort((first, second) => {
    if (sortOrder.value === 'rating') return averageRating(second) - averageRating(first)
    return Number.parseFloat(first.distance) - Number.parseFloat(second.distance)
  })
})

function allRatings(service) {
  return [...(service.ratings || []), ...Object.values(service.userRatings || {})]
}

function averageRating(service) {
  const ratings = allRatings(service)
  if (!ratings.length) return 0
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
}

function formatRating(service) {
  return averageRating(service).toFixed(1)
}

function ratingCount(service) {
  return allRatings(service).length
}

function currentUserRating(service) {
  return service.userRatings?.[props.activeUser?.id] || 0
}

function clearFilters() {
  search.value = ''
  filter.value = 'All'
}
</script>

<template>
  <section class="page-section">
    <div class="container">
      <p class="eyebrow">Local support</p>
      <h1>Services that feel close to home.</h1>
      <p class="lead narrow">Search trusted community partners and see ratings from other members.</p>
      <div class="filters" aria-label="Search support services">
        <label>Search <input v-model="search" type="search" placeholder="Service or suburb" /></label>
        <label>Category <select v-model="filter"><option v-for="type in serviceTypes" :key="type">{{ type }}</option></select></label>
        <label>Sort results <select v-model="sortOrder"><option value="nearest">Nearest first</option><option value="rating">Highest rated</option></select></label>
      </div>
      <p class="result-count">{{ filteredServices.length }} service<span v-if="filteredServices.length !== 1">s</span> found</p>
      <div v-if="filteredServices.length" class="service-grid">
        <article v-for="service in filteredServices" :key="service.id" class="service-card">
          <div class="service-card-head"><span class="tag">{{ service.type }}</span><span class="distance">⌖ {{ service.distance }}</span></div>
          <h2>{{ service.name }}</h2><p class="location">{{ service.suburb }}</p><p>{{ service.description }}</p>
          <div class="rating-summary"><strong aria-label="average rating">★ {{ formatRating(service) }}</strong><span>from {{ ratingCount(service) }} rating<span v-if="ratingCount(service) !== 1">s</span></span></div>
          <fieldset class="rate-control">
            <legend>{{ activeUser ? 'Your rating (you can update it)' : 'Sign in to rate' }}</legend>
            <button v-for="star in 5" :key="star" type="button" :aria-label="`Rate ${star} out of 5`" :class="{ selected: currentUserRating(service) >= star }" @click="$emit('rate', service, star)">★</button>
          </fieldset>
        </article>
      </div>
      <div v-else class="empty-state"><h2>No services match that search.</h2><p>Try a different suburb, service name or category.</p><button class="button secondary" @click="clearFilters">Clear search</button></div>
    </div>
  </section>
</template>
