import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getLecturerCourses } from '@/lib/actions/course.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function LecturerCoursesPage() {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  const { courses, error } = await getLecturerCourses()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Courses</h1>
              <p className="text-sm text-gray-600">Manage your courses and students</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/lecturer/courses/create">
                <Button>+ Create Course</Button>
              </Link>
              <Link href="/lecturer/dashboard">
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
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{courses?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {courses?.filter((c: any) => c.courses?.is_active).length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Primary Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {courses?.filter((c: any) => c.is_primary).length || 0}
              </p>
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
                  <p className="font-semibold">Error loading courses</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && (!courses || courses.length === 0) && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first course to start managing students and assignments
              </p>
              <Link href="/lecturer/courses/create">
                <Button size="lg">+ Create Your First Course</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid */}
        {!error && courses && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => {
              const courseData = course.courses
              
              if (!courseData) return null

              return (
                <Card
                  key={courseData.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {courseData.course_code}
                          </Badge>
                          {course.is_primary && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">
                          {courseData.course_title}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={courseData.is_active ? 'default' : 'secondary'}
                        className={
                          courseData.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {courseData.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {courseData.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {courseData.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center justify-between">
                        <span>Level:</span>
                        <span className="font-medium">{courseData.level}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Semester:</span>
                        <span className="font-medium">
                          {courseData.semester === 1 ? 'First' : 'Second'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Credits:</span>
                        <span className="font-medium">{courseData.credit_units}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Session:</span>
                        <span className="font-medium">{courseData.session}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Link href={`/lecturer/courses/${courseData.id}`}>
                        <Button className="w-full" variant="outline">
                          View Course →
                        </Button>
                      </Link>
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