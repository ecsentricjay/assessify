// app/student/tests/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Clock, Calendar, Award, AlertCircle, CheckCircle, Play } from 'lucide-react'
import Link from 'next/link'
import { getStudentAttempts } from '@/lib/actions/attempt.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { formatDistanceToNow } from 'date-fns'
import type { TestAttempt } from '@/lib/types/test.types'

interface TestAttemptWithTest extends TestAttempt {
  test?: {
    id: string
    title: string
    test_type: string
    total_marks: number
    pass_mark: number
    access_code: string
    course?: {
      course_code: string
      course_title: string
    } | null
  }
}

export default function StudentTestsPage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState<TestAttemptWithTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAttempts()
  }, [])

  const loadAttempts = async () => {
    try {
      setLoading(true)
      
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const result = await getStudentAttempts()

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.attempts) {
        setAttempts(result.attempts as TestAttemptWithTest[])
      }
    } catch (err) {
      console.error('Error loading attempts:', err)
      setError('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tests...</p>
        </div>
      </div>
    )
  }

  const completedAttempts = attempts.filter(a => a.status === 'completed')
  const inProgressAttempts = attempts.filter(a => a.status === 'in_progress')
  const passedTests = completedAttempts.filter(a => a.passed)
  const avgScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Tests</h1>
                <p className="text-sm text-gray-600">View all your test attempts and results</p>
              </div>
            </div>
            <Link href="/student/tests/access">
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Take a Test
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tests Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{completedAttempts.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tests Passed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{passedTests.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{avgScore.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{inProgressAttempts.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tests Tabs */}
        <Tabs defaultValue="completed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="completed">
              Completed Tests ({completedAttempts.length})
            </TabsTrigger>
            <TabsTrigger value="inprogress">
              In Progress ({inProgressAttempts.length})
            </TabsTrigger>
          </TabsList>

          {/* Completed Tests */}
          <TabsContent value="completed">
            {completedAttempts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No completed tests yet</p>
                    <p className="text-sm mt-2">Take your first test to see results here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedAttempts.map((attempt) => (
                  <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {attempt.test?.test_type?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg">{attempt.test?.title}</h3>
                          {attempt.test?.course && (
                            <p className="text-sm text-gray-600">
                              {attempt.test.course.course_code} - {attempt.test.course.course_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Score Display */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-center flex-1">
                          <p className="text-sm text-gray-600">Your Score</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {attempt.total_score}/{attempt.test?.total_marks}
                          </p>
                        </div>
                        <div className="w-px h-12 bg-gray-300"></div>
                        <div className="text-center flex-1">
                          <p className="text-sm text-gray-600">Percentage</p>
                          <p className={`text-2xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {attempt.percentage?.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Taken {formatDistanceToNow(new Date(attempt.submitted_at || ''), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Time: {attempt.time_taken_minutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <span>Attempt #{attempt.attempt_number}</span>
                        </div>
                      </div>

                      {/* View Results Button */}
                      <Link href={`/student/tests/attempts/${attempt.id}`}>
                        <Button className="w-full" variant="outline">
                          View Results
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* In Progress Tests */}
          <TabsContent value="inprogress">
            {inProgressAttempts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No tests in progress</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgressAttempts.map((attempt) => (
                  <Card key={attempt.id} className="border-2 border-orange-200">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2">In Progress</Badge>
                          <h3 className="font-bold text-lg">{attempt.test?.title}</h3>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-orange-900">Test in Progress</p>
                            <p className="text-xs text-orange-700">
                              Started {formatDistanceToNow(new Date(attempt.started_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => router.push(`/tests/${attempt.test?.access_code || 'unknown'}/take/${attempt.id}`)}
                      >
                        Resume Test
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}