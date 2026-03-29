'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAssignmentForStudent, submitAssignment } from '@/lib/actions/submission.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import FileUpload from '@/components/assignment/file-upload'
import { formatDistanceToNow } from 'date-fns'

export default function AssignmentSubmissionPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submissionText, setSubmissionText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  useEffect(() => {
    async function loadAssignment() {
      setLoading(true)
      const result = await getAssignmentForStudent(assignmentId)
      
      if (result.error) {
        setError(result.error)
      } else {
        setAssignment(result.assignment)
      }
      setLoading(false)
    }

    loadAssignment()
  }, [assignmentId])

  const handleFilesUploaded = (urls: string[]) => {
    setUploadedFiles(urls)
    setSuccess('Files uploaded successfully!')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (uploadedFiles.length === 0 && !submissionText.trim()) {
      setError('Please upload files or provide text submission')
      return
    }

    if (assignment.submission_cost > 0 && assignment.walletBalance < assignment.submission_cost) {
      setError(`Insufficient wallet balance. You need ₦${assignment.submission_cost} but have ₦${assignment.walletBalance}`)
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await submitAssignment({
      assignmentId,
      submissionText: submissionText.trim() || undefined,
      fileUrls: uploadedFiles
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSuccess(result.message || 'Assignment submitted successfully!')
      setTimeout(() => {
        router.push('/student/assignments')
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/student/assignments">
              <Button>Back to Assignments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assignment) return null

  const deadline = new Date(assignment.deadline)
  const now = new Date()
  const isOverdue = now > deadline
  const hasSubmitted = !!assignment.submission

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                <Badge className={hasSubmitted ? "bg-green-100 text-green-800" : isOverdue ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                  {hasSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {assignment.courses.course_code} • {assignment.courses.course_title}
              </p>
            </div>
            <Link href="/student/assignments">
              <Button variant="outline">← Back</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Assignment Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Assignment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Description</h4>
                  <p className="text-gray-800">{assignment.description}</p>
                </div>

                {assignment.instructions && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Instructions</h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{assignment.instructions}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Type</h4>
                    <p className="text-gray-800 capitalize">{assignment.assignment_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Maximum Score</h4>
                    <p className="text-gray-800">{assignment.max_score} points</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">CA Marks</h4>
                    <p className="text-gray-800">{assignment.allocated_marks} marks</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Deadline</h4>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                      {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isOverdue ? 'Overdue' : formatDistanceToNow(deadline, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Form or Status */}
            {hasSubmitted ? (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Submitted At</h4>
                    <p className="text-gray-800">
                      {new Date(assignment.submission.submitted_at).toLocaleString()}
                    </p>
                    {assignment.submission.is_late && (
                      <p className="text-sm text-orange-600 mt-1">
                        Late submission ({assignment.submission.late_days} day(s) late)
                      </p>
                    )}
                  </div>

                  {assignment.submission.submission_text && (
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Text Submission</h4>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {assignment.submission.submission_text}
                      </p>
                    </div>
                  )}

                  {assignment.submission.file_urls && assignment.submission.file_urls.length > 0 && (
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Submitted Files</h4>
                      <div className="space-y-2">
                        {assignment.submission.file_urls.map((url: string, index: number) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition"
                          >
                            <span className="text-sm">📎 File {index + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignment.submission.final_score !== null ? (
                    isOverdue ? (
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Grade</h4>
                        <p className="text-3xl font-bold text-green-600">
                          {assignment.submission.final_score}/{assignment.max_score}
                        </p>
                        {assignment.submission.lecturer_feedback && (
                          <div className="mt-3">
                            <h5 className="font-semibold text-xs text-gray-600 mb-1">Feedback</h5>
                            <p className="text-sm text-gray-800">{assignment.submission.lecturer_feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm text-amber-800 mb-2">Results Pending</h4>
                        <p className="text-sm text-amber-700">
                          Your grade and feedback will be available after the assignment deadline:
                        </p>
                        <p className="text-sm font-semibold text-amber-900 mt-2">
                          {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ⏳ Your submission is awaiting grading by your lecturer.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  {isOverdue && !assignment.late_submission_allowed ? (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                      <p className="text-red-800 font-semibold mb-2">Deadline Passed</p>
                      <p className="text-sm text-red-700">
                        The deadline for this assignment has passed and late submissions are not allowed.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {isOverdue && assignment.late_submission_allowed && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                          <p className="text-orange-800 font-semibold mb-1">⚠️ Late Submission</p>
                          <p className="text-sm text-orange-700">
                            This is a late submission. A penalty of {assignment.late_penalty_percentage}% per day will be applied to your score.
                          </p>
                        </div>
                      )}

                      {/* Text Submission */}
                      <div className="space-y-2">
                        <Label htmlFor="submissionText">Text Submission (Optional)</Label>
                        <Textarea
                          id="submissionText"
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          placeholder="Enter your submission text here..."
                          rows={6}
                          disabled={submitting}
                        />
                      </div>

                      {/* File Upload - Updated to 10 files */}
                      <FileUpload
                        allowedTypes={assignment.allowed_file_types}
                        maxSizeMb={assignment.max_file_size_mb}
                        onUploadComplete={handleFilesUploaded}
                        maxFiles={10}
                      />

                      {uploadedFiles.length > 0 && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            ✅ {uploadedFiles.length} file(s) ready for submission
                          </p>
                        </div>
                      )}

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

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={submitting || (uploadedFiles.length === 0 && !submissionText.trim())}
                      >
                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Cost & Balance */}
            {assignment.submission_cost > 0 && (
              <Card className={`border-2 ${assignment.walletBalance >= assignment.submission_cost ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Cost</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Cost:</span>
                    <span className="text-2xl font-bold text-green-600">₦{assignment.submission_cost}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Your Balance:</span>
                    <span className={`text-2xl font-bold ${assignment.walletBalance >= assignment.submission_cost ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{assignment.walletBalance}
                    </span>
                  </div>
                  {assignment.walletBalance < assignment.submission_cost && !hasSubmitted && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-red-800 mb-2">Insufficient balance</p>
                      <Link href="/student/wallet">
                        <Button size="sm" className="w-full">
                          Fund Wallet
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* File Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">File Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Allowed Types:</span>
                  <p className="text-gray-600">{assignment.allowed_file_types.map((t: string) => t.toUpperCase()).join(', ')}</p>
                </div>
                <div>
                  <span className="font-semibold">Max File Size:</span>
                  <p className="text-gray-600">{assignment.max_file_size_mb} MB per file</p>
                </div>
                <div>
                  <span className="font-semibold">Max Files:</span>
                  <p className="font-bold text-green-600">Up to 10 files</p>
                </div>
                <div className="pt-2 mt-2 border-t">
                  <p className="text-xs text-gray-500">
                    💡 You can upload multiple files (PDFs, Word docs, images, etc.) in a single submission
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={assignment.plagiarism_check_enabled ? "text-green-600" : "text-gray-400"}>
                    {assignment.plagiarism_check_enabled ? "✅" : "❌"}
                  </span>
                  <span>Plagiarism Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={assignment.ai_grading_enabled ? "text-green-600" : "text-gray-400"}>
                    {assignment.ai_grading_enabled ? "✅" : "❌"}
                  </span>
                  <span>AI-Assisted Grading</span>
                </div>
              </CardContent>
            </Card>

            {/* Lecturer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lecturer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {assignment.profiles?.first_name?.charAt(0)}
                    {assignment.profiles?.last_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {assignment.profiles?.title && `${assignment.profiles.title}. `}
                      {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}