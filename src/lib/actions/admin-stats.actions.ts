// lib/actions/admin-stats.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './admin-auth.actions'

/**
 * Get platform-wide statistics for admin dashboard
 */
export async function getPlatformStats() {
  await requireAdmin() // Ensure user is admin
  
  const supabase = await createClient()

  try {
    // Get user counts by role
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    const userStats = {
      total: profiles?.length || 0,
      students: profiles?.filter(p => p.role === 'student').length || 0,
      lecturers: profiles?.filter(p => p.role === 'lecturer').length || 0,
      admins: profiles?.filter(p => p.role === 'admin').length || 0,
      partners: profiles?.filter(p => p.role === 'partner').length || 0,
    }

    // Get course count
    const { count: courseCount, error: courseError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })

    if (courseError) {
      console.error('Error fetching courses:', courseError)
    }

    // Get assignment count
    const { count: assignmentCount, error: assignmentError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })

    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError)
    }

    // Get test count
    const { count: testCount, error: testError } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true })

    if (testError) {
      console.error('Error fetching tests:', testError)
    }

    // Get total wallet balance
    const { data: wallets, error: walletError } = await supabase
      .from('wallets')
      .select('balance')

    if (walletError) {
      console.error('Error fetching wallets:', walletError)
    }

    const totalBalance = wallets?.reduce((sum, wallet) => sum + (wallet.balance || 0), 0) || 0

    // Get total transactions
    const { count: transactionCount, error: transactionError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError)
    }

    // Calculate platform revenue (27% of assignment and test payments)
    const { data: paymentTransactions, error: paymentError } = await supabase
      .from('transactions')
      .select('amount')
      .in('purpose', ['assignment_payment', 'test_payment'])

    if (paymentError) {
      console.error('Error fetching payment transactions:', paymentError)
    }

    // Platform gets 27% of payments
    const totalPayments = paymentTransactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0
    const platformRevenue = Math.round(totalPayments * 0.27)

    // Get enrollments count (correct table name: course_enrollments)
    const { count: enrollmentCount, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
    }

    return {
      success: true,
      data: {
        users: userStats,
        courses: courseCount || 0,
        assignments: assignmentCount || 0,
        tests: testCount || 0,
        enrollments: enrollmentCount || 0,
        totalWalletBalance: totalBalance,
        platformRevenue: platformRevenue,
        totalTransactions: transactionCount || 0,
      }
    }
  } catch (error: any) {
    console.error('Error fetching platform stats:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code
    })
    return {
      success: false,
      error: error?.message || 'Failed to fetch platform statistics'
    }
  }
}

/**
 * Get recent activity across the platform
 */
export async function getRecentActivity(limit = 10) {
  await requireAdmin()
  
  const supabase = await createClient()

  try {
    const activities: Array<{
      type: 'user_signup' | 'course_created' | 'transaction'
      title: string
      description: string
      timestamp: string
      id: string
    }> = []

    // Get recent user signups - use first_name + last_name
    const { data: recentUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.error('Error fetching recent users:', {
        message: usersError.message,
        details: usersError.details,
        hint: usersError.hint
      })
    } else if (recentUsers) {
      activities.push(...recentUsers.map(u => ({
        type: 'user_signup' as const,
        title: `${u.first_name || ''} ${u.last_name || 'User'} joined as ${u.role}`,
        description: `New ${u.role} account`,
        timestamp: u.created_at,
        id: u.id
      })))
    }

    // Get recent courses - use course_title and created_by (correct column names)
    const { data: recentCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, course_title, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(5)

    if (coursesError) {
      console.error('Error fetching recent courses:', {
        message: coursesError.message,
        details: coursesError.details,
        hint: coursesError.hint
      })
    } else if (recentCourses) {
      activities.push(...recentCourses.map(c => ({
        type: 'course_created' as const,
        title: 'New course created',
        description: c.course_title || 'Course',
        timestamp: c.created_at,
        id: c.id
      })))
    }

    // Get recent transactions - no direct user_id, just basic info
    const { data: recentTransactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount, purpose, created_at, wallet_id')
      .order('created_at', { ascending: false })
      .limit(5)

    if (transactionsError) {
      console.error('Error fetching recent transactions:', {
        message: transactionsError.message,
        details: transactionsError.details,
        hint: transactionsError.hint
      })
    } else if (recentTransactions) {
      activities.push(...recentTransactions.map(t => ({
        type: 'transaction' as const,
        title: `Transaction: ${t.purpose?.replace(/_/g, ' ') || 'Payment'}`,
        description: `₦${t.amount?.toLocaleString() || 0}`,
        timestamp: t.created_at,
        id: t.id
      })))
    }

    // Sort by timestamp and limit
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return {
      success: true,
      data: activities.slice(0, limit)
    }
  } catch (error: any) {
    console.error('Error fetching recent activity:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code
    })
    return {
      success: false,
      error: error?.message || 'Failed to fetch recent activity',
      data: []
    }
  }
}

/**
 * Get users active today (logged in within last 24 hours)
 */
export async function getActiveUsersToday() {
  await requireAdmin()
  
  const supabase = await createClient()

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Try to get users who logged in recently
    // Check if last_sign_in_at or last_login column exists
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', yesterday.toISOString())

    if (error) {
      // Column doesn't exist yet
      console.log('last_sign_in_at column does not exist, returning 0')
      return { success: true, data: 0 }
    }

    return {
      success: true,
      data: count || 0
    }
  } catch (error: any) {
    console.log('Error fetching active users (expected if last_sign_in_at column missing):', error?.message)
    return {
      success: true,
      data: 0
    }
  }
}

/**
 * Get growth statistics (compared to previous period)
 */
export async function getGrowthStats() {
  await requireAdmin()
  
  const supabase = await createClient()

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const sixtyDaysAgo = new Date(now)
    sixtyDaysAgo.setDate(now.getDate() - 60)

    // Users growth (last 30 days vs previous 30 days)
    const { count: recentUsers, error: recentError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (recentError) {
      console.error('Error fetching recent users for growth:', {
        message: recentError.message,
        details: recentError.details
      })
    }

    const { count: previousUsers, error: previousError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (previousError) {
      console.error('Error fetching previous users for growth:', {
        message: previousError.message,
        details: previousError.details
      })
    }

    const userGrowth = previousUsers && previousUsers > 0
      ? ((recentUsers! - previousUsers) / previousUsers) * 100
      : 0

    // Revenue growth - use actual payment purposes
    const { data: recentRevenue, error: recentRevenueError } = await supabase
      .from('transactions')
      .select('amount')
      .in('purpose', ['assignment_payment', 'test_payment'])
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (recentRevenueError) {
      console.error('Error fetching recent revenue:', {
        message: recentRevenueError.message,
        details: recentRevenueError.details
      })
    }

    const { data: previousRevenue, error: previousRevenueError } = await supabase
      .from('transactions')
      .select('amount')
      .in('purpose', ['assignment_payment', 'test_payment'])
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (previousRevenueError) {
      console.error('Error fetching previous revenue:', {
        message: previousRevenueError.message,
        details: previousRevenueError.details
      })
    }

    // Calculate 27% platform fee from payments
    const recentRevenueTotal = Math.round((recentRevenue?.reduce((sum, tx) => sum + tx.amount, 0) || 0) * 0.27)
    const previousRevenueTotal = Math.round((previousRevenue?.reduce((sum, tx) => sum + tx.amount, 0) || 0) * 0.27)

    const revenueGrowth = previousRevenueTotal > 0
      ? ((recentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100
      : 0

    return {
      success: true,
      data: {
        userGrowth: Math.round(userGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        newUsersThisMonth: recentUsers || 0,
        revenueThisMonth: recentRevenueTotal,
      }
    }
  } catch (error: any) {
    console.error('Error fetching growth stats:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code
    })
    return {
      success: false,
      data: {
        userGrowth: 0,
        revenueGrowth: 0,
        newUsersThisMonth: 0,
        revenueThisMonth: 0,
      }
    }
  }
}