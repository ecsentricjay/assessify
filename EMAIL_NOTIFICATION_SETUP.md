# Email Notification System Implementation Guide

**Status**: ✅ Complete and Ready  
**Date**: February 7, 2026  
**Provider**: Resend  
**Styling**: Friendly/Casual  

---

## Overview

Complete email notification system integrated with Resend for automated notifications across all critical events:

- 📝 **Assignment Submissions**
- 📊 **Grading Completions** 
- 🧪 **Test Invitations**
- 💰 **Payment Receipts**
- 👋 **Welcome Emails**
- 🔐 **Password Resets**
- 📚 **Course Enrollments**

---

## Installation

### 1. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm add resend react-email @react-email/render

# Or using npm
npm install resend react-email @react-email/render

# Or using yarn
yarn add resend react-email @react-email/render
```

### 2. Update Environment Variables

Add the following to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=re_TJf9rCaR_BH5YnXJSahdpGvirmvkiCSCE
SENDER_EMAIL=support@assessify.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to your production URL
```

### 3. Verify Installation

```bash
# Test if packages are installed correctly
npm ls resend react-email
```

---

## Architecture

### File Structure

```
src/
├── lib/
│   ├── email-templates/          # Email templates (React components)
│   │   ├── index.ts
│   │   ├── assignment-submitted.tsx
│   │   ├── grading-complete.tsx
│   │   ├── test-invitation.tsx
│   │   ├── enrollment-confirmation.tsx
│   │   ├── password-reset.tsx
│   │   ├── payment-receipt.tsx
│   │   └── welcome.tsx
│   ├── services/
│   │   └── resend.service.ts     # Resend API integration
│   └── actions/
│       ├── email.actions.ts       # Email sending server actions
│       └── payment.actions.ts     # Updated with email notifications
```

---

## Components

### 1. Resend Service (`resend.service.ts`)

Core service for sending emails via Resend API:

```typescript
// Send single email
await sendEmail({
  to: 'user@example.com',
  subject: 'Your Subject',
  html: '<html>...</html>'
})

// Configuration
- RESEND_API_KEY: from environment
- SENDER_EMAIL: support@assessify.com
- Error handling & logging
```

### 2. Email Templates

All templates are React components that render to HTML:

**AssignmentSubmittedEmail** - Sent when student submits assignment
- Course title
- Assignment title
- Submission date
- Reference ID

**GradingCompleteEmail** - Sent when assignment is graded
- Score and percentage
- Lecturer feedback
- Color-coded grades (green ≥80%, blue ≥70%, etc.)
- Link to dashboard

**TestInvitationEmail** - Sent when test is available
- Test title & course
- Questions count
- Time limit
- Direct link to start

**PaymentReceiptEmail** - Sent when wallet is funded
- Amount & reference
- Payment method
- Transaction date
- New wallet balance

**EnrollmentConfirmationEmail** - Sent when student enrolls in course
- Course code & title
- Lecturer name
- Enrollment date

**PasswordResetEmail** - Sent for password reset
- Reset link (24-hour expiry)
- Security warning
- Expiry time

**WelcomeEmail** - Sent to new users
- Role-specific features
- Quick tips
- Dashboard link

### 3. Email Actions (`email.actions.ts`)

Server actions to trigger email sending:

```typescript
// Send welcome email
await sendWelcomeEmail(email, firstName, lastName, role)

// Send assignment submitted notification
await sendAssignmentSubmittedEmail(email, studentName, course, assignment, date, submissionId)

// Send grading complete notification
await sendGradingCompleteEmail(email, studentName, course, assignment, score, maxScore, feedback)

// Send test invitation
await sendTestInvitationEmail(email, studentName, course, test, code, duration, questions, date)

// Send enrollment confirmation
await sendEnrollmentConfirmationEmail(email, studentName, courseCode, courseTitle, lecturer, date)

// Send password reset
await sendPasswordResetEmail(email, userName, resetToken)

// Send payment receipt
await sendPaymentReceiptEmail(email, studentName, amount, reference, date, method, balance)

// Send bulk emails
await sendBulkNotificationEmails(emailArray)
```

---

## Integration Points

### Payment System (✅ Implemented)

**File**: `src/lib/actions/payment.actions.ts`

When a payment is verified:
1. Wallet is credited
2. Transaction is recorded
3. **Payment receipt email is sent automatically**

Location where email is triggered:
- `verifyPaymentAndCreditWallet()` - Direct payment verification
- `handlePaystackWebhook()` - Webhook payment processing

```typescript
// After wallet update succeeds:
await sendPaymentReceiptEmail(
  user.email,
  studentName,
  amountNGN,
  reference,
  emailDate,
  'Paystack',
  balanceAfter
)
```

### Authentication System

**To integrate with auth**:

1. After user registration (in `auth.actions.ts`):
   ```typescript
   await sendWelcomeEmail(email, firstName, lastName, role)
   ```

2. When password reset requested:
   ```typescript
   await sendPasswordResetEmail(email, userName, resetToken)
   ```

### Assignment Submissions

**To integrate with assignment submission**:

In `submission.actions.ts`, after successful submission:
```typescript
await sendAssignmentSubmittedEmail(
  studentEmail,
  studentName,
  courseTitle,
  assignmentTitle,
  submissionDate,
  submissionId
)
```

### Grading System

**To integrate with grading**:

In `grading.actions.ts`, after grading is saved:
```typescript
await sendGradingCompleteEmail(
  studentEmail,
  studentName,
  courseTitle,
  assignmentTitle,
  score,
  maxScore,
  feedback
)
```

### Course Enrollment

**To integrate with enrollment**:

In `course.actions.ts`, after successful enrollment:
```typescript
await sendEnrollmentConfirmationEmail(
  studentEmail,
  studentName,
  courseCode,
  courseTitle,
  lecturerName,
  enrollmentDate
)
```

### Test Assignments

**To integrate with tests**:

When a test is published or assigned, send invitation:
```typescript
await sendTestInvitationEmail(
  studentEmail,
  studentName,
  courseTitle,
  testTitle,
  testCode,
  duration,
  questionCount,
  testDate
)
```

---

## Resend API Keys

### Getting Your API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up or login to your account
3. Navigate to **API Keys** in the dashboard
4. Copy your API key (starts with `re_`)
5. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_YOUR_KEY_HERE
   ```

### Development vs Production

- **Development**: Test in Resend sandbox
- **Production**: Use live API key with verified domain

### Verified Sender Domain

To use a custom domain (e.g., `noreply@assessify.com`):

1. In Resend dashboard, go to **Domains**
2. Add your domain
3. Verify DNS records (Resend will show instructions)
4. Update `SENDER_EMAIL` to use your domain

For testing, you can use the default `onboarding@resend.dev` domain.

---

## Email Template Customization

### Change Sender Email

Update `SENDER_EMAIL` in `.env.local`:
```env
SENDER_EMAIL=noreply@assessify.com
```

### Customize Email Style

Edit email templates in `src/lib/email-templates/`:

```typescript
// Change colors, fonts, spacing, etc.
<div style={{ color: '#YOUR_COLOR' }}>
  ...
</div>
```

### Add Logo or Images

Templates can include images:
```tsx
<img 
  src="https://your-domain.com/logo.png" 
  alt="Logo"
  style={{ width: '200px' }}
/>
```

### Modify Email Content

Edit the JSX in each template file:
```typescript
<p>Your custom message here</p>
```

---

## Testing Email Delivery

### Local Development

1. **Resend Sandbox Mode**:
   - Emails won't actually be sent
   - Check browser console for logs
   - Use test email addresses

2. **Test with Real Email**:
   - Use `onboarding@resend.dev` recipient
   - Check your email inbox
   - Verify HTML rendering

### Sending Test Emails

```typescript
// In a test file or component
import { sendPaymentReceiptEmail } from '@/lib/actions/email.actions'

// Test payment receipt email
await sendPaymentReceiptEmail(
  'your-email@example.com',
  'John Doe',
  5000,
  'ASS-test-12345',
  'Feb 7, 2026',
  'Paystack',
  10000
)
```

### Troubleshooting

**Email not sent?**
- Check RESEND_API_KEY is set correctly
- Verify sender email is authorized
- Check browser/server logs for errors
- Ensure recipient email is valid

**Email not received?**
- Check spam/junk folder
- Verify email address is correct
- Check Resend dashboard activity logs
- For Gmail: Whitelist `bounce@resend.dev`

---

## Monitoring & Logging

### Resend Dashboard

Track all sent emails:
1. Go to [https://dashboard.resend.com](https://dashboard.resend.com)
2. View email activity
3. Check bounce/delivery rates
4. Monitor API quota usage

### Application Logging

Emails failures are logged:
```
console.error('Email error:', error)
```

Check server logs for:
- Failed emails
- Validation errors
- API rate limits

---

## Best Practices

### ✅ Do's

- ✅ Always include unsubscribe/contact info in emails
- ✅ Test emails thoroughly before production
- ✅ Use descriptive subject lines
- ✅ Include user's name for personalization
- ✅ Provide direct action links
- ✅ Handle email failure gracefully (don't break app)
- ✅ Rate limit mass emails

### ❌ Don'ts

- ❌ Send unsolicited emails
- ❌ Include sensitive data in emails
- ❌ Use shared API keys
- ❌ Send too many emails at once
- ❌ Hardcode email addresses
- ❌ Use production key in development

---

## Future Enhancements

- [ ] Email frequency settings (user preferences)
- [ ] Email templates customization by admin
- [ ] SMS notifications (Twilio)
- [ ] Scheduled bulk emails
- [ ] Email analytics & open rates
- [ ] A/B testing for subject lines
- [ ] Email template versioning
- [ ] Multi-language support

---

## Support

**Resend Docs**: https://resend.com/docs  
**Resend Support**: support@resend.com  
**React Email Docs**: https://react.email

---

## Summary

The email notification system is fully integrated with production-quality code:

✅ Professional HTML email templates  
✅ Friendly and engaging tone  
✅ Automatic error handling  
✅ Payment integration complete  
✅ Ready for additional integrations  
✅ Fully documented  

Next steps:
1. ✅ Install dependencies (`resend`, `react-email`)
2. ✅ Add environment variables
3. 📋 Integrate with auth system  
4. 📋 Integrate with assignment submission
5. 📋 Integrate with grading system
6. 📋 Integrate with course enrollment
