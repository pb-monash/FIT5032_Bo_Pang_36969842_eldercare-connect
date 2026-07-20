<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'eldercare-connect-v1'

const seedServices = [
  { id: 1, name: 'Harbour Wellbeing Hub', suburb: 'Clayton', type: 'Social connection', distance: '1.2 km', description: 'Friendly weekday gatherings, light exercise and a community lunch.', ratings: [5, 4, 5, 4] },
  { id: 2, name: 'Gentle Steps Physio', suburb: 'Oakleigh', type: 'Health support', distance: '3.8 km', description: 'Mobility consultations and small guided movement sessions.', ratings: [5, 4, 4] },
  { id: 3, name: 'Digital Confidence Club', suburb: 'Chadstone', type: 'Learning', distance: '5.1 km', description: 'Patient one-to-one help with phones, video calls and online safety.', ratings: [4, 5, 5, 4, 5] },
]

const seedActivities = [
  { id: 1, title: 'Morning tea & conversation', date: 'Tuesday, 10:30 am', seats: 8, category: 'Community' },
  { id: 2, title: 'Gentle balance class', date: 'Wednesday, 2:00 pm', seats: 4, category: 'Wellbeing' },
  { id: 3, title: 'Using your smartphone safely', date: 'Friday, 11:00 am', seats: 10, category: 'Learning' },
]

const currentPage = ref('home')
const showMenu = ref(false)
const activeUser = ref(null)
const services = ref(seedServices)
const activities = ref(seedActivities)
const users = ref([])
const bookings = ref([])
const toast = ref('')
const search = ref('')
const filter = ref('All')
const authMode = ref('login')
const authError = ref('')
const authNotice = ref('')
const authForm = ref({ name: '', email: '', password: '', role: 'member' })
const ratingChoice = ref({})

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Find support' },
  { id: 'activities', label: 'Activities' },
  { id: 'resources', label: 'Resources' },
]

const storedState = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ services: services.value, activities: activities.value, users: users.value, bookings: bookings.value, activeUser: activeUser.value }))
}

onMounted(() => {
  const saved = storedState()
  if (saved) {
    services.value = Array.isArray(saved.services) ? saved.services : seedServices
    activities.value = Array.isArray(saved.activities) ? saved.activities : seedActivities
    users.value = Array.isArray(saved.users) ? saved.users : []
    bookings.value = Array.isArray(saved.bookings) ? saved.bookings : []
    activeUser.value = saved.activeUser || null
  }
})

watch([services, activities, users, bookings, activeUser], saveState, { deep: true })

const serviceTypes = computed(() => ['All', ...new Set(services.value.map(service => service.type))])
const filteredServices = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return services.value.filter(service => (filter.value === 'All' || service.type === filter.value) && (!keyword || `${service.name} ${service.suburb} ${service.type}`.toLowerCase().includes(keyword)))
})
const isAdmin = computed(() => activeUser.value?.role === 'admin')
const displayName = computed(() => activeUser.value?.name?.split(' ')[0] || 'there')

function averageRating(service) {
  if (!service.ratings?.length) return 0
  return service.ratings.reduce((sum, rating) => sum + rating, 0) / service.ratings.length
}

function formatRating(service) { return averageRating(service).toFixed(1) }

function notify(message) {
  toast.value = message
  window.setTimeout(() => { if (toast.value === message) toast.value = '' }, 3600)
}

function navigate(page) {
  const protectedPages = ['account', 'admin']
  if (protectedPages.includes(page) && !activeUser.value) {
    currentPage.value = 'account'
    authMode.value = 'login'
    authNotice.value = 'Please sign in to access your account.'
  } else if (page === 'admin' && !isAdmin.value) {
    notify('The staff dashboard is available to staff accounts only.')
    currentPage.value = 'home'
  } else currentPage.value = page
  showMenu.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cleanText(value, max = 80) {
  return String(value || '').replace(/[<>]/g, '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, max)
}

function handleAuth() {
  authError.value = ''
  authNotice.value = ''
  const email = cleanText(authForm.value.email, 100).toLowerCase()
  const password = String(authForm.value.password || '')
  if (!/^\S+@\S+\.\S+$/.test(email)) return authError.value = 'Enter a valid email address.'
  if (password.length < 8) return authError.value = 'Password must contain at least 8 characters.'
  if (authMode.value === 'register') {
    const name = cleanText(authForm.value.name, 50)
    if (name.length < 2) return authError.value = 'Enter your name (at least 2 characters).'
    if (users.value.some(user => user.email === email)) return authError.value = 'An account already exists with this email.'
    const account = { id: crypto.randomUUID(), name, email, password, role: authForm.value.role }
    users.value.push(account)
    activeUser.value = { id: account.id, name, email, role: account.role }
    authForm.value = { name: '', email: '', password: '', role: 'member' }
    notify(`Welcome to ElderCare Connect, ${name}.`)
  } else {
    const account = users.value.find(user => user.email === email && user.password === password)
    if (!account) return authError.value = 'Email or password is incorrect. You can create an account instead.'
    activeUser.value = { id: account.id, name: account.name, email, role: account.role }
    notify(`Welcome back, ${account.name}.`)
  }
  currentPage.value = activeUser.value.role === 'admin' ? 'admin' : 'services'
}

function logOut() {
  activeUser.value = null
  currentPage.value = 'home'
  notify('You have been signed out.')
}

function addRating(service, rating) {
  if (!activeUser.value) {
    authNotice.value = 'Sign in before sharing a rating.'
    navigate('account')
    return
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return
  const previous = ratingChoice.value[service.id]
  if (previous) service.ratings = service.ratings.map(value => value === previous ? rating : value)
  else service.ratings.push(rating)
  ratingChoice.value = { ...ratingChoice.value, [service.id]: rating }
  notify(`Thanks for rating ${service.name}.`)
}

function bookActivity(activity) {
  if (!activeUser.value) {
    authNotice.value = 'Sign in to book an activity.'
    navigate('account')
    return
  }
  if (activity.seats < 1) return notify('This activity is fully booked.')
  if (bookings.value.some(booking => booking.activityId === activity.id && booking.userId === activeUser.value.id)) return notify('You have already booked this activity.')
  bookings.value.push({ id: crypto.randomUUID(), activityId: activity.id, userId: activeUser.value.id })
  activity.seats -= 1
  notify(`Your place in “${activity.title}” is confirmed.`)
}

function addService() {
  if (!isAdmin.value) return
  const id = Math.max(0, ...services.value.map(service => service.id)) + 1
  services.value.push({ id, name: 'New community service', suburb: 'To be confirmed', type: 'Health support', distance: 'New', description: 'A new service added by the staff team.', ratings: [] })
  notify('A draft service has been added to the list.')
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header class="site-header">
    <div class="container nav-wrap">
      <button class="brand" type="button" aria-label="Go to home" @click="navigate('home')">
        <span class="brand-mark" aria-hidden="true">♥</span><span>ElderCare <b>Connect</b></span>
      </button>
      <button class="menu-button" type="button" :aria-expanded="showMenu" aria-controls="primary-nav" @click="showMenu = !showMenu">Menu</button>
      <nav id="primary-nav" :class="{ open: showMenu }" aria-label="Main navigation">
        <button v-for="item in navItems" :key="item.id" type="button" :class="{ active: currentPage === item.id }" @click="navigate(item.id)">{{ item.label }}</button>
        <button v-if="isAdmin" type="button" :class="{ active: currentPage === 'admin' }" @click="navigate('admin')">Staff hub</button>
        <button class="account-button" type="button" :class="{ active: currentPage === 'account' }" @click="navigate('account')">{{ activeUser ? 'My account' : 'Sign in' }}</button>
      </nav>
    </div>
  </header>

  <main id="main-content">
    <section v-if="currentPage === 'home'" class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">A kinder way to stay connected</p>
          <h1>Support for every chapter of ageing.</h1>
          <p class="lead">Find trusted local help, join welcoming activities and make health choices with confidence.</p>
          <div class="hero-actions">
            <button class="button primary" @click="navigate('services')">Find local support <span aria-hidden="true">→</span></button>
            <button class="button secondary" @click="navigate('activities')">Browse activities</button>
          </div>
          <div class="trust-row"><span>✓ Free to use</span><span>✓ Local community partners</span><span>✓ Simple & accessible</span></div>
        </div>
        <div class="hero-art" aria-label="Illustration of connected community members" role="img">
          <div class="sun"></div><div class="arch arch-one"></div><div class="arch arch-two"></div>
          <div class="person person-one"><i></i><b></b></div><div class="person person-two"><i></i><b></b></div><div class="plant"><i></i><i></i><i></i></div>
          <p>Here for you,<br /><strong>near you.</strong></p>
        </div>
      </div>
    </section>

    <section v-if="currentPage === 'home'" class="section container">
      <div class="section-heading"><div><p class="eyebrow">Start here</p><h2>What can we help with today?</h2></div></div>
      <div class="feature-grid">
        <article class="feature-card coral"><span class="feature-icon">⌂</span><h3>Find support nearby</h3><p>Discover friendly local services for health, care and connection.</p><button @click="navigate('services')">Explore support →</button></article>
        <article class="feature-card yellow"><span class="feature-icon">☼</span><h3>Join an activity</h3><p>Try a gentle class, share a meal or learn something new.</p><button @click="navigate('activities')">See activities →</button></article>
        <article class="feature-card blue"><span class="feature-icon">♡</span><h3>Read trusted advice</h3><p>Simple, practical wellbeing resources made for everyday life.</p><button @click="navigate('resources')">Read resources →</button></article>
      </div>
    </section>

    <section v-if="currentPage === 'services'" class="page-section">
      <div class="container"><p class="eyebrow">Local support</p><h1>Services that feel close to home.</h1><p class="lead narrow">Search trusted community partners and see ratings from other members.</p>
        <div class="filters" aria-label="Search support services"><label>Search <input v-model="search" type="search" placeholder="Service or suburb" /></label><label>Category <select v-model="filter"><option v-for="type in serviceTypes" :key="type">{{ type }}</option></select></label></div>
        <p class="result-count">{{ filteredServices.length }} service<span v-if="filteredServices.length !== 1">s</span> found</p>
        <div class="service-grid"><article v-for="service in filteredServices" :key="service.id" class="service-card"><div class="service-card-head"><span class="tag">{{ service.type }}</span><span class="distance">⌖ {{ service.distance }}</span></div><h2>{{ service.name }}</h2><p class="location">{{ service.suburb }}</p><p>{{ service.description }}</p><div class="rating-summary"><strong aria-label="average rating">★ {{ formatRating(service) }}</strong><span>from {{ service.ratings.length }} rating<span v-if="service.ratings.length !== 1">s</span></span></div><fieldset class="rate-control"><legend>Your rating</legend><button v-for="star in 5" :key="star" type="button" :aria-label="`Rate ${star} out of 5`" :class="{ selected: ratingChoice[service.id] >= star }" @click="addRating(service, star)">★</button></fieldset></article></div>
      </div>
    </section>

    <section v-if="currentPage === 'activities'" class="page-section soft-bg"><div class="container"><p class="eyebrow">Community calendar</p><h1>Small moments, good company.</h1><p class="lead narrow">Reserve a spot in an upcoming activity. We will save your booking on this device.</p><div class="activity-list"><article v-for="activity in activities" :key="activity.id" class="activity-card"><div class="date-tile"><span>{{ activity.date.split(',')[0] }}</span><b>{{ activity.date.split(',')[1] }}</b></div><div><span class="tag">{{ activity.category }}</span><h2>{{ activity.title }}</h2><p>{{ activity.seats }} places available</p></div><button class="button primary" :disabled="activity.seats === 0" @click="bookActivity(activity)">{{ activity.seats ? 'Book a place' : 'Full' }}</button></article></div></div></section>

    <section v-if="currentPage === 'resources'" class="page-section"><div class="container"><p class="eyebrow">Health & wellbeing</p><h1>Practical guidance, in plain language.</h1><div class="resource-grid"><article><span>01</span><h2>Staying active safely</h2><p>Easy ways to build movement into your day, at your own pace.</p></article><article><span>02</span><h2>Feeling connected</h2><p>Small steps for finding companionship and community nearby.</p></article><article><span>03</span><h2>Safer online</h2><p>Simple checks to protect your information and confidence online.</p></article></div></div></section>

    <section v-if="currentPage === 'account'" class="page-section account-section"><div class="container auth-layout">
      <div><p class="eyebrow">Your ElderCare Connect</p><h1>{{ activeUser ? `Hello, ${displayName}.` : 'A little support starts here.' }}</h1><p class="lead">Create a free account to book activities and share ratings with the community.</p><ul class="check-list"><li>Book local activities</li><li>Rate services you have used</li><li>Keep your details in one place</li></ul></div>
      <div v-if="!activeUser" class="auth-card"><div class="auth-tabs"><button :class="{ active: authMode === 'login' }" @click="authMode = 'login'; authError = ''; authNotice = ''">Sign in</button><button :class="{ active: authMode === 'register' }" @click="authMode = 'register'; authError = ''; authNotice = ''">Create account</button></div><form @submit.prevent="handleAuth" novalidate><label v-if="authMode === 'register'">Full name<input v-model="authForm.name" maxlength="50" autocomplete="name" /></label><label>Email address<input v-model="authForm.email" type="email" maxlength="100" autocomplete="email" /></label><label>Password<input v-model="authForm.password" type="password" minlength="8" autocomplete="current-password" /><small>At least 8 characters.</small></label><label v-if="authMode === 'register'">Account type<select v-model="authForm.role"><option value="member">Community member</option><option value="admin">Staff member</option></select><small>Demo accounts use this to show role-based access.</small></label><p v-if="authError" class="form-message error" role="alert">{{ authError }}</p><p v-if="authNotice" class="form-message" role="status">{{ authNotice }}</p><button class="button primary wide" type="submit">{{ authMode === 'login' ? 'Sign in securely' : 'Create my account' }}</button></form></div>
      <div v-else class="profile-card"><span class="profile-icon">{{ activeUser.name.charAt(0) }}</span><h2>{{ activeUser.name }}</h2><p>{{ activeUser.email }}</p><p><span class="tag">{{ activeUser.role === 'admin' ? 'Staff member' : 'Community member' }}</span></p><button v-if="isAdmin" class="button secondary wide" @click="navigate('admin')">Open staff hub</button><button class="text-button" @click="logOut">Sign out</button></div>
    </div></section>

    <section v-if="currentPage === 'admin' && isAdmin" class="page-section soft-bg"><div class="container"><p class="eyebrow">Staff hub</p><h1>Community overview</h1><p class="lead narrow">This dashboard is protected: only staff accounts can access it.</p><div class="stats-grid"><article><span>Registered users</span><strong>{{ users.length }}</strong></article><article><span>Activity bookings</span><strong>{{ bookings.length }}</strong></article><article><span>Local services</span><strong>{{ services.length }}</strong></article></div><div class="admin-panel"><div><h2>Service directory</h2><p>Maintain the information members see when searching for help.</p></div><button class="button primary" @click="addService">Add draft service</button></div></div></section>
  </main>

  <footer><div class="container footer-wrap"><div><button class="brand inverse" @click="navigate('home')"><span class="brand-mark">♥</span><span>ElderCare <b>Connect</b></span></button><p>Practical support for healthy, connected ageing.</p></div><p>Need urgent help? Call <strong>000</strong> in Australia.</p></div></footer>
  <div v-if="toast" class="toast" role="status">{{ toast }}</div>
</template>
