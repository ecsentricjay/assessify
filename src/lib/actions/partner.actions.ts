// lib/actions/partner.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { sendPartnerCredentialsEmail } from './email.actions'
import {
  CreatePartnerData,
  UpdatePartnerData,
  PartnerFilters,
  PartnerWithStats,
  PartnerWithProfile,
  CreatePartnerResponse,
  PartnerListResponse,
  PartnerActionResponse,
  PartnerOverview,
  PartnerStatistics,
} from '@/lib/types/partner.types'

// Create service client for admin operations
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

// Helper function to generate random password
function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// ============================================
// ADMIN ACTIONS - Partner Management
// ============================================

/**
 * Create a new partner (Admin only) - NEW IMPLEMENTATION
 * Creates a new user account with partner role
 */
export async function createPartner(
  data: CreatePartnerData,
  createdBy: string
): Promise<CreatePartnerResponse> {
  try {
    const adminClient = createServiceClient()

    // Check if email already exists
    const { data: existingAuth } = await adminClient.auth.admin.listUsers()
    const emailExists = existingAuth.users.some(user => user.email === data.email)
    
    if (emailExists) {
      return { error: 'A user with this email already exists' }
    }

    // Generate temporary password
    const temporaryPassword = generateRandomPassword(12)

    // Create auth user with service role key (bypasses email confirmation)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'partner',
      },
    })

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError)
      return { error: 'Failed to create user account: ' + authError?.message }
    }

    const userId = authData.user.id

    // Create profile (email is in auth.users, not profiles)
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        role: 'partner',
        is_active: true,
        email_verified: true,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Rollback: Delete auth user
      await adminClient.auth.admin.deleteUser(userId)
      return { error: 'Failed to create user profile: ' + profileError.message }
    }

    // Generate unique partner code
    const { data: partnerCode, error: codeError } = await adminClient
      .rpc('generate_partner_code')

    if (codeError || !partnerCode) {
      // Rollback
      await adminClient.auth.admin.deleteUser(userId)
      return { error: 'Failed to generate partner code' }
    }

    // Create partner record
    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .insert({
        user_id: userId,
        partner_code: partnerCode,
        business_name: data.businessName,
        phone_number: data.phone,
        commission_rate: data.commissionRate || 15.00,
        bank_name: data.bankName,
        account_number: data.accountNumber,
        account_name: data.accountName,
        notes: data.notes,
        created_by: createdBy,
        status: 'active',
      })
      .select()
      .single()

    if (partnerError || !partner) {
      console.error('Partner creation error:', partnerError)
      // Rollback
      await adminClient.auth.admin.deleteUser(userId)
      return { error: 'Failed to create partner record: ' + partnerError?.message }
    }

    // Log admin action
    await adminClient.from('admin_actions').insert({
      admin_id: createdBy,
      action_type: 'create_partner',
      target_type: 'partner',
      target_id: partner.id,
      details: {
        partner_code: partnerCode,
        business_name: data.businessName,
        user_id: userId,
        email: data.email,
      },
    })

    // Send partner credentials email
    try {
      await sendPartnerCredentialsEmail(
        data.email,
        data.firstName,
        data.lastName,
        temporaryPassword,
        partnerCode as string
      )
    } catch (emailError) {
      console.error('Failed to send partner credentials email:', emailError)
      // Don't fail the partner creation if email fails
    }

    revalidatePath('/admin/partners')

    return {
      success: true,
      data: {
        partner,
        partnerCode: partnerCode as string,
        temporaryPassword,
        email: data.email,
      },
    }
  } catch (error) {
    console.error('Create partner error:', error)
    return { error: 'Failed to create partner' }
  }
}

/**
 * Get all partners with filters and pagination
 */
export async function getAllPartners(
  filters: PartnerFilters = {}
): Promise<PartnerListResponse> {
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
      .from('partners')
      .select(`
        *,
        profiles:profiles!partners_user_id_fkey (
          id,
          first_name,
          last_name,
          phone
        )
      `, { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`
        partner_code.ilike.%${search}%,
        business_name.ilike.%${search}%
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

    // Get statistics for each partner and their emails
    const adminClient = createServiceClient()
    const { data: { users } } = await adminClient.auth.admin.listUsers()
    
    const partnersWithStats: PartnerWithStats[] = await Promise.all(
      (data || []).map(async (partner) => {
        // Add email to profiles
        const user = users.find(u => u.id === partner.user_id)
        if (user?.email && partner.profiles) {
          partner.profiles.email = user.email
        }

        // Get statistics
        const { data: stats } = await adminClient
          .rpc('get_partner_statistics', { partner_uuid: partner.id })
          .single()

        return {
          ...partner,
          stats: stats || undefined,
        }
      })
    )

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: {
        data: partnersWithStats,
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Get all partners error:', error)
    return { error: 'Failed to fetch partners' }
  }
}

/**
 * Get single partner by ID
 */
export async function getPartnerById(
  partnerId: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    const { data: partner, error } = await supabase
      .from('partners')
      .select(`
        *,
        profiles:profiles!partners_user_id_fkey (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', partnerId)
      .single()

    if (error || !partner) {
      return { error: 'Partner not found' }
    }

    // Get partner's email from auth.users using service role
    try {
      const adminClient = createServiceClient()
      const { data: { users } } = await adminClient.auth.admin.listUsers()
      const user = users.find(u => u.id === partner.user_id)
      if (user?.email && partner.profiles) {
        partner.profiles.email = user.email
      }
    } catch (emailErr) {
      console.warn('Could not fetch email from auth:', emailErr)
    }

    // Get statistics
    let stats: any = undefined
    try {
      const adminClient = createServiceClient()
      const { data: statsData, error: statsError } = await adminClient
        .rpc('get_partner_statistics', { partner_uuid: partnerId })
        .single()
      
      if (!statsError && statsData) {
        stats = statsData
      }
    } catch (statsErr) {
      console.warn('Could not fetch partner statistics:', statsErr)
    }

    return {
      success: true,
      data: {
        ...partner,
        stats: stats || undefined,
      },
    }
  } catch (error) {
    console.error('Get partner by ID error:', error)
    return { error: 'Failed to fetch partner' }
  }
}

/**
 * Update partner details (Admin only)
 */
export async function updatePartner(
  partnerId: string,
  data: UpdatePartnerData,
  updatedBy: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    const { data: partner, error } = await supabase
      .from('partners')
      .update({
        business_name: data.businessName,
        phone_number: data.phoneNumber,
        commission_rate: data.commissionRate,
        status: data.status,
        bank_name: data.bankName,
        account_number: data.accountNumber,
        account_name: data.accountName,
        notes: data.notes,
      })
      .eq('id', partnerId)
      .select()
      .single()

    if (error || !partner) {
      return { error: 'Failed to update partner' }
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: updatedBy,
      action_type: 'update_partner',
      target_type: 'partner',
      target_id: partnerId,
      details: data,
    })

    revalidatePath('/admin/partners')
    revalidatePath(`/admin/partners/${partnerId}`)

    return { success: true, data: partner }
  } catch (error) {
    console.error('Update partner error:', error)
    return { error: 'Failed to update partner' }
  }
}

/**
 * Update partner status (Admin only)
 */
export async function updatePartnerStatus(
  partnerId: string,
  status: 'active' | 'inactive' | 'suspended',
  updatedBy: string,
  reason?: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    const { data: partner, error } = await supabase
      .from('partners')
      .update({ status })
      .eq('id', partnerId)
      .select()
      .single()

    if (error || !partner) {
      return { error: 'Failed to update partner status' }
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: updatedBy,
      action_type: 'update_partner_status',
      target_type: 'partner',
      target_id: partnerId,
      details: { status, reason },
    })

    revalidatePath('/admin/partners')
    revalidatePath(`/admin/partners/${partnerId}`)

    return { success: true, data: partner }
  } catch (error) {
    console.error('Update partner status error:', error)
    return { error: 'Failed to update partner status' }
  }
}

/**
 * Update partner commission rate (Admin only)
 */
export async function updateCommissionRate(
  partnerId: string,
  commissionRate: number,
  updatedBy: string,
  reason?: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    // Validate commission rate
    if (commissionRate < 0 || commissionRate > 100) {
      return { error: 'Commission rate must be between 0 and 100' }
    }

    const { data: partner, error } = await supabase
      .from('partners')
      .update({ commission_rate: commissionRate })
      .eq('id', partnerId)
      .select()
      .single()

    if (error || !partner) {
      return { error: 'Failed to update commission rate' }
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: updatedBy,
      action_type: 'update_commission_rate',
      target_type: 'partner',
      target_id: partnerId,
      details: { commission_rate: commissionRate, reason },
    })

    revalidatePath('/admin/partners')
    revalidatePath(`/admin/partners/${partnerId}`)

    return { success: true, data: partner }
  } catch (error) {
    console.error('Update commission rate error:', error)
    return { error: 'Failed to update commission rate' }
  }
}

// ============================================
// PARTNER ACTIONS - Partner Self-Service
// ============================================

/**
 * Get partner profile for logged-in partner
 */
export async function getMyPartnerProfile(): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: partner, error } = await supabase
      .from('partners')
      .select(`
        *,
        profiles:profiles!partners_user_id_fkey (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (error || !partner) {
      return { error: 'Partner profile not found' }
    }

    // Get statistics
    let stats: any = undefined
    try {
      const adminClient = createServiceClient()
      const { data: statsData, error: statsError } = await adminClient
        .rpc('get_partner_statistics', { partner_uuid: partner.id })
        .single()
      
      if (!statsError && statsData) {
        stats = statsData
      }
    } catch (statsErr) {
      console.warn('Could not fetch partner statistics:', statsErr)
    }

    return {
      success: true,
      data: {
        ...partner,
        stats: stats || undefined,
      },
    }
  } catch (error) {
    console.error('Get my partner profile error:', error)
    return { error: 'Failed to fetch partner profile' }
  }
}

/**
 * Get partner overview/dashboard data
 */
export async function getPartnerOverview(
  partnerId: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = createServiceClient()

    // Get partner with profile
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select(`
        *,
        profiles!partners_user_id_fkey (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerError || 'No partner data')
      return { error: 'Partner not found' }
    }

    // Get partner's email from auth.users using service role
    let partnerEmail = ''
    try {
      const { data: { users } } = await adminClient.auth.admin.listUsers()
      const user = users.find(u => u.id === partner.user_id)
      if (user?.email) {
        partnerEmail = user.email
        // Add email to profiles object
        if (partner.profiles) {
          partner.profiles.email = partnerEmail
        }
      }
    } catch (emailErr) {
      console.warn('Could not fetch email from auth:', emailErr)
    }

    // Get statistics
    let statistics: PartnerStatistics | null = null
    try {
      const { data: statsData, error: statsError } = await adminClient
        .rpc('get_partner_statistics', { partner_uuid: partnerId })
        .single()
      
      if (!statsError && statsData) {
        statistics = statsData as PartnerStatistics
      }
    } catch (statsErr) {
      console.warn('Could not fetch partner statistics:', statsErr)
    }

    const defaultStatistics: PartnerStatistics = {
      total_referrals: 0,
      active_referrals: 0,
      total_submissions: 0,
      total_revenue: 0,
      total_earnings: 0,
      pending_earnings: 0,
      total_withdrawn: 0,
      avg_earnings_per_referral: 0,
    }

    // Get recent earnings (last 10)
    const { data: recentEarnings } = await supabase
      .from('partner_earnings')
      .select(`
        *,
        referral:referrals (
          id,
          referred_lecturer_id,
          referral_code
        ),
        student:profiles!partner_earnings_student_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Enrich earnings with student full names
    const enrichedEarnings = (recentEarnings || []).map((earning: any) => {
      const student = earning.student
      return {
        ...earning,
        student: student ? {
          id: student.id,
          full_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student',
        } : null
      }
    })

    // Get recent referrals (last 5) with FIXED full_name computation
    const { data: recentReferrals } = await supabase
      .from('referrals')
      .select(`
        id,
        partner_id,
        referred_lecturer_id,
        referral_code,
        status,
        total_submissions,
        partner_earnings,
        created_at,
        updated_at,
        lecturer:profiles!referred_lecturer_id (
          id,
          first_name,
          last_name,
          staff_id,
          department,
          faculty
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(5)

    // FIXED: Enrich referrals with proper full_name, email, and submission breakdown
    const enrichedReferrals = await Promise.all(
      (recentReferrals || []).map(async (ref: any) => {
        const lecturer = ref.lecturer
        
        // Get lecturer email from auth.users
        let lecturerEmail = ''
        if (ref.referred_lecturer_id) {
          try {
            const { data: authUser } = await adminClient.auth.admin.getUserById(
              ref.referred_lecturer_id
            )
            lecturerEmail = authUser?.user?.email || ''
          } catch (err) {
            console.warn('Could not fetch lecturer email:', err)
          }
        }

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
            .eq('referral_id', ref.id)

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
          console.warn('Could not fetch earnings breakdown for referral:', earningsErr)
        }

        return {
          ...ref,
          assignment_submissions: assignment_submissions > 0 ? assignment_submissions : null,
          test_submissions: test_submissions > 0 ? test_submissions : null,
          assignment_revenue: assignment_revenue > 0 ? assignment_revenue : null,
          test_revenue: test_revenue > 0 ? test_revenue : null,
          assignment_earnings: assignment_earnings > 0 ? assignment_earnings : null,
          test_earnings: test_earnings > 0 ? test_earnings : null,
          lecturer: lecturer ? {
            id: lecturer.id,
            full_name: `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim() || 'Unknown Lecturer',
            email: lecturerEmail,
            staff_id: lecturer.staff_id,
            department: lecturer.department,
            faculty: lecturer.faculty,
          } : null
        }
      })
    )

    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('partner_withdrawals')
      .select('*')
      .eq('partner_id', partnerId)
      .in('status', ['pending', 'approved'])
      .order('requested_at', { ascending: false })

    // For dashboard display: calculate aggregated assignment/test stats from ALL referrals
    let all_assignment_submissions = 0
    let all_test_submissions = 0
    let all_assignment_revenue = 0
    let all_test_revenue = 0
    let all_assignment_earnings = 0
    let all_test_earnings = 0

    try {
      // Get all earnings grouped by source_type for this partner
      const { data: allEarningsData } = await supabase
        .from('partner_earnings')
        .select('source_type, source_amount, amount')
        .eq('partner_id', partnerId)

      if (allEarningsData) {
        allEarningsData.forEach((earning: any) => {
          if (earning.source_type === 'assignment_submission') {
            all_assignment_submissions += 1
            all_assignment_revenue += earning.source_amount || 0
            all_assignment_earnings += earning.amount || 0
          } else if (earning.source_type === 'test_submission') {
            all_test_submissions += 1
            all_test_revenue += earning.source_amount || 0
            all_test_earnings += earning.amount || 0
          }
        })
      }
    } catch (allEarningsErr) {
      console.warn('Could not fetch aggregated earnings:', allEarningsErr)
    }

    const overview: PartnerOverview = {
      partner: partner as PartnerWithProfile,
      statistics: statistics || defaultStatistics,
      recent_earnings: enrichedEarnings || [],
      recent_referrals: enrichedReferrals || [],
      pending_withdrawals: pendingWithdrawals || [],
      // Add aggregated breakdown stats for dashboard
      aggregated_stats: {
        all_assignment_submissions,
        all_test_submissions,
        all_assignment_revenue,
        all_test_revenue,
        all_assignment_earnings,
        all_test_earnings,
      }
    }

    return { success: true, data: overview }
  } catch (error) {
    console.error('Get partner overview error:', error)
    return { error: 'Failed to fetch partner overview' }
  }
}

/**
 * Update partner bank details (Partner self-service)
 */
export async function updateMyBankDetails(
  data: {
    bankName: string
    accountNumber: string
    accountName: string
  }
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: partner, error } = await supabase
      .from('partners')
      .update({
        bank_name: data.bankName,
        account_number: data.accountNumber,
        account_name: data.accountName,
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !partner) {
      return { error: 'Failed to update bank details' }
    }

    revalidatePath('/partner/profile')

    return { success: true, data: partner }
  } catch (error) {
    console.error('Update bank details error:', error)
    return { error: 'Failed to update bank details' }
  }
}