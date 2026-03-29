// app/admin/content/courses/page.tsx
import { Suspense } from 'react'
import { getAllCourses } from '@/lib/actions/admin-content.actions'
import CoursesClient from './courses-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, FileText, ClipboardList } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function CoursesManagementPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ''
  const status = (params.status as 'all' | 'active' | 'inactive') || 'all'
  const page = parseInt(params.page || '1')

  const coursesResult = await getAllCourses({ search, status, page, limit: 20 })

  const courses = coursesResult.success ? coursesResult.courses : []
  const total = coursesResult.success ? coursesResult.total : 0

  // Calculate statistics
  const activeCourses = (courses ?? []).filter(c => c.is_active).length
  const totalEnrollments = (courses ?? []).reduce((sum, c) => sum + (c._count?.enrollments || 0), 0)
  const totalAssignments = (courses ?? []).reduce((sum, c) => sum + (c._count?.assignments || 0), 0)
  const totalTests = (courses ?? []).reduce((sum, c) => sum + (c._count?.tests || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Course Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all platform courses
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              {activeCourses} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Total created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground">
              Total created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Suspense fallback={<CoursesTableSkeleton />}>
        <CoursesClient
          initialCourses={courses ?? []}
          initialTotal={total ?? 0}
          initialPage={page}
          initialSearch={search}
          initialStatus={status}
        />
      </Suspense>
    </div>
  )
}

function CoursesTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}