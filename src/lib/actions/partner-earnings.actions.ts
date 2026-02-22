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
 * ✅ FIXED: Now uses database stats instead of recalculating
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
        id,
        partner_id,
        referred_lecturer_id,
        referral_code,
        status,
        first_submission_at,
        last_submission_at,
        total_submissions,
        total_revenue,
        partner_earnings,
        created_at,
        updated_at,
        lecturer:profiles!referred_lecturer_id (
          id,
          first_name,
          last_name,
          staff_id,
          department,
          faculty,
          phone
        ),
        partner:partners!partner_id (
          id,
          partner_code,
          business_name,
          commission_rate
        )
      `, { count: 'exact' })
      .eq('partner_id', partnerId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Referrals query error:', JSON.stringify(error, null, 2))
      return { error: error.message || 'Failed to fetch referrals' }
    }

    console.log('✅ Referrals raw data:', data?.length, 'referrals found')

    // Enrich referrals with email and submission breakdown
    const enrichedData = await Promise.all(
      (data || []).map(async (referral: any) => {
        try {
          // Get lecturer email from auth.users
          let lecturerEmail = ''
          if (referral.referred_lecturer_id) {
            const { data: authUser } = await supabase.auth.admin.getUserById(
              referral.referred_lecturer_id
            )
            lecturerEmail = authUser?.user?.email || ''
          }

          // Create full_name for display
          const lecturer = referral.lecturer as any
          const lecturerFullName = (lecturer && typeof lecturer === 'object' && !Array.isArray(lecturer))
            ? `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim()
            : 'Unknown'

          // Calculate assignment vs test breakdown
          let assignment_submissions = 0
          let test_submissions = 0
          let assignment_revenue = 0
          let test_revenue = 0
          let assignment_earnings = 0
          let test_earnings = 0

          try {
            // Get all earnings for this referral grouped by source_type
            const { data: earningsData } = await supabase
              .from('partner_earnings')
              .select('source_type, source_amount, amount')
              .eq('referral_id', referral.id)

            if (earningsData) {
              earningsData.forEach((earning: any) => {
                if (earning.source_type === 'assignment_submission') {
                  assignment_submissions += 1
                  assignment_revenue += earning.source_amount || 0
                  assignment_earnings += earning.amount || 0
                } else if (earning.source_type === 'test_submission') {
                  test_submissions += 1
                  test_revenue += earning.source_amount || 0
                  test_earnings += earning.amount || 0
                }
              })
            }
          } catch (earningsErr) {
            console.warn('Could not fetch earnings breakdown for referral:', referral.id, earningsErr)
          }

          // ✅ USE STATS FROM DATABASE (already calculated by trigger)
          console.log(`Referral ${referral.referral_code}: ${referral.total_submissions} submissions, ₦${referral.total_revenue} revenue, ₦${referral.partner_earnings} earnings`)

          return {
            ...referral,
            lecturer: (lecturer && typeof lecturer === 'object' && !Array.isArray(lecturer)) ? {
              ...lecturer,
              full_name: lecturerFullName,
              email: lecturerEmail,
            } : null,
            // Use database values, don't recalculate
            total_submissions: referral.total_submissions || 0,
            total_revenue: Number(referral.total_revenue) || 0,
            partner_earnings: Number(referral.partner_earnings) || 0,
            // Add breakdown fields
            assignment_submissions: assignment_submissions > 0 ? assignment_submissions : null,
            test_submissions: test_submissions > 0 ? test_submissions : null,
            assignment_revenue: assignment_revenue > 0 ? assignment_revenue : null,
            test_revenue: test_revenue > 0 ? test_revenue : null,
            assignment_earnings: assignment_earnings > 0 ? assignment_earnings : null,
            test_earnings: test_earnings > 0 ? test_earnings : null,
          }
        } catch (err) {
          console.error('Error enriching referral data:', err)
          const lecturer = referral.lecturer as any
          const lecturerFullName = (lecturer && typeof lecturer === 'object' && !Array.isArray(lecturer))
            ? `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim()
            : 'Unknown'
          
          return {
            ...referral,
            lecturer: (lecturer && typeof lecturer === 'object' && !Array.isArray(lecturer)) ? {
              ...lecturer,
              full_name: lecturerFullName,
              email: '',
            } : null,
            total_submissions: referral.total_submissions || 0,
            total_revenue: Number(referral.total_revenue) || 0,
            partner_earnings: Number(referral.partner_earnings) || 0,
            assignment_submissions: null,
            test_submissions: null,
            assignment_revenue: null,
            test_revenue: null,
            assignment_earnings: null,
            test_earnings: null,
          }
        }
      })
    )

    console.log('✅ Enriched referrals count:', enrichedData.length)

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
        id,
        partner_id,
        referred_lecturer_id,
        referral_code,
        status,
        first_submission_at,
        last_submission_at,
        total_submissions,
        total_revenue,
        partner_earnings,
        created_at,
        updated_at,
        lecturer:profiles!referred_lecturer_id (
          id,
          first_name,
          last_name,
          staff_id,
          department,
          faculty,
          phone
        ),
        partner:partners!partner_id (
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

    // Add full_name to lecturer and get email
    const lecturer = data.lecturer as any
    if (lecturer && typeof lecturer === 'object' && !Array.isArray(lecturer)) {
      lecturer.full_name = `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim()
      
      // Get email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(data.referred_lecturer_id)
      lecturer.email = authUser?.user?.email || ''
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
        id,
        partner_id,
        referral_id,
        transaction_id,
        amount,
        commission_rate,
        source_amount,
        lecturer_amount,
        source_type,
        source_id,
        submission_id,
        student_id,
        status,
        withdrawn_at,
        withdrawal_id,
        created_at,
        notes,
        referral:referrals!referral_id (
          id,
          referred_lecturer_id,
          referral_code
        ),
        transaction:transactions!transaction_id (
          id,
          reference,
          amount
        ),
        student:profiles!student_id (
          id,
          first_name,
          last_name
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

    // Add full_name to students
    const enrichedData = (data || []).map((earning: any) => {
      const student = earning.student as any
      return {
        ...earning,
        student: (student && typeof student === 'object' && !Array.isArray(student)) ? {
          ...student,
          full_name: `${student.first_name || ''} ${student.last_name || ''}`.trim()
        } : null
      }
    })

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
        id,
        partner_id,
        referral_id,
        transaction_id,
        amount,
        commission_rate,
        source_amount,
        lecturer_amount,
        source_type,
        source_id,
        submission_id,
        student_id,
        status,
        withdrawn_at,
        withdrawal_id,
        created_at,
        notes,
        transaction:transactions!transaction_id (
          id,
          reference,
          amount
        ),
        student:profiles!student_id (
          id,
          first_name,
          last_name
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

    // Add full_name to students
    const enrichedData = (data || []).map((earning: any) => {
      const student = earning.student as any
      return {
        ...earning,
        student: (student && typeof student === 'object' && !Array.isArray(student)) ? {
          ...student,
          full_name: `${student.first_name || ''} ${student.last_name || ''}`.trim()
        } : null
      }
    })

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

  // Default: Lecturer 35%, Platform 65% (no partner)
  let calculation: CommissionCalculation = {
    submissionAmount,
    lecturerAmount: submissionAmount * 0.35,
    partnerAmount: 0,
    platformAmount: submissionAmount * 0.65,
    commissionRate: 0,
  }

  try {
    // Check if lecturer has a partner referral
    const { data: referral } = await supabase
      .from('referrals')
      .select(`
        id,
        partner_id,
        partner:partners!partner_id (
          id,
          commission_rate,
          status
        )
      `)
      .eq('referred_lecturer_id', lecturerId)
      .eq('status', 'active')
      .single()

    // Type handling
    const partner = referral?.partner as any
    if (partner && typeof partner === 'object' && !Array.isArray(partner) && partner.status === 'active') {
      // Has partner: Lecturer 35%, Partner X%, Platform 50% (minus partner commission)
      const commissionRate = partner.commission_rate || 15
      calculation = {
        submissionAmount,
        lecturerAmount: submissionAmount * 0.35,
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
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select(`
        id,
        partner_id,
        partner:partners!partner_id (
          id,
          commission_rate,
          status
        )
      `)
      .eq('referred_lecturer_id', data.lecturerId)
      .eq('status', 'active')
      .single()

    // Type handling
    const partner = referral?.partner as any
    if (referralError || !referral || !partner || partner.status !== 'active') {
      // No active partner, skip earning recording
      return { success: true, data: { hasPartner: false } }
    }

    const commissionRate = partner.commission_rate || 15
    const partnerAmount = Math.round((data.sourceAmount * commissionRate) / 100)

    // Record earning
    const { data: earning, error: earningError } = await supabase
      .from('partner_earnings')
      .insert({
        partner_id: referral.partner_id,
        referral_id: referral.id,
        transaction_id: data.transactionId,
        amount: partnerAmount,
        commission_rate: commissionRate,
        source_amount: data.sourceAmount,
        lecturer_amount: data.lecturerAmount,
        source_type: data.sourceType,
        source_id: data.sourceId,
        submission_id: data.submissionId,
        student_id: data.studentId,
        status: 'pending'
      })
      .select()
      .single()

    if (earningError) {
      console.error('Record partner earning error:', earningError)
      return { error: 'Failed to record partner earning' }
    }

    return { 
      success: true, 
      data: { 
        hasPartner: true,
        earningId: earning.id,
        partnerAmount
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