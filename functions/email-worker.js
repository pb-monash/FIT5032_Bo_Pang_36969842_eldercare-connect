const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': origin || 'https://example.invalid',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  Vary: 'Origin',
})

function jsonResponse(body, status = 200, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

function cleanText(value, max = 2000) {
  return String(value || '').replace(/[<>]/g, '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, max)
}

function normaliseRecipients(recipients) {
  return [...new Set((Array.isArray(recipients) ? recipients : [])
    .map(recipient => String(recipient || '').trim().toLowerCase())
    .filter(recipient => /^\S+@\S+\.\S+$/.test(recipient)))]
}

function normaliseAttachments(attachments) {
  return (Array.isArray(attachments) ? attachments : [])
    .map(attachment => ({
      filename: cleanText(attachment.filename, 120) || 'attachment.txt',
      type: cleanText(attachment.type, 120) || 'text/plain',
      content: String(attachment.content || '').slice(0, 12000),
    }))
    .filter(attachment => attachment.content)
    .slice(0, 3)
}

function originAllowed(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowedOrigins = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  if (!allowedOrigins.length) return origin
  return allowedOrigins.includes(origin) ? origin : ''
}

function requestAuthorised(request, env) {
  if (env.REQUIRE_FUNCTION_TOKEN !== 'true') return true
  const expected = env.EMAIL_FUNCTION_TOKEN
  const provided = request.headers.get('Authorization') || ''
  return Boolean(expected) && provided === `Bearer ${expected}`
}

async function handleQueueEmail(request, env, origin) {
  if (!requestAuthorised(request, env)) return jsonResponse({ error: 'Unauthorised email function request.' }, 401, origin)
  const payload = await request.json()
  const message = {
    recipients: normaliseRecipients(payload.recipients),
    subject: cleanText(payload.subject, 140),
    body: cleanText(payload.body, 4000),
    attachments: normaliseAttachments(payload.attachments),
  }

  if (!message.recipients.length) return jsonResponse({ error: 'At least one valid recipient is required.' }, 400, origin)
  if (message.subject.length < 3) return jsonResponse({ error: 'Email subject is too short.' }, 400, origin)
  if (message.body.length < 10) return jsonResponse({ error: 'Email body is too short.' }, 400, origin)

  return jsonResponse({
    ok: true,
    mode: 'queued-preview',
    messageId: `eldercare-${Date.now()}`,
    acceptedRecipients: message.recipients.length,
    attachmentNames: message.attachments.map(attachment => attachment.filename),
  }, 202, origin)
}

export default {
  async fetch(request, env) {
    const origin = originAllowed(request, env)
    if (!origin && request.headers.get('Origin')) return jsonResponse({ error: 'Origin is not allowed.' }, 403, '')
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/api/email/queue') {
      try {
        return await handleQueueEmail(request, env, origin)
      } catch {
        return jsonResponse({ error: 'Email request could not be processed.' }, 400, origin)
      }
    }
    return jsonResponse({ error: 'Not found' }, 404, origin)
  },
}
