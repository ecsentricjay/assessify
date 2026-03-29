// app/admin/content/assignments/assignments-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Eye, EyeOff, Send, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toggleAssignmentStatus } from '@/lib/actions/admin-content.actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { AssignmentWithDetails } from '@/lib/actions/admin-content.actions'

interface AssignmentsClientProps {
  initialAssignments: AssignmentWithDetails[]
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialStatus: string
}

export default function AssignmentsClient({
  initialAssignments,
  initialTotal,
  initialPage,
  initialSearch,
  initialStatus
}: AssignmentsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    router.push(`/admin/content/assignments?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    router.push('/admin/content/assignments')
  }

  const handleToggleStatus = async (assignmentId: string, currentStatus: boolean) => {
    setTogglingId(assignmentId)
    try {
      const result = await toggleAssignmentStatus(assignmentId, !currentStatus)
      
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update assignment')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setTogglingId(null)
    }
  }

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  const totalPages = Math.ceil(initialTotal / 20)
  const hasFilters = search || status !== 'all'

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Assignments ({initialTotal})</CardTitle>

        {/* Filters */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
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
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="unpublished">Unpublished</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={applyFilters}>Apply</Button>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>Clear</Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {initialAssignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No assignments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {initialAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                        <Badge variant={assignment.is_published ? 'default' : 'secondary'}>
                          {assignment.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {assignment.is_standalone && (
                          <Badge variant="outline">Standalone</Badge>
                        )}
                        {isDeadlinePassed(assignment.deadline) && (
                          <Badge variant="destructive">Closed</Badge>
                        )}
                      </div>

                      {assignment.courses ? (
                        <p className="text-sm text-muted-foreground mb-2">
                          {assignment.courses.course_code} - {assignment.courses.course_title}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-2">
                          Standalone Assignment
                        </p>
                      )}

                      <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                        {assignment.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" />
                          {assignment._count?.submissions || 0} submissions
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {format(new Date(assignment.deadline), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        Created by {assignment.profiles.first_name} {assignment.profiles.last_name} • {format(new Date(assignment.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={assignment.is_published ? 'outline' : 'default'}
                    onClick={() => handleToggleStatus(assignment.id, assignment.is_published)}
                    disabled={togglingId === assignment.id}
                  >
                    {togglingId === assignment.id ? (
                      'Processing...'
                    ) : assignment.is_published ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Publish
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
                  router.push(`/admin/content/assignments?${params.toString()}`)
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
                  router.push(`/admin/content/assignments?${params.toString()}`)
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