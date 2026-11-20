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
import { Sparkles, GraduationCap, ArrowRight } from 'lucide-react'
import { isSubscriptionRequired } from '@/lib/services/cbt-access.service'
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

  const isJambite = user.profile?.student_type === 'jambite'

  // Get enrolled courses (Jambites have none)
  const { courses } = isJambite ? { courses: [] as any[] } : await getStudentCourses()
  const enrolledCount = courses?.length || 0

  // Get wallet balance
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  const walletBalance = wallet?.balance || 0

  const cbtFree = !(await isSubscriptionRequired())

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Use client component wrapper for header */}
      <DashboardHeader
        title="Assessify"
        subtitle={isJambite ? 'JAMB Prep Dashboard' : 'Student Dashboard'}
        userName={`${user.profile.first_name} ${user.profile.last_name}`}
        userDetail={isJambite ? 'Jambite' : (user.profile.matric_number || '')}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.profile.first_name}! 👋
          </h2>
          <p className="text-gray-600">
            {isJambite
              ? [
                  [user.profile.jamb_institution_1, user.profile.jamb_institution_2].filter(Boolean).join(' / '),
                  [user.profile.jamb_course_1, user.profile.jamb_course_2].filter(Boolean).join(' / '),
                ].filter(Boolean).join(' • ')
              : `${user.profile.department} • ${user.profile.level} Level`}
          </p>
        </div>

        {/* JAMB CBT campaign banner — Jambites only */}
        {isJambite && (
        <Link href="/student/cbt/courses" className="group mb-8 block overflow-hidden rounded-2xl bg-linear-to-br from-[#030D2A] via-[#071650] to-[#1565F5] p-6 text-white shadow-lg transition hover:shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/10 p-3">
                <GraduationCap className="h-8 w-8 text-yellow-300" />
              </div>
              <div>
                <span className="mb-2 inline-block rounded-full bg-yellow-300 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-gray-900">
                  {cbtFree ? 'Free for every student' : 'JAMB CBT Practice'}
                </span>
                <h3 className="text-2xl font-extrabold leading-tight sm:text-3xl">Improve your JAMB score 🎯</h3>
                <p className="mt-1 max-w-xl text-sm text-blue-100 sm:text-base">
                  {cbtFree ? 'Free timed' : 'Timed'} JAMB CBT practice with worked solutions and instant scoring. Pick a subject and start in seconds.
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-[#071650] transition group-hover:bg-yellow-300">
              Start practising <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
        )}

        {/* Stats Grid */}
        {isJambite ? (
          <div className="mb-8 max-w-sm">
            <StudentWalletCard balance={walletBalance} />
          </div>
        ) : (
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
        )}

        {/* NEW: AI Assignment Writer Highlight Card */}
        {!isJambite && (
        <Card className="mb-8 border-2 border-primary/20 bg-linear-to-br from-primary/5 via-primary/3 to-background shadow-lg">
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

        )}

        {/* NEW: AI Study Aid Highlight Card */}
        <Card className="mb-8 border-2 border-blue-300 bg-linear-to-br from-blue-50 via-indigo-50 to-blue-100 shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl text-blue-900">AI Study Aid</CardTitle>
                    <Badge className="bg-blue-600 text-white text-xs">NEW</Badge>
                  </div>
                  <CardDescription className="text-base mt-1 text-blue-800">
                    Transform study materials into AI-generated practice questions
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Upload images or documents</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Auto text extraction (OCR)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Instant question generation</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span>MCQ or Theory format</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span>Detailed explanations included</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span>Track your practice history</span>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-medium text-blue-700">Get Started</p>
                  <p className="text-xs text-blue-600">3 free attempts included</p>
                  <p className="text-xs text-blue-500">Additional purchases available</p>
                </div>
                <Link href="/student/study-aid">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Studying Now
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick links for Jambites */}
        {isJambite && (
          <p className="mb-4 text-sm text-gray-600">
            Got admission? <Link href="/student/profile" className="font-semibold text-blue-600 hover:underline">Upgrade to a full student account</Link>
          </p>
        )}
        {isJambite && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { href: '/student/cbt/courses', emoji: '📝', title: 'Practice Tests', desc: 'Pick a subject and start' },
              { href: '/student/cbt/leaderboard', emoji: '🏆', title: 'Leaderboard', desc: 'See how you rank' },
              { href: '/student/wallet', emoji: '💰', title: 'Wallet', desc: 'Fund & manage balance' },
              { href: '/student/profile', emoji: '⚙️', title: 'Profile', desc: 'Update your JAMB choices' },
            ].map((l) => (
              <Link key={l.href} href={l.href}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="text-3xl mb-1">{l.emoji}</div>
                    <CardTitle className="text-base">{l.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{l.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Actions (university students only) */}
        {!isJambite && (
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

        )}

        {/* Promo Code Card for Referrals */}
        <div className="mb-8">
          {/* Placeholder - PromoCodeCard moved to focus on core features */}
        </div>

        {/* Recent Activity */}
        {!isJambite && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityContent userId={user.id} enrolledCount={enrolledCount} />
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  )
}