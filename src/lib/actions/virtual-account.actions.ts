'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import {
  createAndAssignDVA,
} from '@/lib/services/paystack.service'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Check if the current user already has a virtual account
 */
export async function getVirtualAccount() {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('virtual_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return { success: false, hasAccount: false }
    }

    return { 
      success: true, 
      hasAccount: true, 
      account: data,
      isPending: !data.is_active || data.account_number === 'pending'
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Activate virtual account — full flow:
 * 1. Create Paystack customer
 * 2. Validate NIN identity
 * 3. Assign DVA
 * 4. Save to virtual_accounts table
 */
/**
 * Retry DVA creation — called if signup DVA failed
 * Uses form data stored in profile
 */
export async function activateVirtualAccount() {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const adminClient = createServiceClient()
    const supabase = await createClient()

    // Fetch profile with admin client
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'Failed to fetch your profile' }
    }

    const { first_name, last_name, phone } = profile
    const email = user.email || ''

    if (!first_name?.trim() || !last_name?.trim()) {
      return { success: false, error: 'Your profile must have a first and last name' }
    }

    if (!phone?.trim()) {
      return { success: false, error: 'Your profile must have a phone number' }
    }

    const dvaResult = await createAndAssignDVA({
      email,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
      preferred_bank: 'wema-bank',
      country: 'NG',
    })

    if (!dvaResult.success || !dvaResult.dva) {
      return { success: false, error: dvaResult.error || 'Failed to create virtual account' }
    }

    const dva = dvaResult.dva
    const account = dva.dedicated_account || dva
    const customer = dva.customer || {}

    const { data: savedAccount, error: saveError } = await adminClient
      .from('virtual_accounts')
      .upsert({
        user_id: user.id,
        paystack_customer_code: customer.customer_code || '',
        paystack_customer_id: customer.id || 0,
        paystack_account_id: account.id || 0,
        account_number: account.account_number || '',
        account_name: account.account_name || '',
        bank_name: account.bank?.name || 'Wema Bank',
        bank_slug: account.bank?.slug || 'wema-bank',
        bank_id: account.bank?.id || 0,
        currency: 'NGN',
        is_active: true,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save virtual account:', saveError)
      return { success: false, error: 'Account created but failed to save. Contact support.' }
    }

    return { success: true, account: savedAccount }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Virtual account activation error:', message)
    return { success: false, error: message }
  }
}