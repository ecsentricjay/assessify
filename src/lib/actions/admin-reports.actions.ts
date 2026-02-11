// lib/actions/admin-reports.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './admin-auth.actions'

export interface FinancialReport {
  totalRevenue: number
  totalWithdrawals: number
  totalRefunds: number
  netRevenue: number
  platformEarnings: number
  lecturerEarnings: number
  totalTransactions: number
  averageTransactionValue: number
}

export interface UserReport {
  totalUsers: number
  students: number
  lecturers: number
  admins: number
  newUsersThisMonth: number
  activeUsers: number
}

export interface ContentReport {
  totalCourses: number
  totalAssignments: number
  totalTests: number
  totalSubmissions: number
  averageGrade: number
}

export interface RevenueByPeriod {
  date: string
  revenue: number
  transactions: number
}

/**
 * Get comprehensive financial report
 */
export async function getFinancialReport(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { startDate, endDate } = params || {}

    // Build date filter
    let dateFilter = {}
    if (startDate) {
      dateFilter = { ...dateFilter, gte: startDate }
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      dateFilter = { ...dateFilter, lt: endDateTime.toISOString() }
    }

    // Get all transactions
    let txQuery = supabase.from('transactions').select('*')
    
    if (startDate) txQuery = txQuery.gte('created_at', startDate)
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      txQuery = txQuery.lt('created_at', endDateTime.toISOString())
    }

    const { data: transactions } = await txQuery

    // Calculate financial metrics
    const credits = transactions?.filter(t => t.type === 'credit' && t.status === 'completed') || []
    const debits = transactions?.filter(t => t.type === 'debit' && t.status === 'completed') || []

    const totalRevenue = credits.reduce((sum, t) => sum + t.amount, 0)
    const totalWithdrawals = debits.filter(t => t.purpose === 'withdrawal').reduce((sum, t) => sum + t.amount, 0)
    const totalRefunds = credits.filter(t => t.purpose === 'refund').reduce((sum, t) => sum + t.amount, 0)

    // Platform earnings (30% of revenue minus refunds)
    const platformEarnings = (totalRevenue * 0.30) - totalRefunds
    const lecturerEarnings = totalRevenue * 0.70

    const report: FinancialReport = {
      totalRevenue,
      totalWithdrawals,
      totalRefunds,
      netRevenue: totalRevenue - totalWithdrawals - totalRefunds,
      platformEarnings,
      lecturerEarnings,
      totalTransactions: transactions?.length || 0,
      averageTransactionValue: transactions?.length ? totalRevenue / transactions.length : 0
    }

    return {
      success: true,
      report
    }
  } catch (error: any) {
    console.error('Error generating financial report:', error)
    return {
      success: false,
      error: error?.message || 'Failed to generate financial report'
    }
  }
}

/**
 * Get user statistics report
 */
export async function getUserReport() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role, created_at, is_active')

    const totalUsers = profiles?.length || 0
    const students = profiles?.filter(p => p.role === 'student').length || 0
    const lecturers = profiles?.filter(p => p.role === 'lecturer').length || 0
    const admins = profiles?.filter(p => p.role === 'admin').length || 0
    const activeUsers = profiles?.filter(p => p.is_active).length || 0

    // New users this month
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const newUsersThisMonth = profiles?.filter(p => 
      new Date(p.created_at) >= thisMonthStart
    ).length || 0

    const report: UserReport = {
      totalUsers,
      students,
      lecturers,
      admins,
      newUsersThisMonth,
      activeUsers
    }

    return {
      success: true,
      report
    }
  } catch (error: any) {
    console.error('Error generating user report:', error)
    return {
      success: false,
      error: error?.message || 'Failed to generate user report'
    }
  }
}

/**
 * Get content statistics report
 */
export async function getContentReport() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Get counts
    const [coursesRes, assignmentsRes, testsRes, submissionsRes] = await Promise.all([
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('assignments').select('*', { count: 'exact', head: true }),
      supabase.from('tests').select('*', { count: 'exact', head: true }),
      supabase.from('assignment_submissions').select('final_score')
    ])

    // Calculate average grade
    const scores = submissionsRes.data?.filter(s => s.final_score !== null).map(s => s.final_score) || []
    const averageGrade = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0

    const report: ContentReport = {
      totalCourses: coursesRes.count || 0,
      totalAssignments: assignmentsRes.count || 0,
      totalTests: testsRes.count || 0,
      totalSubmissions: submissionsRes.data?.length || 0,
      averageGrade
    }

    return {
      success: true,
      report
    }
  } catch (error: any) {
    console.error('Error generating content report:', error)
    return {
      success: false,
      error: error?.message || 'Failed to generate content report'
    }
  }
}

/**
 * Get revenue by period (for charts)
 */
export async function getRevenueByPeriod(params?: {
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { startDate, endDate, groupBy = 'day' } = params || {}

    let query = supabase
      .from('transactions')
      .select('created_at, amount, type, status')
      .eq('type', 'credit')
      .eq('status', 'completed')

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      query = query.lt('created_at', endDateTime.toISOString())
    }

    const { data: transactions } = await query.order('created_at', { ascending: true })

    if (!transactions || transactions.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // Group transactions by period
    const grouped = new Map<string, { revenue: number; transactions: number }>()

    transactions.forEach(tx => {
      const date = new Date(tx.created_at)
      let key: string

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      const existing = grouped.get(key) || { revenue: 0, transactions: 0 }
      grouped.set(key, {
        revenue: existing.revenue + tx.amount,
        transactions: existing.transactions + 1
      })
    })

    const data: RevenueByPeriod[] = Array.from(grouped.entries()).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      transactions: stats.transactions
    }))

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Error getting revenue by period:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get revenue data'
    }
  }
}

/**
 * Get top lecturers by earnings
 */
export async function getTopLecturers(limit = 10) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: earnings } = await supabase
      .from('lecturer_earnings')
      .select(`
        lecturer_id,
        amount,
        profiles(first_name, last_name, avatar_url)
      `)

    if (!earnings || earnings.length === 0) {
      return {
        success: true,
        lecturers: []
      }
    }

    // Group by lecturer
    const lecturerMap = new Map<string, { name: string; avatar: string | null; total: number }>()

    earnings.forEach((earning: any) => {
      const existing = lecturerMap.get(earning.lecturer_id) || {
        name: `${earning.profiles?.first_name} ${earning.profiles?.last_name}`,
        avatar: earning.profiles?.avatar_url || null,
        total: 0
      }
      lecturerMap.set(earning.lecturer_id, {
        ...existing,
        total: existing.total + earning.amount
      })
    })

    const lecturers = Array.from(lecturerMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)

    return {
      success: true,
      lecturers
    }
  } catch (error: any) {
    console.error('Error getting top lecturers:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get top lecturers'
    }
  }
}

/**
 * Export report to CSV
 */
export async function exportReportToCSV(reportType: 'financial' | 'users' | 'content') {
  try {
    await requireAdmin()

    let csv = ''
    let filename = ''

    if (reportType === 'financial') {
      const result = await getFinancialReport()
      if (!result.success || !result.report) throw new Error('Failed to generate report')

      const headers = ['Metric', 'Value']
      const rows = [
        ['Total Revenue', `₦${result.report.totalRevenue.toLocaleString()}`],
        ['Total Withdrawals', `₦${result.report.totalWithdrawals.toLocaleString()}`],
        ['Total Refunds', `₦${result.report.totalRefunds.toLocaleString()}`],
        ['Net Revenue', `₦${result.report.netRevenue.toLocaleString()}`],
        ['Platform Earnings', `₦${result.report.platformEarnings.toLocaleString()}`],
        ['Lecturer Earnings', `₦${result.report.lecturerEarnings.toLocaleString()}`],
        ['Total Transactions', result.report.totalTransactions.toString()],
        ['Average Transaction Value', `₦${result.report.averageTransactionValue.toLocaleString()}`]
      ]

      csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      filename = `financial_report_${new Date().toISOString().split('T')[0]}.csv`
    }

    return {
      success: true,
      csv,
      filename
    }
  } catch (error: any) {
    console.error('Error exporting report:', error)
    return {
      success: false,
      error: error?.message || 'Failed to export report'
    }
  }
}