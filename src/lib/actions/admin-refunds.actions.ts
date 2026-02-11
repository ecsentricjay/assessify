// lib/actions/admin-refunds.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from './admin-auth.actions'

export interface RefundRequest {
  user_id: string
  transaction_id?: string
  amount: number
  reason: string
  refund_type: 'full' | 'partial'
}

export interface RefundRecord {
  id: string
  user_id: string
  transaction_id: string | null
  amount: number
  reason: string
  refund_type: string
  status: string
  processed_by: string
  created_at: string
  updated_at: string
  user: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  admin: {
    first_name: string
    last_name: string
  }
}

/**
 * Create and process a refund
 */
export async function processRefund(refund: RefundRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    // Verify user exists and get their wallet
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', refund.user_id)
      .single()

    if (userError || !userProfile) throw new Error('User not found')

    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', refund.user_id)
      .single()

    if (walletError || !wallet) throw new Error('Wallet not found')

    // Create refund record first
    const { data: refundRecord, error: refundError } = await supabase
      .from('refunds')
      .insert({
        user_id: refund.user_id,
        transaction_id: refund.transaction_id,
        amount: refund.amount,
        reason: refund.reason,
        refund_type: refund.refund_type,
        status: 'completed',
        processed_by: admin.id
      })
      .select()
      .single()

    if (refundError) throw refundError

    // Calculate new balance
    const balanceBefore = wallet.balance
    const balanceAfter = balanceBefore + refund.amount

    // Create transaction record
    const refundReference = `REFUND-${Date.now()}`
    
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'credit',
        purpose: 'refund',
        amount: refund.amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference: refundReference,
        status: 'completed',
        description: refund.reason,
        metadata: {
          admin_id: admin.id,
          admin_name: `${admin.profile.first_name} ${admin.profile.last_name}`,
          refund_id: refundRecord.id,
          refund_type: refund.refund_type,
          original_transaction_id: refund.transaction_id
        }
      })
      .select()
      .single()

    if (txError) throw txError

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: balanceAfter,
        total_funded: wallet.total_funded + refund.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (updateError) throw updateError

    // Log admin action
    await logAdminAction({
      actionType: 'PROCESS_REFUND',
      targetType: 'refund',
      targetId: refundRecord.id,
      details: {
        user_id: refund.user_id,
        user_name: `${userProfile.first_name} ${userProfile.last_name}`,
        amount: refund.amount,
        reason: refund.reason,
        refund_type: refund.refund_type,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        transaction_id: transaction.id
      }
    })

    return {
      success: true,
      message: `Refund of ₦${refund.amount.toLocaleString()} processed successfully`,
      refundId: refundRecord.id,
      newBalance: balanceAfter
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process refund'
    }
  }
}

/**
 * Get all refunds with filters
 */
export async function getAllRefunds(params?: {
  search?: string
  status?: string
  page?: number
  limit?: number
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    
    const { search = '', status = 'all', page = 1, limit = 20 } = params || {}
    
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('refunds')
      .select(`
        *,
        user:profiles!refunds_user_id_fkey(id, first_name, last_name, role),
        admin:profiles!refunds_processed_by_fkey(first_name, last_name)
      `, { count: 'exact' })

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Search by user name or email (we'll filter this in memory since it's a joined table)
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Filter search results if search term provided
    let filteredData = data
    if (search) {
      filteredData = data?.filter((refund: any) => 
        refund.user?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        refund.user?.last_name?.toLowerCase().includes(search.toLowerCase())
      ) || []
    }

    return {
      success: true,
      refunds: filteredData as unknown as RefundRecord[],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch refunds'
    }
  }
}

/**
 * Get refund statistics
 */
export async function getRefundStatistics() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('amount, status, refund_type, created_at')

    if (error) throw error

    // Calculate statistics
    const totalRefunds = refunds?.length || 0
    const totalAmount = refunds?.reduce((sum, r) => sum + r.amount, 0) || 0
    const completedRefunds = refunds?.filter(r => r.status === 'completed').length || 0
    const pendingRefunds = refunds?.filter(r => r.status === 'pending').length || 0

    // This month's refunds
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)
    
    const thisMonthRefunds = refunds?.filter(r => 
      new Date(r.created_at) >= thisMonthStart
    ) || []
    
    const thisMonthAmount = thisMonthRefunds.reduce((sum, r) => sum + r.amount, 0)

    return {
      success: true,
      statistics: {
        totalRefunds,
        totalAmount,
        completedRefunds,
        pendingRefunds,
        fullRefunds: refunds?.filter(r => r.refund_type === 'full').length || 0,
        partialRefunds: refunds?.filter(r => r.refund_type === 'partial').length || 0,
        thisMonthRefunds: thisMonthRefunds.length,
        thisMonthAmount
      }
    }
  } catch (error) {
    console.error('Error fetching refund statistics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics'
    }
  }
}

/**
 * Search users for refund (to find user_id)
 */
export async function searchUsersForRefund(query: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        wallets(id, balance)
      `)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(10)

    if (error) throw error

    // Format the data to include full_name for easier display
    const formattedData = data?.map(user => ({
      ...user,
      full_name: `${user.first_name} ${user.last_name}`
    }))

    return {
      success: true,
      users: formattedData || []
    }
  } catch (error) {
    console.error('Error searching users:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search users'
    }
  }
}