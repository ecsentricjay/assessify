'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Share2, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  getLeaderboard,
  getMyLeaderboardPosition,
  getAllBundleLeaderboards,
  type LeaderboardEntry,
  type BundleLeaderboardInfo,
} from '@/lib/actions/cbt-leaderboard.actions'
import { LeaderboardTable } from '@/components/cbt/LeaderboardTable'
import { LeaderboardShare } from '@/components/cbt/LeaderboardShare'

const PERIODS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '90d' },
] as const

type PeriodValue = typeof PERIODS[number]['value']

function getDateFrom(period: PeriodValue): string | undefined {
  if (period === 'all') return undefined
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export default function LeaderboardPage() {
  const [bundles, setBundles] = useState<BundleLeaderboardInfo[]>([])
  const [selectedBundle, setSelectedBundle] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myPosition, setMyPosition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue>('all')

  // Fetch bundles on mount
  useEffect(() => {
    fetchBundles()
  }, [])

  // Fetch leaderboard when bundle or period changes
  useEffect(() => {
    if (selectedBundle) {
      fetchLeaderboard()
      fetchMyPosition()
    }
  }, [selectedBundle, selectedPeriod])

  const fetchBundles = async () => {
    try {
      const result = await getAllBundleLeaderboards()

      if (result.success && result.data) {
        setBundles(result.data)

        // Auto-select first bundle
        if (result.data.length > 0 && !selectedBundle) {
          setSelectedBundle(result.data[0].bundleId)
        }
      } else {
        setError('Failed to load bundles')
      }
    } catch (err) {
      console.error('Failed to fetch bundles:', err)
      setError('An error occurred')
    }
  }

  const fetchLeaderboard = useCallback(async () => {
    if (!selectedBundle) return

    try {
      setLoading(true)
      setError(null)

      const result = await getLeaderboard(selectedBundle, {
        limit: 200,
        dateFrom: getDateFrom(selectedPeriod),
      })

      if (result.success && result.data) {
        setLeaderboard(result.data.leaderboard)
        setCurrentPage(1)
      } else {
        setError(result.error || 'Failed to fetch leaderboard')
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }, [selectedBundle, selectedPeriod])

  const fetchMyPosition = useCallback(async () => {
    if (!selectedBundle) return

    try {
      const result = await getMyLeaderboardPosition(selectedBundle)

      if (result.success && result.data) {
        setMyPosition(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch position:', err)
    }
  }, [selectedBundle])

  const handleRefresh = async () => {
    toast.loading('Refreshing leaderboard...')
    await Promise.all([fetchLeaderboard(), fetchMyPosition()])
    toast.dismiss()
    toast.success('Leaderboard updated')
  }

  const selectedBundleInfo = bundles.find((b) => b.bundleId === selectedBundle)
  const topPerformers = leaderboard.slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">CBT Leaderboard</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Bundle Selector */}
          {bundles.length > 0 && (
            <>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Select Bundle:</label>
                <select
                  value={selectedBundle}
                  onChange={(e) => setSelectedBundle(e.target.value)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {bundles.map((bundle) => (
                    <option key={bundle.bundleId} value={bundle.bundleId}>
                      {bundle.bundleName} ({bundle.participantCount} participants)
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Filter */}
              {selectedBundle && (
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-sm font-medium text-gray-700">Period:</span>
                  <div className="flex gap-2 flex-wrap">
                    {PERIODS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setSelectedPeriod(p.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedPeriod === p.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {bundles.length === 0 && !loading && (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
              <span>No bundles with leaderboards yet. Start practicing!</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-sm text-red-600 hover:text-red-700 font-medium mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {selectedBundle && !error && (
          <>
            {/* Your Position Card */}
            {myPosition?.onLeaderboard ? (
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-500 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Position</h2>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Rank</p>
                        <p className="text-3xl font-bold text-blue-600">#{myPosition.rank}</p>
                        <p className="text-xs text-gray-500">of {myPosition.totalParticipants}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="text-3xl font-bold text-gray-900">{Math.round(myPosition.performanceScore)}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sessions</p>
                        <p className="text-3xl font-bold text-gray-900">{myPosition.totalSessions}</p>
                        <p className="text-xs text-gray-500">completed</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Score</p>
                        <p className="text-3xl font-bold text-gray-900">{myPosition.averageScore.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">average</p>
                      </div>
                    </div>

                    {/* Percentile Badge */}
                    <div className="inline-block">
                      <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        <span>🎯</span>
                        Top {myPosition.percentile}% • Keep it up! 🚀
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowShare(!showShare)}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-medium border border-gray-300 transition-colors shrink-0"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>

                {/* Share Section */}
                {showShare && selectedBundleInfo && (
                  <LeaderboardShare
                    bundleName={selectedBundleInfo.bundleName}
                    rank={myPosition.rank}
                    score={myPosition.performanceScore}
                    totalParticipants={myPosition.totalParticipants}
                  />
                )}
              </div>
            ) : (
              <div className="bg-linear-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to the Leaderboard!</h2>
                <p className="text-gray-700 mb-2">
                  You're not on this leaderboard yet. Complete practice sessions to earn points and appear here.
                </p>
                <p className="text-sm text-gray-600">
                  Performance Score = (Sessions × 10) + (Avg Score × 2) - (Avg Time / 60)
                </p>
              </div>
            )}

            {/* Top 3 Podium */}
            {topPerformers.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  🏆 Top Performers{selectedPeriod !== 'all' && (
                    <span className="ml-2 text-base font-normal text-gray-500">
                      ({PERIODS.find(p => p.value === selectedPeriod)?.label})
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* 2nd Place */}
                  {topPerformers.length >= 2 && (
                    <div className="bg-linear-to-b from-gray-50 to-gray-100 rounded-lg p-6 border-l-4 border-gray-400 order-2 md:order-1">
                      <p className="text-5xl font-bold mb-3">🥈</p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{topPerformers[1].studentName}</h3>
                      <p className="text-3xl font-bold text-gray-700 mb-2">
                        {Math.round(topPerformers[1].performanceScore)}
                      </p>
                      <p className="text-sm text-gray-600">{topPerformers[1].totalSessions} sessions</p>
                    </div>
                  )}

                  {/* 1st Place */}
                  {topPerformers.length >= 1 && (
                    <div className="bg-linear-to-b from-yellow-50 to-yellow-100 rounded-lg p-6 border-l-4 border-yellow-500 md:order-2 ring-2 ring-yellow-300">
                      <p className="text-6xl font-bold mb-3">🥇</p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{topPerformers[0].studentName}</h3>
                      <p className="text-3xl font-bold text-yellow-600 mb-2">
                        {Math.round(topPerformers[0].performanceScore)}
                      </p>
                      <p className="text-sm text-gray-600">{topPerformers[0].totalSessions} sessions</p>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {topPerformers.length >= 3 && (
                    <div className="bg-linear-to-b from-orange-50 to-orange-100 rounded-lg p-6 border-l-4 border-orange-500 order-3 md:order-3">
                      <p className="text-5xl font-bold mb-3">🥉</p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{topPerformers[2].studentName}</h3>
                      <p className="text-3xl font-bold text-orange-600 mb-2">
                        {Math.round(topPerformers[2].performanceScore)}
                      </p>
                      <p className="text-sm text-gray-600">{topPerformers[2].totalSessions} sessions</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Full Leaderboard{selectedPeriod !== 'all' && (
                  <span className="ml-2 text-base font-normal text-gray-500">
                    · {PERIODS.find(p => p.value === selectedPeriod)?.label}
                  </span>
                )}
              </h2>
              <LeaderboardTable
                entries={leaderboard}
                loading={loading}
                pageSize={50}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                showStats={true}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
