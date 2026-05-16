// lib/actions/transaction.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { checkInstitutionalCoverage } from './institution.actions'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { calculateRevenueSplit } from '@/lib/utils/revenue-split'
import { recordPartnerEarning } from '@/lib/actions/partner-earnings.actions'

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

export interface ProcessSubmissionPaymentData {
  studentId: string
  lecturerId: string
  submissionAmount: number
  sourceType: 'assignment_submission' | 'test_submission'
  sourceId: string
  submissionId: string
  purpose: string
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
 */
// ─── ADD THIS IMPORT at the top of transaction.actions.ts ────────────────────
// import { checkInstitutionalCoverage } from './institution.actions'
//
// Then REPLACE the processSubmissionPayment function with this:

export async function processSubmissionPayment(
  data: ProcessSubmissionPaymentData
): Promise<ProcessSubmissionPaymentResult> {
  const supabase = await createClient()
  const adminClient = createServiceClient()

  try {
    console.log('💳 Processing submission payment:', data)

    // ── STEP 0: Check institutional coverage ─────────────────────────────────
    const coverage = await checkInstitutionalCoverage(data.studentId)
    console.log('🏫 Institutional coverage:', coverage)

    if (coverage.hasInstitution) {
      if (coverage.isExpired) {
        // Hard block — license expired
        return {
          success: false,
          error: `Your institution's license has expired. Please contact your institution administrator to renew access.`,
        }
      }

      if (coverage.isCovered) {
        // Institution covers this submission — skip student wallet deduction
        console.log('✅ Submission covered by institution:', coverage.institutionName)

        const lecturerEarning = coverage.lecturerEarning

        // Get lecturer wallet and credit them at the agreed institutional rate
        if (lecturerEarning > 0) {
          const { data: lecturerWallet } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', data.lecturerId)
            .single()

          if (lecturerWallet) {
            const lecturerBalance = Number(lecturerWallet.balance)
            const newLecturerBalance = lecturerBalance + lecturerEarning

            await supabase
              .from('wallets')
              .update({
                balance: newLecturerBalance,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', data.lecturerId)

            // Record lecturer earning transaction
            await adminClient.from('transactions').insert({
              wallet_id: lecturerWallet.id,
              type: 'credit',
              purpose: data.sourceType === 'assignment_submission'
                ? 'assignment_payment'
                : 'test_payment',
              amount: lecturerEarning,
              balance_before: lecturerBalance,
              balance_after: newLecturerBalance,
              reference: `INST-EARN-${data.submissionId.substring(0, 8)}-${Date.now()}`,
              description: `Institutional earning: ${data.purpose}`,
              status: 'completed',
              institution_id: coverage.institutionId,
              metadata: {
                source_type: data.sourceType,
                source_id: data.sourceId,
                submission_id: data.submissionId,
                student_id: data.studentId,
                covered_by: 'institution',
                institution_id: coverage.institutionId,
              },
            })

            console.log('✅ Lecturer credited ₦', lecturerEarning, 'from institution')
          }
        }

        // Record a zero-cost transaction for the student (for audit trail)
        const { data: studentWallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', data.studentId)
          .single()

        if (studentWallet) {
          await adminClient.from('transactions').insert({
            wallet_id: studentWallet.id,
            type: 'debit',
            purpose: data.sourceType === 'assignment_submission'
              ? 'assignment_payment'
              : 'test_payment',
            amount: 0,
            balance_before: Number(studentWallet.balance),
            balance_after: Number(studentWallet.balance),
            reference: `INST-SUB-${data.submissionId.substring(0, 8)}-${Date.now()}`,
            description: `${data.purpose} (covered by ${coverage.institutionName})`,
            status: 'completed',
            institution_id: coverage.institutionId,
            metadata: {
              source_type: data.sourceType,
              source_id: data.sourceId,
              submission_id: data.submissionId,
              covered_by: 'institution',
              institution_id: coverage.institutionId,
            },
          })
        }

        // Notify student
        try {
          await supabase.from('notifications').insert({
            user_id: data.studentId,
            type: 'payment_deducted',
            title: 'Submission Free',
            message: `Your submission was covered by ${coverage.institutionName}`,
            metadata: { covered_by: 'institution', institution_id: coverage.institutionId },
          })
        } catch (notifError) {
          // non-blocking
        }

        return {
          success: true,
          transactionId: undefined,
          split: {
            lecturerAmount: lecturerEarning,
            partnerAmount: 0,
            platformAmount: 0,
          },
        }
      }
    }
    // ── END INSTITUTIONAL CHECK ───────────────────────────────────────────────
    // If we reach here: student has no institution, or institution is on free plan
    // → proceed with normal personal wallet payment flow below

    // 1. Calculate revenue split
    const split = await calculateRevenueSplit(data.submissionAmount, data.lecturerId)
    console.log('💰 Revenue split:', split)

    // 2. Get student wallet
    const { data: studentWallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', data.studentId)
      .single()

    if (walletError || !studentWallet) {
      console.error('❌ Student wallet error:', walletError)
      return { success: false, error: 'Student wallet not found' }
    }

    const studentBalance = Number(studentWallet.balance)
    console.log('💵 Student balance:', studentBalance, 'Required:', data.submissionAmount)

    // 3. Check if student has sufficient balance
    if (studentBalance < data.submissionAmount) {
      return {
        success: false,
        error: `Insufficient balance. Required: ₦${data.submissionAmount}, Available: ₦${studentBalance}`,
      }
    }

    // 4. Deduct from student wallet
    const newStudentBalance = studentBalance - data.submissionAmount
    const { error: deductError } = await supabase
      .from('wallets')
      .update({
        balance: newStudentBalance,
        total_spent: Number(studentWallet.total_spent || 0) + data.submissionAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', data.studentId)

    if (deductError) {
      console.error('❌ Deduct error:', deductError)
      return { success: false, error: 'Failed to deduct from student wallet' }
    }

    console.log('✅ Deducted from student wallet. New balance:', newStudentBalance)

    // 5. Get lecturer wallet
    const { data: lecturerWallet, error: lecturerWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', data.lecturerId)
      .single()

    if (lecturerWalletError || !lecturerWallet) {
      console.error('❌ Lecturer wallet error:', lecturerWalletError)
      await supabase
        .from('wallets')
        .update({
          balance: studentBalance,
          total_spent: Number(studentWallet.total_spent || 0),
        })
        .eq('user_id', data.studentId)
      return { success: false, error: 'Lecturer wallet not found' }
    }

    // 6. Credit lecturer wallet
    const lecturerBalance = Number(lecturerWallet.balance)
    const newLecturerBalance = lecturerBalance + split.lecturerAmount
    const { error: creditError } = await supabase
      .from('wallets')
      .update({
        balance: newLecturerBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', data.lecturerId)

    if (creditError) {
      console.error('❌ Credit error:', creditError)
      await supabase
        .from('wallets')
        .update({
          balance: studentBalance,
          total_spent: Number(studentWallet.total_spent || 0),
        })
        .eq('user_id', data.studentId)
      return { success: false, error: 'Failed to credit lecturer wallet' }
    }

    console.log('✅ Credited lecturer wallet. New balance:', newLecturerBalance)

    // 7. Create student transaction (debit)
    const { data: studentTransaction, error: studentTxError } = await adminClient
      .from('transactions')
      .insert({
        wallet_id: studentWallet.id,
        type: 'debit',
        purpose: data.sourceType === 'assignment_submission' ? 'assignment_payment' : 'test_payment',
        amount: data.submissionAmount,
        balance_before: studentBalance,
        balance_after: newStudentBalance,
        reference: `SUB-${data.submissionId.substring(0, 8)}-${Date.now()}`,
        description: data.purpose,
        status: 'completed',
        lecturer_id: data.lecturerId,
        partner_id: split.partnerId,
        partner_amount: split.partnerAmount,
        metadata: {
          source_type: data.sourceType,
          source_id: data.sourceId,
          submission_id: data.submissionId,
          lecturer_amount: split.lecturerAmount,
          partner_amount: split.partnerAmount,
          platform_amount: split.platformAmount,
        },
      })
      .select()
      .single()

    if (studentTxError) {
      console.error('❌ Failed to create student transaction:', studentTxError)
    } else {
      console.log('✅ Student transaction created:', studentTransaction?.id)
    }

    // 8. Create lecturer transaction (credit)
    const { data: lecturerTransaction, error: lecturerTxError } = await adminClient
      .from('transactions')
      .insert({
        wallet_id: lecturerWallet.id,
        type: 'credit',
        purpose: data.sourceType === 'assignment_submission' ? 'assignment_payment' : 'test_payment',
        amount: split.lecturerAmount,
        balance_before: lecturerBalance,
        balance_after: newLecturerBalance,
        reference: `EARN-${data.submissionId.substring(0, 8)}-${Date.now()}`,
        description: `Earnings from: ${data.purpose}`,
        status: 'completed',
        metadata: {
          source_type: data.sourceType,
          source_id: data.sourceId,
          submission_id: data.submissionId,
          student_id: data.studentId,
        },
      })
      .select()
      .single()

    if (lecturerTxError) {
      console.error('❌ Failed to create lecturer transaction:', lecturerTxError)
    } else {
      console.log('✅ Lecturer transaction created:', lecturerTransaction?.id)
    }

    // 9. Record lecturer_earnings
    try {
      await adminClient.from('lecturer_earnings').insert({
        lecturer_id: data.lecturerId,
        transaction_id: lecturerTransaction?.id || studentTransaction?.id,
        amount: split.lecturerAmount,
        source_type: data.sourceType === 'assignment_submission' ? 'assignment' : 'test',
        source_id: data.sourceId,
        revenue_share_percentage: 50,
        withdrawn: false,
        earned_at: new Date().toISOString(),
      })
    } catch (earningError) {
      console.error('❌ Error creating lecturer earning:', earningError)
    }

    // 10. Record partner earning
    if (split.hasPartner && split.partnerId && studentTransaction) {
      try {
        const { recordPartnerEarning } = await import('./partner-earnings.actions')
        await recordPartnerEarning({
          lecturerId: data.lecturerId,
          transactionId: studentTransaction.id,
          sourceAmount: data.submissionAmount,
          lecturerAmount: split.lecturerAmount,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          submissionId: data.submissionId,
          studentId: data.studentId,
        })
        console.log('✅ Partner earning recorded')
      } catch (partnerError) {
        console.error('Failed to record partner earning:', partnerError)
      }
    }

    // 11. Notifications
    try {
      await supabase.from('notifications').insert({
        user_id: data.studentId,
        type: 'payment_deducted',
        title: 'Payment Deducted',
        message: `₦${data.submissionAmount.toLocaleString()} deducted for ${data.sourceType.replace('_', ' ')}`,
        metadata: { amount: data.submissionAmount, transaction_id: studentTransaction?.id },
      })

      await supabase.from('notifications').insert({
        user_id: data.lecturerId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `You received ₦${split.lecturerAmount.toLocaleString()} from a submission`,
        metadata: { amount: split.lecturerAmount, transaction_id: lecturerTransaction?.id },
      })
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError)
    }

    return {
      success: true,
      transactionId: studentTransaction?.id,
      split: {
        lecturerAmount: split.lecturerAmount,
        partnerAmount: split.partnerAmount,
        platformAmount: split.platformAmount,
      },
    }
  } catch (error) {
    console.error('❌ Process submission payment error:', error)
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

/**
 * Get submission transactions for a lecturer (earnings only)
 */
export async function getUserSubmissionTransactions(userId: string) {
  const supabase = await createClient()

  try {
    console.log('🔍 Fetching transactions for user:', userId)
    
    // Get user's wallet first
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      console.error('❌ Failed to fetch wallet:', walletError)
      return { success: false, error: 'Wallet not found', transactions: [] }
    }

    console.log('✅ Wallet found:', wallet.id, 'Balance:', wallet.balance)

    // First, get ALL transactions to debug
    const { data: allTx, error: allError } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })

    console.log('📊 ALL transactions for wallet:', allTx?.length || 0)
    
    if (allTx && allTx.length > 0) {
      console.log('📋 Sample transactions:', allTx.slice(0, 5).map(t => ({
        id: t.id.substring(0, 8),
        purpose: t.purpose,
        type: t.type,
        amount: t.amount,
        created: new Date(t.created_at).toLocaleString()
      })))
    } else {
      console.warn('⚠️ No transactions found for this wallet!')
      console.log('Wallet ID being queried:', wallet.id)
    }

    // Get filtered transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .in('purpose', ['assignment_payment', 'test_payment'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ Query error:', error)
      return { success: false, error: 'Failed to fetch submission transactions', transactions: [] }
    }

    console.log('✅ Filtered transactions (assignment_payment or test_payment):', transactions?.length || 0)

    return {
      success: true,
      transactions: transactions || [],
    }
  } catch (error) {
    console.error('❌ Exception:', error)
    return { success: false, error: 'Failed to get submission transactions', transactions: [] }
  }
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    type?: 'debit' | 'credit'
    sourceType?: 'assignment_submission' | 'test_submission'
  }
) {
  const supabase = await createClient()
  const limit = options?.limit || 20
  const offset = options?.offset || 0

  try {
    // Get user's wallet first
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!wallet) {
      return { success: false, error: 'Wallet not found', transactions: [] }
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (options?.type) {
      query = query.eq('type', options.type)
    }

    if (options?.sourceType) {
      query = query.eq('metadata->source_type', options.sourceType)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Failed to fetch transaction history:', error)
      return { success: false, error: 'Failed to fetch transaction history', transactions: [] }
    }

    return {
      success: true,
      transactions: transactions || [],
      count: transactions?.length || 0,
    }
  } catch (error) {
    console.error('Get transaction history error:', error)
    return { success: false, error: 'Failed to get transaction history', transactions: [] }
  }
}

/**
 * Get test transactions for a user
 */
export async function getUserTestTransactions(userId: string) {
  const supabase = await createClient()

  try {
    // Get user's wallet first
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      console.error('Failed to fetch wallet:', walletError)
      return { success: false, error: 'Wallet not found', transactions: [] }
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .eq('purpose', 'test_payment')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch test transactions:', error)
      return { success: false, error: 'Failed to fetch test transactions', transactions: [] }
    }

    return {
      success: true,
      transactions: transactions || [],
    }
  } catch (error) {
    console.error('Get test transactions error:', error)
    return { success: false, error: 'Failed to get test transactions', transactions: [] }
  }
}