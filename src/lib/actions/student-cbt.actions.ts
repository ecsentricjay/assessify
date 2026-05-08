// lib/actions/student-cbt.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'

export interface BundleForStudent {
  id: string
  bundle_name: string
  bundle_description: string | null
  base_price: number
  promo_price: number | null
  effective_price: number
  is_free: boolean
  validity_days: number
  course_ids: string[]
  referrer_commission: number
  already_purchased: boolean
  expiry_date?: string
  subscription_id?: string
}

export interface ActiveSubscription {
  id: string
  bundle_id: string
  course_id: string
  amount_paid: number
  start_date: string
  expiry_date: string
  is_active: boolean
  days_remaining: number
  bundle_name?: string
  bundle_description?: string
  course_ids?: string[]
}

/**
 * Get available bundles for student purchase
 */
export async function getAvailableBundles() {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { success: false, error: 'Not authenticated as student' }
    }

    const supabase = await createClient()

    // Get all active bundles
    const { data: bundles, error } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: true })

    if (error) throw error

    // Get student's active subscriptions
    const { data: subscriptions } = await supabase
      .from('cbt_student_subscriptions')
      .select('bundle_id, expiry_date, id')
      .eq('student_id', user.id)
      .eq('is_active', true)

    // Process bundles
    const bundlesForStudent: BundleForStudent[] = (bundles || []).map((bundle) => {
      const existingSub = subscriptions?.find((sub) => sub.bundle_id === bundle.id)
      const isActive = existingSub && new Date(existingSub.expiry_date) > new Date()

      return {
        id: bundle.id,
        bundle_name: bundle.bundle_name,
        bundle_description: bundle.bundle_description,
        base_price: bundle.base_price,
        promo_price: bundle.promo_price,
        effective_price: bundle.promo_price ?? bundle.base_price,
        is_free: (bundle.promo_price ?? bundle.base_price) === 0,
        validity_days: bundle.validity_days,
        course_ids: bundle.course_ids,
        referrer_commission: bundle.referrer_commission,
        already_purchased: !!isActive,
        expiry_date: existingSub?.expiry_date,
        subscription_id: existingSub?.id,
      }
    })

    return {
      success: true,
      bundles: bundlesForStudent,
    }
  } catch (error: any) {
    console.error('[getAvailableBundles] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch bundles',
    }
  }
}

/**
 * Purchase a bundle (free or paid)
 */
export async function purchaseBundle(params: {
  bundleId: string
  promoCode?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { success: false, error: 'Not authenticated as student' }
    }

    const { bundleId, promoCode } = params
    const supabase = await createClient()

    // 1. Get bundle details
    const { data: bundle, error: bundleError } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .eq('id', bundleId)
      .eq('is_active', true)
      .single()

    if (bundleError || !bundle) {
      return { success: false, error: 'Bundle not found or inactive' }
    }

    // 2. Calculate effective price
    const effectivePrice = bundle.promo_price ?? bundle.base_price
    const isFree = effectivePrice === 0

    // 3. Check if student already has active subscription
    const { data: existingSub } = await supabase
      .from('cbt_student_subscriptions')
      .select('*')
      .eq('student_id', user.id)
      .eq('bundle_id', bundleId)
      .eq('is_active', true)
      .single()

    if (existingSub && new Date(existingSub.expiry_date) > new Date()) {
      return {
        success: false,
        error: 'You already have an active subscription to this bundle',
      }
    }

    // 4. Calculate dates
    const startDate = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + bundle.validity_days)

    // 5. Handle FREE bundle - no payment needed
    if (isFree) {
      const { data: subscription, error: subError } = await supabase
        .from('cbt_student_subscriptions')
        .insert({
          student_id: user.id,
          bundle_id: bundleId,
          course_id: bundle.course_ids[0], // First course as primary
          amount_paid: 0,
          original_price: 0,
          discount_applied: 0,
          start_date: startDate.toISOString(),
          expiry_date: expiryDate.toISOString(),
          is_active: true,
          payment_method: 'free',
          promo_code_used: promoCode || null,
          referrer_commission: 0,
          commission_paid: 0,
        })
        .select()
        .single()

      if (subError) {
        console.error('[Free Bundle Subscription Error]:', subError)
        return { success: false, error: 'Failed to activate free bundle' }
      }

      return {
        success: true,
        message: '🎁 Free bundle activated successfully!',
        subscription: subscription,
        isFree: true,
      }
    }

    // 6. Handle PAID bundle - check wallet and process payment
    // Get student's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      return {
        success: false,
        error: 'Wallet not found. Please fund your wallet first.',
        needsFunding: true,
      }
    }

    // Check sufficient balance
    if (wallet.balance < effectivePrice) {
      return {
        success: false,
        error: 'Insufficient wallet balance',
        currentBalance: wallet.balance,
        required: effectivePrice,
        needsFunding: true,
      }
    }

    // 7. Process payment from wallet
    const balanceBefore = wallet.balance
    const balanceAfter = balanceBefore - effectivePrice
    const reference = `CBT_${Date.now()}_${user.id.substring(0, 8)}`

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'debit',
        purpose: 'cbt_subscription',
        amount: effectivePrice,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference: reference,
        description: `CBT Bundle: ${bundle.bundle_name}`,
        status: 'completed',
        metadata: {
          bundle_id: bundleId,
          bundle_name: bundle.bundle_name,
          promo_code: promoCode,
          validity_days: bundle.validity_days,
        },
      })
      .select()
      .single()

    if (txError) {
      console.error('[Transaction Error]:', txError)
      return { success: false, error: 'Failed to create transaction' }
    }

    // Update wallet balance
    const { error: balanceError } = await supabase
      .from('wallets')
      .update({
        balance: balanceAfter,
        total_spent: wallet.total_spent + effectivePrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (balanceError) {
      console.error('[Balance Update Error]:', balanceError)
      // Rollback transaction
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id)

      return { success: false, error: 'Failed to update wallet balance' }
    }

    // 8. Create subscription
    const { data: subscription, error: subError } = await supabase
      .from('cbt_student_subscriptions')
      .insert({
        student_id: user.id,
        bundle_id: bundleId,
        course_id: bundle.course_ids[0],
        amount_paid: effectivePrice,
        original_price: bundle.base_price,
        discount_applied: bundle.base_price - effectivePrice,
        start_date: startDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        is_active: true,
        payment_method: 'wallet',
        promo_code_used: promoCode || null,
        transaction_id: transaction.id,
        referrer_commission: bundle.referrer_commission || 0,
      })
      .select()
      .single()

    if (subError) {
      console.error('[Subscription Error]:', subError)

      // Rollback wallet
      await supabase
        .from('wallets')
        .update({ balance: balanceBefore, total_spent: wallet.total_spent })
        .eq('id', wallet.id)

      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id)

      return { success: false, error: 'Failed to create subscription' }
    }

    return {
      success: true,
      message: '✅ Bundle purchased successfully!',
      subscription: subscription,
      isFree: false,
      amountPaid: effectivePrice,
      newBalance: balanceAfter,
    }
  } catch (error: any) {
    console.error('[purchaseBundle] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to purchase bundle',
    }
  }
}

/**
 * Get student's active subscriptions
 */
export async function getMySubscriptions() {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { success: false, error: 'Not authenticated as student' }
    }

    const supabase = await createClient()

    const { data: subscriptions, error } = await supabase
      .from('cbt_student_subscriptions')
      .select(`
        *,
        cbt_subscription_bundles (
          bundle_name,
          bundle_description,
          course_ids
        )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Process subscriptions
    const processedSubs: ActiveSubscription[] = (subscriptions || []).map((sub: any) => {
      const expiryDate = new Date(sub.expiry_date)
      const now = new Date()
      const daysRemaining = Math.max(
        0,
        Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      )

      return {
        id: sub.id,
        bundle_id: sub.bundle_id,
        course_id: sub.course_id,
        amount_paid: sub.amount_paid,
        start_date: sub.start_date,
        expiry_date: sub.expiry_date,
        is_active: sub.is_active && expiryDate > now,
        days_remaining: daysRemaining,
        bundle_name: sub.cbt_subscription_bundles?.bundle_name,
        bundle_description: sub.cbt_subscription_bundles?.bundle_description,
        course_ids: sub.cbt_subscription_bundles?.course_ids,
      }
    })

    return {
      success: true,
      subscriptions: processedSubs,
    }
  } catch (error: any) {
    console.error('[getMySubscriptions] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch subscriptions',
    }
  }
}

/**
 * Check if student has access to a specific course
 */
export async function hasAccessToCourse(courseId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { success: false, hasAccess: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Get active subscriptions
    const { data: subscriptions } = await supabase
      .from('cbt_student_subscriptions')
      .select(`
        *,
        cbt_subscription_bundles (course_ids)
      `)
      .eq('student_id', user.id)
      .eq('is_active', true)
      .gt('expiry_date', new Date().toISOString())

    // Check if any subscription includes this course
    const hasAccess = subscriptions?.some((sub: any) => {
      const courseIds = sub.cbt_subscription_bundles?.course_ids || []
      return courseIds.includes(courseId)
    })

    return {
      success: true,
      hasAccess: !!hasAccess,
    }
  } catch (error: any) {
    console.error('[hasAccessToCourse] Error:', error)
    return {
      success: false,
      hasAccess: false,
      error: error.message || 'Failed to check access',
    }
  }
}