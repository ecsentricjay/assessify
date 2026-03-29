// Save as: src/app/lecturer/analytics/[courseId]/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getCourseAnalytics } from '@/lib/actions/analytics.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function CourseAnalyticsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  const {
    course,
    summary,
    assignmentStats,
    gradeDistribution,
    studentPerformance,
    recentSubmissions,
    error
  } = await getCourseAnalytics(courseId)

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'Unable to load analytics'}</p>
            <Link href="/lecturer/analytics">
              <Button>Back to Analytics</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalGrades = Object.values(gradeDistribution || {}).reduce((a: number, b: number) => a + b, 0)

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
                Course Analytics • {course.session}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/lecturer/courses/${course.id}`}>
                <Button variant="outline">View Course</Button>
              </Link>
              <Link href="/lecturer/analytics">
                <Button variant="outline">← Back</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-gray-600">
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.totalStudents || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-gray-600">
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.totalAssignments || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-gray-600">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {summary?.publishedAssignments || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-gray-600">
                Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.totalSubmissions || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-gray-600">
                Graded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {summary?.gradedSubmissions || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-gray-600">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {summary?.pendingGrading || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="md:col-span-2 space-y-6">
            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {totalGrades === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No graded submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(gradeDistribution || {}).map(([grade, count]) => {
                      const percentage = totalGrades > 0 ? (count / totalGrades) * 100 : 0
                      const colors: any = {
                        A: 'bg-green-500',
                        B: 'bg-blue-500',
                        C: 'bg-yellow-500',
                        D: 'bg-orange-500',
                        F: 'bg-red-500'
                      }

                      return (
                        <div key={grade}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold w-6">{grade}</span>
                              <span className="text-gray-600">
                                ({count} student{count !== 1 ? 's' : ''})
                              </span>
                            </div>
                            <span className="font-semibold">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full transition-all ${colors[grade]}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {!assignmentStats || assignmentStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No assignments created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignmentStats.map((stat: any) => (
                      <div key={stat.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{stat.title}</h4>
                            <p className="text-xs text-gray-500">
                              Deadline: {new Date(stat.deadline).toLocaleDateString()}
                            </p>
                          </div>
                          <Link href={`/lecturer/assignments/${stat.id}/submissions`}>
                            <Button size="sm" variant="ghost">
                              View →
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-gray-600 text-xs">Submissions</p>
                            <p className="font-bold text-lg">{stat.totalSubmissions}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Graded</p>
                            <p className="font-bold text-lg text-green-600">
                              {stat.gradedSubmissions}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Pending</p>
                            <p className="font-bold text-lg text-orange-600">
                              {stat.pendingGrading}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Avg Score</p>
                            <p className="font-bold text-lg">
                              {stat.averageScore > 0 ? stat.averageScore.toFixed(1) : '-'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Submission Rate</span>
                            <span className="font-semibold">
                              {stat.submissionRate.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${stat.submissionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Top Performers & Recent */}
          <div className="space-y-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Students</CardTitle>
              </CardHeader>
              <CardContent>
                {!studentPerformance || studentPerformance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No graded submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentPerformance.map((student: any, index: number) => (
                      <div
                        key={student.studentId}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.matricNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {student.averageScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.gradedCount}/{student.submissionsCount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {!recentSubmissions || recentSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSubmissions.map((submission: any) => (
                      <div key={submission.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-sm">
                            {submission.profiles?.first_name} {submission.profiles?.last_name}
                          </p>
                          <Badge className={
                            submission.status === 'graded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }>
                            {submission.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/lecturer/courses/${course.id}`}>
                  <Button className="w-full justify-start" variant="outline">
                    📚 View Course
                  </Button>
                </Link>
                <Link href={`/lecturer/assignments/create?course=${course.id}`}>
                  <Button className="w-full justify-start" variant="outline">
                    ➕ Create Assignment
                  </Button>
                </Link>
                {summary && summary.pendingGrading > 0 && (
                  <Link href={`/lecturer/grading`}>
                    <Button className="w-full justify-start" variant="default">
                      📝 Grade Submissions ({summary.pendingGrading})
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}