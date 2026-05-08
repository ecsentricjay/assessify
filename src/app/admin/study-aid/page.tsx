'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  BookOpen,
  Sparkles,
  Award,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  totalAttempts: number
  freeAttempts: number
  paidAttempts: number
  totalRevenue: number
  totalQuestions: number
  averageAttemptsPerStudent: number
  popularCourses: Array<{
    course_code: string
    course_title: string
    attempt_count: number
  }>
  recentActivity: Array<{
    id: string
    student_name: string
    course_code: string
    question_format: string
    is_free: boolean
    created_at: string
  }>
}

export default function AdminStudyAidDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d')

  useEffect(() => {
    loadDashboard()
  }, [timeRange])

  async function loadDashboard() {
    try {
      const response = await fetch(`/api/admin/study-aid/dashboard?range=${timeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-500 animate-pulse">Loading analytics...</div>
      </div>
    )
  }

  const revenueGrowth = stats ? ((stats.paidAttempts / Math.max(stats.totalAttempts, 1)) * 100).toFixed(1) : 0

  return (
    <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Button */}
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            {['7d', '30d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.activeStudents || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                <BookOpen className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAttempts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.freeAttempts || 0} free / {stats?.paidAttempts || 0} paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{(stats?.totalRevenue || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {revenueGrowth}% paid conversion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questions Generated</CardTitle>
                <Sparkles className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats?.totalQuestions || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{stats?.averageAttemptsPerStudent?.toFixed(1) || 0} per student
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Courses</CardTitle>
                <CardDescription>Top courses by attempt count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.popularCourses?.slice(0, 5).map((course, index) => (
                    <div key={course.course_code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{course.course_code}</p>
                          <p className="text-xs text-muted-foreground">{course.course_title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{course.attempt_count}</p>
                        <p className="text-xs text-muted-foreground">attempts</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest study attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentActivity?.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-semibold">{activity.student_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.course_code} • {activity.question_format === 'mcq' ? 'MCQ' : 'Theory'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.is_free ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                            FREE
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                            PAID
                          </span>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
}