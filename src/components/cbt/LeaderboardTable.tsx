'use client'

import { useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { LeaderboardEntry } from '@/lib/actions/cbt-leaderboard.actions'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  loading?: boolean
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  showStats?: boolean
}

function getRankBadge(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

function getRankStyles(rank: number) {
  if (rank === 1) {
    return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500'
  }
  if (rank === 2) {
    return 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-400'
  }
  if (rank === 3) {
    return 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500'
  }
  return 'hover:bg-gray-50'
}

export function LeaderboardTable({
  entries,
  loading = false,
  pageSize = 50,
  currentPage = 1,
  onPageChange,
  showStats = true,
}: LeaderboardTableProps) {
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return entries.slice(start, start + pageSize)
  }, [entries, currentPage, pageSize])

  const totalPages = Math.ceil(entries.length / pageSize)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No participants on this leaderboard yet.</p>
        <p className="text-sm text-gray-500 mt-2">Complete practice sessions to appear here!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop View - Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-16">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 w-24">Sessions</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 w-24">Avg Score</th>
                {showStats && (
                  <>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 w-24">Avg Time</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 w-28">Performance</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEntries.map((entry) => {
                const badge = getRankBadge(entry.rank)
                const styles = getRankStyles(entry.rank)

                return (
                  <tr
                    key={`${entry.rank}-${entry.studentId}`}
                    className={`${styles} transition-colors ${
                      entry.isCurrentUser ? 'border-blue-500 ring-2 ring-blue-200' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{badge || entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {entry.isCurrentUser && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" aria-label="This is you" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{entry.studentName}</p>
                          {entry.isCurrentUser && <p className="text-xs text-blue-600 font-medium">You</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-900 font-medium">{entry.totalSessions}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-900 font-medium">{entry.averageScore.toFixed(1)}%</span>
                    </td>
                    {showStats && (
                      <>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-600">
                            {Math.round(entry.averageTime / 60)}m {entry.averageTime % 60}s
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-semibold text-blue-600">
                            {Math.round(entry.performanceScore)}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-2">
        {paginatedEntries.map((entry) => {
          const badge = getRankBadge(entry.rank)
          const styles = getRankStyles(entry.rank)

          return (
            <div
              key={`${entry.rank}-${entry.studentId}`}
              className={`p-4 rounded-lg border ${styles} ${
                entry.isCurrentUser ? 'ring-2 ring-blue-300' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl font-bold">{badge || entry.rank}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{entry.studentName}</p>
                    {entry.isCurrentUser && <p className="text-xs text-blue-600 font-medium">You</p>}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {entry.totalSessions} sessions • {entry.averageScore.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold text-blue-600">{Math.round(entry.performanceScore)}</p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            aria-label="Previous page"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              const isActive = page === currentPage
              const isVisible =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1

              if (!isVisible && (page === 2 || page === totalPages - 1)) {
                return <span key={`ellipsis-${page}`}>...</span>
              }

              if (!isVisible) return null

              return (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            aria-label="Next page"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info */}
      <div className="text-center text-xs text-gray-500 mt-4">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, entries.length)} of{' '}
        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
      </div>
    </div>
  )
}
