const requiredFirebaseKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

function readEnvValue(key) {
  return import.meta.env[key] || ''
}

function hasAll(values) {
  return values.every(Boolean)
}

function productionOrigin() {
  if (!import.meta.env.PROD || typeof window === 'undefined') return ''
  return window.location.origin
}

export const firebaseConfig = {
  apiKey: readEnvValue('VITE_FIREBASE_API_KEY'),
  authDomain: readEnvValue('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnvValue('VITE_FIREBASE_PROJECT_ID'),
  appId: readEnvValue('VITE_FIREBASE_APP_ID'),
}

export const cloudFunctionsBaseUrl = readEnvValue('VITE_CLOUD_FUNCTIONS_BASE_URL') || productionOrigin()

export const staffEmails = readEnvValue('VITE_FIREBASE_STAFF_EMAILS')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

export const mapConfig = {
  provider: readEnvValue('VITE_MAP_PROVIDER') || 'maptiler',
  apiKey: readEnvValue('VITE_MAP_API_KEY'),
}

export const integrationStatus = {
  firebaseAuthReady: hasAll(requiredFirebaseKeys.map(readEnvValue)),
  cloudFunctionsReady: Boolean(cloudFunctionsBaseUrl),
  mapReady: Boolean(mapConfig.apiKey),
}

export function describeMissingIntegrations() {
  const missing = []
  if (!integrationStatus.firebaseAuthReady) missing.push('Firebase authentication')
  if (!integrationStatus.cloudFunctionsReady) missing.push('Cloud Functions API')
  if (!integrationStatus.mapReady) missing.push('map provider')
  return missing
}
