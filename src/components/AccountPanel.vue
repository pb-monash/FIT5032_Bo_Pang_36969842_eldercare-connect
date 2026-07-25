<script setup>
defineProps({
  activeUser: { type: Object, default: null },
  authError: { type: String, default: '' },
  authNotice: { type: String, default: '' },
  authPending: { type: Boolean, default: false },
  displayName: { type: String, default: 'there' },
  isAdmin: { type: Boolean, default: false },
  myBookings: { type: Array, required: true },
})

const emit = defineEmits(['authenticate', 'cancel-booking', 'clear-feedback', 'logout', 'navigate'])
const authForm = defineModel('authForm', { required: true })
const authMode = defineModel('authMode', { required: true })

function selectMode(mode) {
  authMode.value = mode
  emit('clear-feedback')
}
</script>

<template>
  <section class="page-section account-section">
    <div class="container auth-layout">
      <div>
        <p class="eyebrow">Your ElderCare Connect</p>
        <h1>{{ activeUser ? `Hello, ${displayName}.` : 'A little support starts here.' }}</h1>
        <p class="lead">Create a free account to book activities and share ratings with the community.</p>
        <ul class="check-list"><li>Book local activities</li><li>Rate services you have used</li><li>Keep your details in one place</li></ul>
      </div>
      <div v-if="!activeUser" class="auth-card">
        <div class="auth-tabs">
          <button :class="{ active: authMode === 'login' }" @click="selectMode('login')">Sign in</button>
          <button :class="{ active: authMode === 'register' }" @click="selectMode('register')">Create account</button>
        </div>
        <form @submit.prevent="$emit('authenticate')" novalidate>
          <label v-if="authMode === 'register'">Full name<input v-model="authForm.name" maxlength="50" autocomplete="name" /></label>
          <label>Email address<input v-model="authForm.email" type="email" maxlength="100" autocomplete="email" /></label>
          <label>Password<input v-model="authForm.password" type="password" minlength="8" :autocomplete="authMode === 'register' ? 'new-password' : 'current-password'" /><small>At least 10 characters, including uppercase, lowercase and a number.</small></label>
          <p v-if="authMode === 'register'" class="form-message">New accounts are created as community member accounts. Passwords are stored as a salted hash on this device.</p>
          <p v-if="authError" class="form-message error" role="alert">{{ authError }}</p>
          <p v-if="authNotice" class="form-message" role="status">{{ authNotice }}</p>
          <button class="button primary wide" type="submit" :disabled="authPending">{{ authPending ? 'Please wait…' : authMode === 'login' ? 'Sign in securely' : 'Create my account' }}</button>
        </form>
        <p v-if="authMode === 'login'" class="staff-hint"><strong>Staff demo:</strong> staff@eldercare.org / StaffDemo2026</p>
      </div>
      <div v-else class="profile-card">
        <span class="profile-icon">{{ activeUser.name.charAt(0) }}</span><h2>{{ activeUser.name }}</h2><p>{{ activeUser.email }}</p>
        <p><span class="tag">{{ activeUser.role === 'admin' ? 'Staff member' : 'Community member' }}</span></p>
        <div class="booking-summary">
          <h3>Your activity bookings</h3>
          <p v-if="!myBookings.length">You have no upcoming bookings yet.</p>
          <ul v-else><li v-for="item in myBookings" :key="item.booking.id"><span><strong>{{ item.activity.title }}</strong><small>{{ item.activity.date }}</small></span><button type="button" @click="$emit('cancel-booking', item.booking, item.activity)">Cancel</button></li></ul>
        </div>
        <button v-if="isAdmin" class="button secondary wide" @click="$emit('navigate', 'admin')">Open staff hub</button>
        <button class="text-button" @click="$emit('logout')">Sign out</button>
      </div>
    </div>
  </section>
</template>
