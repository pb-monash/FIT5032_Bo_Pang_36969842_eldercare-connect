<script setup>
defineProps({
  activities: { type: Array, required: true },
})

defineEmits(['book'])
</script>

<template>
  <section class="page-section soft-bg">
    <div class="container">
      <p class="eyebrow">Community calendar</p>
      <h1>Small moments, good company.</h1>
      <p class="lead narrow">Reserve a spot in an upcoming activity. We will save your booking on this device.</p>
      <div class="activity-list">
        <article v-for="activity in activities" :key="activity.id" class="activity-card">
          <div class="date-tile"><span>{{ activity.date.split(',')[0] }}</span><b>{{ activity.date.split(',')[1] }}</b></div>
          <div><span class="tag">{{ activity.category }}</span><h2>{{ activity.title }}</h2><p>{{ activity.seats }} places available</p></div>
          <button class="button primary" :disabled="activity.seats === 0" @click="$emit('book', activity)">{{ activity.seats ? 'Book a place' : 'Full' }}</button>
        </article>
      </div>
    </div>
  </section>
</template>
