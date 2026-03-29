// lib/actions/student-withdrawals.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/actions/auth.actions'

export interface CreateStudentWithdrawalData {
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
  requestNotes?: string
}

export interface StudentWithdrawalFilters {
  studentId?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
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
// STUDENT WITHDRAWAL ACTIONS
// ============================================

/**
 * Create withdrawal request (Student self-service)
 * Student withdraws from their wallet balance
 */
export async function createStudentWithdrawalRequest(
  data: CreateStudentWithdrawalData
): Promise<WithdrawalResponse> {
  try {
    const supabase = await createClient()

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user is a student
    if (user.profile?.role !== 'student') {
      return { success: false, error: 'Only students can request withdrawals' }
    }

    console.log('👤 Student ID:', user.id)

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      console.error('❌ Wallet fetch failed:', walletError)
      return { success: false, error: 'Wallet not found' }
    }

    console.log('💰 Wallet balance:', wallet.balance)

    // Validate amount
    if (data.amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' }
    }

    const availableBalance = Number(wallet.balance || 0)

    if (data.amount > availableBalance) {
      return { success: false, error: `Insufficient balance. Available: ₦${availableBalance.toLocaleString()}` }
    }

    // Minimum withdrawal amount
    const MIN_WITHDRAWAL = 1000
    if (data.amount < MIN_WITHDRAWAL) {
      return { success: false, error: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL}` }
    }

    // Validate bank details
    if (!data.bankName?.trim()) {
      return { success: false, error: 'Bank name is required' }
    }

    if (!data.accountNumber?.trim() || data.accountNumber.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit account number' }
    }

    if (!data.accountName?.trim()) {
      return { success: false, error: 'Account name is required' }
    }

    console.log('✅ Validation passed, creating withdrawal request...')

    // Create withdrawal request
    // ✅ FIXED: Changed user_id to student_id
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('student_withdrawals')
      .insert({
        student_id: user.id,  // ✅ Changed from user_id
        amount: data.amount,
        bank_name: data.bankName,
        account_number: data.accountNumber,
        account_name: data.accountName,
        status: 'pending',
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error('❌ Withdrawal creation failed:', withdrawalError)
      return { success: false, error: 'Failed to create withdrawal request' }
    }

    console.log('✅ Withdrawal request created:', withdrawal.id)

    // Deduct amount from wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: availableBalance - data.amount })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Wallet update failed:', updateError)
      // Note: In production, you might want to handle this with a transaction
      return { success: false, error: 'Failed to update wallet balance' }
    }

    // Revalidate relevant pages
    revalidatePath('/student/wallet')
    revalidatePath('/student/wallet/withdrawals')

    return {
      success: true,
      data: { withdrawalId: withdrawal.id },
    }
  } catch (error) {
    console.error('❌ Error creating withdrawal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get student's withdrawals
 */
export async function getMyStudentWithdrawals(filters: StudentWithdrawalFilters = {}): Promise<WithdrawalListResponse> {
  try {
    const supabase = await createClient()

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit
    const sortBy = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'

    // Build query
    // ✅ FIXED: Changed user_id to student_id
    let query = supabase
      .from('student_withdrawals')
      .select('*', { count: 'exact' })
      .eq('student_id', user.id)  // ✅ Changed from user_id

    // Apply status filter if provided
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Fetch withdrawals error:', error)
      return { success: false, error: 'Failed to fetch withdrawals' }
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
    console.error('❌ Error fetching withdrawals:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get student's pending withdrawal earnings
 * This represents the amount that can be withdrawn
 */
export async function getStudentAvailableBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const supabase = await createClient()

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get wallet balance (this is what students can withdraw)
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      console.error('❌ Wallet fetch failed:', walletError)
      return { success: false, error: 'Wallet not found' }
    }

    return {
      success: true,
      balance: Number(wallet.balance || 0),
    }
  } catch (error) {
    console.error('❌ Error fetching balance:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get single withdrawal request details
 */
export async function getStudentWithdrawalDetails(withdrawalId: string): Promise<WithdrawalResponse> {
  try {
    const supabase = await createClient()

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // ✅ FIXED: Changed user_id to student_id
    const { data: withdrawal, error } = await supabase
      .from('student_withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .eq('student_id', user.id)  // ✅ Changed from user_id
      .single()

    if (error || !withdrawal) {
      return { success: false, error: 'Withdrawal not found' }
    }

    return {
      success: true,
      data: withdrawal,
    }
  } catch (error) {
    console.error('❌ Error fetching withdrawal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel a pending withdrawal request
 * Returns the amount back to the wallet
 */
export async function cancelStudentWithdrawalRequest(withdrawalId: string): Promise<WithdrawalResponse> {
  try {
    const supabase = await createClient()

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get the withdrawal request
    // ✅ FIXED: Changed user_id to student_id
    const { data: withdrawal, error: fetchError } = await supabase
      .from('student_withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .eq('student_id', user.id)  // ✅ Changed from user_id
      .single()

    if (fetchError || !withdrawal) {
      return { success: false, error: 'Withdrawal not found' }
    }

    // Only allow cancellation of pending requests
    if (withdrawal.status !== 'pending') {
      return { success: false, error: `Cannot cancel ${withdrawal.status} withdrawal requests` }
    }

    // Update withdrawal status
    const { error: updateError } = await supabase
      .from('student_withdrawals')
      .update({ 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', withdrawalId)

    if (updateError) {
      console.error('❌ Update failed:', updateError)
      return { success: false, error: 'Failed to cancel withdrawal' }
    }

    // Return amount to wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ 
          balance: Number(wallet.balance) + Number(withdrawal.amount) 
        })
        .eq('user_id', user.id)
    }

    revalidatePath('/student/wallet')
    revalidatePath('/student/wallet/withdrawals')

    return { success: true, data: { withdrawalId } }
  } catch (error) {
    console.error('❌ Error cancelling withdrawal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}