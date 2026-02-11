// lib/actions/admin-transactions.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './admin-auth.actions'

export interface TransactionWithUser {
  id: string
  wallet_id: string
  type: 'credit' | 'debit'
  purpose: string
  amount: number
  balance_before: number
  balance_after: number
  reference: string
  status: string
  description: string | null
  metadata: Record<string, any> | null
  created_at: string
  wallets: {
    user_id: string
    profiles: {
      id: string
      first_name: string
      last_name: string
      role: string
    }
  }
}

export interface TransactionFilters {
  search?: string
  type?: 'all' | 'credit' | 'debit'
  purpose?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

/**
 * Get all transactions with filters
 */
export async function getAllTransactions(filters: TransactionFilters = {}) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    
    const {
      search = '',
      type = 'all',
      purpose = 'all',
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filters

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('transactions')
      .select(`
        *,
        wallets!inner(
          user_id,
          profiles!inner(
            id,
            first_name,
            last_name,
            role
          )
        )
      `, { count: 'exact' })

    // Filter by type
    if (type !== 'all') {
      query = query.eq('type', type)
    }

    // Filter by purpose
    if (purpose !== 'all') {
      query = query.eq('purpose', purpose)
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      query = query.lt('created_at', endDateTime.toISOString())
    }

    // Search by reference
    if (search) {
      query = query.ilike('reference', `%${search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      success: true,
      transactions: data as TransactionWithUser[],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions'
    }
  }
}

/**
 * Get transaction statistics
 */
export async function getTransactionStatistics(filters?: {
  startDate?: string
  endDate?: string
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    let query = supabase
      .from('transactions')
      .select('type, amount, status')

    // Apply date filters
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters?.endDate) {
      const endDateTime = new Date(filters.endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      query = query.lt('created_at', endDateTime.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    // Calculate statistics
    const totalTransactions = data?.length || 0
    const totalCredit = data?.filter(t => t.type === 'credit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0
    const totalDebit = data?.filter(t => t.type === 'debit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0
    const pendingTransactions = data?.filter(t => t.status === 'pending').length || 0

    return {
      success: true,
      statistics: {
        totalTransactions,
        totalCredit,
        totalDebit,
        netFlow: totalCredit - totalDebit,
        pendingTransactions,
        completedTransactions: totalTransactions - pendingTransactions
      }
    }
  } catch (error) {
    console.error('Error fetching transaction statistics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics'
    }
  }
}

/**
 * Get all unique transaction purposes for filtering
 */
export async function getTransactionPurposes() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('transactions')
      .select('purpose')

    if (error) throw error

    // Get unique purposes
    const purposes = [...new Set(data?.map(t => t.purpose) || [])]
      .filter(Boolean)
      .sort()

    return {
      success: true,
      purposes
    }
  } catch (error) {
    console.error('Error fetching transaction purposes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch purposes'
    }
  }
}

/**
 * Export transactions to CSV
 */
export async function exportTransactionsToCSV(filters: TransactionFilters = {}) {
  try {
    await requireAdmin()
    
    // Get all transactions without pagination
    const result = await getAllTransactions({ ...filters, limit: 10000 })

    if (!result.success || !result.transactions) {
      throw new Error('Failed to fetch transactions')
    }

    // Create CSV content
    const headers = ['Date', 'Reference', 'User', 'Type', 'Amount', 'Purpose', 'Status', 'Description']
    const rows = result.transactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.reference,
      `${t.wallets.profiles.first_name} ${t.wallets.profiles.last_name}`,
      t.type,
      t.amount,
      t.purpose,
      t.status,
      t.description || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return {
      success: true,
      csv,
      filename: `transactions_${new Date().toISOString().split('T')[0]}.csv`
    }
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export transactions'
    }
  }
}