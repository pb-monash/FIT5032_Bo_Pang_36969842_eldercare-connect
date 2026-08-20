import { cloudFunctionsBaseUrl } from '../config/a3Integrations'

function cleanText(value, max = 4000) {
  return String(value || '').replace(/[<>]/g, '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, max)
}

function validRecipients(recipients) {
  return [...new Set((Array.isArray(recipients) ? recipients : [])
    .map(recipient => String(recipient || '').trim().toLowerCase())
    .filter(recipient => /^\S+@\S+\.\S+$/.test(recipient)))]
}

export function createTextAttachment(filename, lines) {
  return {
    filename,
    type: 'text/plain',
    content: btoa(unescape(encodeURIComponent((Array.isArray(lines) ? lines : [lines]).join('\n')))),
  }
}

export async function queueCareEmail({ recipients, subject, body, attachments = [] }) {
  const message = {
    recipients: validRecipients(recipients),
    subject: cleanText(subject, 140),
    body: cleanText(body, 4000),
    attachments,
  }

  if (!message.recipients.length) throw new Error('Choose at least one valid recipient.')
  if (message.subject.length < 3) throw new Error('Add a clear email subject.')
  if (message.body.length < 10) throw new Error('Write a longer email message.')

  if (!cloudFunctionsBaseUrl) {
    return {
      ok: true,
      mode: 'local-preview',
      messageId: `local-${Date.now()}`,
      acceptedRecipients: message.recipients.length,
      attachmentNames: message.attachments.map(attachment => attachment.filename),
    }
  }

  const response = await fetch(`${cloudFunctionsBaseUrl.replace(/\/$/, '')}/api/email/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.ok) throw new Error(result.error || 'Cloud email function failed.')
  return result
}
