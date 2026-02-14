// lib/actions/partner-earnings.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  ReferralFilters,
  EarningFilters,
  ReferralListResponse,
  EarningListResponse,
  PartnerActionResponse,
  CommissionCalculation,
} from '@/lib/types/partner.types'

// ============================================
// REFERRAL ACTIONS
// ============================================

/**
 * Get all referrals for a partner
 */
export async function getPartnerReferrals(
  partnerId: string,
  filters: ReferralFilters = {}
): Promise<ReferralListResponse> {
  try {
    const supabase = await createClient()
    const {
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters

    let query = supabase
      .from('referrals')
      .select(`
        *,
        lecturer:profiles!referrals_referred_lecturer_id_fkey (
          id,
          full_name,
          email,
          staff_id,
          department,
          faculty
        ),
        partner:partners (
          id,
          partner_code,
          business_name
        )
      `, { count: 'exact' })
      .eq('partner_id', partnerId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`
        lecturer.full_name.ilike.%${search}%,
        lecturer.email.ilike.%${search}%,
        lecturer.staff_id.ilike.%${search}%
      `)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return { error: error.message }
    }

    // Enrich referrals with submission statistics
    const enrichedData = await Promise.all(
      (data || []).map(async (referral: any) => {
        try {
          // Get submissions count and revenue for this referred lecturer
          const { data: submissionStats } = await supabase
            .from('assignment_submissions')
            .select('cost_deducted', { count: 'exact' })
            .eq('student_id', referral.referred_lecturer_id)

          const submissionCount = submissionStats?.length || 0
          const totalRevenue = (submissionStats || []).reduce((sum: number, sub: any) => sum + (sub.cost_deducted || 0), 0)
          
          // Get partner's commission rate
          const { data: partner } = await supabase
            .from('partners')
            .select('commission_rate')
            .eq('id', partnerId)
            .single()

          const commissionRate = partner?.commission_rate || 15
          const partnerEarnings = Math.round((totalRevenue * commissionRate) / 100)

          return {
            ...referral,
            total_submissions: submissionCount,
            total_revenue: totalRevenue,
            partner_earnings: partnerEarnings,
          }
        } catch (err) {
          console.error('Error enriching referral data:', err)
          return {
            ...referral,
            total_submissions: 0,
            total_revenue: 0,
            partner_earnings: 0,
          }
        }
      })
    )

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: {
        data: enrichedData || [],
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Get partner referrals error:', error)
    return { error: 'Failed to fetch referrals' }
  }
}

/**
 * Get my referrals (for logged-in partner)
 */
export async function getMyReferrals(
  filters: ReferralFilters = {}
): Promise<ReferralListResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get partner ID
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return { error: 'Partner profile not found' }
    }

    return getPartnerReferrals(partner.id, filters)
  } catch (error) {
    console.error('Get my referrals error:', error)
    return { error: 'Failed to fetch referrals' }
  }
}

/**
 * Get referral details by ID
 */
export async function getReferralById(
  referralId: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        lecturer:profiles!referrals_referred_lecturer_id_fkey (
          id,
          full_name,
          email,
          staff_id,
          department,
          faculty,
          phone_number
        ),
        partner:partners (
          id,
          partner_code,
          business_name,
          commission_rate
        )
      `)
      .eq('id', referralId)
      .single()

    if (error || !data) {
      return { error: 'Referral not found' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Get referral by ID error:', error)
    return { error: 'Failed to fetch referral' }
  }
}

// ============================================
// EARNINGS ACTIONS
// ============================================

/**
 * Get partner earnings with filters
 */
export async function getPartnerEarnings(
  partnerId: string,
  filters: EarningFilters = {}
): Promise<EarningListResponse> {
  try {
    const supabase = await createClient()
    const {
      referralId,
      status,
      sourceType,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters

    let query = supabase
      .from('partner_earnings')
      .select(`
        *,
        referral:referrals (
          id,
          referred_lecturer_id,
          referral_code
        ),
        transaction:transactions (
          id,
          reference,
          amount
        ),
        student:profiles!partner_earnings_student_id_fkey (
          id,
          full_name
        )
      `, { count: 'exact' })
      .eq('partner_id', partnerId)

    // Apply filters
    if (referralId) {
      query = query.eq('referral_id', referralId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return { error: error.message }
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Get partner earnings error:', error)
    return { error: 'Failed to fetch earnings' }
  }
}

/**
 * Get my earnings (for logged-in partner)
 */
export async function getMyEarnings(
  filters: EarningFilters = {}
): Promise<EarningListResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get partner ID
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return { error: 'Partner profile not found' }
    }

    return getPartnerEarnings(partner.id, filters)
  } catch (error) {
    console.error('Get my earnings error:', error)
    return { error: 'Failed to fetch earnings' }
  }
}

/**
 * Get earnings by referral
 */
export async function getEarningsByReferral(
  referralId: string,
  filters: EarningFilters = {}
): Promise<EarningListResponse> {
  try {
    const supabase = await createClient()
    const {
      status,
      sourceType,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters

    let query = supabase
      .from('partner_earnings')
      .select(`
        *,
        transaction:transactions (
          id,
          reference,
          amount
        ),
        student:profiles!partner_earnings_student_id_fkey (
          id,
          full_name
        )
      `, { count: 'exact' })
      .eq('referral_id', referralId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return { error: error.message }
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Get earnings by referral error:', error)
    return { error: 'Failed to fetch earnings' }
  }
}

// ============================================
// COMMISSION CALCULATION UTILITIES
// ============================================

/**
 * Calculate commission split for a submission
 */
export async function calculateCommission(
  submissionAmount: number,
  lecturerId: string
): Promise<CommissionCalculation> {
  const supabase = await createClient()

  // Default: Lecturer 50%, Platform 50% (no partner)
  let calculation: CommissionCalculation = {
    submissionAmount,
    lecturerAmount: submissionAmount * 0.5,
    partnerAmount: 0,
    platformAmount: submissionAmount * 0.5,
    commissionRate: 0,
  }

  try {
    // Check if lecturer has a partner
    const { data: partnerInfo } = await supabase
      .rpc('get_partner_by_lecturer', { lecturer_uuid: lecturerId })
      .single() as { data: { partner_status: string; commission_rate: number } | null }

    if (partnerInfo && partnerInfo.partner_status === 'active') {
      // Has partner: Lecturer 50%, Partner 15%, Platform 35%
      const commissionRate = partnerInfo.commission_rate || 15
      calculation = {
        submissionAmount,
        lecturerAmount: submissionAmount * 0.5,
        partnerAmount: submissionAmount * (commissionRate / 100),
        platformAmount: submissionAmount * (0.5 - commissionRate / 100),
        commissionRate,
      }
    }

    return calculation
  } catch (error) {
    console.error('Calculate commission error:', error)
    return calculation
  }
}

/**
 * Record partner earning when submission is made
 * Called from submission processing logic
 */
export async function recordPartnerEarning(data: {
  lecturerId: string
  transactionId: string
  sourceAmount: number
  lecturerAmount: number
  sourceType: 'assignment_submission' | 'test_submission'
  sourceId: string
  submissionId: string
  studentId: string
}): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    // Get partner info for this lecturer
    const { data: partnerInfo, error: partnerError } = await supabase
      .rpc('get_partner_by_lecturer', { lecturer_uuid: data.lecturerId })
      .single() as { data: { partner_id: string; referral_id: string; partner_status: string; commission_rate: number } | null; error: any }

    if (partnerError || !partnerInfo || partnerInfo.partner_status !== 'active') {
      // No active partner, skip earning recording
      return { success: true, data: { hasPartner: false } }
    }

    // Record earning using database function
    const { data: earningId, error: earningError } = await supabase
      .rpc('record_partner_earning', {
        p_partner_id: partnerInfo.partner_id,
        p_referral_id: partnerInfo.referral_id,
        p_transaction_id: data.transactionId,
        p_source_amount: data.sourceAmount,
        p_lecturer_amount: data.lecturerAmount,
        p_commission_rate: partnerInfo.commission_rate,
        p_source_type: data.sourceType,
        p_source_id: data.sourceId,
        p_submission_id: data.submissionId,
        p_student_id: data.studentId,
      })

    if (earningError) {
      console.error('Record partner earning error:', earningError)
      return { error: 'Failed to record partner earning' }
    }

    return { 
      success: true, 
      data: { 
        hasPartner: true,
        earningId,
        partnerAmount: data.sourceAmount * (partnerInfo.commission_rate / 100)
      } 
    }
  } catch (error) {
    console.error('Record partner earning error:', error)
    return { error: 'Failed to record partner earning' }
  }
}

/**
 * Get partner earnings summary
 */
export async function getPartnerEarningsSummary(
  partnerId: string,
  period: 'today' | 'week' | 'month' | 'all' = 'all'
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    let dateFilter = ''
    const now = new Date()

    switch (period) {
      case 'today':
        dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString()
        break
      case 'week':
        dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString()
        break
      case 'month':
        dateFilter = new Date(now.setDate(now.getDate() - 30)).toISOString()
        break
    }

    let query = supabase
      .from('partner_earnings')
      .select('amount, status')
      .eq('partner_id', partnerId)

    if (dateFilter) {
      query = query.gte('created_at', dateFilter)
    }

    const { data, error } = await query

    if (error) {
      return { error: error.message }
    }

    const summary = {
      total: data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
      pending: data?.filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0,
      withdrawn: data?.filter(e => e.status === 'withdrawn')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0,
      count: data?.length || 0,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error('Get earnings summary error:', error)
    return { error: 'Failed to fetch earnings summary' }
  }
}