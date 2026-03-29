import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getCourseById, getCourseStudents } from '@/lib/actions/course.actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CourseStudentsPage({ params }: PageProps) {
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
  const [courseResult, studentsResult] = await Promise.all([
    getCourseById(id),
    getCourseStudents(id)
  ])

  const course = courseResult.course

  if (!course) {
    redirect('/lecturer/courses')
  }

  // Verify lecturer owns this course
  if (course.created_by !== user.id) {
    redirect('/lecturer/courses')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students = (studentsResult as any)?.data || []

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
              <p className="text-sm text-gray-600">Course Code: {course.code}</p>
            </div>
            <Badge className="bg-blue-600">{students.length} Students</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Enrolled Students</h2>
          <p className="text-gray-600">View and manage students in this course</p>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No students enrolled in this course yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {students.map((enrollment: any) => (
              <Card key={enrollment.student_id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {enrollment.student?.first_name} {enrollment.student?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{enrollment.student?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Matric: {enrollment.student?.matric_number}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}