'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth.actions'

// ============================================
// TYPES
// ============================================

export interface LeaderboardEntry {
  rank: number
  studentId: string
  studentName: string
  totalSessions: number
  averageScore: number
  averageTime: number // in seconds
  performanceScore: number
  lastSessionAt: string
  isCurrentUser?: boolean
}

export interface LeaderboardStats {
  totalParticipants: number
  yourRank: number | null
  yourScore: number | null
  topScore: number
  averageScore: number
}

export interface BundleLeaderboardInfo {
  bundleId: string
  bundleName: string
  participantCount: number
  topPerformer: string | null
  topScore: number | null
}

// ============================================
// MAIN LEADERBOARD FUNCTIONS
// ============================================

/**
 * Get leaderboard for a specific bundle
 * Public - anyone can view
 */
export async function getLeaderboard(bundleId: string, options?: {
  limit?: number
  offset?: number
  dateFrom?: string // ISO string — e.g. new Date(Date.now() - 7 * 86400000).toISOString()
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  try {
    const limit = options?.limit || 50
    const offset = options?.offset || 0

    // Fetch leaderboard entries with student names
    let query = supabase
      .from('cbt_leaderboard')
      .select(`
        rank,
        student_id,
        total_sessions,
        average_score,
        average_time_seconds,
        performance_score,
        last_session_at,
        profiles:student_id (
          first_name,
          last_name
        )
      `)
      .eq('bundle_id', bundleId)
      .order('performance_score', { ascending: false }) // re-rank by score for period filter
      .range(offset, offset + limit - 1)

    if (options?.dateFrom) {
      query = query.gte('last_session_at', options.dateFrom)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('[getLeaderboard] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    // Format entries - re-index ranks for period views
    const leaderboard: LeaderboardEntry[] = (entries || []).map((entry: any, index) => ({
      rank: options?.dateFrom ? index + 1 : entry.rank, // re-rank for period views
      studentId: entry.student_id,
      studentName: entry.profiles 
        ? `${entry.profiles.first_name} ${entry.profiles.last_name}`
        : 'Unknown Student',
      totalSessions: entry.total_sessions,
      averageScore: Math.round(entry.average_score * 100) / 100,
      averageTime: entry.average_time_seconds,
      performanceScore: Math.round(entry.performance_score * 100) / 100,
      lastSessionAt: entry.last_session_at,
      isCurrentUser: user?.id === entry.student_id,
    }))

    // Get stats
    const stats = await getLeaderboardStats(bundleId, user?.id || null)

    return {
      success: true,
      data: {
        leaderboard,
        stats: stats.data,
        bundleId,
      },
      error: null,
    }
  } catch (error) {
    console.error('[getLeaderboard] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch leaderboard',
      data: null,
    }
  }
}

/**
 * Get current user's position in leaderboard
 * Requires authentication
 */
export async function getMyLeaderboardPosition(bundleId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return {
      success: false,
      error: 'Authentication required',
      data: null,
    }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('cbt_leaderboard')
      .select('*')
      .eq('bundle_id', bundleId)
      .eq('student_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[getMyLeaderboardPosition] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    if (!data) {
      return {
        success: true,
        data: {
          onLeaderboard: false,
          message: 'Complete practice sessions to appear on the leaderboard!',
        },
        error: null,
      }
    }

    // Get total participants
    const { count } = await supabase
      .from('cbt_leaderboard')
      .select('id', { count: 'exact', head: true })
      .eq('bundle_id', bundleId)

    return {
      success: true,
      data: {
        onLeaderboard: true,
        rank: data.rank,
        totalSessions: data.total_sessions,
        averageScore: Math.round(data.average_score * 100) / 100,
        averageTime: data.average_time_seconds,
        performanceScore: Math.round(data.performance_score * 100) / 100,
        lastSessionAt: data.last_session_at,
        totalParticipants: count || 0,
        percentile: count ? Math.round((1 - (data.rank - 1) / count) * 100) : 0,
      },
      error: null,
    }
  } catch (error) {
    console.error('[getMyLeaderboardPosition] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch position',
      data: null,
    }
  }
}

/**
 * Get top N performers (for social media, homepage, etc.)
 * Public
 */
export async function getTopPerformers(bundleId: string, limit = 10) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('cbt_leaderboard')
      .select(`
        rank,
        student_id,
        total_sessions,
        average_score,
        performance_score,
        profiles:student_id (
          first_name,
          last_name
        )
      `)
      .eq('bundle_id', bundleId)
      .order('rank', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[getTopPerformers] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    const topPerformers = (data || []).map((entry: any) => ({
      rank: entry.rank,
      studentName: entry.profiles 
        ? `${entry.profiles.first_name} ${entry.profiles.last_name}`
        : 'Unknown Student',
      totalSessions: entry.total_sessions,
      averageScore: Math.round(entry.average_score * 100) / 100,
      performanceScore: Math.round(entry.performance_score * 100) / 100,
    }))

    return {
      success: true,
      data: topPerformers,
      error: null,
    }
  } catch (error) {
    console.error('[getTopPerformers] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch top performers',
      data: null,
    }
  }
}

/**
 * Get leaderboard statistics
 */
async function getLeaderboardStats(bundleId: string, userId: string | null) {
  const supabase = await createClient()

  try {
    // Get all entries for stats
    const { data: allEntries } = await supabase
      .from('cbt_leaderboard')
      .select('performance_score, student_id, rank')
      .eq('bundle_id', bundleId)

    if (!allEntries || allEntries.length === 0) {
      return {
        success: true,
        data: {
          totalParticipants: 0,
          yourRank: null,
          yourScore: null,
          topScore: 0,
          averageScore: 0,
        },
      }
    }

    const userEntry = userId 
      ? allEntries.find(e => e.student_id === userId)
      : null

    const scores = allEntries.map(e => e.performance_score)
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

    const stats: LeaderboardStats = {
      totalParticipants: allEntries.length,
      yourRank: userEntry?.rank || null,
      yourScore: userEntry?.performance_score || null,
      topScore: Math.max(...scores),
      averageScore: Math.round(avgScore * 100) / 100,
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('[getLeaderboardStats] Error:', error)
    return {
      success: true,
      data: {
        totalParticipants: 0,
        yourRank: null,
        yourScore: null,
        topScore: 0,
        averageScore: 0,
      },
    }
  }
}

/**
 * Get all bundles with active leaderboards
 * Public
 */
export async function getAllBundleLeaderboards() {
  const supabase = await createClient()

  try {
    // Get all bundles that have leaderboard entries
    const { data, error } = await supabase
      .from('cbt_leaderboard')
      .select(`
        bundle_id,
        cbt_subscription_bundles:bundle_id (
          bundle_name
        )
      `)

    if (error) {
      console.error('[getAllBundleLeaderboards] Error:', error)
      return { success: false, error: error.message, data: null }
    }

    // Get unique bundles
    const bundleIds = [...new Set((data || []).map((e: any) => e.bundle_id))]

    const leaderboards: BundleLeaderboardInfo[] = []

    for (const bundleId of bundleIds) {
      const { data: entries } = await supabase
        .from('cbt_leaderboard')
        .select(`
          performance_score,
          rank,
          profiles:student_id (
            first_name,
            last_name
          )
        `)
        .eq('bundle_id', bundleId)
        .order('rank', { ascending: true })
        .limit(1)

      const bundleEntry = data?.find((e: any) => e.bundle_id === bundleId)
      const bundleName = (bundleEntry?.cbt_subscription_bundles as any)?.bundle_name || 'Unknown Bundle'

      const { count } = await supabase
        .from('cbt_leaderboard')
        .select('id', { count: 'exact', head: true })
        .eq('bundle_id', bundleId) 

      const topEntry = entries?.[0] as any

      leaderboards.push({
        bundleId,
        bundleName,
        participantCount: count || 0,
        topPerformer: topEntry?.profiles && Array.isArray(topEntry.profiles) && topEntry.profiles.length > 0
          ? `${topEntry.profiles[0].first_name} ${topEntry.profiles[0].last_name}`
          : topEntry?.profiles && typeof topEntry.profiles === 'object'
          ? `${(topEntry.profiles as any).first_name} ${(topEntry.profiles as any).last_name}`
          : null,
        topScore: topEntry?.performance_score || null,
      })
    }

    return {
      success: true,
      data: leaderboards,
      error: null,
    }
  } catch (error) {
    console.error('[getAllBundleLeaderboards] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch bundle leaderboards',
      data: null,
    }
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Manually recalculate leaderboard for a bundle
 * Admin only
 */
export async function recalculateLeaderboard(bundleId: string) {
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
    // Get all completed sessions for this bundle
    const { data: sessions } = await supabase
      .from('cbt_practice_sessions')
      .select(`
        *,
        cbt_student_subscriptions:subscription_id (
          bundle_id,
          student_id
        )
      `)
      .eq('status', 'completed')

    const bundleSessions = (sessions || []).filter(
      (s: any) => s.cbt_student_subscriptions?.bundle_id === bundleId
    )

    // Clear existing leaderboard for this bundle
    await supabase
      .from('cbt_leaderboard')
      .delete()
      .eq('bundle_id', bundleId)

    // Recalculate from scratch
    // The trigger will handle the recalculation
    for (const session of bundleSessions) {
      // Update the session (trigger will fire)
      await supabase
        .from('cbt_practice_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', session.id)
    }

    return {
      success: true,
      data: { message: `Recalculated leaderboard for ${bundleSessions.length} sessions` },
      error: null,
    }
  } catch (error) {
    console.error('[recalculateLeaderboard] Error:', error)
    return {
      success: false,
      error: 'Failed to recalculate leaderboard',
      data: null,
    }
  }
}

/**
 * Get leaderboard export data (for contests/social media)
 * Admin only
 */
export async function exportLeaderboardData(bundleId: string, topN = 100) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'admin') {
    return {
      success: false,
      error: 'Unauthorized. Admin access required.',
      data: null,
    }
  }

  const result = await getLeaderboard(bundleId, { limit: topN })

  if (!result.success || !result.data) {
    return result
  }

  // Generate CSV
  let csv = 'Rank,Student Name,Sessions,Avg Score,Avg Time (min),Performance Score\n'

  result.data.leaderboard.forEach((entry) => {
    csv += `${entry.rank},${entry.studentName},${entry.totalSessions},${entry.averageScore}%,${Math.round(entry.averageTime / 60)},${entry.performanceScore}\n`
  })

  return {
    success: true,
    data: {
      csv,
      leaderboard: result.data.leaderboard,
    },
    error: null,
  }
}