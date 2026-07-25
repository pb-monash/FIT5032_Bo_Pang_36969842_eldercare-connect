<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AccountPanel from './components/AccountPanel.vue'
import ActivityList from './components/ActivityList.vue'
import ServiceDirectory from './components/ServiceDirectory.vue'
import SiteHeader from './components/SiteHeader.vue'
import StaffDashboard from './components/StaffDashboard.vue'
import { createPasswordCredential, migrateLegacyAccounts, verifyPassword } from './composables/useSecureAuth'

const STORAGE_KEY = 'eldercare-connect-v2'
const LEGACY_STORAGE_KEY = 'eldercare-connect-v1'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000
const LOGIN_LOCK_DURATION_MS = 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5
const STAFF_ACCOUNT = {
  id: 'eldercare-staff',
  name: 'ElderCare Staff',
  email: 'staff@eldercare.org',
  role: 'admin',
  passwordSalt: 's7JGoIruyEKljUIw43zFTg==',
  passwordHash: 'm6xmqvjTbHAFLK18ABY4Rt8m9hzkf0r8gy8/WMAT28o=',
  passwordIterations: 120000,
}

const seedServices = [
  { id: 1, name: 'Harbour Wellbeing Hub', suburb: 'Clayton', type: 'Social connection', distance: '1.2 km', description: 'Friendly weekday gatherings, light exercise and a community lunch.', ratings: [5, 4, 5, 4] },
  { id: 2, name: 'Gentle Steps Physio', suburb: 'Oakleigh', type: 'Health support', distance: '3.8 km', description: 'Mobility consultations and small guided movement sessions.', ratings: [5, 4, 4] },
  { id: 3, name: 'Digital Confidence Club', suburb: 'Chadstone', type: 'Learning', distance: '5.1 km', description: 'Patient one-to-one help with phones, video calls and online safety.', ratings: [4, 5, 5, 4, 5] },
  { id: 4, name: 'Home Safety Check-in', suburb: 'Clayton', type: 'Health support', distance: '2.0 km', description: 'Practical home-safety visits and wellbeing check-ins for older adults.', ratings: [5, 5, 4, 5, 5] },
  { id: 5, name: 'Neighbourhood Garden Club', suburb: 'Hughesdale', type: 'Social connection', distance: '4.3 km', description: 'Gentle gardening, tea and friendly conversation in an accessible community garden.', ratings: [4, 4, 5, 4] },
  { id: 6, name: 'Everyday Tech Workshop', suburb: 'Oakleigh', type: 'Learning', distance: '3.1 km', description: 'Small group lessons for online appointments, transport apps and staying safe online.', ratings: [3, 4, 4, 5] },
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
const sortOrder = ref('nearest')
const authMode = ref('login')
const authError = ref('')
const authNotice = ref('')
const authPending = ref(false)
const loginSecurity = ref({ failedAttempts: 0, lockedUntil: 0 })
const authForm = ref({ name: '', email: '', password: '' })
const editorError = ref('')
const editingServiceId = ref(null)
const serviceForm = ref({ name: '', suburb: '', type: 'Health support', distance: '', description: '' })
const readingOptions = ref({ largeText: false, highContrast: false })
const isHydrated = ref(false)

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Find support' },
  { id: 'activities', label: 'Activities' },
  { id: 'resources', label: 'Resources' },
]

const isAdmin = computed(() => activeUser.value?.role === 'admin')
const displayName = computed(() => activeUser.value?.name?.split(' ')[0] || 'there')
const myBookings = computed(() => bookings.value
  .filter(booking => booking.userId === activeUser.value?.id)
  .map(booking => ({ booking, activity: activities.value.find(activity => activity.id === booking.activityId) }))
  .filter(item => item.activity))

function readStoredState() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (current) return current
    return JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY))
  } catch {
    return null
  }
}

function sessionUser(account) {
  return { id: account.id, name: account.name, email: account.email, role: account.role, sessionExpiresAt: Date.now() + SESSION_DURATION_MS }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    services: services.value,
    activities: activities.value,
    users: users.value,
    bookings: bookings.value,
    activeUser: activeUser.value,
    readingOptions: readingOptions.value,
    loginSecurity: loginSecurity.value,
  }))
}

onMounted(async () => {
  const saved = readStoredState()
  if (saved) {
    services.value = Array.isArray(saved.services) ? saved.services : seedServices
    activities.value = Array.isArray(saved.activities) ? saved.activities : seedActivities
    users.value = Array.isArray(saved.users) ? saved.users : []
    bookings.value = Array.isArray(saved.bookings) ? saved.bookings : []
    if (saved.readingOptions) readingOptions.value = { ...readingOptions.value, ...saved.readingOptions }
    if (saved.loginSecurity) loginSecurity.value = { ...loginSecurity.value, ...saved.loginSecurity }
  }

  const savedServiceIds = new Set(services.value.map(service => service.id))
  services.value = [...services.value, ...seedServices.filter(service => !savedServiceIds.has(service.id))]

  users.value = await migrateLegacyAccounts(users.value)
  if (!users.value.some(user => user.email === STAFF_ACCOUNT.email)) users.value.push({ ...STAFF_ACCOUNT })

  const savedSession = saved?.activeUser
  const sessionAccount = users.value.find(user => user.id === savedSession?.id)
  const sessionIsValid = savedSession?.sessionExpiresAt && savedSession.sessionExpiresAt > Date.now()
  activeUser.value = sessionAccount && sessionIsValid ? { ...sessionUser(sessionAccount), sessionExpiresAt: savedSession.sessionExpiresAt } : null
  if (savedSession && !sessionIsValid) authNotice.value = 'Your session has expired. Please sign in again.'
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  isHydrated.value = true
  saveState()
})

watch([services, activities, users, bookings, activeUser, readingOptions, loginSecurity], () => {
  if (isHydrated.value) saveState()
}, { deep: true })

function notify(message) {
  toast.value = message
  window.setTimeout(() => { if (toast.value === message) toast.value = '' }, 3600)
}

function clearAuthFeedback() {
  authError.value = ''
  authNotice.value = ''
}

function toggleReadingOption(option) {
  readingOptions.value = { ...readingOptions.value, [option]: !readingOptions.value[option] }
  notify(option === 'largeText' ? `Large text is ${readingOptions.value.largeText ? 'on' : 'off'}.` : `High contrast is ${readingOptions.value.highContrast ? 'on' : 'off'}.`)
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
  } else {
    currentPage.value = page
  }
  showMenu.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cleanText(value, max = 80) {
  return String(value || '').replace(/[<>]/g, '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, max)
}

function passwordError(password) {
  if (password.length < 10) return 'Password must contain at least 10 characters.'
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return 'Password must include uppercase, lowercase and a number.'
  return ''
}

function isLoginLocked() {
  if (loginSecurity.value.lockedUntil > Date.now()) return true
  if (loginSecurity.value.lockedUntil) loginSecurity.value = { failedAttempts: 0, lockedUntil: 0 }
  return false
}

function recordFailedLogin() {
  const attempts = loginSecurity.value.failedAttempts + 1
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    loginSecurity.value = { failedAttempts: 0, lockedUntil: Date.now() + LOGIN_LOCK_DURATION_MS }
    return 'Too many unsuccessful attempts. Please wait one minute before trying again.'
  }
  loginSecurity.value = { failedAttempts: attempts, lockedUntil: 0 }
  return 'Email or password is incorrect. You can create an account instead.'
}

function resetLoginSecurity() {
  loginSecurity.value = { failedAttempts: 0, lockedUntil: 0 }
}

async function handleAuth() {
  if (authPending.value) return
  clearAuthFeedback()
  const email = cleanText(authForm.value.email, 100).toLowerCase()
  const password = String(authForm.value.password || '')
  if (!/^\S+@\S+\.\S+$/.test(email)) return authError.value = 'Enter a valid email address.'
  if (!password) return authError.value = 'Enter your password.'
  if (authMode.value === 'login' && isLoginLocked()) return authError.value = 'Too many unsuccessful attempts. Please wait one minute before trying again.'

  authPending.value = true
  try {
    if (authMode.value === 'register') {
      const passwordMessage = passwordError(password)
      if (passwordMessage) return authError.value = passwordMessage
      const name = cleanText(authForm.value.name, 50)
      if (name.length < 2) return authError.value = 'Enter your name (at least 2 characters).'
      if (users.value.some(user => user.email === email)) return authError.value = 'An account already exists with this email.'
      const account = { id: crypto.randomUUID(), name, email, role: 'member', ...await createPasswordCredential(password) }
      users.value.push(account)
      activeUser.value = sessionUser(account)
      notify(`Welcome to ElderCare Connect, ${name}.`)
    } else {
      const account = users.value.find(user => user.email === email)
      if (!account || !await verifyPassword(password, account)) {
        authError.value = recordFailedLogin()
        return
      }
      activeUser.value = sessionUser(account)
      notify(`Welcome back, ${account.name}.`)
    }
    resetLoginSecurity()
    currentPage.value = activeUser.value.role === 'admin' ? 'admin' : 'services'
  } catch {
    authError.value = 'We could not complete sign-in securely. Please try again.'
  } finally {
    authForm.value = { ...authForm.value, password: '' }
    authPending.value = false
  }
}

function logOut() {
  activeUser.value = null
  currentPage.value = 'home'
  authForm.value = { name: '', email: '', password: '' }
  notify('You have been signed out.')
}

function addRating(service, rating) {
  if (!activeUser.value) {
    authNotice.value = 'Sign in before sharing a rating.'
    navigate('account')
    return
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return
  service.userRatings = { ...(service.userRatings || {}), [activeUser.value.id]: rating }
  notify(`Your ${rating}-star rating for ${service.name} has been saved.`)
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

function cancelBooking(booking, activity) {
  if (!activeUser.value || booking.userId !== activeUser.value.id) return
  bookings.value = bookings.value.filter(item => item.id !== booking.id)
  activity.seats += 1
  notify(`Your booking for “${activity.title}” has been cancelled.`)
}

function addService() {
  if (!isAdmin.value) return
  const id = Math.max(0, ...services.value.map(service => service.id)) + 1
  const draft = { id, name: 'New community service', suburb: 'To be confirmed', type: 'Health support', distance: '0 km', description: 'Add details for this new community service.', ratings: [], isDraft: true }
  services.value.push(draft)
  openServiceEditor(draft)
}

function openServiceEditor(service) {
  if (!isAdmin.value) return
  editingServiceId.value = service.id
  editorError.value = ''
  serviceForm.value = { name: service.name, suburb: service.suburb, type: service.type, distance: service.distance, description: service.description }
}

function closeServiceEditor() {
  editingServiceId.value = null
  editorError.value = ''
}

function saveService() {
  if (!isAdmin.value) return
  const name = cleanText(serviceForm.value.name, 60)
  const suburb = cleanText(serviceForm.value.suburb, 40)
  const description = cleanText(serviceForm.value.description, 180)
  const distance = cleanText(serviceForm.value.distance, 12)
  if (name.length < 3 || suburb.length < 2 || description.length < 12) return editorError.value = 'Enter a service name, suburb and a description of at least 12 characters.'
  if (!/^\d+(\.\d+)?\s?km$/i.test(distance)) return editorError.value = 'Distance must use a format such as 2.5 km.'
  const service = services.value.find(item => item.id === editingServiceId.value)
  if (!service) return
  Object.assign(service, { name, suburb, type: serviceForm.value.type, distance: distance.toLowerCase(), description, isDraft: false })
  closeServiceEditor()
  notify(`${name} has been saved to the service directory.`)
}

function removeDraftService(service) {
  if (!isAdmin.value || !service.isDraft) return
  services.value = services.value.filter(item => item.id !== service.id)
  if (editingServiceId.value === service.id) closeServiceEditor()
  notify('The unsaved draft service has been removed.')
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <SiteHeader
    v-model:menu-open="showMenu"
    :active-user="activeUser"
    :current-page="currentPage"
    :is-admin="isAdmin"
    :nav-items="navItems"
    :reading-options="readingOptions"
    @navigate="navigate"
    @toggle-reading="toggleReadingOption"
  />

  <main id="main-content" :class="{ 'high-contrast': readingOptions.highContrast, 'large-text': readingOptions.largeText }">
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

    <ServiceDirectory
      v-if="currentPage === 'services'"
      v-model:filter="filter"
      v-model:search="search"
      v-model:sort-order="sortOrder"
      :active-user="activeUser"
      :services="services"
      @rate="addRating"
    />

    <ActivityList v-if="currentPage === 'activities'" :activities="activities" @book="bookActivity" />

    <section v-if="currentPage === 'resources'" class="page-section">
      <div class="container"><p class="eyebrow">Health & wellbeing</p><h1>Practical guidance, in plain language.</h1><div class="resource-grid"><article><span>01</span><h2>Staying active safely</h2><p>Easy ways to build movement into your day, at your own pace.</p></article><article><span>02</span><h2>Feeling connected</h2><p>Small steps for finding companionship and community nearby.</p></article><article><span>03</span><h2>Safer online</h2><p>Simple checks to protect your information and confidence online.</p></article></div></div>
    </section>

    <AccountPanel
      v-if="currentPage === 'account'"
      v-model:auth-form="authForm"
      v-model:auth-mode="authMode"
      :active-user="activeUser"
      :auth-error="authError"
      :auth-notice="authNotice"
      :auth-pending="authPending"
      :display-name="displayName"
      :is-admin="isAdmin"
      :my-bookings="myBookings"
      @authenticate="handleAuth"
      @cancel-booking="cancelBooking"
      @clear-feedback="clearAuthFeedback"
      @logout="logOut"
      @navigate="navigate"
    />

    <StaffDashboard
      v-if="currentPage === 'admin' && isAdmin"
      v-model:service-form="serviceForm"
      :bookings="bookings"
      :editor-error="editorError"
      :editing-service-id="editingServiceId"
      :services="services"
      :users="users"
      @add-service="addService"
      @close-editor="closeServiceEditor"
      @edit-service="openServiceEditor"
      @remove-draft="removeDraftService"
      @save-service="saveService"
    />
  </main>

  <footer :class="{ 'high-contrast': readingOptions.highContrast, 'large-text': readingOptions.largeText }">
    <div class="container footer-wrap"><div><button class="brand inverse" @click="navigate('home')"><span class="brand-mark">♥</span><span>ElderCare <b>Connect</b></span></button><p>Practical support for healthy, connected ageing.</p></div><p>Need urgent help? Call <strong>000</strong> in Australia.</p></div>
  </footer>
  <div v-if="toast" class="toast" role="status">{{ toast }}</div>
</template>
