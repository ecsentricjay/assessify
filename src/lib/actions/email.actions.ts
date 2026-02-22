// lib/actions/email.actions.ts
'use server'

import { sendEmail } from '@/lib/services/resend.service'
import { render } from '@react-email/render'
import {
  AssignmentSubmittedEmail,
  GradingCompleteEmail,
  TestInvitationEmail,
  EnrollmentConfirmationEmail,
  PasswordResetEmail,
  PaymentReceiptEmail,
  WelcomeEmail,
  PartnerCredentialsEmail,
} from '@/lib/email-templates'

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string,
  role: string
) {
  try {
    // Partners go directly to login, others to their dashboard
    const baseUrl = 'https://assessify.ng'
    const dashboardUrl = role === 'partner' 
      ? `${baseUrl}/auth/login`
      : `${baseUrl}/auth/login`

    const html = (await render(
      WelcomeEmail({
        firstName,
        role,
        dashboardUrl,
      })
    )).toString()

    const result = await sendEmail({
      to: email,
      subject: `Welcome to Assessify, ${firstName}! 👋`,
      html,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Welcome email send error:', message)
    return { success: false, error: message }
  }
}

/**
 * Send partner credentials email with login information
 */
export async function sendPartnerCredentialsEmail(
  email: string,
  firstName: string,
  lastName: string,
  temporaryPassword: string,
  partnerCode: string
) {
  try {
    const baseUrl = 'https://assessify.ng'
    const loginUrl = `${baseUrl}/auth/login`

    const html = (await render(
      PartnerCredentialsEmail({
        firstName,
        lastName,
        email,
        temporaryPassword,
        partnerCode,
        loginUrl,
      })
    )).toString()

    const result = await sendEmail({
      to: email,
      subject: `Your Assessify Partner Account Credentials 🤝`,
      html,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Partner credentials email send error:', message)
    return { success: false, error: message }
  }
}

/**
 * Send assignment submitted confirmation
 */
export async function sendAssignmentSubmittedEmail(
  email: string,
  studentName: string,
  courseTitle: string,
  assignmentTitle: string,
  submissionDate: string,
  submissionId: string
) {
  try {
    const html = (await render(
      AssignmentSubmittedEmail({
        studentName,
        courseTitle,
        assignmentTitle,
        submissionDate,
        submissionId,
      })
    )).toString()

    const result = await sendEmail({
      to: email,
      subject: `Assignment Submitted - ${courseTitle}`,
      html,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Assignment submitted email error:', message)
    return { success: false, error: message }
  }
}

/**
 * Send grading completion email
 */
export async function sendGradingCompleteEmail(
  email: string,
  studentName: string,
  courseTitle: string,
  assignmentTitle: string,
  score: number,
  maxScore: number,
  feedback?: string
) {
  try {
    const percentage = Math.round((score / maxScore) * 100)
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/student/dashboard`

    const html = (await render(
      GradingCompleteEmail({
        studentName,
        courseTitle,
        assignmentTitle,
        score,
        maxScore,
        percentage,
        feedback,
        dashboardUrl,
      })
    )).toString()

    const result = await sendEmail({
      to: email,
      subject: `Your assignment is graded! - ${assignmentTitle}`,
      html,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Grading complete email error:', message)
    return { success: false, error: message }
  }
}

/**
 * Send test invitation email
 */
export async function sendTestInvitationEmail(
  email: string,
  studentName: string,
  courseTitle: string,
  testTitle: string,
  testCode: string,
  duration?: number,
  questions?: number,
  testDate?: string
) {
  try {
    const accessUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/tests/${testCode}`

    const html = (await render(
      TestInvitationEmail({
        studentName,
        courseTitle,
        testTitle,
        testDate,
        duration,
        questions,
        accessUrl,
      })
    )).toString()

    const result = await sendEmail({
      to: email,
      subject: `New test available - ${testTitle}`,
      html,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Test invitation email error:', message)
    return { success: false, error: message }
  }
}

/**
 * Send enrollment confirmation email
 */
export async function sendEnrollmentConfirmationEmail(
  email: string,
  studentName: string,
  courseCode: string,
  courseTitle: string,
  lecturer: string,
  enrollmentDate: string
) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/student/courses`

    const html = (await render(
      EnrollmentConfirmationEmail({
        studentName,
        courseCode,
        courseTitle,
        lecturer,
        enrollmentDate,
        dashboardUrl,
      })
    )).toString()

    const result = await sendEmail({
      to: email,
      subject: `Enrolled in ${courseCode} - ${courseTitle}`,
      html,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Enrollment confirmation email error:', message)
    return { success: false, error: message }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetToken: string
) {
  try {
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    const html = (await render(
      PasswordResetEmail({
        userName,
        resetLink,
        expiryTime: '24 hours',
      })
    )).toString()

    const result = await sendEmail({
      to: email,
      subject: 'Reset your Assessify password',
      html,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Password reset email error:', message)
    return { success: false, error: message }
  }
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  email: string,
  studentName: string,
  amount: number,
  reference: string,
  date: string,
  paymentMethod: string,
  walletBalance: number
) {
  try {
    const html = (await render(
      PaymentReceiptEmail({
        studentName,
        amount,
        reference,
        date,
        paymentMethod,
        walletBalance,
      })
    )).toString()

    const result = await sendEmail({
      to: email,
      subject: `Payment Receipt - ₦${amount.toLocaleString('en-NG')}`,
      html,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Payment receipt email error:', message)
    return { success: false, error: message }
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkNotificationEmails(
  emails: Array<{
    to: string
    subject: string
    html: string
  }>
) {
  try {
    let sent = 0
    let failed = 0

    for (const email of emails) {
      const result = await sendEmail(email)
      if (result.success) {
        sent++
      } else {
        failed++
        console.error(`Failed to send email to ${email.to}:`, result.error)
      }
    }

    return {
      success: failed === 0,
      sent,
      failed,
      message: `Sent ${sent} emails, ${failed} failed`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Bulk email error:', message)
    return { success: false, sent: 0, failed: emails.length, error: message }
  }
}
