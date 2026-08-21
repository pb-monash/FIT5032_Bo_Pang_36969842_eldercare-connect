<script setup>
defineProps({
  activities: { type: Array, required: true },
})

defineEmits(['book'])

function bookingClosed(activity) {
  return activity.bookingCutoff && Date.now() > new Date(activity.bookingCutoff).getTime()
}

function capacityUsed(activity) {
  const maxSeats = activity.maxSeats || activity.seats
  return Math.max(0, Math.min(100, Math.round(((maxSeats - activity.seats) / maxSeats) * 100)))
}

function cutoffLabel(activity) {
  if (!activity.bookingCutoff) return 'Bookings stay open until the session starts.'
  return `Book before ${new Date(activity.bookingCutoff).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
}
</script>

<template>
  <section class="page-section soft-bg">
    <div class="container">
      <p class="eyebrow">Community calendar</p>
      <h1>Small moments, good company.</h1>
      <p class="lead narrow">Reserve a spot in an upcoming activity. Calendar rules prevent late, duplicate and over-capacity bookings.</p>
      <div class="activity-list">
        <article v-for="activity in activities" :key="activity.id" class="activity-card">
          <div class="date-tile"><span>{{ activity.date.split(',')[0] }}</span><b>{{ activity.date.split(',').slice(1).join(',').trim() }}</b></div>
          <div class="activity-copy"><span class="tag">{{ activity.category }}</span><h2>{{ activity.title }}</h2><p>{{ activity.seats }} of {{ activity.maxSeats || activity.seats }} places available</p><div class="capacity-track" aria-hidden="true"><span :style="{ width: `${capacityUsed(activity)}%` }"></span></div><small>{{ cutoffLabel(activity) }}</small></div>
          <button class="button primary" :disabled="activity.seats === 0 || bookingClosed(activity)" @click="$emit('book', activity)">{{ activity.seats === 0 ? 'Full' : bookingClosed(activity) ? 'Closed' : 'Book a place' }}</button>
        </article>
      </div>
    </div>
  </section>
</template>
