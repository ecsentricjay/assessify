'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth.actions'

interface EarningsData {
  submissionRevenue?: number // For lecturers
  lecturerReferrals?: number // For partners
  bundleCommissions?: number // For everyone
  totalBalance: number
}

interface EarningsResponse {
  success?: boolean
  data?: EarningsData
  error?: string
}

/**
 * Get earnings breakdown for current user by role
 * Lecturers: Assignment/Test submission revenue
 * Partners: Lecturer referral earnings
 * Students: Bundle commission earnings
 */
export async function getMyEarningsBreakdown(): Promise<EarningsResponse> {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.profile) {
      return { error: 'User not authenticated' }
    }

    const supabase = await createClient()
    const userId = user.id
    const userRole = user.profile.role

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()

    const totalBalance = wallet?.balance || 0

    const earnings: EarningsData = {
      totalBalance,
    }

    // LECTURER: Get submission revenue from assignments/tests
    if (userRole === 'lecturer') {
      const { data: submissions, error: subError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'credit')
        .eq('purpose', 'submission')
        .eq('status', 'completed')

      if (!subError && submissions) {
        earnings.submissionRevenue = submissions.reduce((sum, t) => sum + (t.amount || 0), 0)
      }
    }

    // PARTNER: Get referral earnings from lecturer referrals
    if (userRole === 'partner') {
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!partnerError && partner) {
        const { data: referrals, error: refError } = await supabase
          .from('referrals')
          .select('partner_earnings')
          .eq('partner_id', partner.id)
          .eq('status', 'active')

        if (!refError && referrals) {
          earnings.lecturerReferrals = referrals.reduce(
            (sum, r) => sum + (r.partner_earnings || 0),
            0
          )
        }
      }
    }

    // EVERYONE: Get bundle commission earnings
    const { data: bundleTransactions, error: bundleError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .eq('purpose', 'bundle_commission')
      .eq('status', 'completed')

    if (!bundleError && bundleTransactions) {
      earnings.bundleCommissions = bundleTransactions.reduce(
        (sum, t) => sum + (t.amount || 0),
        0
      )
    }

    return {
      success: true,
      data: earnings,
    }
  } catch (error) {
    console.error('Get earnings breakdown error:', error)
    return { error: 'Failed to fetch earnings breakdown' }
  }
}

/**
 * Get earnings history for a user
 */
export async function getEarningsHistory(
  limit: number = 20,
  offset: number = 0
): Promise<EarningsResponse & { history?: any[] }> {
  try {
    const user = await getCurrentUser()

    if (!user || !user.profile) {
      return { error: 'User not authenticated' }
    }

    const supabase = await createClient()
    const userId = user.id

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { error: error.message }
    }

    return {
      success: true,
      history: transactions || [],
    }
  } catch (error) {
    console.error('Get earnings history error:', error)
    return { error: 'Failed to fetch earnings history' }
  }
}
