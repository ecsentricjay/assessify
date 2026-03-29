// Update: src/app/lecturer/assignments/standalone/page.tsx
// Remove the submission count warning, keep everything else the same

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getLecturerStandaloneAssignments } from '@/lib/actions/standalone-assignment.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import CopyButton from './copy-button'
import DeleteAssignmentButton from '@/components/delete-assignment-button'

export default async function LecturerStandaloneAssignmentsPage() {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  const { assignments, error } = await getLecturerStandaloneAssignments()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Standalone Assignments</h1>
              <p className="text-sm text-gray-600">Quick assignments without course setup</p>
            </div>
            <div className="flex gap-2">
              <Link href="/lecturer/assignments/create">
                <Button>+ Create New</Button>
              </Link>
              <Link href="/lecturer/dashboard">
                <Button variant="outline">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {(!assignments || assignments.length === 0) && (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-4">📝</div>
              <h3 className="text-2xl font-semibold mb-2">No standalone assignments yet</h3>
              <p className="text-gray-600 mb-6">
                Create quick assignments without setting up courses
              </p>
              <Link href="/lecturer/assignments/create">
                <Button>Create Your First Assignment</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {assignments && assignments.length > 0 && (
          <div className="space-y-4">
            {assignments.map((assignment: any) => {
              const deadline = new Date(assignment.deadline)
              const isOverdue = deadline < new Date()
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              const shareableLink = `${baseUrl}/assignments/${assignment.access_code}`

              return (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
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
                          <Badge className={isOverdue ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                            {isOverdue ? 'Closed' : 'Open'}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">{assignment.display_course_title}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{assignment.submissionCount}</p>
                        <p className="text-xs text-gray-500">submissions</p>
                      </div>
                    </div>

                    {/* Access Code */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Access Code:</p>
                          <p className="text-2xl font-bold font-mono text-blue-600">
                            {assignment.access_code}
                          </p>
                        </div>
                        <CopyButton text={assignment.access_code} label="📋 Copy" />
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-300">
                        <p className="text-xs text-gray-600 mb-1">Shareable Link:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={shareableLink}
                            readOnly
                            className="flex-1 text-xs bg-white border rounded px-2 py-1"
                          />
                          <CopyButton text={shareableLink} label="📋" />
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Max Score</p>
                        <p className="text-lg font-bold">{assignment.max_score}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Submissions</p>
                        <p className="text-lg font-bold">{assignment.submissionCount}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Deadline</p>
                        <p className="text-xs font-bold">{deadline.toLocaleDateString()}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Created</p>
                        <p className="text-xs font-bold">
                          {formatDistanceToNow(new Date(assignment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-4 mb-4 text-xs">
                      {assignment.ai_grading_enabled && (
                        <span className="flex items-center gap-1 text-green-600">
                          ✅ AI Grading
                        </span>
                      )}
                      {assignment.plagiarism_check_enabled && (
                        <span className="flex items-center gap-1 text-blue-600">
                          ✅ Plagiarism Check
                        </span>
                      )}
                      {assignment.late_submission_allowed && (
                        <span className="flex items-center gap-1 text-orange-600">
                          ⏰ Late Allowed ({assignment.late_penalty_percentage}%/day)
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/lecturer/assignments/standalone/${assignment.id}`} className="flex-1">
                        <Button className="w-full" variant="default">
                          View Submissions
                        </Button>
                      </Link>
                      <Link href={`/assignments/${assignment.access_code}/preview`} target="_blank">
                        <Button variant="outline">
                          👁️ Preview
                        </Button>
                      </Link>
                      <DeleteAssignmentButton 
                        assignmentId={assignment.id}
                        assignmentTitle={assignment.title}
                        submissionCount={assignment.submissionCount}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}