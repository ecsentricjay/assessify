// app/admin/content/tests/tests-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Eye, EyeOff, Users, Calendar, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toggleTestStatus } from '@/lib/actions/admin-content.actions'
import { toast } from 'sonner'
import { format, isAfter, isBefore } from 'date-fns'
import type { TestWithDetails } from '@/lib/actions/admin-content.actions'

interface TestsClientProps {
  initialTests: TestWithDetails[]
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialStatus: string
}

export default function TestsClient({
  initialTests,
  initialTotal,
  initialPage,
  initialSearch,
  initialStatus
}: TestsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    router.push(`/admin/content/tests?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    router.push('/admin/content/tests')
  }

  const handleToggleStatus = async (testId: string, currentStatus: boolean) => {
    setTogglingId(testId)
    try {
      const result = await toggleTestStatus(testId, !currentStatus)
      
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update test')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setTogglingId(null)
    }
  }

  const getTestStatus = (test: TestWithDetails) => {
    const now = new Date()
    const start = new Date(test.start_time)
    const end = new Date(test.end_time)

    if (isBefore(now, start)) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' }
    if (isAfter(now, end)) return { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
    return { label: 'Active', color: 'bg-green-100 text-green-800' }
  }

  const totalPages = Math.ceil(initialTotal / 20)
  const hasFilters = search || status !== 'all'

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Tests ({initialTotal})</CardTitle>

        {/* Filters */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
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
        {initialTests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {initialTests.map((test) => {
              const testStatus = getTestStatus(test)
              
              return (
                <div
                  key={test.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{test.title}</h3>
                          <Badge variant={test.is_published ? 'default' : 'secondary'}>
                            {test.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          {test.is_standalone && (
                            <Badge variant="outline">Standalone</Badge>
                          )}
                          <Badge className={testStatus.color}>
                            {testStatus.label}
                          </Badge>
                        </div>

                        {test.courses ? (
                          <p className="text-sm text-muted-foreground mb-2">
                            {test.courses.course_code} - {test.courses.course_title}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground mb-2">
                            Standalone Test
                          </p>
                        )}

                        {test.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                            {test.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {test._count?.attempts || 0} attempts
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(test.start_time), 'MMM d, yyyy h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Ends: {format(new Date(test.end_time), 'MMM d, h:mm a')}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Created by {test.profiles.first_name} {test.profiles.last_name} • {format(new Date(test.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={test.is_published ? 'outline' : 'default'}
                      onClick={() => handleToggleStatus(test.id, test.is_published)}
                      disabled={togglingId === test.id}
                    >
                      {togglingId === test.id ? (
                        'Processing...'
                      ) : test.is_published ? (
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
              )
            })}
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
                  router.push(`/admin/content/tests?${params.toString()}`)
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
                  router.push(`/admin/content/tests?${params.toString()}`)
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