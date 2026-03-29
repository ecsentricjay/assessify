// lib/actions/lecturer-withdrawals.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateLecturerWithdrawalData {
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
  requestNotes?: string
}

export interface LecturerWithdrawalFilters {
  lecturerId?: string
  status?: 'pending' | 'approved' | 'paid' | 'rejected'
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface WithdrawalResponse {
  success?: boolean
  error?: string
  data?: any
}

export interface WithdrawalListResponse extends WithdrawalResponse {
  data?: {
    data: any[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ============================================
// LECTURER WITHDRAWAL ACTIONS
// ============================================

/**
 * Create withdrawal request (Lecturer self-service)
 * ✅ FIXED: Removed wallet_id lookup from profiles (doesn't exist)
 */
export async function createLecturerWithdrawalRequest(
  data: CreateLecturerWithdrawalData
): Promise<WithdrawalResponse> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    console.log('👤 User ID:', user.id)

    // ✅ FIXED: Just verify user is a lecturer
    const { data: lecturer, error: lecturerError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .eq('role', 'lecturer')
      .single()

    if (lecturerError || !lecturer) {
      console.error('❌ Lecturer verification failed:', lecturerError)
      return { error: 'Lecturer profile not found' }
    }

    console.log('✅ Lecturer verified:', lecturer.id)

    // ✅ FIXED: Get wallet by user_id directly
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      console.error('❌ Wallet fetch failed:', walletError)
      return { error: 'Wallet not found' }
    }

    console.log('💰 Wallet balance:', wallet.balance)

    // Validate amount
    if (data.amount <= 0) {
      return { error: 'Amount must be greater than 0' }
    }

    if (data.amount > Number(wallet.balance)) {
      return { error: `Insufficient balance. Available: ₦${Number(wallet.balance).toLocaleString()}` }
    }

    // Minimum withdrawal amount (e.g., ₦1000)
    const MIN_WITHDRAWAL = 1000
    if (data.amount < MIN_WITHDRAWAL) {
      return { error: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL}` }
    }

    console.log('✅ Validation passed, creating withdrawal...')

    // Create withdrawal request in withdrawal_requests table
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        lecturer_id: user.id,
        amount: data.amount,
        bank_name: data.bankName,
        account_number: data.accountNumber,
        account_name: data.accountName,
        notes: data.requestNotes,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (withdrawalError || !withdrawal) {
      console.error('❌ Insert failed:', withdrawalError)
      return { error: 'Failed to create withdrawal request: ' + (withdrawalError?.message || 'Unknown error') }
    }

    console.log('✅ Withdrawal created:', withdrawal.id)

    revalidatePath('/lecturer/withdrawals')
    revalidatePath('/admin/finances/withdrawals')

    return {
      success: true,
      data: withdrawal,
    }
  } catch (error) {
    console.error('❌ Exception in createLecturerWithdrawalRequest:', error)
    return { error: 'Failed to create withdrawal request' }
  }
}

// PATCH for src/lib/actions/lecturer-withdrawals.actions.ts
// REPLACE the getAllLecturerWithdrawals function with this:

/**
 * Get all withdrawal requests (Admin)
 * ✅ FIXED: Proper profile joining
 */
export async function getAllLecturerWithdrawals(
  filters: LecturerWithdrawalFilters = {}
): Promise<WithdrawalListResponse> {
  try {
    const supabase = await createClient()
    const {
      lecturerId,
      status,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters

    console.log('📊 Fetching lecturer withdrawals with filters:', filters)

    // ✅ FIXED: Simpler query structure
    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        lecturer:profiles!withdrawal_requests_lecturer_id_fkey (
          id,
          first_name,
          last_name
        )
      `, { count: 'exact' })

    // Apply filters
    if (lecturerId) {
      query = query.eq('lecturer_id', lecturerId)
    }

    if (status) {
      query = query.eq('status', status)
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
      console.error('❌ Query error:', error)
      return { error: error.message }
    }

    console.log(`✅ Found ${data?.length || 0} withdrawal requests (total: ${count})`)

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
    console.error('❌ Exception in getAllLecturerWithdrawals:', error)
    return { error: 'Failed to fetch withdrawals' }
  }
}

/**
 * Get my withdrawal requests (Lecturer self-service)
 */
export async function getMyWithdrawals(
  filters: LecturerWithdrawalFilters = {}
): Promise<WithdrawalListResponse> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    return getAllLecturerWithdrawals({ ...filters, lecturerId: user.id })
  } catch (error) {
    console.error('Get my withdrawals error:', error)
    return { error: 'Failed to fetch withdrawals' }
  }
}

/**
 * Get lecturer's pending earnings (using same approach as getWalletSummary)
 */
export async function getLecturerPendingEarnings(lecturerId: string): Promise<WithdrawalResponse> {
  try {
    const supabase = await createClient()

    // Get wallet directly by user_id (same as getWalletSummary)
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', lecturerId)
      .single()

    if (walletError || !wallet) {
      console.error('Wallet fetch error:', walletError)
      return { error: 'Wallet not found' }
    }

    console.log('💰 Lecturer wallet balance:', wallet.balance)

    return {
      success: true,
      data: {
        pendingEarnings: Number(wallet.balance || 0)
      }
    }
  } catch (error) {
    console.error('Get pending earnings error:', error)
    return { error: 'Failed to fetch pending earnings' }
  }
}

/**
 * Get withdrawal statistics
 */
export async function getLecturerWithdrawalStats(
  lecturerId?: string
): Promise<WithdrawalResponse> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('withdrawal_requests')
      .select('amount, status')

    if (lecturerId) {
      query = query.eq('lecturer_id', lecturerId)
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
