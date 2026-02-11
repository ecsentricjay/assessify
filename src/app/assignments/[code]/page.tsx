// Save as: src/app/assignments/[code]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getStandaloneAssignmentByCode, submitStandaloneAssignment } from '@/lib/actions/standalone-assignment.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import FileUpload from '@/components/assignment/file-upload'
import { formatDistanceToNow } from 'date-fns'

export default function PublicAssignmentAccessPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [assignment, setAssignment] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [submissionText, setSubmissionText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  useEffect(() => {
    async function loadData() {
      console.log('🚀 Starting to load assignment with code:', code)
      setLoading(true)
      
      try {
        // Get current user - REQUIRED
        console.log('👤 Fetching current user...')
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
          console.log('❌ No user found, redirecting to login')
          const returnUrl = encodeURIComponent(`/assignments/${code}`)
          router.push(`/auth/login?redirect=/assignments/${code}`)
          return
        }

        console.log('✅ User found:', currentUser.email)

        if (currentUser.profile?.role !== 'student') {
          console.log('❌ User is not a student:', currentUser.profile?.role)
          setError('Only students can submit assignments. Please login with a student account.')
          setLoading(false)
          return
        }

        setUser(currentUser)
        setStudentName(`${currentUser.profile?.first_name} ${currentUser.profile?.last_name}`)
        setStudentEmail(currentUser.email || '')

        // Get assignment
        console.log('📝 Fetching assignment...')
        const result = await getStandaloneAssignmentByCode(code)
        
        console.log('📊 Assignment result:', result)
        
        if (result.error) {
          console.log('❌ Error fetching assignment:', result.error)
          setError(result.error)
        } else {
          console.log('✅ Assignment loaded:', result.assignment?.title)
          setAssignment(result.assignment)
        }
      } catch (err) {
        console.error('💥 Unexpected error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (code) {
      loadData()
    }
  }, [code, router])

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

    const result = await submitStandaloneAssignment({
      assignmentId: assignment.id,
      submissionText: submissionText.trim() || undefined,
      fileUrls: uploadedFiles
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSuccess(result.message || 'Assignment submitted successfully!')
      // Redirect to view submission after 2 seconds
      setTimeout(() => {
        router.push(`/student/submissions/standalone/${result.submission.id}`)
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment...</p>
          <p className="text-sm text-gray-500 mt-2">Code: {code}</p>
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
            <h2 className="text-xl font-semibold mb-2">
              {error.includes('student') ? 'Access Restricted' : 'Assignment Not Found'}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-4">Access Code: {code}</p>
            {error.includes('student') ? (
              <Link href="/auth/login">
                <Button>Login as Student</Button>
              </Link>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Please check your access code and try again
                </p>
                <Link href="/student/assignments/access">
                  <Button>Try Another Code</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const deadline = new Date(assignment.deadline)
  const now = new Date()
  const isOverdue = now > deadline

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Assessify</h1>
              <p className="text-sm text-gray-600">Assignment Submission</p>
            </div>
            {user && (
              <Link href="/student/dashboard">
                <Button variant="outline" size="sm">Go to Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assignment Header */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {assignment.display_course_code}
                  </Badge>
                  <Badge className={isOverdue ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {isOverdue ? 'Overdue' : 'Open'}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {assignment.title}
                </h2>
                <p className="text-gray-700">{assignment.display_course_title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Access Code</p>
                <p className="text-2xl font-bold font-mono text-blue-600">
                  {assignment.access_code}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Assignment Details & Submission */}
          <div className="md:col-span-2 space-y-6">
            {/* Assignment Details */}
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
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Maximum Score</h4>
                    <p className="text-gray-800">{assignment.max_score} points</p>
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

            {/* Submission Form */}
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Work</CardTitle>
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
                          A penalty of {assignment.late_penalty_percentage}% per day will be applied.
                        </p>
                      </div>
                    )}

                    {/* Student Info - Auto-filled and read-only */}
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                          {user?.profile?.first_name?.charAt(0)}
                          {user?.profile?.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{studentName}</p>
                          <p className="text-sm text-gray-600">{user?.profile?.matric_number}</p>
                          <p className="text-xs text-gray-500">{studentEmail}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm bg-white p-3 rounded border border-blue-300">
                        <div>
                          <p className="text-gray-600 text-xs">Level</p>
                          <p className="font-medium">{user?.profile?.level} Level</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Department</p>
                          <p className="font-medium">{user?.profile?.department}</p>
                        </div>
                      </div>

                      <p className="text-xs text-blue-800 text-center">
                        ✓ Your details are automatically recorded with your submission
                      </p>
                    </div>

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

                    {/* File Upload */}
                    <FileUpload
                      allowedTypes={assignment.allowed_file_types}
                      maxSizeMb={assignment.max_file_size_mb}
                      onUploadComplete={handleFilesUploaded}
                      maxFiles={5}
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
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Lecturer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Lecturer</CardTitle>
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

            {/* File Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>File Requirements</CardTitle>
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
                {assignment.submission_cost > 0 && (
                  <div>
                    <span className="font-semibold">Submission Cost:</span>
                    <p className="text-green-600 font-bold">₦{assignment.submission_cost}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
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

            {/* Stats */}
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle>Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600 text-center">
                  {assignment.submissionCount || 0}
                </p>
                <p className="text-sm text-center text-gray-600 mt-1">
                  students have submitted
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}