<script setup>
defineProps({
  bookings: { type: Array, required: true },
  editorError: { type: String, default: '' },
  editingServiceId: { type: [Number, String], default: null },
  services: { type: Array, required: true },
  users: { type: Array, required: true },
})

defineEmits(['add-service', 'close-editor', 'edit-service', 'remove-draft', 'save-service'])
const serviceForm = defineModel('serviceForm', { required: true })
</script>

<template>
  <section class="page-section soft-bg">
    <div class="container">
      <p class="eyebrow">Staff hub</p>
      <h1>Community overview</h1>
      <p class="lead narrow">This dashboard is protected: only staff accounts can access it.</p>
      <div class="stats-grid"><article><span>Registered users</span><strong>{{ users.length }}</strong></article><article><span>Activity bookings</span><strong>{{ bookings.length }}</strong></article><article><span>Local services</span><strong>{{ services.length }}</strong></article></div>
      <div class="admin-panel"><div><h2>Service directory</h2><p>Maintain the information members see when searching for help.</p></div><button class="button primary" @click="$emit('add-service')">Add service</button></div>
      <div class="service-manager">
        <article v-for="service in services" :key="service.id">
          <div><span v-if="service.isDraft" class="draft-tag">Draft</span><h3>{{ service.name }}</h3><p>{{ service.suburb }} · {{ service.type }}</p></div>
          <div class="manager-actions"><button type="button" class="button secondary" @click="$emit('edit-service', service)">Edit</button><button v-if="service.isDraft" type="button" class="text-button danger" @click="$emit('remove-draft', service)">Remove draft</button></div>
        </article>
      </div>
      <form v-if="editingServiceId !== null" class="editor-card" @submit.prevent="$emit('save-service')" novalidate>
        <div class="editor-heading"><h2>Edit service</h2><button type="button" class="text-button" @click="$emit('close-editor')">Close</button></div>
        <div class="editor-fields">
          <label>Service name<input v-model="serviceForm.name" maxlength="60" /></label>
          <label>Suburb<input v-model="serviceForm.suburb" maxlength="40" /></label>
          <label>Category<select v-model="serviceForm.type"><option>Health support</option><option>Social connection</option><option>Learning</option></select></label>
          <label>Distance<input v-model="serviceForm.distance" placeholder="e.g. 2.5 km" maxlength="12" /></label>
        </div>
        <label>Description<textarea v-model="serviceForm.description" maxlength="180" rows="3"></textarea></label>
        <p v-if="editorError" class="form-message error" role="alert">{{ editorError }}</p>
        <button class="button primary" type="submit">Save service</button>
      </form>
    </div>
  </section>
</template>
