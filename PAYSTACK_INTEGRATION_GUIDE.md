# Paystack Integration Setup Guide

## Overview

This guide explains how to set up and use the Paystack payment integration in Assessify. The integration allows students to fund their wallets for submitting assignments and taking tests.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Paystack Account Setup](#paystack-account-setup)
4. [Webhook Configuration](#webhook-configuration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Paystack account (sign up at https://dashboard.paystack.com)
- Access to your Paystack API keys
- Deployed or local instance running with HTTPS (for webhooks)
- Supabase database configured

---

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Paystack API Keys (from https://dashboard.paystack.com/settings/developer)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
```

### Getting Your API Keys

1. Log in to your Paystack Dashboard: https://dashboard.paystack.com
2. Go to **Settings** → **Developer** (or **API Keys & Webhooks**)
3. You'll see two keys:
   - **Public Key** (starts with `pk_live_` or `pk_test_`) → Use for `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - **Secret Key** (starts with `sk_live_` or `sk_test_`) → Use for `PAYSTACK_SECRET_KEY`

### Development vs Production

- **Development**: Use `pk_test_` and `sk_test_` keys
- **Production**: Use `pk_live_` and `sk_live_` keys

---

## Paystack Account Setup

### 1. Create Paystack Account

- Go to https://dashboard.paystack.com
- Sign up with your email address
- Complete phone verification
- Set up your bank account for payouts (required for live transactions)

### 2. Verify Your Business

Paystack may require business verification. Complete this before using live keys.

### 3. Configure Payout Settings

- Navigate to **Settings** → **Payout Schedule** or **Transfers**
- Set your preferred payout method (Bank Transfer)
- Provide your bank details

---

## Webhook Configuration

### What is a Webhook?

Webhooks allow Paystack to notify your application when payments are successful. This ensures that even if the user doesn't return from Paystack, their wallet is credited.

### Setting Up Webhooks

1. Go to Paystack Dashboard: https://dashboard.paystack.com
2. Navigate to **Settings** → **Developer** → **Webhooks**
3. Add a new webhook with these settings:

   **Webhook URL**: 
   ```
   https://yourdomain.com/api/payments/paystack/webhook
   ```
   
   For **local development**, use ngrok:
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3000
   
   # This will give you a URL like: https://xxxx-xx-xxx-xx-xxx.ngrok.io
   # Use: https://xxxx-xx-xxx-xx-xxx.ngrok.io/api/payments/paystack/webhook
   ```

4. Select these **Events**:
   - ✅ **charge.success** (most important)
   - ✅ **charge.failed** (optional, for logging)
   - ✅ **transfer.success** (if using transfers)

5. Click **Save & Continue**

### Webhook Security

The webhook endpoint verifies the authenticity of Paystack's requests using HMAC-SHA512 signatures. This is handled automatically in the code.

---

## Testing the Integration

### Using Paystack Test Cards

Paystack provides test cards for development:

| Card Type | Card Number | Details |
|-----------|-------------|---------|
| Visa (Success) | 4084084084084081 | Expiry: Any future date, CVV: Any 3 digits |
| Mastercard (Success) | 5531886652142950 | Expiry: Any future date, CVV: Any 3 digits |
| Verve (Success) | 5060666666666666 | Expiry: Any future date, CVV: Any 3 digits |

**OTP**: Always use `123456` for OTP prompts in test mode.

### Manual Testing Steps

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Wallet page**:
   - Login as a student
   - Go to `/wallet` or click "Fund Wallet" button

3. **Initiate Payment**:
   - Enter amount (e.g., ₦1,000)
   - Click "Pay with Paystack"

4. **Complete Payment**:
   - Use test card: `4084084084084081`
   - Any future expiry date
   - Any 3-digit CVV
   - Enter OTP: `123456`

5. **Verify Results**:
   - Check if you're redirected to success page
   - Verify wallet balance is updated in dashboard
   - Check database transaction record

---

## Database Schema

The payment integration uses these existing tables:

### Transactions Table
```sql
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id),
  type text CHECK (type IN ('credit', 'debit')),
  purpose text, -- 'payment', 'funding', etc.
  amount numeric,
  balance_before numeric,
  balance_after numeric,
  reference text UNIQUE,
  description text,
  status text CHECK (status IN ('pending', 'completed', 'failed')),
  metadata jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Wallets Table
```sql
CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  balance numeric DEFAULT 0,
  total_funded numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

---

## API Endpoints

### 1. Initialize Payment
**POST** `/api/payments/paystack/initialize`

Request:
```json
{
  "amount": 5000
}
```

Response:
```json
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "ASS-abc123-1234567890-xyz789"
}
```

### 2. Verify Payment
**GET** `/api/payments/paystack/verify?reference=ASS-abc123-...`

Response:
```json
{
  "success": true,
  "message": "Wallet credited successfully with ₦5,000",
  "walletId": "wallet-uuid",
  "newBalance": 5000
}
```

### 3. Webhook Handler
**POST** `/api/payments/paystack/webhook`

Automatically processes payment notifications from Paystack.

---

## Frontend Integration

### Using PaystackPaymentButton Component

```tsx
import { PaystackPaymentButton } from '@/components/paystack-payment-button'

export function MyComponent() {
  return (
    <PaystackPaymentButton
      onSuccess={(newBalance) => {
        console.log('Payment successful! New balance:', newBalance)
        // Reload or update UI
      }}
      onError={(error) => {
        console.error('Payment failed:', error)
      }}
    />
  )
}
```

### Payment Flow

1. User clicks "Fund Wallet" button
2. Dialog opens with amount input
3. User confirms payment
4. JavaScript redirects to Paystack checkout
5. User completes payment on Paystack
6. User redirected back to `/wallet/payment-success?reference=ASS-...`
7. Page verifies payment and credits wallet
8. User sees success message with new balance

---

## Deployment

### Production Checklist

- [ ] Switch to **live** Paystack keys (pk_live_, sk_live_)
- [ ] Update webhook URL in Paystack Dashboard to production domain
- [ ] Ensure HTTPS is enabled on your domain
- [ ] Test with a small amount before full launch
- [ ] Monitor webhook logs for issues
- [ ] Set up error logging (Sentry, LogRocket, etc.)
- [ ] Configure email notifications for payment notifications
- [ ] Test refund process

### Environment Variable Setup

```bash
# Production .env.production
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
```

---

## Troubleshooting

### Issue: Payment initialized but returns to site instead of Paystack checkout

**Solution**: Ensure `authorizationUrl` is returned correctly from the initialization endpoint.

### Issue: Webhook not being called

**Solutions**:
1. Check webhook URL in Paystack Dashboard matches your domain
2. Verify webhook is enabled for "charge.success" event
3. Test webhook delivery using Paystack Dashboard's "Webhook" section
4. Check server logs for error messages

### Issue: Wallet not credited after successful payment

**Solutions**:
1. Check the webhook is properly configured
2. Verify database transaction record has `status: 'completed'`
3. Ensure wallet exists for the user
4. Check logs for any errors in wallet credit process
5. Verify your Paystack secret key is correct

### Issue: "Invalid Signature" error on webhook

**Solutions**:
1. Ensure `PAYSTACK_SECRET_KEY` is correct and starts with `sk_`
2. Verify webhook URL has no trailing slashes
3. Check that webhook is using POST method
4. Verify Paystack is sending correct signature header

### Issue: Test payments work but live payments don't

**Solutions**:
1. Verify you switched to live keys (pk_live_, sk_live_)
2. Check that your Paystack account is verified and approved
3. Verify payout settings are configured
4. Test with a small amount first

---

## Support

For issues or questions:

1. **Paystack Support**: https://paystack.com/support
2. **Paystack Documentation**: https://paystack.com/docs
3. **App Support**: Contact your development team

---

## Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Paystack Webhook Documentation](https://paystack.com/docs/payments/webhooks/)
- [Paystack Test Environment](https://paystack.com/docs/payments/payment-pages/#testing)
- [Assessify Documentation](../README.md)
