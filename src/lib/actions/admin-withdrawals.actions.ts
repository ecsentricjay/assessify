// src/lib/actions/admin-withdrawals.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return user.id
}

interface ReviewData {
  reviewNotes?: string
  rejectionReason?: string
}

interface PaymentData {
  paymentReference: string
}

export async function approveLecturerWithdrawal(
  withdrawalId: string,
  reviewData: ReviewData
) {
  try {
    const adminId = await requireAdmin()
    const supabase = createServiceClient()

    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*, lecturer:lecturer_id(id)')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return { error: 'Withdrawal request not found' }
    }

    if (withdrawal.status !== 'pending') {
      return { error: 'Only pending withdrawals can be approved' }
    }

    // Update withdrawal status
    const { data: updated, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'approved',
        review_notes: reviewData.reviewNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return { error: 'Failed to approve withdrawal' }
    }

    // TODO: Send notification to lecturer

    revalidatePath('/admin/finances/withdrawals')
    revalidatePath('/lecturer/withdrawals')

    return { success: true, data: updated }
  } catch (error) {
    console.error('Approve withdrawal error:', error)
    return { error: error instanceof Error ? error.message : 'Failed to approve withdrawal' }
  }
}

export async function rejectLecturerWithdrawal(
  withdrawalId: string,
  reviewData: ReviewData
) {
  try {
    const adminId = await requireAdmin()
    const supabase = createServiceClient()

    if (!reviewData.rejectionReason) {
      return { error: 'Rejection reason is required' }
    }

    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
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
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        rejection_reason: reviewData.rejectionReason,
        review_notes: reviewData.reviewNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return { error: 'Failed to reject withdrawal' }
    }

    // TODO: Send notification to lecturer with rejection reason

    revalidatePath('/admin/finances/withdrawals')
    revalidatePath('/lecturer/withdrawals')

    return { success: true, data: updated }
  } catch (error) {
    console.error('Reject withdrawal error:', error)
    return { error: error instanceof Error ? error.message : 'Failed to reject withdrawal' }
  }
}

export async function markLecturerWithdrawalAsPaid(
  withdrawalId: string,
  paymentData: PaymentData
) {
  try {
    const adminId = await requireAdmin()
    const supabase = createServiceClient()

    if (!paymentData.paymentReference) {
      return { error: 'Payment reference is required' }
    }

    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return { error: 'Withdrawal request not found' }
    }

    if (withdrawal.status !== 'approved') {
      return { error: 'Only approved withdrawals can be marked as paid' }
    }

    // Deduct from lecturer's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', withdrawal.lecturer_id)
      .single()

    if (walletError || !wallet) {
      return { error: 'Lecturer wallet not found' }
    }

    if (Number(wallet.balance) < Number(withdrawal.amount)) {
      return { error: 'Insufficient wallet balance' }
    }

    // Deduct from wallet
    const { error: deductError } = await supabase
      .from('wallets')
      .update({
        balance: Number(wallet.balance) - Number(withdrawal.amount),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', withdrawal.lecturer_id)

    if (deductError) {
      console.error('Wallet deduction error:', deductError)
      return { error: 'Failed to deduct from wallet' }
    }

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: withdrawal.lecturer_id,
        type: 'debit',
        amount: Number(withdrawal.amount),
        purpose: 'withdrawal',
        status: 'completed',
        metadata: {
          withdrawal_id: withdrawalId,
          payment_reference: paymentData.paymentReference,
          bank_name: withdrawal.bank_name,
          account_number: withdrawal.account_number
        }
      })

    // Update withdrawal status
    const { data: updated, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'paid',
        payment_reference: paymentData.paymentReference,
        paid_at: new Date().toISOString(),
        paid_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return { error: 'Failed to update withdrawal status' }
    }

    // TODO: Send notification to lecturer

    revalidatePath('/admin/finances/withdrawals')
    revalidatePath('/lecturer/withdrawals')

    return { success: true, data: updated }
  } catch (error) {
    console.error('Mark as paid error:', error)
    return { error: error instanceof Error ? error.message : 'Failed to mark as paid' }
  }
}