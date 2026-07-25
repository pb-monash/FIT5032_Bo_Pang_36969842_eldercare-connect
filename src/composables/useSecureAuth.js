const textEncoder = new TextEncoder()
const PASSWORD_ITERATIONS = 120000

function toBase64(bytes) {
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0))
}

async function derivePasswordHash(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256,
  )
  return new Uint8Array(bits)
}

function constantTimeEqual(first, second) {
  if (first.length !== second.length) return false
  let difference = 0
  for (let index = 0; index < first.length; index += 1) difference |= first[index] ^ second[index]
  return difference === 0
}

export async function createPasswordCredential(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordHash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS)
  return {
    passwordHash: toBase64(passwordHash),
    passwordSalt: toBase64(salt),
    passwordIterations: PASSWORD_ITERATIONS,
  }
}

export async function verifyPassword(password, account) {
  if (!account?.passwordHash || !account.passwordSalt || !Number.isInteger(account.passwordIterations)) return false
  const expectedHash = fromBase64(account.passwordHash)
  const actualHash = await derivePasswordHash(password, fromBase64(account.passwordSalt), account.passwordIterations)
  return constantTimeEqual(expectedHash, actualHash)
}

export async function migrateLegacyAccounts(accounts) {
  return Promise.all(accounts.map(async account => {
    if (typeof account.password !== 'string') return account
    const credential = await createPasswordCredential(account.password)
    const { password, ...safeAccount } = account
    return { ...safeAccount, ...credential }
  }))
}
