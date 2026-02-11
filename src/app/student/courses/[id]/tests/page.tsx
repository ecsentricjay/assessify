// app/student/courses/[id]/tests/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Calendar, Award, AlertCircle, CheckCircle, Play, Trophy } from 'lucide-react'
import Link from 'next/link'
import { getCourseById } from '@/lib/actions/course.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { formatDistanceToNow } from 'date-fns'

interface CourseTest {
  id: string
  title: string
  description: string
  test_type: string
  total_marks: number
  pass_mark: number
  duration_minutes: number
  start_time: string
  end_time: string
  is_published: boolean
  max_attempts: number
  allocated_marks: number
  my_attempts?: any[]
  attempts_used?: number
  best_score?: number
  can_take?: boolean
}

export default function StudentCourseTestsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [tests, setTests] = useState<CourseTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCourseTests()
  }, [courseId])

  const loadCourseTests = async () => {
    try {
      setLoading(true)
      
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get course details
      const courseResult = await getCourseById(courseId)
      if (courseResult.error || !courseResult.course) {
        setError(courseResult.error || 'Course not found')
        return
      }
      setCourse(courseResult.course)

      // Get tests for this course
      const supabase = await (await import('@/lib/supabase/client')).createClient()
      
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('start_time', { ascending: true })

      if (testsError) {
        console.error('Error loading tests:', testsError)
        setError('Failed to load tests')
        return
      }

      // Get student's attempts for these tests
      const testIds = testsData?.map(t => t.id) || []
      const { data: attemptsData } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('student_id', user.id)
        .in('test_id', testIds)

      // Combine tests with attempt data
      const testsWithAttempts = testsData?.map(test => {
        const myAttempts = attemptsData?.filter(a => a.test_id === test.id) || []
        const completedAttempts = myAttempts.filter(a => a.status === 'completed')
        const bestScore = completedAttempts.length > 0
          ? Math.max(...completedAttempts.map(a => a.percentage || 0))
          : undefined

        const now = new Date()
        const startTime = new Date(test.start_time)
        const endTime = new Date(test.end_time)
        const hasStarted = now >= startTime
        const hasExpired = now > endTime
        const attemptsUsed = myAttempts.length
        const hasInProgress = myAttempts.some(a => a.status === 'in_progress')

        const canTake = hasStarted && !hasExpired && attemptsUsed < test.max_attempts && !hasInProgress

        return {
          ...test,
          my_attempts: myAttempts,
          attempts_used: attemptsUsed,
          best_score: bestScore,
          can_take: canTake,
        }
      }) || []

      setTests(testsWithAttempts)
    } catch (err) {
      console.error('Error loading course tests:', err)
      setError('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  const getTestStatus = (test: CourseTest) => {
    const now = new Date()
    const startTime = new Date(test.start_time)
    const endTime = new Date(test.end_time)

    if (now < startTime) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' }
    if (now > endTime) return { label: 'Expired', color: 'bg-gray-100 text-gray-700' }
    return { label: 'Active', color: 'bg-green-100 text-green-700' }
  }

  const handleStartTest = async (testId: string) => {
    try {
      const { startTestAttempt } = await import('@/lib/actions/attempt.actions')
      
      const result = await startTestAttempt(testId)
      
      if (result.error) {
        alert(result.error)
        return
      }
      
      if (result.attemptId) {
        // Navigate to the test taking page
        router.push(`/tests/${courseId}/take/${result.attemptId}`)
      }
    } catch (err) {
      console.error('Error starting test:', err)
      alert('Failed to start test')
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

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error || 'Course not found'}</p>
      </div>
    )
  }

  const upcomingTests = tests.filter(t => new Date(t.start_time) > new Date())
  const activeTests = tests.filter(t => {
    const now = new Date()
    return new Date(t.start_time) <= now && new Date(t.end_time) >= now
  })
  const completedTests = tests.filter(t => (t.attempts_used || 0) > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/student/courses/${courseId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Tests</h1>
              <p className="text-sm text-gray-600">
                {course.course_code} - {course.course_title}
              </p>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tests.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tests Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{completedTests.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{activeTests.length}</p>
            </CardContent>
          </Card>
        </div>

        {tests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No tests available for this course yet</p>
                <p className="text-sm mt-2">Check back later for upcoming tests</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Tests */}
            {activeTests.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Active Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTests.map((test) => {
                    const status = getTestStatus(test)
                    const attemptsRemaining = test.max_attempts - (test.attempts_used || 0)

                    return (
                      <Card key={test.id} className="border-2 border-green-200 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={status.color}>{status.label}</Badge>
                                <Badge variant="outline" className="capitalize">
                                  {test.test_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <h3 className="font-bold text-lg">{test.title}</h3>
                              {test.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {test.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Test Info */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{test.duration_minutes} mins</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-gray-400" />
                              <span>{test.total_marks} marks</span>
                            </div>
                          </div>

                          {/* Deadline */}
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-900 font-medium">
                                Ends {formatDistanceToNow(new Date(test.end_time), { addSuffix: true })}
                              </span>
                            </div>
                          </div>

                          {/* Attempts Info */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Attempts Remaining</span>
                            <Badge variant="secondary">
                              {attemptsRemaining} of {test.max_attempts}
                            </Badge>
                          </div>

                          {/* Best Score */}
                          {test.best_score !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Your Best Score</span>
                              <Badge className="bg-blue-600">
                                {test.best_score.toFixed(0)}%
                              </Badge>
                            </div>
                          )}

                          {/* Action Button */}
                          {test.can_take ? (
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700" 
                              size="lg"
                              onClick={() => handleStartTest(test.id)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Test
                            </Button>
                          ) : (
                            <Button className="w-full" variant="outline" disabled>
                              {attemptsRemaining === 0 ? 'Max Attempts Reached' : 'Not Available'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Tests */}
            {upcomingTests.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingTests.map((test) => {
                    const status = getTestStatus(test)

                    return (
                      <Card key={test.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={status.color}>{status.label}</Badge>
                                <Badge variant="outline" className="capitalize">
                                  {test.test_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <h3 className="font-bold text-lg">{test.title}</h3>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{test.duration_minutes} mins</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-gray-400" />
                              <span>{test.total_marks} marks</span>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-900 font-medium">
                                Starts {formatDistanceToNow(new Date(test.start_time), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed Tests */}
            {completedTests.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Test History</h2>
                <div className="space-y-3">
                  {completedTests.map((test) => {
                    const lastAttempt = test.my_attempts?.[test.my_attempts.length - 1]
                    const isPassed = test.best_score !== undefined && test.best_score >= test.pass_mark

                    return (
                      <Card key={test.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                isPassed ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                {isPassed ? (
                                  <Trophy className="h-6 w-6 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-6 w-6 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{test.title}</h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                  <span>Attempts: {test.attempts_used}/{test.max_attempts}</span>
                                  {test.best_score !== undefined && (
                                    <span className="font-medium">
                                      Best: {test.best_score.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {lastAttempt && (
                              <Link href={`/student/tests/attempts/${lastAttempt.id}`}>
                                <Button variant="outline" size="sm">
                                  View Results
                                </Button>
                              </Link>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}