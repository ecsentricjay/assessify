'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getMyLeaderboardPosition } from '@/lib/actions/cbt-leaderboard.actions'

interface LeaderboardPreviewProps {
  bundleId: string
  sessionScore: number
  bundleName?: string
}

export function LeaderboardPreview({
  bundleId,
  sessionScore,
  bundleName = 'Practice Bundle',
}: LeaderboardPreviewProps) {
  const [position, setPosition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rankImproved, setRankImproved] = useState(false)

  useEffect(() => {
    fetchPosition()
  }, [bundleId])

  const fetchPosition = async () => {
    try {
      const result = await getMyLeaderboardPosition(bundleId)

      if (result.success && result.data?.onLeaderboard) {
        setPosition(result.data)

        // Show improvement badge if in top 10
        if (result.data.rank && result.data.rank <= 10) {
          setRankImproved(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard position:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-48 mb-4" />
        <div className="h-4 bg-gray-300 rounded w-full" />
      </div>
    )
  }

  if (!position?.onLeaderboard) {
    return (
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Keep Practicing!
        </h3>
        <p className="text-gray-700 mb-4">
          Complete more practice sessions to appear on the {bundleName} leaderboard.
        </p>
        <Link
          href={`/student/cbt/leaderboard?bundle=${bundleId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          View Leaderboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const getPositionMessage = () => {
    const rank = position.rank
    if (rank === 1) return '🏆 Amazing! You\'re the top performer!'
    if (rank <= 3) return `🥉 Excellent! You're in the top 3!`
    if (rank <= 10) return `📈 Great job! You're in the top 10!`
    if (rank <= 25) return `👍 Nice! You're in the top 25%!`
    return `🎯 You're ranked #${rank}`
  }

  return (
    <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {getPositionMessage()}
          </h3>
          <p className="text-gray-700 mb-3">
            You're now ranked <span className="font-bold text-orange-600">#{position.rank}</span> of{' '}
            <span className="font-bold">{position.totalParticipants}</span> in {bundleName}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Score</p>
              <p className="text-lg font-bold text-blue-600">{Math.round(position.performanceScore)}</p>
              <p className="text-xs text-gray-500">pts</p>
            </div>

            <div className="bg-white rounded p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Sessions</p>
              <p className="text-lg font-bold text-gray-900">{position.totalSessions}</p>
            </div>

            <div className="bg-white rounded p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Avg Score</p>
              <p className="text-lg font-bold text-gray-900">{position.averageScore.toFixed(1)}%</p>
            </div>

            <div className="bg-white rounded p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Percentile</p>
              <p className="text-lg font-bold text-green-600">{position.percentile}%</p>
            </div>
          </div>

          {rankImproved && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm font-medium border border-green-200 mb-4">
              <TrendingUp className="w-4 h-4" />
              You're in the top 10!
            </div>
          )}
        </div>
      </div>

      <Link
        href={`/student/cbt/leaderboard?bundle=${bundleId}`}
        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        View Full Leaderboard
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
