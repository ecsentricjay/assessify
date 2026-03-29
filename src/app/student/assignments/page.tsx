import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getStudentAssignments } from '@/lib/actions/submission.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function StudentAssignmentsPage() {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    redirect('/auth/login')
  }

  const { assignments, error } = await getStudentAssignments()

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Assignments</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/student/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingAssignments = assignments?.filter(a => !a.hasSubmitted && !a.isOverdue) || []
  const overdueAssignments = assignments?.filter(a => !a.hasSubmitted && a.isOverdue) || []
  const submittedAssignments = assignments?.filter(a => a.hasSubmitted) || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Assignments</h1>
              <p className="text-sm text-gray-600">View and submit your assignments</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
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
                Total Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{assignments?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{pendingAssignments.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{overdueAssignments.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{submittedAssignments.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        {assignments && assignments.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-4">📝</div>
              <h3 className="text-2xl font-semibold mb-2">No assignments yet</h3>
              <p className="text-gray-600 mb-6">
                Assignments from your courses will appear here
              </p>
              <Link href="/student/courses">
                <Button>View My Courses</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-blue-600">📋</span>
              Pending Assignments ({pendingAssignments.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingAssignments.map((assignment: any) => {
                const deadline = new Date(assignment.deadline)
                return (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {assignment.courses.course_code}
                        </Badge>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Pending
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {assignment.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Course:</span>
                          <span className="font-medium">{assignment.courses.course_title}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Due:</span>
                          <span className="font-medium text-orange-600">
                            {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Time Left:</span>
                          <span className="font-medium">
                            {formatDistanceToNow(deadline, { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Marks:</span>
                          <span className="font-medium">{assignment.allocated_marks} marks</span>
                        </div>
                        {assignment.submission_cost > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Cost:</span>
                            <span className="font-medium text-green-600">₦{assignment.submission_cost}</span>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/student/assignments/${assignment.id}`}>
                        <Button className="w-full">
                          View & Submit
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Overdue Assignments */}
        {overdueAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              Overdue Assignments ({overdueAssignments.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {overdueAssignments.map((assignment: any) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {assignment.courses.course_code}
                      </Badge>
                      <Badge className="bg-red-100 text-red-800">
                        Overdue
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Course:</span>
                        <span className="font-medium">{assignment.courses.course_title}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Was Due:</span>
                        <span className="font-medium text-red-600">
                          {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}
                        </span>
                      </div>
                      {assignment.late_submission_allowed && (
                        <div className="bg-orange-50 p-2 rounded text-xs text-orange-800">
                          Late submission allowed ({assignment.late_penalty_percentage}% penalty/day)
                        </div>
                      )}
                    </div>
                    
                    {assignment.late_submission_allowed ? (
                      <Link href={`/student/assignments/${assignment.id}`}>
                        <Button className="w-full" variant="outline">
                          Submit Late
                        </Button>
                      </Link>
                    ) : (
                      <Button className="w-full" disabled>
                        Deadline Passed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Submitted Assignments */}
        {submittedAssignments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-green-600">✅</span>
              Submitted Assignments ({submittedAssignments.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {submittedAssignments.map((assignment: any) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {assignment.courses.course_code}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        Submitted
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(assignment.submission.submitted_at), { addSuffix: true })}
                        </span>
                      </div>
                      {assignment.submission.final_score !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-bold text-green-600">
                            {assignment.submission.final_score}/{assignment.max_score}
                          </span>
                        </div>
                      )}
                      {assignment.submission.status === 'submitted' && (
                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                          Awaiting grading
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/student/assignments/${assignment.id}`}>
                      <Button className="w-full" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}