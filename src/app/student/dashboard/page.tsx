// app/student/dashboard/page.tsx
// SERVER COMPONENT - No 'use client' directive

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getStudentCourses } from '@/lib/actions/course.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import { Sparkles } from 'lucide-react'
import { RecentActivityContent } from '@/components/dashboard/recent-activity-content'
import { StudentWalletCard } from '@/components/dashboard/student-wallet-card'

export default async function StudentDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (user.profile?.role !== 'student') {
    redirect('/') // Redirect non-students
  }

  // Get enrolled courses
  const { courses } = await getStudentCourses()
  const enrolledCount = courses?.length || 0

  // Get wallet balance
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  const walletBalance = wallet?.balance || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Use client component wrapper for header */}
      <DashboardHeader
        title="Assessify"
        subtitle="Student Dashboard"
        userName={`${user.profile.first_name} ${user.profile.last_name}`}
        userDetail={user.profile.matric_number || ''}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.profile.first_name}! 👋
          </h2>
          <p className="text-gray-600">
            {user.profile.department} • {user.profile.level} Level
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Enrolled Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{enrolledCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
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

          <StudentWalletCard balance={walletBalance} />
        </div>

        {/* NEW: AI Assignment Writer Highlight Card */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-background shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">AI Assignment Writer</CardTitle>
                  </div>
                  <CardDescription className="text-base mt-1">
                    Generate high-quality academic assignments with AI assistance
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Unique content per generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Proper academic citations</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Multiple citation styles</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>100-10,000 words range</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Professional formatting</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Instant generation (30-60s)</span>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Pricing</p>
                  <p className="text-2xl font-bold text-primary">₦100</p>
                  <p className="text-xs text-muted-foreground">per 1-1000 words</p>
                </div>
                <Link href="/student/assignment-writer">
                  <Button className="w-full" size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Writing Now
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">📚</div>
              <CardTitle>My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View and manage your enrolled courses</p>
              <Link href="/student/courses">
                <Button className="w-full">View Courses</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">📝</div>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Submit and track your assignments</p>
              <div className="space-y-2">
                <Link href="/student/assignments/access">
                  <Button className="w-full" variant="default">
                    🔑 Enter Assignment Code
                  </Button>
                </Link>
                <Link href="/student/assignments/standalone">
                  <Button className="w-full" variant="outline">
                    View Standalone Submissions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">📋</div>
              <CardTitle>My Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View submission history and spending</p>
              <Link href="/student/submissions">
                <Button className="w-full">View Submissions</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">🎯</div>
              <CardTitle>Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Take online tests and view results</p>
              <Link href="/student/tests">
                <Button className="w-full">View Tests</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">📊</div>
              <CardTitle>CA Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Check your continuous assessment scores</p>
              <Link href="/student/scores">
                <Button className="w-full">View Scores</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-4xl mb-2">💰</div>
              <CardTitle>Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Manage your wallet and transactions</p>
              <Link href="/student/wallet">
                <Button className="w-full">Manage Wallet</Button>
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
              <Link href="/student/profile">
                <Button className="w-full">Edit Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityContent userId={user.id} enrolledCount={enrolledCount} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}