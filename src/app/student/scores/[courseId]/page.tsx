// Save as: src/app/student/scores/[courseId]/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getCourseCADetails } from '@/lib/actions/ca.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function CourseCADetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    redirect('/auth/login')
  }

  const { caRecord, assignments, tests, breakdown, error } = await getCourseCADetails(courseId)

  if (error || !caRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">CA Record Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'No CA record for this course'}</p>
            <Link href="/student/scores">
              <Button>Back to CA Scores</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const course = caRecord.courses
  const percentage = caRecord.percentage || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{course.course_title}</h1>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {course.course_code}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                CA Score Breakdown • {course.session}
              </p>
            </div>
            <Link href="/student/scores">
              <Button variant="outline">← Back to All Scores</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total CA Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-700">
                {caRecord.total_ca_score?.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                out of {course.total_ca_marks}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Percentage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">
                {percentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {breakdown?.assignmentMarks?.toFixed(1) || '0.0'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {breakdown?.testMarks?.toFixed(1) || '0.0'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Assignments & Tests */}
          <div className="md:col-span-2 space-y-6">
            {/* Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Scores</CardTitle>
              </CardHeader>
              <CardContent>
                {!assignments || assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-5xl mb-3">📝</div>
                    <p className="font-medium">No graded assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                            <p className="text-xs text-gray-500 capitalize mt-1">
                              {assignment.type.replace('_', ' ')}
                            </p>
                          </div>
                          <Badge className={
                            assignment.submission?.status === 'graded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }>
                            {assignment.submission?.status === 'graded' ? 'Graded' : 'Pending'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 text-xs mb-1">Your Score</p>
                            <p className="font-bold text-lg">
                              {assignment.score?.toFixed(1) || '0.0'}/{assignment.maxScore}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs mb-1">CA Marks Earned</p>
                            <p className="font-bold text-lg text-green-600">
                              {assignment.caMarksEarned?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs mb-1">Allocated</p>
                            <p className="font-bold text-lg text-gray-700">
                              {assignment.allocatedMarks}
                            </p>
                          </div>
                        </div>

                        {assignment.submission?.lecturer_feedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs font-semibold text-blue-800 mb-1">Feedback:</p>
                            <p className="text-sm text-gray-800">
                              {assignment.submission.lecturer_feedback}
                            </p>
                          </div>
                        )}

                        {assignment.gradedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Graded {formatDistanceToNow(new Date(assignment.gradedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tests - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Test Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <div className="text-5xl mb-3">🎯</div>
                  <p className="font-medium">No tests yet</p>
                  <p className="text-sm mt-1">Test scores will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Course Code:</span>
                  <span className="font-medium">{course.course_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Units:</span>
                  <span className="font-medium">{course.credit_units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Semester:</span>
                  <span className="font-medium">
                    {course.semester === 1 ? 'First' : 'Second'} Semester
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session:</span>
                  <span className="font-medium">{course.session}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{course.department}</span>
                </div>
              </CardContent>
            </Card>

            {/* CA Breakdown */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle>CA Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-gray-700">Attendance:</span>
                  <span className="font-bold text-lg">{course.attendance_marks}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-gray-700">Assignments:</span>
                  <span className="font-bold text-lg text-green-600">
                    {breakdown?.assignmentMarks?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-gray-700">Tests:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {breakdown?.testMarks?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-purple-300">
                  <span className="font-semibold text-gray-800">Total CA:</span>
                  <span className="font-bold text-2xl text-purple-700">
                    {caRecord.total_ca_score?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <p className="text-xs text-center text-gray-600 mt-2">
                  out of {course.total_ca_marks} marks
                </p>
              </CardContent>
            </Card>

            {/* Performance Grade */}
            <Card className={`border-2 ${
              percentage >= 70 ? 'bg-green-50 border-green-300' :
              percentage >= 50 ? 'bg-yellow-50 border-yellow-300' :
              percentage >= 40 ? 'bg-orange-50 border-orange-300' :
              'bg-red-50 border-red-300'
            }`}>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className={`text-6xl font-bold mb-2 ${
                  percentage >= 70 ? 'text-green-600' :
                  percentage >= 50 ? 'text-yellow-600' :
                  percentage >= 40 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {percentage >= 70 ? 'A' :
                   percentage >= 60 ? 'B' :
                   percentage >= 50 ? 'C' :
                   percentage >= 40 ? 'D' : 'F'}
                </p>
                <p className="text-sm text-gray-700">
                  {percentage >= 70 ? 'Excellent!' :
                   percentage >= 50 ? 'Good Work!' :
                   percentage >= 40 ? 'Fair' : 'Needs Improvement'}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Based on {percentage.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/student/courses/${course.id}`}>
                  <Button className="w-full" variant="outline">
                    📚 View Course
                  </Button>
                </Link>
                <Link href={`/student/courses/${course.id}/assignments`}>
                  <Button className="w-full" variant="outline">
                    📝 View Assignments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Last Updated */}
        <Card className="mt-6 bg-gray-50">
          <CardContent className="pt-4 text-center text-sm text-gray-600">
            Last updated {formatDistanceToNow(new Date(caRecord.updated_at), { addSuffix: true })}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}