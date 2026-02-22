// lib/actions/admin-wallet.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from './admin-auth.actions'

export interface WalletWithUser {
  id: string
  user_id: string
  balance: number
  total_funded: number
  total_spent: number
  created_at: string
  updated_at: string
  profiles: {
    id: string
    first_name: string
    last_name: string
    role: string
    avatar_url: string | null
  } | null
}

/**
 * Manually credit a user's wallet
 */
export async function creditWallet(
  userId: string,
  amount: number,
  reason: string
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    // Get or create wallet
    const res = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    let wallet = res.data
    const walletError = res.error

    if (walletError || !wallet) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()

      if (createError) throw createError
      wallet = newWallet
    }

    const balanceBefore = wallet.balance
    const balanceAfter = balanceBefore + amount

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'credit',
        purpose: 'funding',
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference: `ADMIN-CREDIT-${Date.now()}`,
        description: `Manual credit by admin: ${reason}`,
        status: 'completed',
        metadata: {
          admin_id: admin.id,
          admin_name: `${admin.profile.first_name} ${admin.profile.last_name}`,
          reason: reason
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
        total_funded: wallet.total_funded + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (updateError) throw updateError

    // Log admin action
    await logAdminAction({
      actionType: 'WALLET_CREDIT',
      targetType: 'wallet',
      targetId: wallet.id,
      details: {
        user_id: userId,
        amount,
        reason,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
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
    console.error('Error crediting wallet:', error)
    return {
      success: false,
      error: error?.message || 'Failed to credit wallet'
    }
  }
}

/**
 * Manually debit a user's wallet
 */
export async function debitWallet(
  userId: string,
  amount: number,
  reason: string
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      throw new Error('Wallet not found')
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance')
    }

    const balanceBefore = wallet.balance
    const balanceAfter = balanceBefore - amount

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'debit',
        purpose: 'refund', // Using refund as the purpose for manual deductions
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference: `ADMIN-DEBIT-${Date.now()}`,
        description: `Manual debit by admin: ${reason}`,
        status: 'completed',
        metadata: {
          admin_id: admin.id,
          admin_name: `${admin.profile.first_name} ${admin.profile.last_name}`,
          reason: reason
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
        total_spent: wallet.total_spent + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (updateError) throw updateError

    // Log admin action
    await logAdminAction({
      actionType: 'WALLET_DEBIT',
      targetType: 'wallet',
      targetId: wallet.id,
      details: {
        user_id: userId,
        amount,
        reason,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
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
    console.error('Error debiting wallet:', error)
    return {
      success: false,
      error: error?.message || 'Failed to debit wallet'
    }
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(userId: string, limit = 20) {
  await requireAdmin()
  const supabase = await createClient()

  try {
    // Get wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!wallet) {
      return {
        success: true,
        data: []
      }
    }

    // Get transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: transactions || []
    }
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch transactions',
      data: []
    }
  }
}

// Just replace the getAllWallets function in src/lib/actions/admin-wallet.actions.ts
// with this updated version:

/**
 * Get all wallets with user information
 * ✅ FIXED: Now includes partner earnings
 */
export async function getAllWallets(params?: {
  search?: string
  page?: number
  limit?: number
  role?: string
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    
    const { search = '', page = 1, limit = 20, role } = params || {}
    
    const from = (page - 1) * limit
    const to = from + limit - 1

    const query = supabase
      .from('wallets')
      .select(`
        id,
        user_id,
        balance,
        total_funded,
        total_spent,
        created_at,
        updated_at,
        profiles(
          id,
          first_name,
          last_name,
          role,
          avatar_url
        )
      `, { count: 'exact' })

    const { data, error, count } = await query
      .order('balance', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Filter by search if provided
    let filteredData = data
    if (search && data) {
      filteredData = data.filter((wallet: any) => {
        const profile = Array.isArray(wallet.profiles) ? wallet.profiles[0] : wallet.profiles
        if (!profile) return false
        const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase()
        return fullName.includes(search.toLowerCase())
      })
    }

    // Filter by role if provided
    if (role && role !== 'all' && filteredData) {
      filteredData = filteredData.filter((wallet: any) => {
        const profile = Array.isArray(wallet.profiles) ? wallet.profiles[0] : wallet.profiles
        return profile?.role === role
      })
    }

    // ✅ Transform and enrich with partner earnings
    const transformedWallets: WalletWithUser[] = await Promise.all(
      (filteredData || []).map(async (wallet: any) => {
        const profile = Array.isArray(wallet.profiles) ? wallet.profiles[0] : wallet.profiles
        
        // ✅ For partners, get their earnings
        if (profile?.role === 'partner') {
          const { data: partnerData } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', wallet.user_id)
            .single()

          if (partnerData) {
            const { data: earnings } = await supabase
              .from('partner_earnings')
              .select('amount, status')
              .eq('partner_id', partnerData.id)

            const totalEarned = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0
            const withdrawn = earnings?.filter(e => e.status === 'withdrawn')
              .reduce((sum, e) => sum + e.amount, 0) || 0
            const pending = earnings?.filter(e => e.status === 'pending')
              .reduce((sum, e) => sum + e.amount, 0) || 0

            return {
              ...wallet,
              profiles: profile,
              partner_stats: {
                total_earned: totalEarned,
                withdrawn,
                pending,
                available: pending
              }
            }
          }
        }

        return {
          ...wallet,
          profiles: profile
        }
      })
    )

    // Calculate total balance
    const { data: totalData } = await supabase
      .from('wallets')
      .select('balance')
    
    const totalBalance = totalData?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0

    return {
      success: true,
      wallets: transformedWallets,
      total: search || role ? filteredData.length : (count || 0),
      totalBalance,
      page,
      limit
    }
  } catch (error: any) {
    console.error('Error fetching wallets:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch wallets'
    }
  }
}

/**
 * Get wallet statistics
 */
export async function getWalletStatistics() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Total wallets
    const { count: totalWallets } = await supabase
      .from('wallets')
      .select('*', { count: 'exact', head: true })

    // Total balance
    const { data: wallets } = await supabase
      .from('wallets')
      .select('balance')

    const totalBalance = wallets?.reduce((sum, w) => sum + w.balance, 0) || 0

    // Active wallets (balance > 0)
    const activeWallets = wallets?.filter(w => w.balance > 0).length || 0

    // Average balance
    const averageBalance = totalWallets ? totalBalance / totalWallets : 0

    return {
      success: true,
      statistics: {
        totalWallets: totalWallets || 0,
        totalBalance,
        activeWallets,
        averageBalance,
        emptyWallets: (totalWallets || 0) - activeWallets
      }
    }
  } catch (error: any) {
    console.error('Error fetching wallet statistics:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch statistics'
    }
  }
}