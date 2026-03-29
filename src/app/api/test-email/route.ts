import { sendEmail } from '@/lib/services/resend.service'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint for debugging email sending
 * POST /api/test-email with { to: "email@example.com", type: "simple|welcome|reset" }
 */
export async function POST(request: NextRequest) {
  try {
    const { to, type = 'simple' } = await request.json()

    if (!to) {
      return NextResponse.json(
        { error: 'Email address required in "to" field' },
        { status: 400 }
      )
    }

    console.log(`\n========== EMAIL TEST ==========`)
    console.log(`📧 Test type: ${type}`)
    console.log(`📧 Recipient: ${to}`)
    console.log(`📧 Timestamp: ${new Date().toISOString()}`)

    let html: string
    let subject: string

    if (type === 'welcome') {
      // Test welcome email with full rendering
      const { sendWelcomeEmail } = await import('@/lib/actions/email.actions')
      const result = await sendWelcomeEmail(to, 'Test', 'User', 'student')
      console.log(`📧 Welcome email result:`, result)
      return NextResponse.json(result)
    } else if (type === 'reset') {
      // Test password reset email
      const { sendPasswordResetEmail } = await import('@/lib/actions/email.actions')
      const testToken = 'test_token_' + Date.now()
      const result = await sendPasswordResetEmail(to, 'Test User', testToken)
      console.log(`📧 Password reset email result:`, result)
      return NextResponse.json(result)
    } else {
      // Simple test email with minimal HTML
      html = `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h1>Test Email</h1>
            <p>This is a test email sent at ${new Date().toISOString()}</p>
            <p>If you received this, the email system is working!</p>
          </body>
        </html>
      `
      subject = 'Test Email from Assessify'
    }

    console.log(`📧 HTML length: ${html?.length || 0} characters`)
    console.log(`📧 Subject: ${subject}`)

    const result = await sendEmail({
      to,
      subject,
      html,
    })

    console.log(`📧 Resend API response:`, result)
    console.log(`========== END TEST ==========\n`)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : ''
    
    console.error(`❌ Test endpoint error:`, {
      message,
      stack,
      error
    })
    console.log(`========== END TEST (ERROR) ==========\n`)

    return NextResponse.json(
      {
        error: message,
        stack: process.env.NODE_ENV === 'development' ? stack : undefined,
      },
      { status: 500 }
    )
  }
}

// GET endpoint for simple health check
export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint ready',
    usage: 'POST /api/test-email with body: { to: "email@example.com", type: "simple|welcome|reset" }',
    examples: [
      {
        type: 'simple',
        body: { to: 'test@example.com', type: 'simple' },
        description: 'Sends a minimal HTML test email'
      },
      {
        type: 'welcome',
        body: { to: 'test@example.com', type: 'welcome' },
        description: 'Sends a full welcome email template'
      },
      {
        type: 'reset',
        body: { to: 'test@example.com', type: 'reset' },
        description: 'Sends a password reset email template'
      }
    ]
  })
}
