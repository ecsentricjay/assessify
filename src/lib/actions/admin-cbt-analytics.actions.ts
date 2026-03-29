'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth.actions'

export interface SummaryStats {
  totalRevenue: number
  activeSubscriptions: number
  totalSessions: number
  avgSessionScore: number
  promoEarnings: number
  bundlesSold: number
  avgRevenuePerUser: number
  expiringSubscriptions: number
  activePromoCodes: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
}

export interface BundleRevenue {
  bundleId: string
  bundleName: string
  revenue: number
  sold: number
  avgPrice: number
}

export interface PromoCodePerformance {
  id: string
  promoCode: string
  ownerName: string
  ownerRole: string
  totalUses: number
  totalRevenue: number
  commissionEarned: number
  conversionRate: number
  status: string
  ownerId: string
}

export interface TopReferrer {
  id: string
  name: string
  role: string
  code: string
  uses: number
  earnings: number
  avatar?: string
}

export interface TopBundle {
  id: string
  name: string
  sales: number
  revenue: number
}

export interface TopStudent {
  id: string
  name: string
  sessions: number
  avgScore: number
}

export interface RecentActivity {
  id: string
  timestamp: string
  userName: string
  action: string
  amount: number
  type: string
  status: string
}

export interface AnalyticsData {
  summary: SummaryStats
  revenueOverTime: RevenueDataPoint[]
  revenueByBundle: BundleRevenue[]
  promoPerformance: PromoCodePerformance[]
  topReferrers: TopReferrer[]
  topBundles: TopBundle[]
  topStudents: TopStudent[]
  recentActivity: RecentActivity[]
  sessionsOverTime: RevenueDataPoint[]
  performanceDistribution: Array<{ range: string; count: number; percentage: number }>
  coursePopularity: Array<{ courseName: string; sessions: number; avgScore: number }>
  promoImpact: {
    withPromo: number
    withoutPromo: number
    totalDiscount: number
    commissionPaid: number
  }
}

export async function getCBTAnalytics(filters?: {
  startDate?: string
  endDate?: string
  bundleId?: string
}) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'admin') {
    return {
      success: false,
      error: 'Unauthorized. Admin access required.',
      data: null,
    }
  }

  const supabase = await createClient()

  try {
    // Parse date filters - null means no filtering
    const startDate = filters?.startDate ? new Date(filters.startDate) : null
    const endDate = filters?.endDate ? new Date(filters.endDate) : null

    const [
      summaryData,
      revenueOverTime,
      revenueByBundle,
      promoPerformance,
      topReferrers,
      topBundles,
      topStudents,
      recentActivity,
      sessionsOverTime,
      performanceDistribution,
      coursePopularity,
      promoImpact,
    ] = await Promise.all([
      getSummaryStats(supabase, startDate, endDate),
      getRevenueOverTime(supabase, startDate, endDate),
      getRevenueByBundle(supabase, startDate, endDate, filters?.bundleId),
      getPromoCodePerformance(supabase, startDate, endDate),
      getTopReferrers(supabase, startDate, endDate),
      getTopBundles(supabase, startDate, endDate),
      getTopStudents(supabase, startDate, endDate),
      getRecentActivity(supabase, startDate, endDate),
      getSessionsOverTime(supabase, startDate, endDate),
      getPerformanceDistribution(supabase, startDate, endDate),
      getCoursePopularity(supabase, startDate, endDate),
      getPromoImpact(supabase, startDate, endDate),
    ])

    const data: AnalyticsData = {
      summary: summaryData,
      revenueOverTime,
      revenueByBundle,
      promoPerformance,
      topReferrers,
      topBundles,
      topStudents,
      recentActivity,
      sessionsOverTime,
      performanceDistribution,
      coursePopularity,
      promoImpact,
    }

    return {
      success: true,
      data,
      error: null,
    }
  } catch (error) {
    console.error('[getCBTAnalytics] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch analytics data',
      data: null,
    }
  }
}

async function getSummaryStats(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<SummaryStats> {
  try {
    const { data: allSubs } = await supabase
      .from('cbt_student_subscriptions')
      .select('amount_paid, expiry_date, is_active, created_at, student_id')

    // Filter by date if provided
    const subscriptions = startDate && endDate
      ? (allSubs || []).filter((sub: any) => {
          const date = new Date(sub.created_at)
          return date >= startDate && date <= endDate
        })
      : (allSubs || [])

    const totalRevenue = subscriptions.reduce(
      (sum: number, sub: any) => sum + (parseFloat(sub.amount_paid) || 0),
      0
    )

    const bundlesSold = subscriptions.length

    const now = new Date()
    const activeSubscriptions = (allSubs || []).filter(
      (sub: any) => sub.is_active && new Date(sub.expiry_date) > now
    ).length

    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const expiringSubscriptions = (allSubs || []).filter((sub: any) => {
      const expiry = new Date(sub.expiry_date)
      return sub.is_active && expiry > now && expiry <= sevenDaysFromNow
    }).length

    const { data: allSessions } = await supabase
      .from('cbt_practice_sessions')
      .select('score_percentage, status, created_at')

    const sessions = startDate && endDate
      ? (allSessions || []).filter((s: any) => {
          const date = new Date(s.created_at)
          return s.status === 'completed' && date >= startDate && date <= endDate
        })
      : (allSessions || []).filter((s: any) => s.status === 'completed')

    const totalSessions = sessions.length
    const avgSessionScore =
      sessions.length > 0
        ? sessions.reduce((sum: number, s: any) => sum + (parseFloat(s.score_percentage) || 0), 0) /
          sessions.length
        : 0

    const { data: allEarnings } = await supabase
      .from('bundle_promo_earnings')
      .select('commission_amount, status, created_at')

    const earnings = startDate && endDate
      ? (allEarnings || []).filter((e: any) => {
          const date = new Date(e.created_at)
          return e.status === 'approved' && date >= startDate && date <= endDate
        })
      : (allEarnings || []).filter((e: any) => e.status === 'approved')

    const promoEarnings = earnings.reduce(
      (sum: number, e: any) => sum + (parseFloat(e.commission_amount) || 0),
      0
    )

    const { data: activeCodes } = await supabase
      .from('promo_codes')
      .select('id')
      .eq('is_active', true)

    const activePromoCodes = activeCodes?.length || 0

    const uniqueStudents = new Set(subscriptions.map((s: any) => s.student_id)).size
    const avgRevenuePerUser = uniqueStudents > 0 ? totalRevenue / uniqueStudents : 0

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeSubscriptions,
      totalSessions,
      avgSessionScore: Math.round(avgSessionScore * 100) / 100,
      promoEarnings: Math.round(promoEarnings * 100) / 100,
      bundlesSold,
      avgRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
      expiringSubscriptions,
      activePromoCodes,
    }
  } catch (error) {
    console.error('[getSummaryStats] Error:', error)
    return {
      totalRevenue: 0,
      activeSubscriptions: 0,
      totalSessions: 0,
      avgSessionScore: 0,
      promoEarnings: 0,
      bundlesSold: 0,
      avgRevenuePerUser: 0,
      expiringSubscriptions: 0,
      activePromoCodes: 0,
    }
  }
}

async function getRevenueOverTime(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<RevenueDataPoint[]> {
  try {
    const { data: allData } = await supabase
      .from('cbt_student_subscriptions')
      .select('amount_paid, created_at')
      .order('created_at', { ascending: true })

    const data = startDate && endDate
      ? (allData || []).filter((row: any) => {
          const date = new Date(row.created_at)
          return date >= startDate && date <= endDate
        })
      : (allData || [])

    const grouped: Record<string, number> = {}
    data.forEach((row: any) => {
      const date = new Date(row.created_at).toISOString().split('T')[0]
      grouped[date] = (grouped[date] || 0) + (parseFloat(row.amount_paid) || 0)
    })

    return Object.entries(grouped).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }))
  } catch (error) {
    console.error('[getRevenueOverTime] Error:', error)
    return []
  }
}

async function getRevenueByBundle(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null,
  bundleId?: string
): Promise<BundleRevenue[]> {
  try {
    const { data: allSubs } = await supabase
      .from('cbt_student_subscriptions')
      .select('amount_paid, bundle_id, created_at')

    let subs = startDate && endDate
      ? (allSubs || []).filter((row: any) => {
          const date = new Date(row.created_at)
          return date >= startDate && date <= endDate
        })
      : (allSubs || [])

    if (bundleId) {
      subs = subs.filter((s: any) => s.bundle_id === bundleId)
    }

    if (subs.length === 0) return []

    const bundleIds = [...new Set(subs.map((s: any) => s.bundle_id).filter(Boolean))]
    const { data: bundles } = await supabase
      .from('cbt_subscription_bundles')
      .select('id, bundle_name')
      .in('id', bundleIds)

    const bundleMap = Object.fromEntries((bundles || []).map((b: any) => [b.id, b.bundle_name]))

    const grouped: Record<string, any> = {}
    subs.forEach((sub: any) => {
      const bid = sub.bundle_id
      if (!bid) return

      if (!grouped[bid]) {
        grouped[bid] = {
          bundleId: bid,
          bundleName: bundleMap[bid] || 'Unknown',
          revenue: 0,
          sold: 0,
          prices: [],
        }
      }

      const amount = parseFloat(sub.amount_paid) || 0
      grouped[bid].revenue += amount
      grouped[bid].sold += 1
      grouped[bid].prices.push(amount)
    })

    return Object.values(grouped).map((bundle: any) => ({
      bundleId: bundle.bundleId,
      bundleName: bundle.bundleName,
      revenue: Math.round(bundle.revenue * 100) / 100,
      sold: bundle.sold,
      avgPrice:
        bundle.prices.length > 0
          ? Math.round((bundle.revenue / bundle.prices.length) * 100) / 100
          : 0,
    }))
  } catch (error) {
    console.error('[getRevenueByBundle] Error:', error)
    return []
  }
}

async function getPromoCodePerformance(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<PromoCodePerformance[]> {
  try {
    const { data: promoCodes } = await supabase
      .from('promo_codes')
      .select('*')
      .order('total_earnings', { ascending: false })

    if (!promoCodes || promoCodes.length === 0) return []

    const ownerIds = [...new Set(promoCodes.map((p: any) => p.user_id))]
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', ownerIds)

    const ownerMap = Object.fromEntries(
      (owners || []).map((o: any) => [o.id, `${o.first_name} ${o.last_name}`])
    )

    const results: PromoCodePerformance[] = []

    for (const promo of promoCodes) {
      const { data: allEarnings } = await supabase
        .from('bundle_promo_earnings')
        .select('commission_amount, amount_paid, status, created_at')
        .eq('promo_code', promo.promo_code)
        .eq('status', 'approved')

      const earnings = startDate && endDate
        ? (allEarnings || []).filter((e: any) => {
            const date = new Date(e.created_at)
            return date >= startDate && date <= endDate
          })
        : (allEarnings || [])

      const commissionEarned = earnings.reduce(
        (sum: number, e: any) => sum + (parseFloat(e.commission_amount) || 0),
        0
      )

      const totalRevenue = earnings.reduce(
        (sum: number, e: any) => sum + (parseFloat(e.amount_paid) || 0),
        0
      )

      results.push({
        id: promo.id,
        promoCode: promo.promo_code,
        ownerName: ownerMap[promo.user_id] || 'Unknown',
        ownerRole: promo.user_role || 'student',
        totalUses: promo.total_uses || 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        commissionEarned: Math.round(commissionEarned * 100) / 100,
        conversionRate: promo.total_uses > 0 ? (earnings.length / promo.total_uses) * 100 : 0,
        status: promo.is_active ? 'Active' : 'Inactive',
        ownerId: promo.user_id,
      })
    }

    return results
  } catch (error) {
    console.error('[getPromoCodePerformance] Error:', error)
    return []
  }
}

async function getTopReferrers(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<TopReferrer[]> {
  try {
    const { data: allEarnings } = await supabase
      .from('bundle_promo_earnings')
      .select('commission_amount, referrer_id, promo_code, referrer_role, status, created_at')
      .eq('status', 'approved')

    const earnings = startDate && endDate
      ? (allEarnings || []).filter((e: any) => {
          const date = new Date(e.created_at)
          return date >= startDate && date <= endDate
        })
      : (allEarnings || [])

    if (earnings.length === 0) return []

    const referrerIds = [...new Set(earnings.map((e: any) => e.referrer_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', referrerIds)

    const profileMap = Object.fromEntries(
      (profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`])
    )

    const grouped: Record<string, any> = {}
    earnings.forEach((e: any) => {
      const rid = e.referrer_id
      if (!grouped[rid]) {
        grouped[rid] = {
          id: rid,
          name: profileMap[rid] || 'Unknown',
          role: e.referrer_role || 'student',
          code: e.promo_code,
          uses: 0,
          earnings: 0,
        }
      }
      grouped[rid].earnings += parseFloat(e.commission_amount) || 0
      grouped[rid].uses += 1
    })

    return Object.values(grouped)
      .sort((a: any, b: any) => b.earnings - a.earnings)
      .slice(0, 10)
  } catch (error) {
    console.error('[getTopReferrers] Error:', error)
    return []
  }
}

async function getTopBundles(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<TopBundle[]> {
  try {
    const { data: allSubs } = await supabase
      .from('cbt_student_subscriptions')
      .select('amount_paid, bundle_id, created_at')

    const subs = startDate && endDate
      ? (allSubs || []).filter((row: any) => {
          const date = new Date(row.created_at)
          return date >= startDate && date <= endDate
        })
      : (allSubs || [])

    if (subs.length === 0) return []

    const bundleIds = [...new Set(subs.map((s: any) => s.bundle_id).filter(Boolean))]
    const { data: bundles } = await supabase
      .from('cbt_subscription_bundles')
      .select('id, bundle_name')
      .in('id', bundleIds)

    const bundleMap = Object.fromEntries((bundles || []).map((b: any) => [b.id, b.bundle_name]))

    const grouped: Record<string, any> = {}
    subs.forEach((sub: any) => {
      const bid = sub.bundle_id
      if (!bid) return

      if (!grouped[bid]) {
        grouped[bid] = {
          id: bid,
          name: bundleMap[bid] || 'Unknown',
          sales: 0,
          revenue: 0,
        }
      }
      grouped[bid].sales += 1
      grouped[bid].revenue += parseFloat(sub.amount_paid) || 0
    })

    return Object.values(grouped)
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 5)
  } catch (error) {
    console.error('[getTopBundles] Error:', error)
    return []
  }
}

async function getTopStudents(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<TopStudent[]> {
  try {
    const { data: allSessions } = await supabase
      .from('cbt_practice_sessions')
      .select('student_id, score_percentage, status, created_at')
      .eq('status', 'completed')

    const sessions = startDate && endDate
      ? (allSessions || []).filter((s: any) => {
          const date = new Date(s.created_at)
          return date >= startDate && date <= endDate
        })
      : (allSessions || [])

    if (sessions.length === 0) return []

    const studentIds = [...new Set(sessions.map((s: any) => s.student_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', studentIds)

    const profileMap = Object.fromEntries(
      (profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`])
    )

    const grouped: Record<string, any> = {}
    sessions.forEach((s: any) => {
      const sid = s.student_id
      if (!grouped[sid]) {
        grouped[sid] = {
          id: sid,
          name: profileMap[sid] || 'Unknown',
          sessions: 0,
          scores: [],
        }
      }
      grouped[sid].sessions += 1
      grouped[sid].scores.push(parseFloat(s.score_percentage) || 0)
    })

    return Object.values(grouped)
      .map((student: any) => ({
        id: student.id,
        name: student.name,
        sessions: student.sessions,
        avgScore:
          student.scores.length > 0
            ? Math.round(
                (student.scores.reduce((a: number, b: number) => a + b, 0) / student.scores.length) *
                  100
              ) / 100
            : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10)
  } catch (error) {
    console.error('[getTopStudents] Error:', error)
    return []
  }
}

async function getRecentActivity(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<RecentActivity[]> {
  try {
    const { data: allTxns } = await supabase
      .from('transactions')
      .select('*')
      .in('purpose', ['cbt_bundle', 'referral_commission'])
      .order('created_at', { ascending: false })

    const txns = startDate && endDate
      ? (allTxns || []).filter((txn: any) => {
          const date = new Date(txn.created_at)
          return date >= startDate && date <= endDate
        })
      : (allTxns || [])

    const transactions = txns.slice(0, 20)

    if (transactions.length === 0) return []

    const userIds = [...new Set(transactions.map((t: any) => t.user_id).filter(Boolean))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds)

    const profileMap = Object.fromEntries(
      (profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`])
    )

    return transactions.map((txn: any) => {
      let action = 'Transaction'
      if (txn.purpose === 'cbt_bundle') action = 'Bundle Purchase'
      else if (txn.purpose === 'referral_commission') action = 'Referral Commission'

      return {
        id: txn.id,
        timestamp: new Date(txn.created_at).toLocaleString(),
        userName: profileMap[txn.user_id] || 'Unknown',
        action,
        amount: Math.round((parseFloat(txn.amount) || 0) * 100) / 100,
        type: txn.purpose || 'unknown',
        status: txn.status || 'completed',
      }
    })
  } catch (error) {
    console.error('[getRecentActivity] Error:', error)
    return []
  }
}

async function getSessionsOverTime(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<RevenueDataPoint[]> {
  try {
    const { data: allData } = await supabase
      .from('cbt_practice_sessions')
      .select('created_at, status')
      .order('created_at', { ascending: true })

    const data = startDate && endDate
      ? (allData || []).filter((row: any) => {
          const date = new Date(row.created_at)
          return row.status === 'completed' && date >= startDate && date <= endDate
        })
      : (allData || []).filter((row: any) => row.status === 'completed')

    const grouped: Record<string, number> = {}
    data.forEach((row: any) => {
      const date = new Date(row.created_at).toISOString().split('T')[0]
      grouped[date] = (grouped[date] || 0) + 1
    })

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      revenue: count,
    }))
  } catch (error) {
    console.error('[getSessionsOverTime] Error:', error)
    return []
  }
}

async function getPerformanceDistribution(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<Array<{ range: string; count: number; percentage: number }>> {
  try {
    const { data: allData } = await supabase
      .from('cbt_practice_sessions')
      .select('score_percentage, status, created_at')
      .eq('status', 'completed')

    const data = startDate && endDate
      ? (allData || []).filter((row: any) => {
          const date = new Date(row.created_at)
          return date >= startDate && date <= endDate
        })
      : (allData || [])

    if (data.length === 0) return []

    const ranges = {
      '0-40%': 0,
      '40-60%': 0,
      '60-80%': 0,
      '80-100%': 0,
    }

    data.forEach((row: any) => {
      const score = parseFloat(row.score_percentage) || 0
      if (score < 40) ranges['0-40%'] += 1
      else if (score < 60) ranges['40-60%'] += 1
      else if (score < 80) ranges['60-80%'] += 1
      else ranges['80-100%'] += 1
    })

    const total = data.length

    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
      percentage: Math.round((count / total) * 100 * 100) / 100,
    }))
  } catch (error) {
    console.error('[getPerformanceDistribution] Error:', error)
    return []
  }
}

async function getCoursePopularity(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<Array<{ courseName: string; sessions: number; avgScore: number }>> {
  try {
    const { data: allSessions } = await supabase
      .from('cbt_practice_sessions')
      .select('course_id, score_percentage, status, created_at')
      .eq('status', 'completed')

    const sessions = startDate && endDate
      ? (allSessions || []).filter((s: any) => {
          const date = new Date(s.created_at)
          return date >= startDate && date <= endDate
        })
      : (allSessions || [])

    if (sessions.length === 0) return []

    const courseIds = [...new Set(sessions.map((s: any) => s.course_id).filter(Boolean))]
    const { data: courses } = await supabase
      .from('cbt_courses')
      .select('id, course_title')
      .in('id', courseIds)

    const courseMap = Object.fromEntries((courses || []).map((c: any) => [c.id, c.course_title]))

    const grouped: Record<string, any> = {}
    sessions.forEach((s: any) => {
      const cid = s.course_id
      if (!cid) return

      if (!grouped[cid]) {
        grouped[cid] = {
          courseName: courseMap[cid] || 'Unknown',
          sessions: 0,
          scores: [],
        }
      }
      grouped[cid].sessions += 1
      grouped[cid].scores.push(parseFloat(s.score_percentage) || 0)
    })

    return Object.values(grouped)
      .map((course: any) => ({
        courseName: course.courseName,
        sessions: course.sessions,
        avgScore:
          course.scores.length > 0
            ? Math.round(
                (course.scores.reduce((a: number, b: number) => a + b, 0) / course.scores.length) *
                  100
              ) / 100
            : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10)
  } catch (error) {
    console.error('[getCoursePopularity] Error:', error)
    return []
  }
}

async function getPromoImpact(
  supabase: any,
  startDate: Date | null,
  endDate: Date | null
): Promise<{
  withPromo: number
  withoutPromo: number
  totalDiscount: number
  commissionPaid: number
}> {
  try {
    const { data: allSubs } = await supabase
      .from('cbt_student_subscriptions')
      .select('amount_paid, discount_applied, promo_code_used, created_at')

    const subs = startDate && endDate
      ? (allSubs || []).filter((row: any) => {
          const date = new Date(row.created_at)
          return date >= startDate && date <= endDate
        })
      : (allSubs || [])

    const withPromo = subs
      .filter((s: any) => s.promo_code_used != null)
      .reduce((sum: number, row: any) => sum + (parseFloat(row.amount_paid) || 0), 0)

    const withoutPromo = subs
      .filter((s: any) => s.promo_code_used == null)
      .reduce((sum: number, row: any) => sum + (parseFloat(row.amount_paid) || 0), 0)

    const totalDiscount = subs.reduce(
      (sum: number, row: any) => sum + (parseFloat(row.discount_applied) || 0),
      0
    )

    const { data: allCommissions } = await supabase
      .from('bundle_promo_earnings')
      .select('commission_amount, status, created_at')

    const commissions = startDate && endDate
      ? (allCommissions || []).filter((e: any) => {
          const date = new Date(e.created_at)
          return e.status === 'approved' && date >= startDate && date <= endDate
        })
      : (allCommissions || []).filter((e: any) => e.status === 'approved')

    const commissionPaid = commissions.reduce(
      (sum: number, row: any) => sum + (parseFloat(row.commission_amount) || 0),
      0
    )

    return {
      withPromo: Math.round(withPromo * 100) / 100,
      withoutPromo: Math.round(withoutPromo * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      commissionPaid: Math.round(commissionPaid * 100) / 100,
    }
  } catch (error) {
    console.error('[getPromoImpact] Error:', error)
    return {
      withPromo: 0,
      withoutPromo: 0,
      totalDiscount: 0,
      commissionPaid: 0,
    }
  }
}

export async function generateAnalyticsCSV(data: AnalyticsData): Promise<string> {
  let csv = 'CBT Analytics Report\n'
  csv += `Generated: ${new Date().toLocaleString()}\n\n`

  csv += 'SUMMARY STATISTICS\n'
  csv += `Total Revenue,${data.summary.totalRevenue}\n`
  csv += `Active Subscriptions,${data.summary.activeSubscriptions}\n`
  csv += `Total Sessions,${data.summary.totalSessions}\n`
  csv += `Average Session Score,${data.summary.avgSessionScore}\n`
  csv += `Promo Earnings,${data.summary.promoEarnings}\n`
  csv += `Bundles Sold,${data.summary.bundlesSold}\n`
  csv += `Avg Revenue Per User,${data.summary.avgRevenuePerUser}\n\n`

  csv += 'REVENUE BY BUNDLE\n'
  csv += 'Bundle Name,Revenue,Sold,Avg Price\n'
  data.revenueByBundle.forEach((bundle) => {
    csv += `${bundle.bundleName},${bundle.revenue},${bundle.sold},${bundle.avgPrice}\n`
  })
  csv += '\n'

  csv += 'PROMO CODE PERFORMANCE\n'
  csv += 'Promo Code,Owner,Uses,Commission,Conversion Rate\n'
  data.promoPerformance.forEach((promo) => {
    csv += `${promo.promoCode},${promo.ownerName},${promo.totalUses},${promo.commissionEarned},${promo.conversionRate.toFixed(2)}%\n`
  })
  csv += '\n'

  csv += 'TOP REFERRERS\n'
  csv += 'Name,Code,Uses,Earnings\n'
  data.topReferrers.forEach((referrer) => {
    csv += `${referrer.name},${referrer.code},${referrer.uses},${referrer.earnings}\n`
  })
  csv += '\n'

  csv += 'TOP STUDENTS\n'
  csv += 'Name,Sessions,Avg Score\n'
  data.topStudents.forEach((student) => {
    csv += `${student.name},${student.sessions},${student.avgScore}\n`
  })

  return csv
}