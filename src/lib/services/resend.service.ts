// lib/services/resend.service.ts
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'support@assessify.ng'

if (!RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set in environment variables')
}

const resend = new Resend(RESEND_API_KEY || '')

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!RESEND_API_KEY) {
      console.error('Resend API key not configured')
      return {
        success: false,
        error: 'Email service not configured',
      }
    }

    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: to,
      subject: subject,
      html: html,
      replyTo: replyTo,
    })

    if (result.error) {
      console.error('Resend error:', result.error)
      return {
        success: false,
        error: result.error.message,
      }
    }

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Email error:', message)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Send email to multiple recipients
 */
export async function sendBulkEmails(
  emails: Array<{
    to: string
    subject: string
    html: string
    replyTo?: string
  }>
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const email of emails) {
    const result = await sendEmail(email)
    if (result.success) {
      sent++
    } else {
      failed++
    }
  }

  return { success: failed === 0, sent, failed }
}

/**
 * Get sender email
 */
export function getSenderEmail(): string {
  return SENDER_EMAIL
}
