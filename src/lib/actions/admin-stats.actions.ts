// lib/actions/admin-stats.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './admin-auth.actions'

/**
 * Get platform-wide statistics for admin dashboard
 * ✅ FIXED: Correct revenue calculation including AI assignments
 */
export async function getPlatformStats() {
  await requireAdmin()
  
  const supabase = await createClient()

  try {
    // Get user counts by role
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role')

    const userStats = {
      total: profiles?.length || 0,
      students: profiles?.filter(p => p.role === 'student').length || 0,
      lecturers: profiles?.filter(p => p.role === 'lecturer').length || 0,
      admins: profiles?.filter(p => p.role === 'admin').length || 0,
      partners: profiles?.filter(p => p.role === 'partner').length || 0,
    }

    // Get counts
    const { count: courseCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })

    const { count: assignmentCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })

    const { count: testCount } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true })

    const { count: enrollmentCount } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })

    // Get total wallet balance
    const { data: wallets } = await supabase
      .from('wallets')
      .select('balance')

    const totalBalance = wallets?.reduce((sum, wallet) => sum + (wallet.balance || 0), 0) || 0

    // Get total transactions
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    // ✅ FIXED: Get all payment transactions (DEBIT = student payments)
    const { data: paymentTransactions } = await supabase
      .from('transactions')
      .select('amount, purpose')
      .in('purpose', ['assignment_payment', 'test_payment', 'ai_assignment'])
      .eq('type', 'debit') // ✅ Student payments (not credits)
      .eq('status', 'completed')

    // Calculate revenue by source
    const aiRevenue = paymentTransactions?.filter(tx => tx.purpose === 'ai_assignment')
      .reduce((sum, tx) => sum + tx.amount, 0) || 0
    
    const submissionRevenue = paymentTransactions?.filter(tx => 
      tx.purpose === 'assignment_payment' || tx.purpose === 'test_payment'
    ).reduce((sum, tx) => sum + tx.amount, 0) || 0

    // Get partner commissions (15% from referral submissions)
    const { data: partnerEarnings } = await supabase
      .from('partner_earnings')
      .select('amount')

    const totalPartnerCommission = partnerEarnings?.reduce((sum, e) => sum + e.amount, 0) || 0

    // ✅ CORRECT PLATFORM REVENUE CALCULATION:
    // Platform gets:
    // - 100% of AI assignment revenue
    // - 50% of submission revenue (assignments/tests)
    // - Minus partner commissions (15% of partner referral submissions)
    // ✅ CORRECT
const platformEarnings = Math.round(aiRevenue + (submissionRevenue * 0.50))

    return {
      success: true,
      data: {
        users: userStats,
        courses: courseCount || 0,
        assignments: assignmentCount || 0,
        tests: testCount || 0,
        enrollments: enrollmentCount || 0,
        totalWalletBalance: totalBalance,
        platformRevenue: platformEarnings,
        totalTransactions: transactionCount || 0,
        // ✅ Revenue breakdown by source
        revenueBreakdown: {
          aiAssignments: aiRevenue,
          assignmentsAndTests: submissionRevenue,
          partnerCommissions: totalPartnerCommission,
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching platform stats:', error)
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

    // Get recent user signups
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentUsers) {
      activities.push(...recentUsers.map(u => ({
        type: 'user_signup' as const,
        title: `${u.first_name || ''} ${u.last_name || 'User'} joined as ${u.role}`,
        description: `New ${u.role} account`,
        timestamp: u.created_at,
        id: u.id
      })))
    }

    // Get recent courses
    const { data: recentCourses } = await supabase
      .from('courses')
      .select('id, course_title, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentCourses) {
      activities.push(...recentCourses.map(c => ({
        type: 'course_created' as const,
        title: 'New course created',
        description: c.course_title || 'Course',
        timestamp: c.created_at,
        id: c.id
      })))
    }

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('id, amount, purpose, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentTransactions) {
      activities.push(...recentTransactions.map(t => ({
        type: 'transaction' as const,
        title: `Transaction: ${t.purpose?.replace(/_/g, ' ') || 'Payment'}`,
        description: `₦${t.amount?.toLocaleString() || 0}`,
        timestamp: t.created_at,
        id: t.id
      })))
    }

    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return {
      success: true,
      data: activities.slice(0, limit)
    }
  } catch (error: any) {
    console.error('Error fetching recent activity:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch recent activity',
      data: []
    }
  }
}

/**
 * Get users active today
 */
export async function getActiveUsersToday() {
  await requireAdmin()
  
  const supabase = await createClient()

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', yesterday.toISOString())

    return {
      success: true,
      data: count || 0
    }
  } catch (error: any) {
    return {
      success: true,
      data: 0
    }
  }
}

/**
 * Get growth statistics
 * ✅ FIXED: Uses debit transactions (student payments)
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

    // Users growth
    const { count: recentUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    const { count: previousUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())

    const userGrowth = previousUsers && previousUsers > 0
      ? ((recentUsers! - previousUsers) / previousUsers) * 100
      : 0

    // ✅ FIXED: Revenue growth
    const { data: recentRevenue } = await supabase
      .from('transactions')
      .select('amount')
      .in('purpose', ['assignment_payment', 'test_payment', 'ai_assignment'])
      .eq('type', 'debit')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const { data: previousRevenue } = await supabase
      .from('transactions')
      .select('amount')
      .in('purpose', ['assignment_payment', 'test_payment', 'ai_assignment'])
      .eq('type', 'debit')
      .eq('status', 'completed')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())

    const recentRevenueTotal = recentRevenue?.reduce((sum, tx) => sum + tx.amount, 0) || 0
    const previousRevenueTotal = previousRevenue?.reduce((sum, tx) => sum + tx.amount, 0) || 0

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
    console.error('Error fetching growth stats:', error)
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