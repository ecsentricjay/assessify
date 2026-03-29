// app/tests/[code]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, Award, Calendar, User, BookOpen, CheckCircle } from 'lucide-react'
import { getTestByAccessCode } from '@/lib/actions/test.actions'
import { startTestAttempt } from '@/lib/actions/attempt.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { formatDistanceToNow } from 'date-fns'
import type { TestWithDetails } from '@/lib/types/test.types'

export default function PublicTestAccessPage() {
  const params = useParams()
  const router = useRouter()
  const accessCode = params.code as string

  const [user, setUser] = useState<any>(null)
  const [test, setTest] = useState<TestWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [canStart, setCanStart] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [hasInProgress, setHasInProgress] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)

  useEffect(() => {
    loadTestAndUser()
  }, [accessCode])

  const loadTestAndUser = async () => {
    try {
      setLoading(true)
      setError('')

      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push(`/auth/login?redirect=/tests/${accessCode}`)
        return
      }

      if (currentUser.profile?.role !== 'student') {
        setError('Only students can take tests')
        setLoading(false)
        return
      }

      setUser(currentUser)

      // Get wallet balance
      const supabase = await (await import('@/lib/supabase/client')).createClient()
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', currentUser.id)
        .single()

      setWalletBalance(wallet?.balance || 0)

      // Get test details
      const result = await getTestByAccessCode(accessCode)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.test) {
        setTest(result.test)
        setCanStart(result.can_start || false)
        setAttemptsUsed(result.attempts_used || 0)
        setHasInProgress(result.has_in_progress || false)
      }
    } catch (err) {
      console.error('Error loading test:', err)
      setError('Failed to load test')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = async () => {
    if (!test || !canStart) return

    // Check wallet balance if test has cost
    if (test.access_cost > 0 && walletBalance < test.access_cost) {
      alert(`Insufficient wallet balance. You need ₦${test.access_cost} to take this test.`)
      return
    }

    if (!confirm('Are you ready to start the test? The timer will begin immediately.')) {
      return
    }

    try {
      setStarting(true)
      setError('')

      const result = await startTestAttempt(test.id)

      if (result.error) {
        setError(result.error)
        
        // If there's an in-progress attempt, redirect to it
        if (result.attemptId) {
          router.push(`/tests/${accessCode}/take/${result.attemptId}`)
        }
        return
      }

      if (result.attemptId) {
        router.push(`/tests/${accessCode}/take/${result.attemptId}`)
      }
    } catch (err) {
      console.error('Error starting test:', err)
      setError('Failed to start test')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test...</p>
        </div>
      </div>
    )
  }

  if (error && !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Access Test</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/student/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!test) {
    return null
  }

  const now = new Date()
  const startTime = new Date(test.start_time)
  const endTime = new Date(test.end_time)
  const hasStarted = now >= startTime
  const hasExpired = now > endTime
  const attemptsRemaining = test.max_attempts - attemptsUsed

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            {test.display_course_code && (
              <Badge variant="outline" className="text-sm">{test.display_course_code}</Badge>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
          </div>
          {test.display_course_title && (
            <p className="text-sm text-gray-600 mt-1">{test.display_course_title}</p>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Warning: Not Started Yet */}
        {!hasStarted && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Test Not Started</p>
                <p className="text-sm text-yellow-800">
                  This test will be available {formatDistanceToNow(startTime, { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning: Expired */}
        {hasExpired && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Test Expired</p>
                <p className="text-sm text-red-800">
                  This test ended {formatDistanceToNow(endTime, { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning: Max Attempts Reached */}
        {attemptsRemaining === 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">Maximum Attempts Reached</p>
                <p className="text-sm text-orange-800">
                  You have used all {test.max_attempts} allowed attempt(s) for this test.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Information */}
            <Card>
              <CardHeader>
                <CardTitle>Test Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {test.description && (
                  <div>
                    <p className="text-gray-700">{test.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold">{test.duration_minutes} minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Marks</p>
                      <p className="font-semibold">{test.total_marks}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pass Mark</p>
                      <p className="font-semibold">{test.pass_mark}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Attempts Left</p>
                      <p className="font-semibold">{attemptsRemaining} of {test.max_attempts}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <p className="text-sm font-medium text-gray-700">Test Schedule</p>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Starts: {new Date(test.start_time).toLocaleString()}</p>
                    <p>Ends: {new Date(test.end_time).toLocaleString()}</p>
                  </div>
                </div>

                {test.access_cost > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Test Access Fee</p>
                        <p className="text-lg font-bold text-purple-700">₦{test.access_cost}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Your Balance</p>
                        <p className={`text-lg font-bold ${walletBalance >= test.access_cost ? 'text-green-600' : 'text-red-600'}`}>
                          ₦{walletBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {walletBalance < test.access_cost && (
                      <p className="text-sm text-red-600 mt-2">
                        Insufficient balance. Please fund your wallet to take this test.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            {test.instructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{test.instructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Student Information */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user?.profile?.first_name?.[0]}{user?.profile?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user?.profile?.first_name} {user?.profile?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{user?.profile?.matric_number}</p>
                    <p className="text-sm text-gray-600">
                      {user?.profile?.department} • {user?.profile?.level} Level
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Start Test Card */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle>Ready to Begin?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleStartTest}
                  disabled={!canStart || starting || !hasStarted || hasExpired || attemptsRemaining === 0 || (test.access_cost > 0 && walletBalance < test.access_cost)}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                >
                  {starting ? 'Starting...' : 'Start Test'}
                </Button>

                {canStart && hasStarted && !hasExpired && attemptsRemaining > 0 && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      The timer will start immediately after you click &quot;Start Test&quot;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lecturer Info */}
            {test.creator && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Created By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 font-semibold">
                        {test.creator.first_name[0]}{test.creator.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {test.creator.title && `${test.creator.title}. `}
                        {test.creator.first_name} {test.creator.last_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Questions Shuffled</span>
                  <Badge variant={test.shuffle_questions ? 'default' : 'secondary'} className="text-xs">
                    {test.shuffle_questions ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Instant Results</span>
                  <Badge variant={test.show_results_immediately ? 'default' : 'secondary'} className="text-xs">
                    {test.show_results_immediately ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Review Allowed</span>
                  <Badge variant={test.allow_review ? 'default' : 'secondary'} className="text-xs">
                    {test.allow_review ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}