// Save as: src/app/lecturer/analytics/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getLecturerAnalytics } from '@/lib/actions/analytics.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function LecturerAnalyticsDashboard() {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  const { summary, courseStats, error } = await getLecturerAnalytics()

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Analytics</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/lecturer/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayName = user.profile.title
    ? `${user.profile.title} ${user.profile.last_name}`
    : `${user.profile.first_name} ${user.profile.last_name}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Performance metrics and insights</p>
            </div>
            <Link href="/lecturer/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome, {displayName}! 👋
                </h2>
                <p className="text-gray-600 mt-1">
                  {user.profile.department} • {user.profile.faculty}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">
                  ₦{summary?.totalEarnings?.toLocaleString() || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-700">
                {summary?.totalCourses || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-700">
                {summary?.totalStudents || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-700">
                {summary?.totalAssignments || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {summary?.publishedAssignments || 0} published
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-indigo-700">
                {summary?.totalTests || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {summary?.standaloneTests || 0} standalone • {summary?.courseTests || 0} course-based
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Test Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-pink-700">
                {summary?.totalTestAttempts || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {summary?.completedTestAttempts || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Pending Grading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-700">
                {summary?.pendingGrading || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {summary?.gradedSubmissions || 0} graded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Submission Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Submission Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Total Submissions</span>
                    <span className="font-bold">{summary?.totalSubmissions || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Graded</span>
                    <span className="font-bold text-green-600">
                      {summary?.gradedSubmissions || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${summary?.totalSubmissions ? (summary.gradedSubmissions / summary.totalSubmissions) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-bold text-orange-600">
                      {summary?.pendingGrading || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-orange-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${summary?.totalSubmissions ? (summary.pendingGrading / summary.totalSubmissions) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Grading Rate</span>
                  <span className="text-2xl font-bold text-green-600">
                    {summary?.totalSubmissions
                      ? ((summary.gradedSubmissions / summary.totalSubmissions) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                      {summary?.totalCourses || 0}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Courses Teaching</p>
                      <p className="font-semibold text-gray-900">This Semester</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                      {summary?.totalStudents || 0}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Students Reached</p>
                      <p className="font-semibold text-gray-900">Total Enrollment</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                      {summary?.publishedAssignments || 0}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Assignments</p>
                      <p className="font-semibold text-gray-900">Published</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                      {summary?.totalTests || 0}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Tests</p>
                      <p className="font-semibold text-gray-900">
                        {summary?.standaloneTests || 0} Standalone
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Performance */}
        {(!courseStats || courseStats.length === 0) ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold mb-2">No course data yet</h3>
              <p className="text-gray-600 mb-6">
                Create courses to see detailed analytics
              </p>
              <Link href="/lecturer/courses/create">
                <Button>Create Your First Course</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Course Performance</CardTitle>
                <Badge variant="secondary">{courseStats.length} courses</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseStats.map((stat: any) => (
                  <div
                    key={stat.course.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {stat.course.course_title}
                          </h4>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {stat.course.course_code}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {stat.course.session} • {stat.course.semester === 1 ? 'First' : 'Second'} Semester
                        </p>
                      </div>
                      <Link href={`/lecturer/analytics/${stat.course.id}`}>
                        <Button size="sm" variant="outline">
                          View Details →
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Students</p>
                        <p className="text-xl font-bold text-blue-600">
                          {stat.enrollmentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Assignments</p>
                        <p className="text-xl font-bold text-purple-600">
                          {stat.assignmentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Tests</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {stat.testCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Submissions</p>
                        <p className="text-xl font-bold text-green-600">
                          {stat.totalSubmissions}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Test Attempts</p>
                        <p className="text-xl font-bold text-pink-600">
                          {stat.testAttempts || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Pending</p>
                        <p className="text-xl font-bold text-orange-600">
                          {stat.pendingGrading}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Grading Progress</span>
                        <span className="font-semibold">
                          {stat.totalSubmissions > 0
                            ? ((stat.gradedSubmissions / stat.totalSubmissions) * 100).toFixed(0)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${stat.totalSubmissions > 0 ? (stat.gradedSubmissions / stat.totalSubmissions) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}