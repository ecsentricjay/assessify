'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StudyAidHeader from '@/components/study-aid/StudyAidHeader'
import { 
  Eye, 
  Download, 
  Clock, 
  BookOpen,
  Sparkles,
  TrendingUp,
  Award,
  Search,
  Filter,
  Calendar
} from 'lucide-react'

interface Attempt {
  id: string
  course_code: string
  course_title: string
  topic: string
  question_format: 'mcq' | 'theory'
  question_count: number
  is_free: boolean
  status: string
  created_at: string
  completed_at: string
}

export default function StudyAidHistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFormat, setFilterFormat] = useState<'all' | 'mcq' | 'theory'>('all')
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid'>('all')

  useEffect(() => {
    loadAttempts()
  }, [])

  async function loadAttempts() {
    try {
      const response = await fetch('/api/study-aid/attempts')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAttempts(data.attempts || [])
        }
      }
    } catch (error) {
      console.error('Failed to load attempts:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter attempts
  const filteredAttempts = attempts.filter((attempt) => {
    const matchesSearch =
      searchQuery === '' ||
      attempt.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.course_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.topic?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFormat = 
      filterFormat === 'all' || 
      attempt.question_format === filterFormat

    const matchesType =
      filterType === 'all' ||
      (filterType === 'free' && attempt.is_free) ||
      (filterType === 'paid' && !attempt.is_free)

    return matchesSearch && matchesFormat && matchesType
  })

  // Statistics
  const totalAttempts = attempts.length
  const completedAttempts = attempts.filter(a => a.status === 'completed').length
  const totalQuestions = attempts.reduce((sum, a) => sum + (a.question_count || 0), 0)
  const freeAttempts = attempts.filter(a => a.is_free).length
  const paidAttempts = attempts.filter(a => !a.is_free).length

  if (loading) {
    return (
      <>
        <StudyAidHeader />
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-gradient-to-br from-[#2E3192] via-[#3F51B5] to-[#2E3192]">
          <div className="text-white text-2xl animate-pulse">Loading history...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <StudyAidHeader />
      <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-[#2E3192] via-[#3F51B5] to-[#2E3192]">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#4FC3F7] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#2EC4B6] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total Attempts */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-8 h-8 text-[#4FC3F7]" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{totalAttempts}</h3>
              <p className="text-blue-200 text-sm font-semibold">Total Sessions</p>
            </div>

            {/* Completed */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-[#2EC4B6]" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{completedAttempts}</h3>
              <p className="text-blue-200 text-sm font-semibold">Completed</p>
            </div>

            {/* Questions Generated */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{totalQuestions}</h3>
              <p className="text-blue-200 text-sm font-semibold">Questions</p>
            </div>

            {/* Free vs Paid */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                {freeAttempts}F / {paidAttempts}P
              </h3>
              <p className="text-blue-200 text-sm font-semibold">Free / Paid</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200" />
                <input
                  type="text"
                  placeholder="Search course or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
                />
              </div>

              {/* Format Filter */}
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value as any)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
              >
                <option value="all" className="bg-[#2E3192]">All Formats</option>
                <option value="mcq" className="bg-[#2E3192]">MCQ Only</option>
                <option value="theory" className="bg-[#2E3192]">Theory Only</option>
              </select>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
              >
                <option value="all" className="bg-[#2E3192]">All Types</option>
                <option value="free" className="bg-[#2E3192]">Free Only</option>
                <option value="paid" className="bg-[#2E3192]">Paid Only</option>
              </select>
            </div>
          </div>

          {/* Attempts List */}
          {filteredAttempts.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-16 text-center">
              <BookOpen className="w-24 h-24 text-blue-300 mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {attempts.length === 0 ? 'No study sessions yet' : 'No sessions match your filters'}
              </h3>
              <p className="text-blue-200 mb-6 font-semibold">
                {attempts.length === 0 
                  ? 'Start your first AI study session now!' 
                  : 'Try adjusting your filters'}
              </p>
              <button
                onClick={() => router.push('/student/study-aid')}
                className="px-8 py-4 bg-gradient-to-r from-[#2EC4B6] to-[#4FC3F7] rounded-lg font-bold text-white hover:scale-105 transition"
              >
                Start Studying
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:border-[#4FC3F7] hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    {/* Left: Course Info */}
                    <div className="flex-1 min-w-[250px]">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-2xl font-bold text-white">
                          {attempt.course_code}
                        </h3>
                        {attempt.is_free ? (
                          <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                            FREE
                          </span>
                        ) : (
                          <span className="bg-[#4FC3F7]/20 text-[#4FC3F7] px-3 py-1 rounded-full text-xs font-bold border border-[#4FC3F7]/30">
                            PAID
                          </span>
                        )}
                        {attempt.status === 'completed' ? (
                          <span className="bg-[#2EC4B6]/20 text-[#2EC4B6] px-3 py-1 rounded-full text-xs font-bold border border-[#2EC4B6]/30">
                            ✓ COMPLETED
                          </span>
                        ) : (
                          <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                            {attempt.status.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <p className="text-blue-100 text-lg mb-1 font-semibold">
                        {attempt.course_title}
                      </p>
                      {attempt.topic && (
                        <p className="text-blue-200 text-sm mb-2">Topic: {attempt.topic}</p>
                      )}

                      <div className="flex items-center gap-6 text-blue-200 text-sm font-semibold flex-wrap">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-[#4FC3F7]" />
                          {attempt.question_count} {attempt.question_format === 'mcq' ? 'MCQs' : 'Theory'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-[#2EC4B6]" />
                          {formatDate(attempt.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {attempt.status === 'completed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/student/study-aid/attempt/${attempt.id}`)}
                          className="px-4 py-2 bg-[#4FC3F7]/20 border border-[#4FC3F7]/30 text-[#4FC3F7] rounded-lg hover:bg-[#4FC3F7]/30 transition flex items-center gap-2 font-semibold"
                        >
                          <Eye className="w-5 h-5" />
                          View
                        </button>

                        <button
                          onClick={() => alert('PDF download coming soon!')}
                          className="px-4 py-2 bg-[#2EC4B6]/20 border border-[#2EC4B6]/30 text-[#2EC4B6] rounded-lg hover:bg-[#2EC4B6]/30 transition"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Info */}
          {filteredAttempts.length > 0 && (
            <div className="mt-8 text-center text-blue-200 font-semibold">
              Showing {filteredAttempts.length} of {attempts.length} sessions
            </div>
          )}
        </div>
      </div>
    </>
  )
}