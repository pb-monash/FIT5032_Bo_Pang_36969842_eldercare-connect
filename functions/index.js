import { logger } from 'firebase-functions'
import { onRequest } from 'firebase-functions/v2/https'

const allowedMethods = 'POST, OPTIONS'
const allowedHeaders = 'Content-Type, Authorization'

function corsHeaders(origin = '') {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': allowedHeaders,
    Vary: 'Origin',
  }
}

function sendJson(response, status, body, origin = '') {
  response.status(status).set(corsHeaders(origin)).json(body)
}

function cleanText(value, max = 4000) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F]/g, '')
    .trim()
    .slice(0, max)
}

function normaliseRecipients(recipients) {
  return [...new Set((Array.isArray(recipients) ? recipients : [])
    .map(recipient => String(recipient || '').trim().toLowerCase())
    .filter(recipient => /^\S+@\S+\.\S+$/.test(recipient)))]
}

function normaliseAttachments(attachments) {
  return (Array.isArray(attachments) ? attachments : [])
    .map((attachment) => {
      const plainContent = String(attachment.content || '').slice(0, 800000)
      const base64Content = String(attachment.contentBase64 || '').slice(0, 1200000)
      return {
        filename: cleanText(attachment.filename, 120) || 'attachment.txt',
        type: cleanText(attachment.type, 120) || 'text/plain',
        content: base64Content || Buffer.from(plainContent, 'utf8').toString('base64'),
      }
    })
    .filter(attachment => attachment.content)
    .slice(0, 3)
}

function env(name) {
  return process.env[name] || ''
}

function buildMessage(payload) {
  const message = {
    recipients: normaliseRecipients(payload?.recipients),
    subject: cleanText(payload?.subject, 140),
    body: cleanText(payload?.body, 4000),
    attachments: normaliseAttachments(payload?.attachments),
  }

  if (!message.recipients.length) throw new Error('At least one valid recipient is required.')
  if (message.subject.length < 3) throw new Error('Email subject is too short.')
  if (message.body.length < 10) throw new Error('Email body is too short.')
  return message
}

async function sendWithBrevo(message) {
  const apiKey = env('BREVO_API_KEY')
  const senderEmail = env('BREVO_SENDER_EMAIL')
  if (!apiKey || !senderEmail) return null

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: env('BREVO_SENDER_NAME') || 'ElderCare Connect',
      },
      to: message.recipients.map(email => ({ email })),
      subject: message.subject,
      textContent: message.body,
      attachment: message.attachments.map(attachment => ({
        name: attachment.filename,
        content: attachment.content,
      })),
    }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Brevo email delivery failed.')
  return {
    provider: 'brevo',
    messageId: result.messageId || `brevo-${Date.now()}`,
  }
}

async function sendWithSendGrid(message) {
  const apiKey = env('SENDGRID_API_KEY')
  const senderEmail = env('SENDGRID_SENDER_EMAIL')
  if (!apiKey || !senderEmail) return null

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: message.recipients.map(email => ({ email })) }],
      from: {
        email: senderEmail,
        name: env('SENDGRID_SENDER_NAME') || 'ElderCare Connect',
      },
      subject: message.subject,
      content: [{ type: 'text/plain', value: message.body }],
      attachments: message.attachments.map(attachment => ({
        filename: attachment.filename,
        type: attachment.type,
        content: attachment.content,
        disposition: 'attachment',
      })),
    }),
  })

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.errors?.[0]?.message || 'SendGrid email delivery failed.')
  }
  return {
    provider: 'sendgrid',
    messageId: response.headers.get('x-message-id') || `sendgrid-${Date.now()}`,
  }
}

async function deliverOrPreview(message) {
  const brevoResult = await sendWithBrevo(message)
  if (brevoResult) return brevoResult

  const sendgridResult = await sendWithSendGrid(message)
  if (sendgridResult) return sendgridResult

  return {
    provider: 'firebase-preview',
    messageId: `preview-${Date.now()}`,
  }
}

export const queueEmail = onRequest({
  region: 'australia-southeast1',
  cors: true,
}, async (request, response) => {
  const origin = request.get('origin') || ''

  if (request.method === 'OPTIONS') {
    response.status(204).set(corsHeaders(origin)).send('')
    return
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, error: 'Only POST requests are supported.' }, origin)
    return
  }

  try {
    const message = buildMessage(request.body)
    const delivery = await deliverOrPreview(message)
    logger.info('ElderCare email request processed.', {
      provider: delivery.provider,
      recipientCount: message.recipients.length,
      attachmentCount: message.attachments.length,
    })
    sendJson(response, delivery.provider === 'firebase-preview' ? 202 : 200, {
      ok: true,
      mode: delivery.provider === 'firebase-preview' ? 'firebase-cloud-preview' : 'delivered',
      provider: delivery.provider,
      messageId: delivery.messageId,
      acceptedRecipients: message.recipients.length,
      attachmentNames: message.attachments.map(attachment => attachment.filename),
    }, origin)
  } catch (error) {
    logger.warn('ElderCare email request failed.', { message: error.message })
    sendJson(response, 400, {
      ok: false,
      error: error.message || 'Email request could not be processed.',
    }, origin)
  }
})
