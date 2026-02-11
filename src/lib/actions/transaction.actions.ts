// lib/actions/transaction.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateRevenueSplit } from '@/lib/utils/revenue-split'
import { recordPartnerEarning } from '@/lib/actions/partner-earnings.actions'
import { 
  notifyAssignmentGraded, 
  notifyTestGraded 
} from '@/lib/actions/notification-helpers'

export interface ProcessSubmissionPaymentData {
  studentId: string
  lecturerId: string
  submissionAmount: number
  sourceType: 'assignment_submission' | 'test_submission'
  sourceId: string // Assignment or Test ID
  submissionId: string
  purpose: string // e.g., "Assignment submission fee"
}

export interface ProcessSubmissionPaymentResult {
  success: boolean
  error?: string
  transactionId?: string
  split?: {
    lecturerAmount: number
    partnerAmount: number
    platformAmount: number
  }
}

/**
 * Process payment for assignment/test submission
 * This handles the complete flow:
 * 1. Deduct from student wallet
 * 2. Credit lecturer wallet
 * 3. Calculate and record partner commission (if applicable)
 * 4. Create transaction record
 * 5. Send notifications
 */
export async function processSubmissionPayment(
  data: ProcessSubmissionPaymentData
): Promise<ProcessSubmissionPaymentResult> {
  const supabase = await createClient()

  try {
    // 1. Calculate revenue split
    const split = await calculateRevenueSplit(data.submissionAmount, data.lecturerId)

    // 2. Get student wallet
    const { data: studentWallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', data.studentId)
      .single()

    if (walletError || !studentWallet) {
      return { success: false, error: 'Student wallet not found' }
    }

    // 3. Check if student has sufficient balance
    if (Number(studentWallet.balance) < data.submissionAmount) {
      return { success: false, error: 'Insufficient balance' }
    }

    // 4. Deduct from student wallet
    const { error: deductError } = await supabase
      .from('wallets')
      .update({
        balance: Number(studentWallet.balance) - data.submissionAmount,
      })
      .eq('user_id', data.studentId)

    if (deductError) {
      return { success: false, error: 'Failed to deduct from student wallet' }
    }

    // 5. Credit lecturer wallet
    const { data: lecturerWallet, error: lecturerWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', data.lecturerId)
      .single()

    if (lecturerWalletError) {
      // Rollback student deduction
      await supabase
        .from('wallets')
        .update({ balance: Number(studentWallet.balance) })
        .eq('user_id', data.studentId)
      return { success: false, error: 'Lecturer wallet not found' }
    }

    const { error: creditError } = await supabase
      .from('wallets')
      .update({
        balance: Number(lecturerWallet.balance) + split.lecturerAmount,
      })
      .eq('user_id', data.lecturerId)

    if (creditError) {
      // Rollback student deduction
      await supabase
        .from('wallets')
        .update({ balance: Number(studentWallet.balance) })
        .eq('user_id', data.studentId)
      return { success: false, error: 'Failed to credit lecturer wallet' }
    }

    // 6. Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: data.studentId,
        amount: data.submissionAmount,
        type: 'debit',
        purpose: data.purpose,
        status: 'completed',
        lecturer_id: data.lecturerId,
        partner_id: split.partnerId,
        partner_amount: split.partnerAmount,
        metadata: {
          source_type: data.sourceType,
          source_id: data.sourceId,
          submission_id: data.submissionId,
          lecturer_amount: split.lecturerAmount,
          platform_amount: split.platformAmount,
        },
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      console.error('Failed to create transaction:', transactionError)
      // Note: Money already transferred, log for manual reconciliation
    }

    // 7. Record partner earning (if applicable)
    if (split.hasPartner && split.partnerId && split.referralId && transaction) {
      try {
        await recordPartnerEarning({
          lecturerId: data.lecturerId,
          transactionId: transaction.id,
          sourceAmount: data.submissionAmount,
          lecturerAmount: split.lecturerAmount,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          submissionId: data.submissionId,
          studentId: data.studentId,
        })
      } catch (partnerError) {
        console.error('Failed to record partner earning:', partnerError)
        // Don't fail the transaction, just log
      }
    }

    // 8. Send notifications (optional, non-blocking)
    try {
      // Notify student
      await supabase.from('notifications').insert({
        user_id: data.studentId,
        type: 'payment_deducted',
        title: 'Payment Deducted',
        message: `₦${data.submissionAmount.toLocaleString()} deducted for ${data.sourceType.replace('_', ' ')}`,
        metadata: {
          amount: data.submissionAmount,
          transaction_id: transaction?.id,
        },
      })

      // Notify lecturer
      await supabase.from('notifications').insert({
        user_id: data.lecturerId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `You received ₦${split.lecturerAmount.toLocaleString()} from a submission`,
        metadata: {
          amount: split.lecturerAmount,
          transaction_id: transaction?.id,
        },
      })

      // Notify partner (if applicable)
      if (split.hasPartner && split.partnerId) {
        // Get partner's user_id
        const { data: partner } = await supabase
          .from('partners')
          .select('user_id')
          .eq('id', split.partnerId)
          .single()

        if (partner) {
          await supabase.from('notifications').insert({
            user_id: partner.user_id,
            type: 'commission_earned',
            title: 'Commission Earned',
            message: `You earned ₦${split.partnerAmount.toLocaleString()} commission`,
            metadata: {
              amount: split.partnerAmount,
              transaction_id: transaction?.id,
              commission_rate: split.commissionRate,
            },
          })
        }
      }
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError)
      // Don't fail the transaction
    }

    return {
      success: true,
      transactionId: transaction?.id,
      split: {
        lecturerAmount: split.lecturerAmount,
        partnerAmount: split.partnerAmount,
        platformAmount: split.platformAmount,
      },
    }
  } catch (error) {
    console.error('Process submission payment error:', error)
    return { success: false, error: 'Failed to process payment' }
  }
}

/**
 * Helper function to check if student has sufficient balance
 */
export async function checkStudentBalance(
  studentId: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; currentBalance: number }> {
  const supabase = await createClient()

  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', studentId)
      .single()

    if (error || !wallet) {
      return { sufficient: false, currentBalance: 0 }
    }

    const balance = Number(wallet.balance)
    return {
      sufficient: balance >= requiredAmount,
      currentBalance: balance,
    }
  } catch (error) {
    console.error('Check student balance error:', error)
    return { sufficient: false, currentBalance: 0 }
  }
}