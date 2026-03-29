'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, RefreshCw, AlertCircle, Users, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import {
  getAllBundleLeaderboards,
  getLeaderboard,
  exportLeaderboardData,
  recalculateLeaderboard,
  type BundleLeaderboardInfo,
} from '@/lib/actions/cbt-leaderboard.actions'
import { LeaderboardTable } from '@/components/cbt/LeaderboardTable'

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

export default function AdminLeaderboardPage() {
  const [bundles, setBundles] = useState<BundleLeaderboardInfo[]>([])
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue>('all')

  // Fetch bundles on mount
  useEffect(() => {
    fetchBundles()
  }, [])

  // Fetch leaderboard when bundle or period changes
  useEffect(() => {
    if (selectedBundle) {
      fetchLeaderboard()
    }
  }, [selectedBundle, selectedPeriod])

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const result = await getAllBundleLeaderboards()

      if (result.success && result.data) {
        setBundles(result.data)

        if (result.data.length > 0 && !selectedBundle) {
          setSelectedBundle(result.data[0].bundleId)
        }
      } else {
        setError('Failed to load bundles')
      }
    } catch (err) {
      console.error('Failed to fetch bundles:', err)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    if (!selectedBundle) return

    try {
      setLoading(true)
      const result = await getLeaderboard(selectedBundle, {
        limit: 200,
        dateFrom: getDateFrom(selectedPeriod),
      })

      if (result.success && result.data) {
        setLeaderboard(result.data.leaderboard)
      } else {
        setError('Failed to fetch leaderboard')
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!selectedBundle) return

    try {
      setExporting(true)
      const result = await exportLeaderboardData(selectedBundle, 200)

      if (result.success && result.data) {
        const csvData = (result.data as any).csv
        if (csvData) {
          const blob = new Blob([csvData], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `leaderboard-${selectedBundle}-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success('Leaderboard exported successfully')
        }
      } else {
        toast.error(result.error || 'Failed to export')
      }
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export leaderboard')
    } finally {
      setExporting(false)
    }
  }

  const handleRecalculate = async () => {
    if (!selectedBundle) return

    if (!confirm('This will recalculate the leaderboard from all practice sessions. Continue?')) {
      return
    }

    try {
      setRecalculating(true)
      const result = await recalculateLeaderboard(selectedBundle)

      if (result.success) {
        toast.success('Leaderboard recalculated successfully')
        await fetchLeaderboard()
      } else {
        toast.error(result.error || 'Failed to recalculate')
      }
    } catch (err) {
      console.error('Recalculation error:', err)
      toast.error('Failed to recalculate leaderboard')
    } finally {
      setRecalculating(false)
    }
  }

  const currentBundle = bundles.find((b) => b.bundleId === selectedBundle)

  if (loading && bundles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-300 rounded w-64" />
          <div className="h-64 bg-gray-300 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard Management</h1>
          </div>

          <p className="text-gray-600">Monitor and manage CBT practice leaderboards across all bundles</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {bundles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Leaderboards Yet</h2>
            <p className="text-gray-600">Leaderboards will appear once students complete practice sessions.</p>
          </div>
        ) : (
          <>
            {/* Bundles Overview */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bundle Leaderboards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundles.map((bundle) => (
                  <button
                    key={bundle.bundleId}
                    onClick={() => setSelectedBundle(bundle.bundleId)}
                    className={`text-left p-6 rounded-lg border-2 transition-all ${
                      selectedBundle === bundle.bundleId
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{bundle.bundleName}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{bundle.participantCount} participants</span>
                      </div>
                      {bundle.topPerformer && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span>Top: {bundle.topPerformer}</span>
                        </div>
                      )}
                      {bundle.topScore && (
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">{Math.round(bundle.topScore)} pts</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Details */}
            {selectedBundle && currentBundle && (
              <div className="space-y-6">
                {/* Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard Actions</h3>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExport}
                      disabled={exporting || loading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>

                    <button
                      onClick={handleRecalculate}
                      disabled={recalculating || loading}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                      {recalculating ? 'Recalculating...' : 'Recalculate'}
                    </button>

                    <button
                      onClick={fetchLeaderboard}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    <p>
                      <span className="font-medium">{currentBundle.participantCount}</span> students have completed
                      practice sessions for this bundle.
                    </p>
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {currentBundle.bundleName} Leaderboard
                    </h3>

                    {/* Period Filter */}
                    <div className="flex items-center gap-3 mb-4">
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
                  </div>

                  <LeaderboardTable
                    entries={leaderboard}
                    loading={loading}
                    pageSize={50}
                    currentPage={1}
                    showStats={true}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
