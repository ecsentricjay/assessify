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
 */
export async function createWithdrawalRequest(
  data: CreateWithdrawalData
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get partner profile
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, pending_earnings, bank_name, account_number, account_name')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      return { error: 'Partner profile not found' }
    }

    // Validate amount
    if (data.amount <= 0) {
      return { error: 'Amount must be greater than 0' }
    }

    if (data.amount > Number(partner.pending_earnings)) {
      return { error: `Insufficient balance. Available: ₦${partner.pending_earnings}` }
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
      })
      .select()
      .single()

    if (withdrawalError || !withdrawal) {
      return { error: 'Failed to create withdrawal request' }
    }

    revalidatePath('/partner/withdrawals')
    revalidatePath('/admin/finances/withdrawals')

    return {
      success: true,
      data: withdrawal,
    }
  } catch (error) {
    console.error('Create withdrawal request error:', error)
    return { error: 'Failed to create withdrawal request' }
  }
}

/**
 * Get all withdrawal requests (Admin)
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

    let query = supabase
      .from('partner_withdrawals')
      .select(`
        *,
        partner:partners (
          id,
          partner_code,
          business_name
        ),
        reviewed_by_profile:profiles!partner_withdrawals_reviewed_by_fkey (
          id,
          full_name
        ),
        paid_by_profile:profiles!partner_withdrawals_paid_by_fkey (
          id,
          full_name
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
    console.error('Get all partner withdrawals error:', error)
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
 */
export async function approvePartnerWithdrawal(
  withdrawalId: string,
  reviewData: ReviewWithdrawalData,
  reviewedBy: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

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

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: reviewedBy,
      action_type: 'approve_partner_withdrawal',
      target_type: 'partner_withdrawal',
      target_id: withdrawalId,
      details: {
        amount: withdrawal.amount,
        partner_id: withdrawal.partner_id,
        notes: reviewData.reviewNotes,
      },
    })

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
 */
export async function rejectPartnerWithdrawal(
  withdrawalId: string,
  reviewData: ReviewWithdrawalData,
  reviewedBy: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

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

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: reviewedBy,
      action_type: 'reject_partner_withdrawal',
      target_type: 'partner_withdrawal',
      target_id: withdrawalId,
      details: {
        amount: withdrawal.amount,
        partner_id: withdrawal.partner_id,
        reason: reviewData.rejectionReason,
      },
    })

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
 */
export async function markPartnerWithdrawalAsPaid(
  withdrawalId: string,
  paymentData: MarkWithdrawalPaidData,
  paidBy: string
): Promise<PartnerActionResponse> {
  try {
    const supabase = await createClient()

    if (!paymentData.paymentReference) {
      return { error: 'Payment reference is required' }
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

    if (withdrawal.status !== 'approved') {
      return { error: 'Only approved withdrawals can be marked as paid' }
    }

    // Process withdrawal using database function
    const { error: processError } = await supabase
      .rpc('process_partner_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_partner_id: withdrawal.partner_id,
        p_amount: Number(withdrawal.amount),
      })

    if (processError) {
      return { error: 'Failed to process withdrawal: ' + processError.message }
    }

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

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: paidBy,
      action_type: 'mark_partner_withdrawal_paid',
      target_type: 'partner_withdrawal',
      target_id: withdrawalId,
      details: {
        amount: withdrawal.amount,
        partner_id: withdrawal.partner_id,
        payment_reference: paymentData.paymentReference,
      },
    })

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