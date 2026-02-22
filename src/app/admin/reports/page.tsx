// app/admin/reports/page.tsx
import { Suspense } from 'react'
import {
  getFinancialReport,
  getUserReport,
  getContentReport,
  getRevenueByPeriod,
  getTopLecturers
} from '@/lib/actions/admin-reports.actions'
import PlatformReportsClient from './platform-reports-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  FileText,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function PlatformReportsPage({
  searchParams
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}) {
  const params = await searchParams
  const startDate = params.startDate
  const endDate = params.endDate

  const [financialResult, userResult, contentResult, revenueResult, lecturersResult] = await Promise.all([
    getFinancialReport({ startDate, endDate }),
    getUserReport(),
    getContentReport(),
    getRevenueByPeriod({ startDate, endDate, groupBy: 'day' }),
    getTopLecturers(10)
  ])

  const financial = financialResult.success ? financialResult.report ?? null : null
  const users = userResult.success ? userResult.report ?? null : null
  const content = contentResult.success ? contentResult.report ?? null : null
  const revenueData = revenueResult.success ? revenueResult.data ?? [] : []
  const topLecturers = lecturersResult.success ? lecturersResult.lecturers ?? [] : []

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Platform Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of financial, user, and content metrics
        </p>
      </div>

      {/* Financial Overview */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Financial Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₦{financial?.totalRevenue.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₦{financial?.platformEarnings.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Platform share
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Writer</CardTitle>
              <Sparkles className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                ₦{financial?.aiAssignmentRevenue.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI assignments
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lecturer Earnings</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ₦{financial?.lecturerEarnings.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lecturer share
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partner Earnings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₦{financial?.partnerEarnings.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Partner commissions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Statistics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          User Statistics
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Platform wide
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users?.students || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active learners
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lecturers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users?.lecturers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Content creators
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{users?.newUsersThisMonth || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly growth
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Statistics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          Content Statistics
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content?.totalCourses || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active courses
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {content?.totalAssignments || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {content?.totalTests || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Published
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Grade</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {content?.averageGrade.toFixed(1) || '0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Platform average
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts & Detailed Reports */}
      <Suspense fallback={<ReportsSkeleton />}>
        <PlatformReportsClient
          revenueData={revenueData}
          topLecturers={topLecturers}
          financialReport={financial}
          userReport={users}
          contentReport={content}
        />
      </Suspense>
    </div>
  )
}

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}