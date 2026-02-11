// Replace your src/app/lecturer/assignments/[id]/page.tsx with this:

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getAssignmentById } from '@/lib/actions/assignment.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import AssignmentActions from './assignment-actions'

export default async function LecturerAssignmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  const { assignment, error } = await getAssignmentById(id)

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Assignment Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'This assignment does not exist'}</p>
            <Link href="/lecturer/courses">
              <Button>Back to Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user created this assignment
  if (assignment.created_by !== user.id) {
    redirect('/lecturer/courses')
  }

  const deadlineDate = new Date(assignment.deadline)
  const isOverdue = deadlineDate < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    assignment.is_published
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {assignment.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {assignment.courses?.course_code} • {assignment.courses?.course_title}
              </p>
            </div>
            <Link href={`/lecturer/courses/${assignment.course_id}`}>
              <Button variant="outline">← Back to Course</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{assignment.submissionCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Grading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Graded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">-</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column */}
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
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Type</h4>
                    <p className="text-gray-800 capitalize">{assignment.assignment_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Maximum Score</h4>
                    <p className="text-gray-800">{assignment.max_score} points</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Allocated CA Marks</h4>
                    <p className="text-gray-800">{assignment.allocated_marks} marks</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Deadline</h4>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                      {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isOverdue ? 'Overdue' : formatDistanceToNow(deadlineDate, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Late Submissions:</span>
                      <span className="font-medium">
                        {assignment.late_submission_allowed ? (
                          <span className="text-green-600">
                            Allowed ({assignment.late_penalty_percentage}% penalty/day)
                          </span>
                        ) : (
                          <span className="text-red-600">Not Allowed</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max File Size:</span>
                      <span className="font-medium">{assignment.max_file_size_mb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowed Types:</span>
                      <span className="font-medium">{assignment.allowed_file_types.join(', ').toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submission Cost:</span>
                      <span className="font-medium">
                        {assignment.submission_cost > 0 ? `₦${assignment.submission_cost}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plagiarism Check:</span>
                      <span className={`font-medium ${assignment.plagiarism_check_enabled ? 'text-green-600' : 'text-gray-600'}`}>
                        {assignment.plagiarism_check_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI Grading:</span>
                      <span className={`font-medium ${assignment.ai_grading_enabled ? 'text-green-600' : 'text-gray-600'}`}>
                        {assignment.ai_grading_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submissions */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Submissions</CardTitle>
                  <Link href={`/lecturer/assignments/${assignment.id}/submissions`}>
                    <Button size="sm" variant="outline">
                      View All ({assignment.submissionCount})
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {assignment.submissionCount === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-3">📝</div>
                    <p className="font-medium">No submissions yet</p>
                    <p className="text-sm mt-1">
                      Submissions will appear here when students submit
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {assignment.submissionCount} submission(s) received
                    </p>
                    <Link href={`/lecturer/assignments/${assignment.id}/submissions`}>
                      <Button className="w-full">
                        📋 View & Grade Submissions
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/lecturer/assignments/${assignment.id}/submissions`}>
                  <Button className="w-full justify-start" variant="default">
                    <span className="mr-2">📋</span>
                    View All Submissions ({assignment.submissionCount || 0})
                  </Button>
                </Link>
                
                <AssignmentActions
                  assignmentId={assignment.id}
                  isPublished={assignment.is_published}
                  courseId={assignment.course_id}
                />
              </CardContent>
            </Card>

            {/* Created By */}
            <Card>
              <CardHeader>
                <CardTitle>Created By</CardTitle>
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
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(assignment.created_at), { addSuffix: true })}
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