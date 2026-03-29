import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getCourseById } from '@/lib/actions/course.actions'
import { getCourseAnalytics } from '@/lib/actions/analytics.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CourseAnalyticsPage({ params }: PageProps) {
  // Await params first
  const { id } = await params

  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (user.profile?.role !== 'lecturer') {
    redirect('/')
  }

  // Parallel data fetching for better performance
  const [courseResult, analyticsData] = await Promise.all([
    getCourseById(id),
    getCourseAnalytics(id)
  ])

  const course = courseResult.course

  if (!course) {
    redirect('/lecturer/courses')
  }

  // Verify lecturer owns this course
  if (course.created_by !== user.id) {
    redirect('/lecturer/courses')
  }

  // Handle error response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((analyticsData as any)?.error) {
    redirect('/lecturer/courses')
  }

  const {
    summary = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = (analyticsData as any) || {}

  const {
    totalStudents = 0,
    totalAssignments = 0,
    publishedAssignments = 0,
    totalTests = 0,
    totalSubmissions = 0,
    gradedSubmissions = 0,
    pendingGrading = 0,
    completedTestAttempts = 0,
  } = summary || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href={`/lecturer/courses/${id}`}
                className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
              >
                ← Back to Course
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <p className="text-sm text-gray-600">Analytics & Performance</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
              <p className="text-xs text-gray-600 mt-1">Enrolled in course</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{totalAssignments}</p>
              <p className="text-xs text-gray-600 mt-1">{publishedAssignments} published</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{totalSubmissions}</p>
              <p className="text-xs text-gray-600 mt-1">{gradedSubmissions} graded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tests Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{totalTests}</p>
              <p className="text-xs text-gray-600 mt-1">{completedTestAttempts} completed attempts</p>
            </CardContent>
          </Card>
        </div>

        {/* Submission Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-blue-600">{totalSubmissions}</p>
                </div>
                <Badge className="bg-blue-600">All</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Pending Grading</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingGrading}</p>
                </div>
                <Badge className="bg-yellow-600">Awaiting</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Graded</p>
                  <p className="text-2xl font-bold text-green-600">{gradedSubmissions}</p>
                </div>
                <Badge className="bg-green-600">Completed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Information */}
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Course Code</p>
                <p className="font-medium text-gray-900">{course.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Department</p>
                <p className="font-medium text-gray-900">{course.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="font-medium text-gray-900">{course.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Credit Units</p>
                <p className="font-medium text-gray-900">{course.credit_units || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}