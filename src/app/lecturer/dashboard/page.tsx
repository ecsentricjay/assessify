// app/lecturer/dashboard/page.tsx
// SERVER COMPONENT - No 'use client' directive

import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getLecturerCourses } from '@/lib/actions/course.actions'
import { getLecturerStandaloneAssignments } from '@/lib/actions/standalone-assignment.actions'
import { getWalletSummary } from '@/lib/actions/wallet.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
// ✅ Import the client component wrapper
import DashboardHeader from '@/components/dashboard/dashboard-header'
import { RecentSubmissionsContent } from '@/components/dashboard/recent-submissions-content'

export default async function LecturerDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (user.profile?.role !== 'lecturer') {
    redirect('/')
  }

  const { courses } = await getLecturerCourses()
  const courseCount = courses?.length || 0

  // Get standalone assignments count
  const { assignments } = await getLecturerStandaloneAssignments()
  const standaloneCount = assignments?.length || 0

  // Get wallet/earnings summary
  const walletResult = await getWalletSummary(user.id)
  const totalEarnings = walletResult.success && walletResult.summary ? walletResult.summary.totalEarned : 0

  // Get submission counts
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { count: totalSubmissions } = await adminClient
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .in('assignment_id', (await adminClient
      .from('assignments')
      .select('id')
      .eq('created_by', user.id)).data?.map(a => a.id) || [])
    .eq('status', 'submitted')

  const { count: pendingGrading } = await adminClient
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .in('assignment_id', (await adminClient
      .from('assignments')
      .select('id')
      .eq('created_by', user.id)).data?.map(a => a.id) || [])
    .eq('status', 'submitted')
    .is('final_score', null)

  const displayName = user.profile.title
    ? `${user.profile.title} ${user.profile.last_name}`
    : `${user.profile.first_name} ${user.profile.last_name}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Use client component wrapper for header */}
      <DashboardHeader
        title="Assessify"
        subtitle="Lecturer Dashboard"
        userName={`${user.profile.first_name} ${user.profile.last_name}`}
        userDetail={user.profile.staff_id || ''}
        userTitle={user.profile.title}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {displayName}! 👋
          </h2>
          <p className="text-gray-600">
            {user.profile.department} • {user.profile.faculty}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                My Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{courseCount}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Standalone Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{standaloneCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalSubmissions || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Grading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{pendingGrading || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">₦{totalEarnings.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">📚</div>
              <CardTitle>My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Manage your courses and students</p>
              <Link href="/lecturer/courses">
                <Button className="w-full">View Courses</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl">📋</div>
                {standaloneCount > 0 && (
                  <Badge className="bg-purple-600 text-white">{standaloneCount}</Badge>
                )}
              </div>
              <CardTitle>Standalone Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Quick assignments without course setup</p>
              <Link href="/lecturer/assignments/standalone">
                <Button className="w-full">View Standalone</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="text-4xl mb-2">➕</div>
              <CardTitle>Create Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Create a new assignment for your students</p>
              <Link href="/lecturer/assignments/create">
                <Button className="w-full">Create New</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 bg-green-50">
            <CardHeader>
              <div className="text-4xl mb-2">🎯</div>
              <CardTitle>Create Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Create a new CBT test</p>
              <Link href="/lecturer/tests/create">
                <Button className="w-full">Create New</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl">🎯</div>
              </div>
              <CardTitle>Standalone Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Quick tests without course setup</p>
              <Link href="/lecturer/tests/standalone">
                <Button className="w-full">View Standalone Tests</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">📊</div>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View performance analytics</p>
              <Link href="/lecturer/analytics">
                <Button className="w-full">View Analytics</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">💰</div>
              <CardTitle>Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Track your earnings and withdrawals</p>
              <Link href="/lecturer/earnings">
                <Button className="w-full">View Earnings</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">⚙️</div>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Update your profile information</p>
              <Link href="/lecturer/profile">
                <Button className="w-full">Edit Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSubmissionsContent userId={user.id} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}