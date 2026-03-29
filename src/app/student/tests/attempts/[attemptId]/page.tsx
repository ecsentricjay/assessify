// app/student/tests/attempts/[attemptId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Trophy } from 'lucide-react'
import { getAttemptDetails } from '@/lib/actions/attempt.actions'
import Link from 'next/link'
import type { AttemptWithDetails } from '@/lib/types/test.types'

export default function TestResultsPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [attempt, setAttempt] = useState<AttemptWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAttempt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId])

  const loadAttempt = async () => {
    try {
      setLoading(true)
      
      const result = await getAttemptDetails(attemptId)

      if (result.error || !result.attempt) {
        setError(result.error || 'Attempt not found')
        return
      }

      setAttempt(result.attempt)
    } catch (err) {
      console.error('Error loading attempt:', err)
      setError('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !attempt || !attempt.test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Results</h2>
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

  const correctAnswers = attempt.answers?.filter(a => a.is_correct).length || 0
  const incorrectAnswers = attempt.answers?.filter(a => a.is_correct === false).length || 0
  const unanswered = (attempt.answers?.filter(a => a.is_correct === null).length || 0)
  const totalQuestions = attempt.answers?.length || 0

  // Check if test deadline has passed
  const testEndTime = new Date(attempt.test.end_time)
  const now = new Date()
  const canViewResults = now >= testEndTime

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/student/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
              <p className="text-sm text-gray-600">{attempt.test.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!canViewResults ? (
          <Card className="mb-8 border-2 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-amber-900 mb-2">Results Not Yet Available</h2>
                <p className="text-amber-800 mb-4">
                  Your test results and feedback will be available after the test deadline.
                </p>
                <p className="text-lg font-semibold text-amber-900">
                  Available from: {testEndTime.toLocaleDateString()} at {testEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Result Banner */}
            <Card className={`mb-8 border-2 ${attempt.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                    attempt.passed ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {attempt.passed ? (
                      <Trophy className="h-10 w-10 text-green-600" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-600" />
                    )}
                  </div>
                  <h2 className={`text-3xl font-bold mb-2 ${attempt.passed ? 'text-green-900' : 'text-red-900'}`}>
                    {attempt.passed ? 'Congratulations! You Passed' : 'Test Not Passed'}
                  </h2>
                  <div className="flex items-center justify-center gap-8 mt-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Your Score</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {attempt.total_score}/{attempt.test.total_marks}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Percentage</p>
                      <p className={`text-4xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {attempt.percentage?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pass Mark</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {attempt.test.pass_mark}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Correct Answers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{correctAnswers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Incorrect Answers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{incorrectAnswers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Unanswered/Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">{unanswered}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Taken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{attempt.time_taken_minutes}m</p>
                </CardContent>
              </Card>
            </div>

            {/* Test Information */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Test Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Test Type</p>
                    <p className="font-medium capitalize">{attempt.test.test_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attempt Number</p>
                    <p className="font-medium">{attempt.attempt_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Questions</p>
                    <p className="font-medium">{totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted At</p>
                    <p className="font-medium">
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Review (if allowed) */}
            {attempt.test.allow_review && attempt.answers && attempt.answers.length > 0 && (
              <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attempt.answers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className={`p-4 border-2 rounded-lg ${
                      answer.is_correct === true ? 'border-green-200 bg-green-50' :
                      answer.is_correct === false ? 'border-red-200 bg-red-50' :
                      'border-orange-200 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
                        answer.is_correct === true ? 'bg-green-200 text-green-700' :
                        answer.is_correct === false ? 'bg-red-200 text-red-700' :
                        'bg-orange-200 text-orange-700'
                      }`}>
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {answer.question?.question_type === 'mcq' ? 'MCQ' :
                             answer.question?.question_type === 'true_false' ? 'T/F' :
                             'Essay'}
                          </Badge>
                          {answer.is_correct === true && (
                            <Badge className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Correct
                            </Badge>
                          )}
                          {answer.is_correct === false && (
                            <Badge className="bg-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Incorrect
                            </Badge>
                          )}
                          {answer.is_correct === null && (
                            <Badge className="bg-orange-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending Review
                            </Badge>
                          )}
                          <Badge variant="secondary">{answer.marks_awarded || 0} / {answer.question?.marks} marks</Badge>
                        </div>

                        <p className="font-medium text-gray-900 mb-3">
                          {answer.question?.question_text}
                        </p>

                        {/* Show options for MCQ/True-False */}
                        {(answer.question?.question_type === 'mcq' || answer.question?.question_type === 'true_false') && (
                          <div className="space-y-2 mb-3">
                            {answer.question.options?.map((option: { id: string; option_text: string; is_correct: boolean }) => {
                              const isSelected = answer.selected_option_ids?.includes(option.id)
                              const isCorrect = option.is_correct

                              return (
                                <div
                                  key={option.id}
                                  className={`p-2 rounded border ${
                                    isCorrect ? 'bg-green-50 border-green-300' :
                                    isSelected ? 'bg-red-50 border-red-300' :
                                    'bg-white border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isSelected && (
                                      <span className="text-sm">👉</span>
                                    )}
                                    {isCorrect && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                    <span className="text-sm">{option.option_text}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Show text answer for essay */}
                        {answer.question?.question_type === 'essay' && answer.answer_text && (
                          <div className="mb-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{answer.answer_text}</p>
                          </div>
                        )}

                        {/* Explanation */}
                        {answer.question?.explanation && (
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                            <p className="text-sm text-blue-800">{answer.question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
              </Card>
            )}

            {!attempt.test.allow_review && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-600">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Question review is not available for this test.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}