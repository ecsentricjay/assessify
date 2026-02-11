// app/tests/[code]/take/[attemptId]/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Timer } from '@/components/test/timer'
import { QuestionNavigation } from '@/components/test/question-navigation'
import { ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react'
import { getAttemptDetails } from '@/lib/actions/attempt.actions'
import { saveAnswer, submitTestAttempt } from '@/lib/actions/attempt.actions'
import { getShuffledTestQuestions } from '@/lib/actions/question.actions'
import type { AttemptWithDetails, QuestionWithOptions } from '@/lib/types/test.types'

export default function TestTakingPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string
  const accessCode = params.code as string

  const [attempt, setAttempt] = useState<AttemptWithDetails | null>(null)
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    loadAttempt()
  }, [attemptId])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentAnswer()
    }, 30000)

    return () => clearInterval(interval)
  }, [currentQuestionIndex, answers])

  // Warn before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const loadAttempt = async () => {
    try {
      setLoading(true)
      
      console.log('Loading attempt:', attemptId)
      
      const result = await getAttemptDetails(attemptId)
      
      console.log('Attempt result:', result)

      if (result.error || !result.attempt) {
        console.error('Attempt error:', result.error)
        setError(result.error || 'Attempt not found')
        return
      }

      // Check if attempt belongs to current user
      const user = await (await import('@/lib/actions/auth.actions')).getCurrentUser()
      console.log('Current user:', user?.id)
      console.log('Attempt student:', result.attempt.student_id)
      
      if (!user || result.attempt.student_id !== user.id) {
        console.error('Unauthorized: User mismatch')
        setError('Unauthorized access to this attempt')
        return
      }

      setAttempt(result.attempt)

      // Load questions (shuffled if enabled)
      console.log('Loading questions for test:', result.attempt.test_id)
      
      const questionsResult = await getShuffledTestQuestions(
        result.attempt.test_id,
        result.attempt.test?.shuffle_questions || false,
        result.attempt.test?.shuffle_options || false
      )

      console.log('Questions loaded:', questionsResult.questions?.length)

      if (questionsResult.questions) {
        setQuestions(questionsResult.questions)
        console.log('First question:', questionsResult.questions[0])
        console.log('First question options:', questionsResult.questions[0]?.options)
      }

      // Load existing answers if any
      if (result.attempt.answers) {
        console.log('Loading existing answers:', result.attempt.answers.length)
        const answersMap = new Map()
        result.attempt.answers.forEach((answer: any) => {
          if (answer.selected_option_ids) {
            answersMap.set(answer.question_id, { type: 'options', value: answer.selected_option_ids })
          } else if (answer.answer_text) {
            answersMap.set(answer.question_id, { type: 'text', value: answer.answer_text })
          }
        })
        setAnswers(answersMap)
        console.log('Loaded answers for questions:', answersMap.size)
      }
    } catch (err) {
      console.error('Error loading attempt:', err)
      setError('Failed to load test: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    const answer = answers.get(currentQuestion.id)
    if (!answer) return // No answer to save

    try {
      setSaving(true)
      
      const result = await saveAnswer({
        attempt_id: attemptId,
        question_id: currentQuestion.id,
        selected_option_ids: answer.type === 'options' ? answer.value : undefined,
        answer_text: answer.type === 'text' ? answer.value : undefined,
      })

      if (result.error) {
        console.error('Error saving answer:', result.error)
      } else {
        setLastSaved(new Date())
      }
    } catch (err) {
      console.error('Error saving answer:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAnswerChange = (questionId: string, type: 'options' | 'text', value: any) => {
    const newAnswers = new Map(answers)
    newAnswers.set(questionId, { type, value })
    setAnswers(newAnswers)
  }

  const handleNavigate = async (newIndex: number) => {
    // Save current answer before navigating
    await saveCurrentAnswer()
    setCurrentQuestionIndex(newIndex)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      handleNavigate(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      handleNavigate(currentQuestionIndex + 1)
    }
  }

  const handleSubmit = async () => {
    const unanswered = questions.length - answers.size
    
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to submit?`)) {
        return
      }
    } else {
      if (!confirm('Are you sure you want to submit your test? This action cannot be undone.')) {
        return
      }
    }

    try {
      setSubmitting(true)
      
      // Save current answer first
      await saveCurrentAnswer()

      // Submit test
      const result = await submitTestAttempt(attemptId)

      if (result.error) {
        alert(result.error)
        return
      }

      // Redirect to results
      router.push(`/student/tests/attempts/${attemptId}`)
    } catch (err) {
      console.error('Error submitting test:', err)
      alert('Failed to submit test')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTimeUp = useCallback(() => {
    alert('Time is up! Your test will be submitted automatically.')
    submitTestAttempt(attemptId).then(() => {
      router.push(`/student/tests/attempts/${attemptId}`)
    })
  }, [attemptId, router])

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

  if (error || !attempt || !attempt.test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Test</h2>
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h2>
              <p className="text-gray-600">This test has no questions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.get(currentQuestion.id)
  const answeredQuestions = new Set(
    Array.from(answers.keys()).map(qId => 
      questions.findIndex(q => q.id === qId)
    ).filter(idx => idx !== -1)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Timer */}
      <Timer
        startTime={new Date(attempt.started_at)}
        durationMinutes={attempt.test.duration_minutes}
        onTimeUp={handleTimeUp}
      />

      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{attempt.test.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  Last saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {saving && (
                <Badge variant="outline" className="text-xs">Saving...</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="outline" className="capitalize">
                        {currentQuestion.question_type === 'mcq' ? 'Multiple Choice' :
                         currentQuestion.question_type === 'true_false' ? 'True/False' :
                         'Essay Question'}
                      </Badge>
                      <Badge variant="secondary">{currentQuestion.marks} marks</Badge>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentQuestion.question_text}
                    </h2>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* MCQ Options */}
                {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={option.id}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          currentAnswer?.value?.includes(option.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={currentAnswer?.value?.includes(option.id) || false}
                          onChange={(e) => {
                            const currentIds = currentAnswer?.value || []
                            const newIds = e.target.checked
                              ? [...currentIds, option.id]
                              : currentIds.filter((id: string) => id !== option.id)
                            handleAnswerChange(currentQuestion.id, 'options', newIds)
                          }}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-700 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-gray-900">{option.option_text}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* True/False Options */}
                {currentQuestion.question_type === 'true_false' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          currentAnswer?.value?.includes(option.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          checked={currentAnswer?.value?.includes(option.id) || false}
                          onChange={() => {
                            handleAnswerChange(currentQuestion.id, 'options', [option.id])
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-lg font-medium text-gray-900">
                          {option.option_text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Essay Answer */}
                {currentQuestion.question_type === 'essay' && (
                  <div>
                    <Textarea
                      value={currentAnswer?.value || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, 'text', e.target.value)}
                      placeholder="Type your answer here..."
                      rows={12}
                      className="resize-none"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Word count: {(currentAnswer?.value || '').split(/\s+/).filter(Boolean).length}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Question Navigation */}
          <div>
            <QuestionNavigation
              totalQuestions={questions.length}
              currentQuestion={currentQuestionIndex}
              answeredQuestions={answeredQuestions}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </main>
    </div>
  )
}