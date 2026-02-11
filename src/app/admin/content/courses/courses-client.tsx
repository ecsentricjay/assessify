// app/admin/content/courses/courses-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Power, PowerOff, Users, FileText, ClipboardList } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toggleCourseStatus } from '@/lib/actions/admin-content.actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { CourseWithDetails } from '@/lib/actions/admin-content.actions'

interface CoursesClientProps {
  initialCourses: CourseWithDetails[]
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialStatus: string
}

export default function CoursesClient({
  initialCourses,
  initialTotal,
  initialPage,
  initialSearch,
  initialStatus
}: CoursesClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    router.push(`/admin/content/courses?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    router.push('/admin/content/courses')
  }

  const handleToggleStatus = async (courseId: string, currentStatus: boolean) => {
    setTogglingId(courseId)
    try {
      const result = await toggleCourseStatus(courseId, !currentStatus)
      
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update course')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setTogglingId(null)
    }
  }

  const totalPages = Math.ceil(initialTotal / 20)
  const hasFilters = search || status !== 'all'

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Courses ({initialTotal})</CardTitle>

        {/* Filters */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={applyFilters}>Apply</Button>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>Clear</Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {initialCourses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No courses found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {initialCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{course.course_code}</h3>
                        <Badge variant={course.is_active ? 'default' : 'secondary'}>
                          {course.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{course.course_title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course._count?.enrollments || 0} students
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {course._count?.assignments || 0} assignments
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {course._count?.tests || 0} tests
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created by {course.profiles.first_name} {course.profiles.last_name} • {format(new Date(course.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={course.is_active ? 'destructive' : 'default'}
                    onClick={() => handleToggleStatus(course.id, course.is_active)}
                    disabled={togglingId === course.id}
                  >
                    {togglingId === course.id ? (
                      'Processing...'
                    ) : course.is_active ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-1" />
                        Suspend
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Page {initialPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={initialPage <= 1}
                onClick={() => {
                  const params = new URLSearchParams()
                  if (search) params.set('search', search)
                  if (status !== 'all') params.set('status', status)
                  params.set('page', String(initialPage - 1))
                  router.push(`/admin/content/courses?${params.toString()}`)
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={initialPage >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams()
                  if (search) params.set('search', search)
                  if (status !== 'all') params.set('status', status)
                  params.set('page', String(initialPage + 1))
                  router.push(`/admin/content/courses?${params.toString()}`)
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}