// app/admin/content/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/actions/admin-auth.actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  FileText, 
  ClipboardList, 
  Send,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function ContentOverviewPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Fetch all statistics
  const [
    coursesData,
    assignmentsData,
    testsData,
    assignmentSubsData,
    testAttemptsData,
    enrollmentsData
  ] = await Promise.all([
    supabase.from('courses').select('is_active', { count: 'exact' }),
    supabase.from('assignments').select('is_published', { count: 'exact' }),
    supabase.from('tests').select('is_published', { count: 'exact' }),
    supabase.from('assignment_submissions').select('plagiarism_score, status', { count: 'exact' }),
    supabase.from('test_attempts').select('status', { count: 'exact' }),
    supabase.from('course_enrollments').select('*', { count: 'exact', head: true })
  ])

  // Calculate statistics
  const totalCourses = coursesData.count || 0
  const activeCourses = coursesData.data?.filter(c => c.is_active).length || 0

  const totalAssignments = assignmentsData.count || 0
  const publishedAssignments = assignmentsData.data?.filter(a => a.is_published).length || 0

  const totalTests = testsData.count || 0
  const publishedTests = testsData.data?.filter(t => t.is_published).length || 0

  const totalSubmissions = assignmentSubsData.count || 0
  const gradedSubmissions = assignmentSubsData.data?.filter(s => s.status === 'graded').length || 0
  const flaggedSubmissions = assignmentSubsData.data?.filter(s => (s.plagiarism_score || 0) >= 70).length || 0

  const totalAttempts = testAttemptsData.count || 0
  const completedAttempts = testAttemptsData.data?.filter(t => t.status === 'completed').length || 0

  const totalEnrollments = enrollmentsData.count || 0

  // Get today's activity
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todaySubmissions } = await supabase
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', today.toISOString())

  const { count: todayAttempts } = await supabase
    .from('test_attempts')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', today.toISOString())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Management</h1>
        <p className="text-muted-foreground">
          Manage courses, assignments, tests, and monitor submissions
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {activeCourses} active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {publishedAssignments} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground">
              {publishedTests} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Activity</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(todaySubmissions || 0) + (todayAttempts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Submissions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grading Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {gradedSubmissions} of {totalSubmissions} graded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Submissions</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{flaggedSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              High plagiarism detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Courses Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Course Management</CardTitle>
                  <CardDescription>View and manage all courses</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-lg font-semibold">
                {totalCourses}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Courses</span>
                <span className="font-medium text-green-600">{activeCourses}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inactive Courses</span>
                <span className="font-medium text-gray-600">{totalCourses - activeCourses}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Enrollments</span>
                <span className="font-medium">{totalEnrollments}</span>
              </div>
              <Link href="/admin/content/courses">
                <Button className="w-full mt-4" variant="outline">
                  Manage Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Assignment Management</CardTitle>
                  <CardDescription>Monitor assignments and submissions</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-lg font-semibold">
                {totalAssignments}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Published</span>
                <span className="font-medium text-green-600">{publishedAssignments}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Draft</span>
                <span className="font-medium text-gray-600">{totalAssignments - publishedAssignments}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Submissions</span>
                <span className="font-medium">{totalSubmissions}</span>
              </div>
              <Link href="/admin/content/assignments">
                <Button className="w-full mt-4" variant="outline">
                  Manage Assignments
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tests Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Test Management</CardTitle>
                  <CardDescription>Monitor tests and student attempts</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-lg font-semibold">
                {totalTests}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Published</span>
                <span className="font-medium text-green-600">{publishedTests}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Draft</span>
                <span className="font-medium text-gray-600">{totalTests - publishedTests}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Attempts</span>
                <span className="font-medium">{totalAttempts}</span>
              </div>
              <Link href="/admin/content/tests">
                <Button className="w-full mt-4" variant="outline">
                  Manage Tests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Send className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Submissions Monitoring</CardTitle>
                  <CardDescription>Track and flag suspicious activity</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-lg font-semibold">
                {totalSubmissions + totalAttempts}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Today&apos;s Submissions</span>
                <span className="font-medium text-green-600">{(todaySubmissions || 0) + (todayAttempts || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Flagged (High Plagiarism)</span>
                <span className="font-medium text-red-600">{flaggedSubmissions}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Graded</span>
                <span className="font-medium">{gradedSubmissions}</span>
              </div>
              <Link href="/admin/content/submissions">
                <Button className="w-full mt-4" variant="outline">
                  Monitor Submissions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Platform Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">Content Created</p>
              <p className="text-2xl font-bold text-blue-700">
                {totalCourses + totalAssignments + totalTests}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Courses, Assignments, Tests
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-medium mb-1">Student Engagement</p>
              <p className="text-2xl font-bold text-green-700">
                {totalSubmissions + totalAttempts}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Total submissions & attempts
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-700">
                {totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0}%
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Assignments graded
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}