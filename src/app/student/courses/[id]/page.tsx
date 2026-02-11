// Replace: src/app/student/courses/[id]/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getCourseById } from '@/lib/actions/course.actions'
import { getCourseAssignments } from '@/lib/actions/assignment.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { FileText } from 'lucide-react'


export default async function StudentCourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    redirect('/auth/login')
  }

  const { course, error } = await getCourseById(id)
  
  // Fetch course assignments
  const { assignments } = await getCourseAssignments(id)
  const publishedAssignments = assignments?.filter((a: any) => a.is_published) || []

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'This course does not exist'}</p>
            <Link href="/student/courses">
              <Button>Back to Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get course lecturers
  const lecturers = (course.course_lecturers || []).filter((l: any) => l.profiles)

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
            <Link href="/student/courses">
              <Button variant="outline">← Back to Courses</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{publishedAssignments.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">-</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                CA Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">0/100</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Course Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Course Information */}
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.description ? (
                  <p className="text-gray-800">{course.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available</p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Faculty</h4>
                    <p className="text-gray-800">{course.faculty}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Department</h4>
                    <p className="text-gray-800">{course.department}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Credit Units</h4>
                    <p className="text-gray-800">{course.credit_units} Units</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Semester</h4>
                    <p className="text-gray-800">
                      {course.semester === 1 ? 'First' : 'Second'} Semester
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Assignments</CardTitle>
                  <span className="text-sm text-gray-600">{publishedAssignments.length} assignment(s)</span>
                </div>
              </CardHeader>
              <CardContent>
                {publishedAssignments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-3">📝</div>
                    <p className="font-medium">No assignments yet</p>
                    <p className="text-sm mt-1">
                      Assignments will appear here when your lecturer creates them
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {publishedAssignments.slice(0, 3).map((assignment: any) => {
                      const deadline = new Date(assignment.deadline)
                      const isOverdue = deadline < new Date()
                      
                      return (
                        <div
                          key={assignment.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm">{assignment.title}</h4>
                            <Badge className={isOverdue ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                              {isOverdue ? 'Overdue' : 'Open'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {assignment.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              Due: {formatDistanceToNow(deadline, { addSuffix: true })}
                            </span>
                            <Link href={`/student/assignments/${assignment.id}`}>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                    
                    {publishedAssignments.length > 3 && (
                      <div className="text-center pt-2">
                        <Link href="/student/assignments">
                          <Button variant="outline" size="sm">
                            View All {publishedAssignments.length} Assignments
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tests */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tests</CardTitle>
                  <span className="text-sm text-gray-600">0 tests</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">🎯</div>
                  <p className="font-medium">No tests available</p>
                  <p className="text-sm mt-1">
                    Tests will appear here when scheduled by your lecturer
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Lecturer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Course Lecturer{lecturers.length > 1 ? 's' : ''}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lecturers.length === 0 ? (
                  <p className="text-sm text-gray-500">No lecturer assigned</p>
                ) : (
                  lecturers.map((lecturer: any) => {
                    if (!lecturer.profiles) return null
                    
                    const firstName = lecturer.profiles.first_name || ''
                    const lastName = lecturer.profiles.last_name || ''
                    const title = lecturer.profiles.title || ''
                    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

                    return (
                      <div
                        key={lecturer.lecturer_id}
                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                            {initials || '??'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {title && `${title}. `}
                              {firstName} {lastName}
                            </p>
                            {lecturer.is_primary && (
                              <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                Primary Lecturer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/student/assignments">
                  <Button className="w-full justify-start" variant="outline">
                    <span className="mr-2">📝</span>
                    View All My Assignments
                  </Button>
                </Link>
                <Link href={`/student/courses/${course.id}/tests`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    View Tests
                  </Button>
                </Link>
                <Link href={`/student/scores/${course.id}`}>
                  <Button className="w-full justify-start" variant="outline">
                    <span className="mr-2">📊</span>
                    View My CA Scores
                  </Button>
                </Link>
                <Link href="/student/courses">
                  <Button className="w-full justify-start" variant="outline">
                    <span className="mr-2">📚</span>
                    My Other Courses
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Assignments Available</span>
                  <span className="font-bold">{publishedAssignments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Submitted</span>
                  <span className="font-bold">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Current CA Score</span>
                  <span className="font-bold text-green-600">0/100</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}