// lib/actions/payment.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  formatAmountToKobo,
  formatAmountFromKobo,
} from '@/lib/services/paystack.service'
import { sendPaymentReceiptEmail } from '@/lib/actions/email.actions'

// Create admin client for bypassing RLS
function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

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
        purpose: 'funding',
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
      return { success: false, message: 'Invalid webhook event' }
    }

    // Always use admin client in webhooks — no user session available
    const adminClient = createServiceClient()

    // ── DVA Assignment Success ──────────────────────────────────────────
    if (event.event === 'dedicatedaccount.assign.success') {
      const webhookData = event.data
      const customer = webhookData.customer
      const dedicatedAccount = webhookData.dedicated_account

      console.log('DVA assign success webhook:', JSON.stringify(webhookData, null, 2))

      if (!customer?.email) {
        return { success: true, message: 'No customer email in DVA webhook' }
      }

      const { data: authUsers } = await adminClient.auth.admin.listUsers()
      const authUser = authUsers?.users?.find((u: any) => u.email === customer.email)

      if (!authUser) {
        console.error('No auth user found for DVA webhook email:', customer.email)
        return { success: true, message: 'User not found for DVA webhook' }
      }

      const { error: updateError } = await adminClient
        .from('virtual_accounts')
        .update({
          paystack_customer_code: customer.customer_code || '',
          paystack_customer_id: customer.id || 0,
          paystack_account_id: dedicatedAccount.id || 0,
          account_number: dedicatedAccount.account_number,
          account_name: dedicatedAccount.account_name,
          bank_name: dedicatedAccount.bank?.name || 'Wema Bank',
          bank_slug: dedicatedAccount.bank?.slug || 'wema-bank',
          bank_id: dedicatedAccount.bank?.id || 0,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', authUser.id)

      if (updateError) {
        console.error('Failed to update DVA record:', updateError)
        return { success: false, message: 'Failed to update virtual account' }
      }

      console.log('DVA activated for user:', authUser.id, dedicatedAccount.account_number)
      return { success: true, message: 'DVA activated successfully' }
    }

    // ── Bank Transfer via DVA ───────────────────────────────────────────
    if (event.event === 'charge.success' && event.data?.channel === 'dedicated_nuban') {
      const data = event.data
      const accountNumber = data.authorization?.receiver_bank_account_number

      console.log('DVA transfer webhook received:', {
        accountNumber,
        amount: data.amount,
        reference: data.reference,
        channel: data.channel,
      })

      if (!accountNumber) {
        console.error('No receiver account number in transfer webhook. Authorization:', JSON.stringify(data.authorization, null, 2))
        return { success: false, message: 'No account number in transfer webhook' }
      }

      // Find user who owns this virtual account
      const { data: virtualAccount, error: vaError } = await adminClient
        .from('virtual_accounts')
        .select('user_id')
        .eq('account_number', accountNumber)
        .single()

      if (vaError || !virtualAccount) {
        console.error('Virtual account not found for transfer:', accountNumber, vaError)
        return { success: false, message: 'Virtual account not found' }
      }

      // Get wallet
      const { data: wallet, error: walletError } = await adminClient
        .from('wallets')
        .select('*')
        .eq('user_id', virtualAccount.user_id)
        .single()

      if (walletError || !wallet) {
        console.error('Wallet not found for user:', virtualAccount.user_id, walletError)
        return { success: false, message: 'Wallet not found' }
      }

      const amountNGN = formatAmountFromKobo(data.amount || 0)
      const balanceBefore = Number(wallet.balance)
      const balanceAfter = balanceBefore + amountNGN
      const reference = `DVA-${data.reference}`

      // Idempotency check
      const { data: existingTx } = await adminClient
        .from('transactions')
        .select('id')
        .eq('reference', reference)
        .maybeSingle()

      if (existingTx) {
        console.log('Transfer already processed:', reference)
        return { success: true, message: 'Transfer already processed' }
      }

      // Credit wallet
      const { error: walletUpdateError } = await adminClient
        .from('wallets')
        .update({
          balance: balanceAfter,
          total_funded: (Number(wallet.total_funded) || 0) + amountNGN,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id)

      if (walletUpdateError) {
        console.error('Failed to credit wallet:', walletUpdateError)
        return { success: false, message: 'Failed to credit wallet' }
      }

      // Record transaction
      const { error: txInsertError } = await adminClient
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'credit',
          purpose: 'funding',
          amount: amountNGN,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference,
          description: `Bank transfer — ₦${amountNGN.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
          status: 'completed',
          metadata: {
            gateway: 'paystack_dva',
            channel: 'dedicated_nuban',
            account_number: accountNumber,
            paystack_reference: data.reference,
          },
        })

      if (txInsertError) {
        console.error('Failed to record transaction:', txInsertError)
      }

      // Send receipt email
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', virtualAccount.user_id)
        .single()

      const { data: authUserData } = await adminClient.auth.admin.getUserById(virtualAccount.user_id)

      if (userProfile && authUserData?.user?.email) {
        const emailDate = new Date().toLocaleDateString('en-NG', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
        await sendPaymentReceiptEmail(
          authUserData.user.email,
          `${userProfile.first_name} ${userProfile.last_name}`,
          amountNGN,
          reference,
          emailDate,
          'Bank Transfer',
          balanceAfter
        ).catch((e) => console.error('Receipt email failed:', e))
      }

      console.log(`✅ Wallet credited ₦${amountNGN} for user ${virtualAccount.user_id}. New balance: ₦${balanceAfter}`)
      return { success: true, message: `Wallet funded via transfer: ₦${amountNGN}` }
    }

    // ── Card Payment (charge.success, non-DVA) ──────────────────────────
    if (event.event !== 'charge.success') {
      return { success: true, message: `Event ${event.event} acknowledged` }
    }

    const data = event.data
    if (!data?.reference) {
      return { success: false, message: 'No transaction reference in webhook' }
    }

    const { data: transaction, error: txError } = await adminClient
      .from('transactions')
      .select('*')
      .eq('reference', data.reference)
      .maybeSingle()

    if (txError || !transaction) {
      console.log('Transaction not found for reference:', data.reference)
      return { success: true, message: 'Transaction not found (skipped)' }
    }

    if (transaction.status === 'completed') {
      return { success: true, message: 'Transaction already processed' }
    }

    const { data: wallet, error: walletError } = await adminClient
      .from('wallets')
      .select('*')
      .eq('id', transaction.wallet_id)
      .single()

    if (walletError || !wallet) {
      return { success: false, message: 'Wallet not found' }
    }

    const amountNGN = formatAmountFromKobo(data.amount || 0)
    const balanceAfter = Number(wallet.balance) + amountNGN

    await adminClient
      .from('wallets')
      .update({
        balance: balanceAfter,
        total_funded: (Number(wallet.total_funded) || 0) + amountNGN,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    await adminClient
      .from('transactions')
      .update({
        status: 'completed',
        balance_after: balanceAfter,
        metadata: {
          ...transaction.metadata,
          webhook_processed: true,
          webhook_timestamp: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id)

    // Send receipt email
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', wallet.user_id)
      .single()

    const { data: authUserData } = await adminClient.auth.admin.getUserById(wallet.user_id)

    if (userProfile && authUserData?.user?.email) {
      const emailDate = new Date().toLocaleDateString('en-NG', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
      await sendPaymentReceiptEmail(
        authUserData.user.email,
        `${userProfile.first_name} ${userProfile.last_name}`,
        amountNGN,
        data.reference,
        emailDate,
        'Paystack',
        balanceAfter
      ).catch((e) => console.error('Receipt email failed:', e))
    }

    return { success: true, message: `Wallet funded with ₦${amountNGN}` }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook processing error:', message)
    return { success: false, message: message }
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

// lib/actions/payment.actions.ts

/**
 * Get payment history for user (ALL transactions, not just wallet funding)
 */
/**
 * Get payment history for user - ALL transactions
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

    // Get user's wallet first
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!wallet) {
      return {
        success: false,
        error: 'Wallet not found',
        payments: [],
      }
    }

    // Get ALL transactions (removed purpose filter entirely)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Transaction history error:', error)
      return {
        success: false,
        error: error.message,
        payments: [],
      }
    }

    console.log('✅ Transaction history fetched:', data?.length, 'transactions')

    return {
      success: true,
      payments: data || [],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Get payment history error:', message)
    return {
      success: false,
      error: message,
      payments: [],
    }
  }
}