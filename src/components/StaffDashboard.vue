<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  activities: { type: Array, required: true },
  bookings: { type: Array, required: true },
  editorError: { type: String, default: '' },
  editingServiceId: { type: [Number, String], default: null },
  services: { type: Array, required: true },
  users: { type: Array, required: true },
})

defineEmits(['add-service', 'close-editor', 'edit-service', 'remove-draft', 'save-service'])
const serviceForm = defineModel('serviceForm', { required: true })

const rowsPerPage = 10
const bookingSearch = ref('')
const memberSearch = ref('')
const bookingPage = ref(1)
const memberPage = ref(1)
const bookingSort = ref({ key: 'createdAt', direction: 'desc' })
const memberSort = ref({ key: 'name', direction: 'asc' })
const bookingFilters = reactive({ member: '', activity: '', date: '', status: '', provider: '' })
const memberFilters = reactive({ name: '', email: '', role: '', provider: '', bookingCount: '' })

const bookingColumns = [
  { key: 'member', label: 'Member' },
  { key: 'activity', label: 'Activity' },
  { key: 'date', label: 'Activity date' },
  { key: 'status', label: 'Status' },
  { key: 'provider', label: 'Auth' },
]

const memberColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'provider', label: 'Auth' },
  { key: 'bookingCount', label: 'Bookings' },
]

function providerLabel(provider) {
  if (provider === 'firebase') return 'Firebase'
  if (provider === 'demo') return 'Demo data'
  return 'Local'
}

function normalise(value) {
  return String(value ?? '').toLowerCase()
}

function compareValues(left, right) {
  const leftNumber = Number(left)
  const rightNumber = Number(right)
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) return leftNumber - rightNumber
  return String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' })
}

function filterRows(rows, columns, globalSearch, filters) {
  const keyword = normalise(globalSearch).trim()
  return rows.filter(row => {
    const globalMatch = !keyword || columns.some(column => normalise(row[column.key]).includes(keyword))
    const columnMatch = columns.every(column => !filters[column.key] || normalise(row[column.key]).includes(normalise(filters[column.key]).trim()))
    return globalMatch && columnMatch
  })
}

function sortRows(rows, sort) {
  return [...rows].sort((left, right) => {
    const result = compareValues(left[sort.key], right[sort.key])
    return sort.direction === 'asc' ? result : -result
  })
}

function paginateRows(rows, page) {
  const start = (page - 1) * rowsPerPage
  return rows.slice(start, start + rowsPerPage)
}

function pageCount(rows) {
  return Math.max(1, Math.ceil(rows.length / rowsPerPage))
}

function setBookingSort(key) {
  bookingSort.value = {
    key,
    direction: bookingSort.value.key === key && bookingSort.value.direction === 'asc' ? 'desc' : 'asc',
  }
}

function setMemberSort(key) {
  memberSort.value = {
    key,
    direction: memberSort.value.key === key && memberSort.value.direction === 'asc' ? 'desc' : 'asc',
  }
}

const bookingRows = computed(() => props.bookings.map(booking => {
  const member = props.users.find(user => user.id === booking.userId)
  const activity = props.activities.find(item => item.id === booking.activityId)
  return {
    id: booking.id,
    member: member?.name || 'Unknown member',
    activity: activity?.title || 'Unknown activity',
    date: activity?.date || 'To be confirmed',
    status: booking.status || 'Confirmed',
    provider: providerLabel(member?.provider),
    createdAt: booking.createdAt || '2026-08-19',
  }
}))

const memberRows = computed(() => props.users.map(user => {
  const userBookings = props.bookings.filter(booking => booking.userId === user.id)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'admin' ? 'Staff' : 'Member',
    provider: providerLabel(user.provider),
    bookingCount: userBookings.length,
  }
}))

const filteredBookingRows = computed(() => sortRows(filterRows(bookingRows.value, bookingColumns, bookingSearch.value, bookingFilters), bookingSort.value))
const filteredMemberRows = computed(() => sortRows(filterRows(memberRows.value, memberColumns, memberSearch.value, memberFilters), memberSort.value))
const bookingPageCount = computed(() => pageCount(filteredBookingRows.value))
const memberPageCount = computed(() => pageCount(filteredMemberRows.value))
const visibleBookingRows = computed(() => paginateRows(filteredBookingRows.value, Math.min(bookingPage.value, bookingPageCount.value)))
const visibleMemberRows = computed(() => paginateRows(filteredMemberRows.value, Math.min(memberPage.value, memberPageCount.value)))

watch([bookingSearch, () => ({ ...bookingFilters })], () => { bookingPage.value = 1 })
watch([memberSearch, () => ({ ...memberFilters })], () => { memberPage.value = 1 })
</script>

<template>
  <section class="page-section soft-bg">
    <div class="container">
      <p class="eyebrow">Staff hub</p>
      <h1>Community overview</h1>
      <p class="lead narrow">This dashboard is protected: only staff accounts can access it.</p>
      <div class="stats-grid"><article><span>Registered users</span><strong>{{ users.length }}</strong></article><article><span>Activity bookings</span><strong>{{ bookings.length }}</strong></article><article><span>Local services</span><strong>{{ services.length }}</strong></article></div>

      <section class="data-table-panel" aria-labelledby="booking-table-title">
        <div class="table-heading"><div><p class="eyebrow">Interactive table</p><h2 id="booking-table-title">Activity bookings</h2></div><p>{{ filteredBookingRows.length }} matching booking records</p></div>
        <label class="table-search">Search bookings<input v-model="bookingSearch" type="search" placeholder="Search member, activity, status or auth" /></label>
        <div class="data-table-scroll">
          <table class="advanced-table">
            <thead>
              <tr>
                <th v-for="column in bookingColumns" :key="column.key" scope="col"><button type="button" class="sort-button" @click="setBookingSort(column.key)">{{ column.label }}<span aria-hidden="true">{{ bookingSort.key === column.key ? (bookingSort.direction === 'asc' ? 'Asc' : 'Desc') : 'Sort' }}</span></button></th>
              </tr>
              <tr class="table-filter-row">
                <th v-for="column in bookingColumns" :key="`booking-filter-${column.key}`"><input v-model="bookingFilters[column.key]" :aria-label="`Filter bookings by ${column.label}`" :placeholder="`Filter ${column.label}`" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in visibleBookingRows" :key="row.id"><td>{{ row.member }}</td><td>{{ row.activity }}</td><td>{{ row.date }}</td><td><span class="status-pill">{{ row.status }}</span></td><td>{{ row.provider }}</td></tr>
              <tr v-if="!visibleBookingRows.length"><td colspan="5" class="empty-cell">No booking records match the current filters.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination-bar"><button type="button" class="button secondary" :disabled="bookingPage <= 1" @click="bookingPage -= 1">Previous</button><span>Page {{ Math.min(bookingPage, bookingPageCount) }} of {{ bookingPageCount }} - 10 rows per page</span><button type="button" class="button secondary" :disabled="bookingPage >= bookingPageCount" @click="bookingPage += 1">Next</button></div>
      </section>

      <section class="data-table-panel" aria-labelledby="member-table-title">
        <div class="table-heading"><div><p class="eyebrow">Interactive table</p><h2 id="member-table-title">Member directory</h2></div><p>{{ filteredMemberRows.length }} matching member records</p></div>
        <label class="table-search">Search members<input v-model="memberSearch" type="search" placeholder="Search name, email, role or auth" /></label>
        <div class="data-table-scroll">
          <table class="advanced-table">
            <thead>
              <tr>
                <th v-for="column in memberColumns" :key="column.key" scope="col"><button type="button" class="sort-button" @click="setMemberSort(column.key)">{{ column.label }}<span aria-hidden="true">{{ memberSort.key === column.key ? (memberSort.direction === 'asc' ? 'Asc' : 'Desc') : 'Sort' }}</span></button></th>
              </tr>
              <tr class="table-filter-row">
                <th v-for="column in memberColumns" :key="`member-filter-${column.key}`"><input v-model="memberFilters[column.key]" :aria-label="`Filter members by ${column.label}`" :placeholder="`Filter ${column.label}`" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in visibleMemberRows" :key="row.id"><td>{{ row.name }}</td><td>{{ row.email }}</td><td>{{ row.role }}</td><td>{{ row.provider }}</td><td>{{ row.bookingCount }}</td></tr>
              <tr v-if="!visibleMemberRows.length"><td colspan="5" class="empty-cell">No member records match the current filters.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination-bar"><button type="button" class="button secondary" :disabled="memberPage <= 1" @click="memberPage -= 1">Previous</button><span>Page {{ Math.min(memberPage, memberPageCount) }} of {{ memberPageCount }} - 10 rows per page</span><button type="button" class="button secondary" :disabled="memberPage >= memberPageCount" @click="memberPage += 1">Next</button></div>
      </section>

      <div class="admin-panel"><div><h2>Service directory</h2><p>Maintain the information members see when searching for help.</p></div><button class="button primary" @click="$emit('add-service')">Add service</button></div>
      <div class="service-manager">
        <article v-for="service in services" :key="service.id">
          <div><span v-if="service.isDraft" class="draft-tag">Draft</span><h3>{{ service.name }}</h3><p>{{ service.suburb }} - {{ service.type }}</p></div>
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
