// lib/actions/admin-financial.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from './admin-auth.actions'

/**
 * Get all withdrawal requests with filters
 */
export async function getWithdrawalRequests({
  status = 'all',
  page = 1,
  limit = 20
}: {
  status?: string
  page?: number
  limit?: number
}) {
  await requireAdmin()
  const supabase = await createClient()

  try {
    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        lecturer:lecturer_id (
          id,
          first_name,
          last_name
        ),
        reviewed_by_admin:reviewed_by (
          first_name,
          last_name
        ),
        paid_by_admin:paid_by (
          first_name,
          last_name
        )
      `, { count: 'exact' })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      success: true,
      data: {
        requests: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  } catch (error: any) {
    console.error('Error fetching withdrawal requests:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch withdrawal requests'
    }
  }
}

/**
 * Approve withdrawal request
 */
export async function approveWithdrawal(
  requestId: string,
  notes?: string
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'approved',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    await logAdminAction({
      actionType: 'WITHDRAWAL_APPROVED',
      targetType: 'withdrawal',
      targetId: requestId,
      details: {
        amount: data.amount,
        lecturer_id: data.lecturer_id,
        notes
      }
    })

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Error approving withdrawal:', error)
    return {
      success: false,
      error: error?.message || 'Failed to approve withdrawal'
    }
  }
}

/**
 * Reject withdrawal request
 */
export async function rejectWithdrawal(
  requestId: string,
  reason: string
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    await logAdminAction({
      actionType: 'WITHDRAWAL_REJECTED',
      targetType: 'withdrawal',
      targetId: requestId,
      details: {
        amount: data.amount,
        lecturer_id: data.lecturer_id,
        reason
      }
    })

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error)
    return {
      success: false,
      error: error?.message || 'Failed to reject withdrawal'
    }
  }
}

/**
 * Mark withdrawal as paid
 */
export async function markWithdrawalAsPaid(
  requestId: string,
  paymentReference: string,
  paymentProofUrl?: string
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'paid',
        paid_by: admin.id,
        paid_at: new Date().toISOString(),
        payment_reference: paymentReference,
        payment_proof_url: paymentProofUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    await logAdminAction({
      actionType: 'WITHDRAWAL_PAID',
      targetType: 'withdrawal',
      targetId: requestId,
      details: {
        amount: data.amount,
        lecturer_id: data.lecturer_id,
        payment_reference: paymentReference
      }
    })

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Error marking withdrawal as paid:', error)
    return {
      success: false,
      error: error?.message || 'Failed to mark as paid'
    }
  }
}

/**
 * Get financial overview statistics
 * ✅ FIXED: Correct revenue calculation
 */
export async function getFinancialOverview() {
  await requireAdmin()
  const supabase = await createClient()

  try {
    // ✅ FIXED: Get all payment transactions (DEBIT = student payments)
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('amount, purpose')
      .in('purpose', ['assignment_payment', 'test_payment', 'ai_assignment'])
      .eq('type', 'debit')
      .eq('status', 'completed')

    // Calculate revenue by source
    const aiRevenue = allTransactions?.filter(tx => tx.purpose === 'ai_assignment')
      .reduce((sum, tx) => sum + tx.amount, 0) || 0
    
    const submissionRevenue = allTransactions?.filter(tx => 
      tx.purpose === 'assignment_payment' || tx.purpose === 'test_payment'
    ).reduce((sum, tx) => sum + tx.amount, 0) || 0

    // Get partner commissions
    const { data: partnerEarnings } = await supabase
      .from('partner_earnings')
      .select('amount')

    const totalPartnerCommission = partnerEarnings?.reduce((sum, e) => sum + e.amount, 0) || 0

    // ✅ CORRECT: Platform gets 100% AI + 50% submissions - partner commission
    const platformRevenue = Math.round(aiRevenue + (submissionRevenue * 0.5) - totalPartnerCommission)

    // Total in all wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('balance')

    const totalWalletBalance = wallets?.reduce((sum, w) => sum + w.balance, 0) || 0

    // Pending withdrawals
    const { data: pendingWithdrawals, count: pendingCount } = await supabase
      .from('withdrawal_requests')
      .select('amount', { count: 'exact' })
      .eq('status', 'pending')

    const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0

    // Approved withdrawals
    const { data: approvedWithdrawals, count: approvedCount } = await supabase
      .from('withdrawal_requests')
      .select('amount', { count: 'exact' })
      .eq('status', 'approved')

    const approvedAmount = approvedWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0

    // Total paid out
    const { data: paidWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('status', 'paid')

    const totalPaidOut = paidWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0

    // Transaction counts
    const { count: creditCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'credit')

    const { count: debitCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'debit')

    return {
      success: true,
      data: {
        platformRevenue,
        totalWalletBalance,
        pendingWithdrawals: {
          count: pendingCount || 0,
          amount: pendingAmount
        },
        approvedWithdrawals: {
          count: approvedCount || 0,
          amount: approvedAmount
        },
        totalPaidOut,
        transactions: {
          credits: creditCount || 0,
          debits: debitCount || 0,
          total: (creditCount || 0) + (debitCount || 0)
        },
        // ✅ Revenue breakdown by source
        revenueBreakdown: {
          aiAssignments: aiRevenue,
          assignmentsAndTests: submissionRevenue,
          partnerCommissions: totalPartnerCommission,
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching financial overview:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch financial overview'
    }
  }
}

/**
 * Process refund to student
 */
export async function processRefund(
  userId: string,
  amount: number,
  reason: string,
  sourceType: 'assignment' | 'test',
  sourceId: string
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      throw new Error('Wallet not found')
    }

    const balanceBefore = wallet.balance
    const balanceAfter = balanceBefore + amount

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'credit',
        purpose: 'refund',
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference: `REFUND-${Date.now()}`,
        description: `Refund: ${reason}`,
        status: 'completed',
        metadata: {
          admin_id: admin.id,
          admin_name: `${admin.profile.first_name} ${admin.profile.last_name}`,
          reason,
          source_type: sourceType,
          source_id: sourceId
        }
      })
      .select()
      .single()

    if (txError) throw txError

    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: balanceAfter,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (updateError) throw updateError

    await logAdminAction({
      actionType: 'REFUND_PROCESSED',
      targetType: 'wallet',
      targetId: wallet.id,
      details: {
        user_id: userId,
        amount,
        reason,
        source_type: sourceType,
        source_id: sourceId,
        transaction_id: transaction.id
      }
    })

    return {
      success: true,
      data: {
        transaction,
        newBalance: balanceAfter
      }
    }
  } catch (error: any) {
    console.error('Error processing refund:', error)
    return {
      success: false,
      error: error?.message || 'Failed to process refund'
    }
  }
}