// lib/actions/payment.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  formatAmountToKobo,
  formatAmountFromKobo,
} from '@/lib/services/paystack.service'
import { sendPaymentReceiptEmail } from '@/lib/actions/email.actions'

export interface CreatePaymentLinkResponse {
  success: boolean
  authorizationUrl?: string
  reference?: string
  error?: string
}

export interface ProcessPaymentResult {
  success: boolean
  message: string
  walletId?: string
  newBalance?: number
  error?: string
}

export interface VerifyPaymentResponse {
  success: boolean
  isPaid: boolean
  amount: number
  message: string
  error?: string
}

/**
 * Create a payment link for wallet funding
 * User is redirected to Paystack checkout
 */
export async function createPaymentLink(
  amountNGN: number,
  callbackUrl?: string
): Promise<CreatePaymentLinkResponse> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Validate amount
    if (amountNGN <= 0) {
      return {
        success: false,
        error: 'Amount must be greater than 0',
      }
    }

    if (amountNGN < 100) {
      return {
        success: false,
        error: 'Minimum amount is ₦100',
      }
    }

    if (amountNGN > 5000000) {
      return {
        success: false,
        error: 'Maximum amount is ₦5,000,000',
      }
    }

    // Generate unique reference
    const reference = `ASS-${user.id.substr(0, 8)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Get or create wallet
    const supabase = await createClient()
    let wallet = await getOrCreateWallet(user.id, supabase)

    if (!wallet) {
      return {
        success: false,
        error: 'Failed to create/retrieve wallet',
      }
    }

    // Initialize Paystack transaction
    const result = await initializePaystackTransaction({
      reference,
      amount: formatAmountToKobo(amountNGN),
      email: user.email || '',
      callback_url: callbackUrl,
      metadata: {
        user_id: user.id,
        wallet_id: wallet.id,
        transaction_type: 'wallet_funding',
        first_name: user.profile?.first_name || 'User',
        last_name: user.profile?.last_name || '',
      },
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to initialize payment',
      }
    }

    // Store pending transaction reference in database
    await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'credit',
        purpose: 'payment',
        amount: amountNGN,
        balance_before: wallet.balance,
        balance_after: wallet.balance, // Will be updated on verification
        reference: reference,
        description: `Paystack wallet funding - ₦${amountNGN.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        status: 'pending',
        metadata: {
          gateway: 'paystack',
          paystack_reference: reference,
        },
      })
      .select()
      .single()

    return {
      success: true,
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Payment link creation error:', message)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Verify payment and credit wallet
 */
export async function verifyPaymentAndCreditWallet(
  reference: string
): Promise<ProcessPaymentResult> {
  try {
    if (!reference) {
      return {
        success: false,
        message: 'Payment reference is required',
      }
    }

    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated',
      }
    }

    const supabase = await createClient()

    // Verify with Paystack
    const verification = await verifyPaystackTransaction(reference)

    if (!verification || !verification.status) {
      return {
        success: false,
        message: 'Payment verification failed',
      }
    }

    // Check if payment was successful
    if (verification.data?.status !== 'success') {
      return {
        success: false,
        message: `Payment status: ${verification.data?.status || 'unknown'}`,
      }
    }

    // Get amount from verification
    const amountKobo = verification.data?.amount || 0
    const amountNGN = formatAmountFromKobo(amountKobo)

    // Get wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError || !walletData) {
      return {
        success: false,
        message: 'Wallet not found',
      }
    }

    const balanceBefore = walletData.balance
    const balanceAfter = balanceBefore + amountNGN

    // Credit wallet
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: balanceAfter,
        total_funded: (walletData.total_funded || 0) + amountNGN,
        updated_at: new Date().toISOString(),
      })
      .eq('id', walletData.id)

    if (updateError) {
      return {
        success: false,
        message: 'Failed to credit wallet',
      }
    }

    // Update transaction status
    const { error: txError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        balance_after: balanceAfter,
        metadata: {
          gateway: 'paystack',
          paystack_reference: reference,
          verified_at: new Date().toISOString(),
          customer_id: verification.data?.customer?.id,
        },
      })
      .eq('reference', reference)

    if (txError) {
      console.error('Failed to update transaction:', txError)
    }

    // Send payment receipt email
    const studentName = `${user.profile?.first_name} ${user.profile?.last_name}`
    const emailDate = new Date().toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    await sendPaymentReceiptEmail(
      user.email || '',
      studentName,
      amountNGN,
      reference,
      emailDate,
      'Paystack',
      balanceAfter
    ).catch((error) => {
      // Log but don't fail if email fails
      console.error('Failed to send payment receipt email:', error)
    })

    return {
      success: true,
      message: `Wallet credited successfully with ₦${amountNGN.toLocaleString('en-NG')}`,
      walletId: walletData.id,
      newBalance: balanceAfter,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Payment verification error:', message)
    return {
      success: false,
      message: message,
    }
  }
}

/**
 * Handle Paystack webhook event
 * Called from webhook endpoint
 */
export async function handlePaystackWebhook(
  event: any
): Promise<{ success: boolean; message: string }> {
  try {
    if (!event || !event.event) {
      return {
        success: false,
        message: 'Invalid webhook event',
      }
    }

    const supabase = await createClient()

    // Only process charge.success events
    if (event.event !== 'charge.success') {
      return {
        success: true,
        message: `Event ${event.event} processed (no action needed)`,
      }
    }

    const data = event.data
    if (!data || !data.reference) {
      return {
        success: false,
        message: 'No transaction reference in webhook',
      }
    }

    // Get transaction from database
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', data.reference)
      .single()

    if (txError || !transaction) {
      console.log('Transaction not found, skipping webhook')
      return {
        success: true,
        message: 'Transaction not found (skipped)',
      }
    }

    // If already processed, skip
    if (transaction.status === 'completed') {
      return {
        success: true,
        message: 'Transaction already processed',
      }
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', transaction.wallet_id)
      .single()

    if (walletError || !wallet) {
      return {
        success: false,
        message: 'Wallet not found',
      }
    }

    const amountKobo = data.amount || 0
    const amountNGN = formatAmountFromKobo(amountKobo)
    const balanceAfter = wallet.balance + amountNGN

    // Update wallet
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: balanceAfter,
        total_funded: (wallet.total_funded || 0) + amountNGN,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update wallet',
      }
    }

    // Update transaction status
    const { error: txUpdateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        balance_after: balanceAfter,
        metadata: {
          ...transaction.metadata,
          webhook_processed: true,
          webhook_timestamp: new Date().toISOString(),
          customer_id: data.customer?.id,
        },
      })
      .eq('id', transaction.id)

    if (txUpdateError) {
      console.error('Failed to update transaction after webhook:', txUpdateError)
    }

    // Send payment receipt email via webhook
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', wallet.user_id)
      .single()

    if (userProfile && userProfile.email) {
      const studentName = `${userProfile.first_name} ${userProfile.last_name}`
      const emailDate = new Date().toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      await sendPaymentReceiptEmail(
        userProfile.email,
        studentName,
        amountNGN,
        data.reference,
        emailDate,
        'Paystack',
        balanceAfter
      ).catch((error) => {
        // Log but don't fail if email fails
        console.error('Failed to send payment receipt email via webhook:', error)
      })
    }

    return {
      success: true,
      message: `Wallet funded with ₦${amountNGN}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook processing error:', message)
    return {
      success: false,
      message: message,
    }
  }
}

/**
 * Get or create wallet for user
 */
export async function getOrCreateWallet(
  userId: string,
  supabase: any
): Promise<{ id: string; balance: number } | null> {
  try {
    // Try to get existing wallet
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single()

    if (!error && wallet) {
      return wallet
    }

    // Create new wallet
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        balance: 0,
        total_funded: 0,
        total_spent: 0,
      })
      .select('id, balance')
      .single()

    if (createError) {
      console.error('Failed to create wallet:', createError)
      return null
    }

    return newWallet
  } catch (error) {
    console.error('Error in getOrCreateWallet:', error)
    return null
  }
}

/**
 * Get payment history for user
 */
export async function getPaymentHistory(limit = 10) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        payments: [],
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        id,
        reference,
        amount,
        status,
        created_at,
        description,
        wallets(user_id)
      `
      )
      .eq('wallets.user_id', user.id)
      .eq('type', 'credit')
      .eq('purpose', 'payment')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return {
        success: false,
        error: error.message,
        payments: [],
      }
    }

    return {
      success: true,
      payments: data || [],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: message,
      payments: [],
    }
  }
}
