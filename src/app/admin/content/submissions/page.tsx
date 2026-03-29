// app/admin/content/submissions/page.tsx
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { getRecentSubmissions, getSubmissionStatistics } from '@/lib/actions/admin-content.actions'
import SubmissionsClient from './submissions-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function SubmissionsMonitoringPage() {
  const [submissionsResult, statsResult] = await Promise.all([
    getRecentSubmissions({ limit: 50 }),
    getSubmissionStatistics()
  ])

  const submissions = submissionsResult.success ? submissionsResult.submissions : []
  const stats = statsResult.success ? statsResult.statistics : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Submissions Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor recent submissions and flag suspicious activity
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Submissions</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssignmentSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Attempts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTestAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Submissions</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.todaySubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">
              In the last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.flaggedSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">
              High plagiarism score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Suspense fallback={<SubmissionsSkeleton />}>
        <SubmissionsClient initialSubmissions={submissions || []} />
      </Suspense>
    </div>
  )
}

function SubmissionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}