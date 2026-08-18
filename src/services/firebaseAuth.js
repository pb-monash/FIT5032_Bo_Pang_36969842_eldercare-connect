import { initializeApp, getApps } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { firebaseConfig, integrationStatus, staffEmails } from '../config/a3Integrations'

let firebaseAuth

function getFirebaseAuth() {
  if (!integrationStatus.firebaseAuthReady) return null
  if (firebaseAuth) return firebaseAuth
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  firebaseAuth = getAuth(app)
  return firebaseAuth
}

function roleForEmail(email) {
  return staffEmails.includes(String(email || '').toLowerCase()) ? 'admin' : 'member'
}

export function mapFirebaseUser(user) {
  if (!user) return null
  const email = user.email || ''
  return {
    id: `firebase:${user.uid}`,
    name: user.displayName || email.split('@')[0] || 'Community member',
    email,
    role: roleForEmail(email),
    provider: 'firebase',
  }
}

export function subscribeToFirebaseAuth(onChange, onError) {
  const auth = getFirebaseAuth()
  if (!auth) return () => {}
  return onAuthStateChanged(auth, user => onChange(mapFirebaseUser(user)), onError)
}

export async function registerFirebaseMember({ name, email, password }) {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase Authentication is not configured.')
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  if (name) await updateProfile(credential.user, { displayName: name })
  return { ...mapFirebaseUser(credential.user), name: name || credential.user.displayName }
}

export async function signInFirebaseMember({ email, password }) {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase Authentication is not configured.')
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return mapFirebaseUser(credential.user)
}

export async function signOutFirebaseMember() {
  const auth = getFirebaseAuth()
  if (auth) await signOut(auth)
}
