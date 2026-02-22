// lib/actions/partner-withdrawals.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  CreateWithdrawalData,
  ReviewWithdrawalData,
  MarkWithdrawalPaidData,
  WithdrawalFilters,
  WithdrawalListResponse,
  PartnerActionResponse,
} from '@/lib/types/partner.types'

// ============================================
// PARTNER WITHDRAWAL ACTIONS
// ============================================

/**
 * Create withdrawal request (Partner self-service)
 * ✅ FIXED: Better error handling and logging
 */
export async function createWithdrawalRequest(
  data: CreateWithdrawalData
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ Not authenticated')
      return { error: 'Not authenticated' }
    }

    console.log('👤 User ID:', user.id)

    // Get partner profile
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, pending_earnings, bank_name, account_number, account_name')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      console.error('❌ Partner fetch failed:', partnerError)
      return { error: 'Partner profile not found' }
    }

    console.log('✅ Partner found:', partner.id)
    console.log('💰 Pending earnings:', partner.pending_earnings)

    // Validate amount
    if (data.amount <= 0) {
      return { error: 'Amount must be greater than 0' }
    }

    const availableBalance = Number(partner.pending_earnings || 0)

    if (data.amount > availableBalance) {
      return { error: `Insufficient balance. Available: ₦${availableBalance.toLocaleString()}` }
    }

    // Minimum withdrawal amount (e.g., ₦1000)
    const MIN_WITHDRAWAL = 1000
    if (data.amount < MIN_WITHDRAWAL) {
      return { error: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL}` }
    }

    // Use provided bank details or fall back to saved details
    const bankName = data.bankName || partner.bank_name
    const accountNumber = data.accountNumber || partner.account_number
    const accountName = data.accountName || partner.account_name

    if (!bankName || !accountNumber || !accountName) {
      return { error: 'Bank details are required. Please update your profile.' }
    }

    console.log('✅ Validation passed, creating withdrawal...')

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('partner_withdrawals')
      .insert({
        partner_id: partner.id,
        amount: data.amount,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        request_notes: data.requestNotes,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single()

    if (withdrawalError || !withdrawal) {
      console.error('❌ Insert failed:', withdrawalError)
      return { error: 'Failed to create withdrawal request: ' + (withdrawalError?.message || 'Unknown error') }
    }

    console.log('✅ Withdrawal created:', withdrawal.id)

    revalidatePath('/partner/withdrawals')
    revalidatePath('/admin/finances/withdrawals')

    return {
      success: true,
      data: withdrawal,
    }
  } catch (error) {
    console.error('❌ Exception in createWithdrawalRequest:', error)
    return { error: 'Failed to create withdrawal request' }
  }
}

/**
 * Get all withdrawal requests (Admin)
 * ✅ FIXED: Proper partner joining
 */
export async function getAllPartnerWithdrawals(
  filters: WithdrawalFilters = {}
): Promise<WithdrawalListResponse> {
  try {
    const supabase = await createClient()
    const {
      partnerId,
      status,
      dateFrom,
      dateTo,
      sortBy = 'requested_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters

    console.log('📊 Fetching partner withdrawals with filters:', filters)

    // ✅ FIXED: Simpler query structure
    let query = supabase
      .from('partner_withdrawals')
      .select(`
        *,
        partner:partners!partner_withdrawals_partner_id_fkey (
          id,
          partner_code,
          business_name
        )
      `, { count: 'exact' })

    // Apply filters
    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('requested_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('requested_at', dateTo)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Query error:', error)
      return { error: error.message }
    }

    console.log(`✅ Found ${data?.length || 0} partner withdrawals (total: ${count})`)

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
    console.error('❌ Exception in getAllPartnerWithdrawals:', error)
    return { error: 'Failed to fetch withdrawals' }
  }
}

/**
 * Get my withdrawal requests (Partner self-service)
 */
export async function getMyWithdrawals(
  filters: WithdrawalFilters = {}
): Promise<WithdrawalListResponse> {
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

    return getAllPartnerWithdrawals({ ...filters, partnerId: partner.id })
  } catch (error) {
    console.error('Get my withdrawals error:', error)
    return { error: 'Failed to fetch withdrawals' }
  }
}

/**
 * Approve withdrawal request (Admin only)
 * ✅ FIXED: Properly gets admin ID from auth
 */
export async function approvePartnerWithdrawal(
  withdrawalId: string,
  reviewData: { reviewNotes?: string }
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin access required' }
    }

    const reviewedBy = user.id

    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('partner_withdrawals')
      .select('*, partner:partners(id, pending_earnings)')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return { error: 'Withdrawal request not found' }
    }

    if (withdrawal.status !== 'pending') {
      return { error: 'Only pending withdrawals can be approved' }
    }

    // Verify partner has sufficient balance
    const partnerData = withdrawal.partner as { id: string; pending_earnings: number | string }
    if (!partnerData || Number(partnerData.pending_earnings) < Number(withdrawal.amount)) {
      return { error: 'Insufficient partner balance' }
    }

    // Update withdrawal status
    const { data: updated, error: updateError } = await supabase
      .from('partner_withdrawals')
      .update({
        status: 'approved',
        review_notes: reviewData.reviewNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError || !updated) {
      return { error: 'Failed to approve withdrawal' }
    }

    revalidatePath('/admin/finances/withdrawals')
    revalidatePath('/partner/withdrawals')

    return { success: true, data: updated }
  } catch (error) {
    console.error('Approve withdrawal error:', error)
    return { error: 'Failed to approve withdrawal' }
  }
}

/**
 * Reject withdrawal request (Admin only)
 * ✅ FIXED: Properly gets admin ID from auth
 */
export async function rejectPartnerWithdrawal(
  withdrawalId: string,
  reviewData: { rejectionReason: string; reviewNotes?: string }
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin access required' }
    }

    const reviewedBy = user.id

    if (!reviewData.rejectionReason) {
      return { error: 'Rejection reason is required' }
    }

    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('partner_withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return { error: 'Withdrawal request not found' }
    }

    if (withdrawal.status !== 'pending') {
      return { error: 'Only pending withdrawals can be rejected' }
    }

    // Update withdrawal status
    const { data: updated, error: updateError } = await supabase
      .from('partner_withdrawals')
      .update({
        status: 'rejected',
        rejection_reason: reviewData.rejectionReason,
        review_notes: reviewData.reviewNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError || !updated) {
      return { error: 'Failed to reject withdrawal' }
    }

    revalidatePath('/admin/finances/withdrawals')
    revalidatePath('/partner/withdrawals')

    return { success: true, data: updated }
  } catch (error) {
    console.error('Reject withdrawal error:', error)
    return { error: 'Failed to reject withdrawal' }
  }
}

/**
 * Mark withdrawal as paid (Admin only)
 * ✅ FIXED: Properly gets admin ID and deducts from partner balance
 */
export async function markPartnerWithdrawalAsPaid(
  withdrawalId: string,
  paymentData: { paymentReference: string }
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin access required' }
    }

    const paidBy = user.id

    if (!paymentData.paymentReference) {
      return { error: 'Payment reference is required' }
    }

    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('partner_withdrawals')
      .select('*, partner:partners(id, pending_earnings)')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return { error: 'Withdrawal request not found' }
    }

    if (withdrawal.status !== 'approved') {
      return { error: 'Only approved withdrawals can be marked as paid' }
    }

    const partnerData = withdrawal.partner as { id: string; pending_earnings: number | string }
    const currentBalance = Number(partnerData.pending_earnings)

    if (currentBalance < Number(withdrawal.amount)) {
      return { error: 'Insufficient partner balance' }
    }

    // Deduct from partner's pending earnings
    const { error: deductError } = await supabase
      .from('partners')
      .update({
        pending_earnings: currentBalance - Number(withdrawal.amount),
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawal.partner_id)

    if (deductError) {
      console.error('Partner balance deduction error:', deductError)
      return { error: 'Failed to deduct from partner balance' }
    }

    // Update partner_earnings records to mark as withdrawn
    await supabase
      .from('partner_earnings')
      .update({ status: 'withdrawn' })
      .eq('partner_id', withdrawal.partner_id)
      .eq('status', 'pending')
      .lte('amount', Number(withdrawal.amount))

    // Update withdrawal status
    const { data: updated, error: updateError } = await supabase
      .from('partner_withdrawals')
      .update({
        status: 'paid',
        payment_reference: paymentData.paymentReference,
        paid_at: new Date().toISOString(),
        paid_by: paidBy,
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError || !updated) {
      return { error: 'Failed to update withdrawal status' }
    }

    revalidatePath('/admin/finances/withdrawals')
    revalidatePath('/partner/withdrawals')

    return { success: true, data: updated }
  } catch (error) {
    console.error('Mark withdrawal as paid error:', error)
    return { error: 'Failed to mark withdrawal as paid' }
  }
}

/**
 * Get withdrawal statistics
 */
export async function getPartnerWithdrawalStats(
  partnerId?: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('partner_withdrawals')
      .select('amount, status')

    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }

    const { data, error } = await query

    if (error) {
      return { error: error.message }
    }

    const stats = {
      total: data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0,
      pending: data?.filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0,
      approved: data?.filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0,
      paid: data?.filter(w => w.status === 'paid')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0,
      rejected: data?.filter(w => w.status === 'rejected')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0,
      count: {
        total: data?.length || 0,
        pending: data?.filter(w => w.status === 'pending').length || 0,
        approved: data?.filter(w => w.status === 'approved').length || 0,
        paid: data?.filter(w => w.status === 'paid').length || 0,
        rejected: data?.filter(w => w.status === 'rejected').length || 0,
      },
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Get withdrawal stats error:', error)
    return { error: 'Failed to fetch withdrawal statistics' }
  }
}