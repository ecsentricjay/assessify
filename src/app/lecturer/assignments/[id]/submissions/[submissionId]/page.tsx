// Save as: src/app/lecturer/grading/submission/[submissionId]/page.tsx
// Replace the existing file with this

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSubmissionById, gradeSubmission, getAssignmentSubmissions } from '@/lib/actions/grading.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import DocumentViewer from '@/components/grading/document-viewer'
import AIGradingButton from '@/components/grading/ai-grading-button'
import { aiGradeAssignment } from '@/lib/actions/ai-grading.actions'

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string
  submission_text?: string
  file_urls?: string[]
  final_score: number | null
  lecturer_feedback?: string
  status: string
  is_late: boolean
  late_days: number
  plagiarism_score: number | null
  graded_at?: string
  profiles: {
    first_name: string
    last_name: string
    matric_number: string
    level: number
    department: string
  }
  assignments: {
    id: string
    title: string
    description: string
    max_score: number
    allocated_marks: number
    assignment_type: string
    created_by: string
    course_id: string
    late_penalty_percentage: number
    courses: {
      course_code: string
      course_title: string
    }
  }
}

export default function GradeSubmissionPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  const submissionId = params.submissionId as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [score, setScore] = useState<string>('')
  const [feedback, setFeedback] = useState<string>('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Load current submission
    const submissionResult = await getSubmissionById(submissionId)
    
    if (submissionResult.error) {
      setError(submissionResult.error)
      setLoading(false)
      return
    }

    if (submissionResult.submission) {
      const sub = submissionResult.submission as Submission
      setSubmission(sub)
      if (sub.final_score !== null) {
        setScore(sub.final_score.toString())
      }
      if (sub.lecturer_feedback) {
        setFeedback(sub.lecturer_feedback)
      }

      // Load all submissions for navigation
      const submissionsResult = await getAssignmentSubmissions(sub.assignment_id)
      if (submissionsResult.submissions) {
        setAllSubmissions(submissionsResult.submissions as Submission[])
        const index = submissionsResult.submissions.findIndex((s: Submission) => s.id === submissionId)
        setCurrentSubmissionIndex(index)
      }
    }
    
    setLoading(false)
  }, [submissionId])

  useEffect(() => {
     
    // Defer call to avoid synchronous setState inside the effect
    Promise.resolve().then(() => {
      loadData()
    })
    // loadData is memoized with useCallback, safe to call here
  }, [submissionId, loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!submission) return

    const scoreValue = parseFloat(score)
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > submission.assignments.max_score) {
      setError(`Score must be between 0 and ${submission.assignments.max_score}`)
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const result = await gradeSubmission({
      submissionId,
      finalScore: scoreValue,
      lecturerFeedback: feedback.trim() || undefined
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSuccess(result.message || 'Submission graded successfully!')
      // Reload submission to show updated grade
      await loadData()
      setSubmitting(false)
    }
  }

  const navigateToSubmission = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? currentSubmissionIndex - 1 
      : currentSubmissionIndex + 1

    if (newIndex >= 0 && newIndex < allSubmissions.length) {
      const newSubmission = allSubmissions[newIndex]
      router.push(`/lecturer/assignments/${assignmentId}/submissions/${newSubmission.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    )
  }

  if (error && !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href={`/lecturer/assignments/${assignmentId}/submissions`}>
              <Button>Back to Submissions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!submission) return null

  const student = submission.profiles
  const assignment = submission.assignments
  const isGraded = submission.status === 'graded'
  const hasPreviousSubmission = currentSubmissionIndex > 0
  const hasNextSubmission = currentSubmissionIndex < allSubmissions.length - 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/lecturer/assignments/${assignmentId}/submissions`}>
                <Button variant="outline" size="sm">← Back</Button>
              </Link>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold">Grade Submission</h1>
                  <Badge className={isGraded ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                    {isGraded ? 'Graded' : 'Pending'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {student?.first_name} {student?.last_name} • {student?.matric_number}
                </p>
              </div>
            </div>

            {/* Navigation between submissions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigateToSubmission('prev')}
                disabled={!hasPreviousSubmission}
              >
                ← Previous Student
              </Button>
              <span className="text-sm text-gray-600">
                {currentSubmissionIndex + 1} / {allSubmissions.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigateToSubmission('next')}
                disabled={!hasNextSubmission}
              >
                Next Student →
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Document Viewer (60%) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Submission Info Banner */}
            <Card className={submission.is_late ? "border-2 border-orange-300 bg-orange-50" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Submitted At</p>
                    <p className="font-semibold">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                    </p>
                  </div>
                  {submission.is_late && (
                    <Badge className="bg-orange-600 text-white">
                      ⏰ Late: {submission.late_days} day(s)
                    </Badge>
                  )}
                </div>
                {submission.is_late && assignment.late_penalty_percentage > 0 && (
                  <div className="mt-3 pt-3 border-t border-orange-300">
                    <p className="text-sm text-orange-800">
                      <strong>Late Penalty:</strong> {assignment.late_penalty_percentage}% per day = {assignment.late_penalty_percentage * submission.late_days}% total
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Submission (if exists) */}
            {submission.submission_text && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Text Submission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg border max-h-60 overflow-y-auto">
                    <p className="text-gray-800 whitespace-pre-wrap">{submission.submission_text}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Viewer */}
            {submission.file_urls && submission.file_urls.length > 0 ? (
              <DocumentViewer fileUrls={submission.file_urls} />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600">No files submitted</p>
                </CardContent>
              </Card>
            )}

            {/* Plagiarism Score (if exists) */}
            {submission.plagiarism_score !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Plagiarism Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg border ${
                    submission.plagiarism_score > 30 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <p className={`font-bold text-2xl ${
                      submission.plagiarism_score > 30 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {submission.plagiarism_score}% Similarity
                    </p>
                    <p className="text-sm mt-1 text-gray-600">
                      {submission.plagiarism_score > 30 
                        ? 'High similarity detected - review carefully' 
                        : 'Low similarity - looks original'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Grading Form & Info (40%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Grading Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{isGraded ? 'Update Grade' : 'Grade Submission'}</CardTitle>
                  {submission && (
                    <AIGradingButton
                      onGrade={async (rubric) => {
                        const result = await aiGradeAssignment(submission.id, rubric)
                        if (result.success) {
                          setScore(result.score?.toString() || '')
                          setFeedback(result.feedback || '')
                          await loadData()
                        }
                        return result
                      }}
                      label="AI Grade"
                      variant="outline"
                      size="sm"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="score">
                      Score * (Max: {assignment.max_score} points)
                    </Label>
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max={assignment.max_score}
                      step="0.5"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder={`Enter score (0-${assignment.max_score})`}
                      required
                      disabled={submitting}
                    />
                    {submission.is_late && assignment.late_penalty_percentage > 0 && (
                      <p className="text-xs text-orange-600">
                        ⚠️ Late penalty of {assignment.late_penalty_percentage * submission.late_days}% will be applied automatically
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback (Optional)</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback to the student..."
                      rows={6}
                      disabled={submitting}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-md text-sm">
                      {success}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Saving...' : isGraded ? '✏️ Update Grade' : '✅ Submit Grade'}
                  </Button>

                  {/* Quick Navigation after grading */}
                  {isGraded && hasNextSubmission && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigateToSubmission('next')}
                    >
                      Grade Next Student →
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Student Details */}
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl">
                    {student?.first_name?.charAt(0)}
                    {student?.last_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {student?.first_name} {student?.last_name}
                    </p>
                    <p className="text-sm text-gray-600 font-mono">{student?.matric_number}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level:</span>
                    <span className="font-medium">{student?.level} Level</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{student?.department}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-medium">{assignment.courses.course_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">
                    {assignment.assignment_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Score:</span>
                  <span className="font-medium">{assignment.max_score} points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CA Marks:</span>
                  <span className="font-medium">{assignment.allocated_marks} marks</span>
                </div>
              </CardContent>
            </Card>

            {/* Current Grade (if graded) */}
            {isGraded && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Current Grade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-green-600">
                      {submission.final_score?.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">out of {assignment.max_score}</p>
                  </div>

                  {submission.lecturer_feedback && (
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <h5 className="font-semibold text-xs text-gray-600 mb-1">Feedback</h5>
                      <p className="text-sm text-gray-800">{submission.lecturer_feedback}</p>
                    </div>
                  )}

                  {submission.graded_at && (
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      Graded {formatDistanceToNow(new Date(submission.graded_at), { addSuffix: true })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}