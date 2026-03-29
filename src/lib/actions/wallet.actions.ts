'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get wallet information for a user
 */
export async function getUserWallet(userId: string) {
  const supabase = await createClient()

  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch wallet:', error)
      return { success: false, error: 'Failed to fetch wallet' }
    }

    return {
      success: true,
      wallet: {
        id: wallet.id,
        userId: wallet.user_id,
        balance: Number(wallet.balance),
        totalSpent: Number(wallet.total_spent || 0),
        totalEarned: Number(wallet.total_earned || 0),
        updatedAt: wallet.updated_at,
      },
    }
  } catch (error) {
    console.error('Get wallet error:', error)
    return { success: false, error: 'Failed to get wallet' }
  }
}

/**
 * Get wallet balance summary for a user
 */
export async function getWalletSummary(userId: string) {
  const supabase = await createClient()

  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return { success: false, error: 'Wallet not found' }
    }

    // Get earnings from transactions using wallet_id
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('wallet_id', wallet.id)
      .eq('type', 'credit')

    if (txError) {
      console.error('Failed to fetch transactions for summary:', txError)
    }

    const totalEarned = transactions
      ? transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
      : 0

    return {
      success: true,
      summary: {
        currentBalance: Number(wallet.balance),
        totalEarned,
        totalSpent: Number(wallet.total_spent || 0),
        lastUpdated: wallet.updated_at,
      },
    }
  } catch (error) {
    console.error('Get wallet summary error:', error)
    return { success: false, error: 'Failed to get wallet summary' }
  }
}
