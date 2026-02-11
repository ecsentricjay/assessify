// Save as: src/app/student/scores/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getStudentCARecords } from '@/lib/actions/ca.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function StudentCADashboard() {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    redirect('/auth/login')
  }

  const { caRecords, summary, error } = await getStudentCARecords()

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading CA Records</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/student/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">CA Scores</h1>
              <p className="text-sm text-gray-600">Continuous Assessment Records</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info Banner */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.profile.first_name} {user.profile.last_name}
                </h2>
                <p className="text-sm text-gray-600">
                  {user.profile.matric_number} • {user.profile.level} Level • {user.profile.department}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Session</p>
                <p className="text-lg font-semibold">2024/2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary?.totalCourses || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total CA Marks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {summary?.totalCA?.toFixed(1) || '0.0'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average CA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {summary?.averageCA?.toFixed(1) || '0.0'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* No Records State */}
        {(!caRecords || caRecords.length === 0) && (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold mb-2">No CA Records Yet</h3>
              <p className="text-gray-600 mb-6">
                Your CA scores will appear here once your lecturers grade your submissions
              </p>
              <Link href="/student/courses">
                <Button>View My Courses</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* CA Records by Course */}
        {caRecords && caRecords.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Course CA Breakdown</h2>
              {/* Export button - will be implemented later */}
              {/* <Button variant="outline" size="sm">
                📄 Export Report
              </Button> */}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {caRecords
                .filter((record: any) => record.courses)
                .map((record: any) => {
                const course = record.courses
                const percentage = record.percentage || 0
                const totalPossible = course.total_ca_marks || 0

                // Calculate progress color
                let progressColor = 'bg-red-500'
                if (percentage >= 70) progressColor = 'bg-green-500'
                else if (percentage >= 50) progressColor = 'bg-yellow-500'
                else if (percentage >= 40) progressColor = 'bg-orange-500'

                return (
                  <Card key={record.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {course.course_code}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                              {course.semester === 1 ? 'First' : 'Second'} Semester
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{course.course_title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {course.session}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-green-600">
                            {record.total_ca_score?.toFixed(1) || '0.0'}
                          </p>
                          <p className="text-sm text-gray-600">out of {totalPossible}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${progressColor}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* CA Breakdown */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Attendance</p>
                          <p className="text-lg font-semibold">{course.attendance_marks} marks</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Assessments</p>
                          <p className="text-lg font-semibold">
                            {(course.total_ca_marks - course.attendance_marks).toFixed(1)} marks
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link href={`/student/scores/${course.id}`}>
                        <Button className="w-full" variant="outline">
                          View Detailed Breakdown →
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Info Card */}
        {caRecords && caRecords.length > 0 && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h4 className="font-semibold mb-2">About CA Scores</h4>
                  <p className="text-sm text-gray-700">
                    Continuous Assessment (CA) scores are calculated based on your performance in 
                    assignments, tests, and attendance. The total CA typically contributes 30% to 
                    your final grade. Click on any course to see a detailed breakdown of your scores.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}