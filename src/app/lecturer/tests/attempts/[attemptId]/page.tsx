// app/lecturer/tests/attempts/[attemptId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Save, User, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AIGradingButton from '@/components/grading/ai-grading-button'
import BulkAIGrading from '@/components/grading/bulk-ai-grading'
import { aiGradeTestEssay, aiGradeAllTestEssays } from '@/lib/actions/ai-grading.actions'
import { toast } from 'sonner'

// Helper function to safely parse feedback data
function parseFeedbackData(feedbackData: any) {
  if (!feedbackData) return null;
  if (typeof feedbackData === 'string') {
    try {
      return JSON.parse(feedbackData);
    } catch {
      return null;
    }
  }
  return feedbackData;
}

export default function AttemptReviewPage() {
  const params = useParams()
  const attemptId = params.attemptId as string

  const [attempt, setAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gradingAnswerId, setGradingAnswerId] = useState<string | null>(null)
  const [gradeMarks, setGradeMarks] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAttempt()
  }, [attemptId])

  const loadAttempt = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Get attempt with all related data (without email)
      const { data: attemptData, error: attemptError } = await supabase
        .from('test_attempts')
        .select(`
          *,
          student:profiles(
            id,
            first_name,
            last_name,
            matric_number,
            level,
            department
          ),
          test:tests(
            id,
            title,
            total_marks,
            pass_mark
          )
        `)
        .eq('id', attemptId)
        .single()

      if (attemptError) throw attemptError

      // Get answers with questions and options
      const { data: answersData, error: answersError } = await supabase
        .from('student_answers')
        .select(`
          *,
          question:questions(
            id,
            question_text,
            question_type,
            marks,
            options:question_options(
              id,
              option_text,
              is_correct
            )
          )
        `)
        .eq('attempt_id', attemptId)
        .order('answered_at', { ascending: true })

      if (answersError) throw answersError

      setAttempt({ ...attemptData, answers: answersData })
    } catch (err) {
      console.error('Error loading attempt:', err)
      setError('Failed to load attempt')
    } finally {
      setLoading(false)
    }
  }

  const handleManualGrade = async (answerId: string) => {
    if (gradeMarks < 0 || !attempt) {
      toast.error('Please enter valid marks')
      return
    }

    try {
      setSaving(true)
      const supabase = createClient()
      
      const answer = attempt.answers?.find((a: any) => a.id === answerId)
      if (!answer) return

      // Update answer
      const { error: updateError } = await supabase
        .from('student_answers')
        .update({
          marks_awarded: gradeMarks,
          is_correct: gradeMarks > 0,
        })
        .eq('id', answerId)

      if (updateError) throw updateError

      // Recalculate total
      await recalculateAttemptScore()

      toast.success('Grade saved successfully!')
      setGradingAnswerId(null)
      setGradeMarks(0)
      
      await loadAttempt()
    } catch (err) {
      console.error('Error grading:', err)
      toast.error('Failed to save grade')
    } finally {
      setSaving(false)
    }
  }

  const recalculateAttemptScore = async () => {
    const supabase = createClient()

    // Get all answers
    const { data: answers } = await supabase
      .from('student_answers')
      .select('marks_awarded')
      .eq('attempt_id', attemptId)

    if (!answers) return

    const totalScore = answers.reduce((sum: number, a: any) => sum + (a.marks_awarded || 0), 0)
    const percentage = (totalScore / (attempt.test?.total_marks || 100)) * 100
    const passed = percentage >= (attempt.test?.pass_mark || 40)

    await supabase
      .from('test_attempts')
      .update({
        total_score: totalScore,
        percentage,
        passed,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attempt...</p>
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
              <p className="text-red-600">{error || 'Attempt not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const essayQuestions = attempt.answers?.filter((a: any) => a.question?.question_type === 'essay') || []
  const pendingEssays = essayQuestions.filter((a: any) => a.marks_awarded === null)

  // Debug logging
  console.log('Total answers:', attempt.answers?.length)
  console.log('Essay questions:', essayQuestions.length)
  console.log('Pending essays:', pendingEssays.length)
  console.log('Essay questions data:', essayQuestions)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/lecturer/tests/${attempt.test_id}/attempts`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Attempts
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attempt Review</h1>
              <p className="text-sm text-gray-600">{attempt.test.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <Card className={`border-2 ${attempt.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Attempt Summary</span>
                  <Badge variant={attempt.status === 'completed' ? 'default' : 'secondary'}>
                    {attempt.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Score</p>
                    <p className="text-2xl font-bold">
                      {attempt.total_score}/{attempt.test.total_marks}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Percentage</p>
                    <p className={`text-2xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {attempt.percentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Result</p>
                    <p className={`text-2xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {attempt.passed ? 'PASS' : 'FAIL'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Essays Alert + Bulk AI Grading */}
            {pendingEssays.length > 0 ? (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-900">Pending Manual Grading</p>
                        <p className="text-sm text-orange-800">
                          {pendingEssays.length} essay question(s) require grading
                        </p>
                      </div>
                    </div>
                    <BulkAIGrading
                      onGradeAll={async (rubric) => {
                        const result = await aiGradeAllTestEssays(attemptId, rubric)
                        if (result.success) {
                          await loadAttempt()
                        }
                        return result
                      }}
                      itemCount={pendingEssays.length}
                      itemType="essays"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-blue-800">
                    ℹ️ No pending essay questions. All questions have been graded or there are no essay questions in this test.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Total questions: {attempt.answers?.length || 0} | Essay questions: {essayQuestions.length}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Questions & Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {attempt.answers?.map((answer: any, index: number) => (
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
                            {answer.marks_awarded === null && (
                              <Badge className="bg-orange-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            <Badge variant="secondary">{answer.marks_awarded || 0} / {answer.question?.marks} marks</Badge>
                          </div>

                          <p className="font-medium text-gray-900 mb-3">
                            {answer.question?.question_text}
                          </p>

                          {/* MCQ/True-False Options */}
                          {(answer.question?.question_type === 'mcq' || answer.question?.question_type === 'true_false') && (
                            <div className="space-y-2 mb-3">
                              {answer.question.options?.map((option: any) => {
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
                                      {isSelected && <span>👉</span>}
                                      {isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                                      <span className="text-sm">{option.option_text}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Essay Answer */}
                          {answer.question?.question_type === 'essay' && (
                            <div>
                              <div className="mb-3 p-3 bg-white rounded border">
                                <p className="text-sm font-medium text-gray-600 mb-1">Student&apos;s Answer:</p>
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                  {answer.answer_text || 'No answer provided'}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Word count: {(answer.answer_text || '').split(/\s+/).filter(Boolean).length}
                                </p>
                              </div>

                              {/* AI Feedback Display */}
                              {answer.ai_feedback_data && (
                                <div className="mb-4 p-4 border-purple-200 bg-purple-50 rounded-lg">
                                  <h4 className="font-semibold text-purple-900 flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4" />
                                    AI Feedback
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p className="text-purple-800">
                                      {parseFeedbackData(answer.ai_feedback_data)?.feedback}
                                    </p>
                                    {parseFeedbackData(answer.ai_feedback_data)?.strengths?.length > 0 && (
                                      <div>
                                        <p className="font-medium text-green-700">Strengths:</p>
                                        <ul className="list-disc list-inside">
                                          {parseFeedbackData(answer.ai_feedback_data)?.strengths.map((s: string, i: number) => (
                                            <li key={i} className="text-green-600">{s}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {parseFeedbackData(answer.ai_feedback_data)?.improvements?.length > 0 && (
                                      <div>
                                        <p className="font-medium text-orange-700">Areas to Improve:</p>
                                        <ul className="list-disc list-inside">
                                          {parseFeedbackData(answer.ai_feedback_data)?.improvements.map((s: string, i: number) => (
                                            <li key={i} className="text-orange-600">{s}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Grading Options */}
                              {answer.marks_awarded === null && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="font-semibold text-blue-900">Grade This Essay</p>
                                    <AIGradingButton
                                      onGrade={async (rubric) => {
                                        const result = await aiGradeTestEssay(attemptId, answer.question_id, rubric)
                                        if (result.success) {
                                          await loadAttempt()
                                        }
                                        return result
                                      }}
                                      label="AI Grade"
                                      variant="outline"
                                      size="sm"
                                    />
                                  </div>

                                  {gradingAnswerId === answer.id ? (
                                    <div className="space-y-3">
                                      <div>
                                        <Label htmlFor={`marks-${answer.id}`}>
                                          Award Marks (0 - {answer.question.marks})
                                        </Label>
                                        <Input
                                          id={`marks-${answer.id}`}
                                          type="number"
                                          min="0"
                                          max={answer.question.marks}
                                          step="0.5"
                                          value={gradeMarks}
                                          onChange={(e) => setGradeMarks(parseFloat(e.target.value))}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleManualGrade(answer.id)}
                                          disabled={saving}
                                          size="sm"
                                        >
                                          <Save className="h-4 w-4 mr-2" />
                                          {saving ? 'Saving...' : 'Save Grade'}
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            setGradingAnswerId(null)
                                            setGradeMarks(0)
                                          }}
                                          variant="outline"
                                          size="sm"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      onClick={() => {
                                        setGradingAnswerId(answer.id)
                                        setGradeMarks(answer.question?.marks || 0)
                                      }}
                                      size="sm"
                                      variant="secondary"
                                    >
                                      Manual Grade
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {attempt.student?.first_name?.[0]}{attempt.student?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {attempt.student?.first_name} {attempt.student?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{attempt.student?.matric_number}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Level</p>
                    <p className="font-medium">{attempt.student?.level}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department</p>
                    <p className="font-medium">{attempt.student?.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attempt Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Attempt Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Attempt Number</p>
                  <p className="font-medium">#{attempt.attempt_number}</p>
                </div>
                <div>
                  <p className="text-gray-600">Time Taken</p>
                  <p className="font-medium">{attempt.time_taken_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-gray-600">Started At</p>
                  <p className="font-medium">{new Date(attempt.started_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted At</p>
                  <p className="font-medium">
                    {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'In Progress'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}