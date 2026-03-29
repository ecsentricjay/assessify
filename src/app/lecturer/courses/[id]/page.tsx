import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getCourseById } from '@/lib/actions/course.actions'
import { getCourseAssignments } from '@/lib/actions/assignment.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import CopyEnrollmentCode from './copy-code'
import DeleteCourseButton from '@/components/delete-course-button'
import { formatDistanceToNow } from 'date-fns'

export default async function LecturerCourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  const { course, error } = await getCourseById(id)
  const { assignments } = await getCourseAssignments(id)

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'This course does not exist'}</p>
            <Link href="/lecturer/courses">
              <Button>Back to Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCourseLecturer = course.course_lecturers?.some(
    (cl: any) => cl.lecturer_id === user.id
  )

  if (!isCourseLecturer) {
    redirect('/lecturer/courses')
  }

  // Check if current user is primary lecturer
  const isPrimaryLecturer = course.course_lecturers?.some(
    (cl: any) => cl.lecturer_id === user.id && cl.is_primary
  )

  const assignmentCount = assignments?.length || 0
  const publishedCount = assignments?.filter((a: any) => a.is_published).length || 0
  const draftCount = assignmentCount - publishedCount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{course.course_title}</h1>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {course.course_code}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {course.department} • {course.level} Level • {course.session}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isPrimaryLecturer && (
                <DeleteCourseButton
                  courseId={course.id}
                  courseTitle={course.course_title}
                  courseCode={course.course_code}
                />
              )}
              <Link href="/lecturer/courses">
                <Button variant="outline">← Back to Courses</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Enrolled Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{course.enrollmentCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{assignmentCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {publishedCount} published, {draftCount} draft
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
              <p className="text-3xl font-bold">0</p>
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
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Course Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Course Information */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.description && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Description</h4>
                    <p className="text-gray-800">{course.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Faculty</h4>
                    <p className="text-gray-800">{course.faculty}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Department</h4>
                    <p className="text-gray-800">{course.department}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Level</h4>
                    <p className="text-gray-800">{course.level} Level</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Semester</h4>
                    <p className="text-gray-800">
                      {course.semester === 1 ? 'First' : 'Second'} Semester
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Credit Units</h4>
                    <p className="text-gray-800">{course.credit_units} Units</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Session</h4>
                    <p className="text-gray-800">{course.session}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Status</h4>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      course.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {course.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Enrolled Students */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Enrolled Students</CardTitle>
                  <Button variant="outline" size="sm">
                    View All ({course.enrollmentCount})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {course.enrollmentCount === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No students enrolled yet</p>
                    <p className="text-sm mt-2">
                      Share the enrollment code with your students
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {course.enrollmentCount} student(s) enrolled in this course
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Assignments</CardTitle>
                  <Link href={`/lecturer/assignments/create?course=${course.id}`}>
                    <Button size="sm">+ Create New</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {assignmentCount === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No assignments yet</p>
                    <p className="text-sm mt-2">Create your first assignment</p>
                    <Link href={`/lecturer/assignments/create?course=${course.id}`}>
                      <Button className="mt-4" size="sm">Create Assignment</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments?.map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{assignment.title}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                assignment.is_published
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {assignment.is_published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {assignment.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                            <span>Max: {assignment.max_score} pts</span>
                            <span>CA: {assignment.allocated_marks} marks</span>
                          </div>
                        </div>
                        <Link href={`/lecturer/assignments/${assignment.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Enrollment Code */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Enrollment Code</CardTitle>
                <p className="text-sm text-gray-600">
                  Share this code with students
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border-2 border-blue-300 mb-4">
                  <p className="text-3xl font-bold text-center text-blue-600 tracking-wider font-mono">
                    {course.enrollment_code}
                  </p>
                </div>
                <CopyEnrollmentCode code={course.enrollment_code} />
                <p className="text-xs text-gray-600 mt-3">
                  Students can use this code to enroll in your course instantly
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/lecturer/courses/${course.id}/assignments/create`}>
                  <Button className="w-full justify-start" variant="outline">
                    <span className="mr-2">📝</span>
                    Create Assignment
                  </Button>
                </Link>
                <Link href={`/lecturer/courses/${course.id}/tests/create`}>
                  <Button className="w-full justify-start" variant="outline">
                    <span className="mr-2">🎯</span>
                    Create Test
                  </Button>
                </Link>
                <Link href={`/lecturer/courses/${course.id}/students`}>
                  <Button className="w-full justify-start" variant="outline">
                    <span className="mr-2">👥</span>
                    View Students
                  </Button>
                </Link>
                <Link href={`/lecturer/courses/${course.id}/analytics`}>
                  <Button className="w-full justify-start" variant="outline">
                    <span className="mr-2">📊</span>
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Lecturers */}
            {course.course_lecturers && course.course_lecturers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Lecturers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {course.course_lecturers.map((cl: any) => (
                    <div
                      key={cl.lecturer_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {cl.profiles.title && `${cl.profiles.title}. `}
                          {cl.profiles.first_name} {cl.profiles.last_name}
                        </p>
                        {cl.is_primary && (
                          <span className="text-xs text-green-600 font-medium">
                            Primary Lecturer
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}