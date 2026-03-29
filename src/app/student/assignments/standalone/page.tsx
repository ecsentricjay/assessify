// Save as: src/app/student/assignments/standalone/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function StudentStandaloneAssignmentsPage() {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Get student's standalone assignment submissions
  const { data: submissions, error } = await supabase
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
    .eq('student_id', user.id)
    .eq('assignments.is_standalone', true)
    .order('submitted_at', { ascending: false })

  const totalSubmissions = submissions?.length || 0
  const gradedCount = submissions?.filter(s => s.status === 'graded').length || 0
  const pendingCount = totalSubmissions - gradedCount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Standalone Submissions</h1>
              <p className="text-sm text-gray-600">View all your standalone assignment submissions</p>
            </div>
            <div className="flex gap-2">
              <Link href="/student/assignments/access">
                <Button>🔑 Enter New Code</Button>
              </Link>
              <Link href="/student/dashboard">
                <Button variant="outline">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalSubmissions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Graded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{gradedCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-800">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold">Error loading submissions</p>
                  <p className="text-sm">{error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && (!submissions || submissions.length === 0) && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t submitted any standalone assignments yet. Enter an assignment code to get started.
              </p>
              <Link href="/student/assignments/access">
                <Button size="lg">🔑 Enter Assignment Code</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Submissions List */}
        {!error && submissions && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map((submission: any) => {
              const assignment = submission.assignments
              if (!assignment) return null

              const isGraded = submission.status === 'graded'
              const deadline = new Date(assignment.deadline)
              const isOverdue = deadline < new Date()

              return (
                <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {assignment.display_course_code}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800">
                            Standalone
                          </Badge>
                          <Badge
                            className={
                              isGraded
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }
                          >
                            {isGraded ? '✅ Graded' : '⏳ Pending'}
                          </Badge>
                          {submission.is_late && (
                            <Badge className="bg-red-100 text-red-800">
                              Late ({submission.late_days}d)
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">{assignment.display_course_title}</p>
                      </div>

                      {isGraded && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Your Score</p>
                          <p className="text-3xl font-bold text-green-600">
                            {submission.final_score?.toFixed(1) || 0}
                          </p>
                          <p className="text-sm text-gray-600">out of {assignment.max_score}</p>
                        </div>
                      )}
                    </div>

                    {/* Submission Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Submitted</p>
                        <p className="text-sm font-medium">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Deadline</p>
                        <p className="text-sm font-medium">
                          {deadline.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {deadline.toLocaleTimeString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Access Code</p>
                        <p className="text-lg font-bold font-mono text-blue-600">
                          {assignment.access_code}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Lecturer</p>
                        <p className="text-sm font-medium">
                          {assignment.profiles?.title && `${assignment.profiles.title}. `}
                          {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                        </p>
                      </div>
                    </div>

                    {/* Feedback Preview (if graded) */}
                    {isGraded && submission.lecturer_feedback && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 mb-2">
                          📝 Lecturer Feedback:
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {submission.lecturer_feedback}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/student/submissions/standalone/${submission.id}`} className="flex-1">
                        <Button className="w-full" variant="default">
                          View Details
                        </Button>
                      </Link>
                      {submission.file_urls && submission.file_urls.length > 0 && (
                        <Button variant="outline" asChild>
                          <a href={submission.file_urls[0]} target="_blank" rel="noopener noreferrer">
                            📄 View File
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Help Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Need to Submit an Assignment?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-4">
              Have an assignment code from your lecturer? Enter it to access and submit the assignment.
            </p>
            <Link href="/student/assignments/access">
              <Button>🔑 Enter Assignment Code</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}