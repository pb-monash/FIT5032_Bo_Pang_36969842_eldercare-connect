<script setup>
const props = defineProps({
  activeUser: { type: Object, default: null },
  currentPage: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  menuOpen: { type: Boolean, default: false },
  navItems: { type: Array, required: true },
  readingOptions: { type: Object, required: true },
})

const emit = defineEmits(['navigate', 'toggle-reading', 'update:menuOpen'])

function navigate(page) {
  emit('navigate', page)
  emit('update:menuOpen', false)
}

function toggleMenu() {
  emit('update:menuOpen', !props.menuOpen)
}
</script>

<template>
  <header class="site-header" :class="{ 'high-contrast': readingOptions.highContrast, 'large-text': readingOptions.largeText }">
    <div class="container nav-wrap">
      <button class="brand" type="button" aria-label="Go to home" @click="navigate('home')">
        <span class="brand-mark" aria-hidden="true">♥</span><span>ElderCare <b>Connect</b></span>
      </button>
      <div class="reading-controls" aria-label="Reading options">
        <button type="button" :aria-pressed="readingOptions.largeText" @click="emit('toggle-reading', 'largeText')">A+</button>
        <button type="button" :aria-pressed="readingOptions.highContrast" @click="emit('toggle-reading', 'highContrast')">Contrast</button>
      </div>
      <button class="menu-button" type="button" :aria-expanded="menuOpen" aria-controls="primary-nav" @click="toggleMenu">Menu</button>
      <nav id="primary-nav" :class="{ open: menuOpen }" aria-label="Main navigation">
        <button v-for="item in navItems" :key="item.id" type="button" :class="{ active: currentPage === item.id }" @click="navigate(item.id)">{{ item.label }}</button>
        <button v-if="isAdmin" type="button" :class="{ active: currentPage === 'admin' }" @click="navigate('admin')">Staff hub</button>
        <button class="account-button" type="button" :class="{ active: currentPage === 'account' }" @click="navigate('account')">{{ activeUser ? 'My account' : 'Sign in' }}</button>
      </nav>
    </div>
  </header>
</template>
