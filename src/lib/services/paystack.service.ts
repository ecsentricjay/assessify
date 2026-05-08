// lib/services/paystack.service.ts
/**
 * Paystack Payment Service
 * Handles all payment gateway operations with Paystack
 * - Initialize transactions
 * - Verify transactions
 * - Validate webhooks
 */

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

if (!SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY is not set in environment variables');
}

if (!PUBLIC_KEY) {
  console.error('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set in environment variables');
}

/**
 * Paystack Transaction Interface
 */
export interface PaystackTransaction {
  reference: string;
  amount: number; // in kobo (divide by 100 for NGN)
  email: string;
  callback_url?: string;
  metadata?: {
    user_id: string;
    wallet_id?: string;
    transaction_type: 'wallet_funding';
    [key: string]: any;
  };
}

/**
 * Paystack Verification Response
 */
export interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      first_name: string;
      last_name: string;
    };
    status: 'success' | 'failed' | 'pending';
    [key: string]: any;
  };
}

/**
 * Initialize a Paystack transaction
 * Returns authorization URL for redirect to checkout
 */
export async function initializePaystackTransaction(
  transaction: PaystackTransaction
): Promise<{
  success: boolean;
  authorizationUrl?: string;
  reference?: string;
  error?: string;
}> {
  try {
    if (!SECRET_KEY) {
      throw new Error('Paystack API key not configured');
    }

    // Validate amount (must be positive)
    if (transaction.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate email
    if (!transaction.email || !transaction.email.includes('@')) {
      throw new Error('Valid email is required');
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify({
        reference: transaction.reference,
        amount: transaction.amount, // in kobo
        email: transaction.email,
        metadata: transaction.metadata,
        callback_url: transaction.callback_url,
      }),
    });

    const data = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    if (!data.status) {
      return {
        success: false,
        error: data.message || 'Failed to initialize payment',
      };
    }

    return {
      success: true,
      authorizationUrl: data.data?.authorization_url,
      reference: data.data?.reference,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Paystack initialization error:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Verify a Paystack transaction
 * Call this after user completes payment at Paystack
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerificationResponse | null> {
  try {
    if (!SECRET_KEY) {
      throw new Error('Paystack API key not configured');
    }

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SECRET_KEY}`,
        },
      }
    );

    const data = (await response.json()) as PaystackVerificationResponse;

    if (!data.status) {
      console.error('Paystack verification failed:', data.message);
      return null;
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Paystack verification error:', message);
    return null;
  }
}

/**
 * Validate Paystack webhook signature
 * Used to verify webhook authenticity
 */
export function validatePaystackWebhookSignature(
  body: string,
  signature: string
): boolean {
  try {
    if (!SECRET_KEY) {
      console.error('Paystack secret key not configured for webhook validation');
      return false;
    }

    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', SECRET_KEY)
      .update(body)
      .digest('hex');

    return hash === signature;
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
}

/**
 * Get public key for frontend
 */
export function getPaystackPublicKey(): string {
  if (!PUBLIC_KEY) {
    throw new Error('Paystack public key not configured');
  }
  return PUBLIC_KEY;
}

/**
 * Format amount from NGN to kobo (Paystack uses kobo)
 */
export function formatAmountToKobo(ngnAmount: number): number {
  return Math.round(ngnAmount * 100);
}

/**
 * Format amount from kobo to NGN
 */
export function formatAmountFromKobo(koboAmount: number): number {
  return koboAmount / 100;
}

// ─── Dedicated Virtual Account (DVA) ───────────────────────────────────────

export interface PaystackCustomer {
  customer_code: string
  id: number
  email: string
  first_name: string
  last_name: string
}

export interface PaystackDVA {
  bank: {
    name: string
    slug: string
    id: number
  }
  account_name: string
  account_number: string
  id: number
  assigned: boolean
}

/**
 * Create a Paystack customer
 * Required before assigning a DVA
 */
export async function createPaystackCustomer(data: {
  email: string
  first_name: string
  last_name: string
  phone?: string
}): Promise<{ success: boolean; customer?: PaystackCustomer; error?: string }> {
  try {
    if (!SECRET_KEY) throw new Error('Paystack API key not configured')

    const response = await fetch(`${PAYSTACK_BASE_URL}/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!result.status) {
      return { success: false, error: result.message || 'Failed to create customer' }
    }

    return { success: true, customer: result.data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Paystack create customer error:', message)
    return { success: false, error: message }
  }
}

/**
 * Validate a customer's NIN via Paystack
 * Required before DVA assignment on live mode
 */
export async function validateCustomerIdentity(data: {
  customer_code: string
  country: string
  type: 'nin'
  value: string // the NIN number
  first_name: string
  last_name: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SECRET_KEY) throw new Error('Paystack API key not configured')

    const response = await fetch(`${PAYSTACK_BASE_URL}/customer/${data.customer_code}/identification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify({
        country: data.country,
        type: data.type,
        value: data.value,
        first_name: data.first_name,
        last_name: data.last_name,
      }),
    })

    const result = await response.json()

    if (!result.status) {
      return { success: false, error: result.message || 'Identity validation failed' }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Paystack identity validation error:', message)
    return { success: false, error: message }
  }
}

/**
 * Single-step: Create customer + assign DVA in one call
 * Uses /dedicated_account/assign endpoint
 */
export async function createAndAssignDVA(data: {
  email: string
  first_name: string
  last_name: string
  phone: string
  preferred_bank: string
  country: string
}): Promise<{ success: boolean; pending?: boolean; dva?: any; error?: string }> {
  try {
    if (!SECRET_KEY) throw new Error('Paystack API key not configured')

    const response = await fetch(`${PAYSTACK_BASE_URL}/dedicated_account/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    console.log('Paystack DVA assign response:', JSON.stringify(result, null, 2))

    if (!result.status) {
      return { success: false, error: result.message || 'Failed to assign DVA' }
    }

    // Async response — Paystack will send webhook when done
    if (result.message === 'Assign dedicated account in progress') {
      return { success: true, pending: true }
    }

    // Sync response — account details returned immediately
    return { success: true, pending: false, dva: result.data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Paystack DVA assign error:', message)
    return { success: false, error: message }
  }
}

/**
 * Fetch an existing customer's DVA details from Paystack
 */
export async function getCustomerDVA(
  customer_code: string
): Promise<{ success: boolean; dva?: PaystackDVA; error?: string }> {
  try {
    if (!SECRET_KEY) throw new Error('Paystack API key not configured')

    const response = await fetch(`${PAYSTACK_BASE_URL}/customer/${customer_code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
    })

    const result = await response.json()

    if (!result.status) {
      return { success: false, error: result.message || 'Failed to fetch customer' }
    }

    const dva = result.data?.dedicated_account
    if (!dva) {
      return { success: false, error: 'No virtual account assigned yet' }
    }

    return { success: true, dva }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Paystack get DVA error:', message)
    return { success: false, error: message }
  }
}