// Create this file: src/app/student/submissions/standalone/[id]/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function StudentStandaloneSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Get submission details
  const { data: submission, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      assignments (
        id,
        title,
        display_course_code,
        display_course_title,
        max_score,
        deadline,
        access_code,
        is_standalone,
        profiles:created_by (
          first_name,
          last_name,
          title
        )
      )
    `)
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Submission Not Found</h2>
            <p className="text-gray-600 mb-4">
              This submission does not exist or you don&apos;t have permission to view it.
            </p>
            <Link href="/student/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const assignment = submission.assignments
  const isGraded = submission.status === 'graded'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Submission Details</h1>
              <p className="text-sm text-gray-600">View your assignment submission</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">✅</div>
              <div>
                <h3 className="text-lg font-bold text-green-800">
                  Submission Successful!
                </h3>
                <p className="text-green-700">
                  Your assignment has been submitted successfully.
                  {submission.is_late && ` Note: This submission was ${submission.late_days} day(s) late.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {assignment.display_course_code}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    Standalone
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {assignment.display_course_title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Access Code</p>
                <p className="text-xl font-bold font-mono text-blue-600">
                  {assignment.access_code}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Submission Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Submission Status */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <Badge
                      className={
                        isGraded
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {isGraded ? '✅ Graded' : '⏳ Pending Review'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submitted</p>
                    <p className="font-medium">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(submission.submitted_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {submission.is_late && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Late Status</p>
                      <Badge className="bg-red-100 text-red-800">
                        {submission.late_days} day(s) late
                      </Badge>
                    </div>
                  )}
                  {isGraded && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {submission.final_score?.toFixed(1) || 0}/{assignment.max_score}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Your Submission */}
            <Card>
              <CardHeader>
                <CardTitle>Your Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.submission_text && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">
                      Text Submission
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{submission.submission_text}</p>
                    </div>
                  </div>
                )}

                {submission.file_urls && submission.file_urls.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">
                      Uploaded Files ({submission.file_urls.length})
                    </h4>
                    <div className="space-y-2">
                      {submission.file_urls.map((url: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">📄</span>
                            <span className="text-sm font-medium">
                              File {index + 1}
                            </span>
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View File →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback (if graded) */}
            {isGraded && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle>Lecturer Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  {submission.lecturer_feedback ? (
                    <div className="bg-white p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{submission.lecturer_feedback}</p>
                    </div>
                  ) : (
                    <p className="text-gray-600 italic">No feedback provided yet</p>
                  )}
                </CardContent>
              </Card>
            )}
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

            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Maximum Score</p>
                  <p className="font-bold">{assignment.max_score} points</p>
                </div>
                <div>
                  <p className="text-gray-600">Deadline</p>
                  <p className="font-medium">
                    {new Date(assignment.deadline).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(assignment.deadline).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">
                  If you have questions about your submission or grade, contact your lecturer.
                </p>
                <Link href="/student/dashboard">
                  <Button className="w-full" variant="outline">
                    Back to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}