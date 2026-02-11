// app/admin/page.tsx
import { requireAdmin } from '@/lib/actions/admin-auth.actions'
import { 
  getPlatformStats, 
  getRecentActivity,
  getActiveUsersToday,
  getGrowthStats
} from '@/lib/actions/admin-stats.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/admin/stats-card'
import { ActivityFeed } from '@/components/admin/activity-feed'
import { QuickActions } from '@/components/admin/quick-actions'
import Link from 'next/link'
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  FileText,
  ClipboardCheck,
  Wallet,
  ArrowRight
} from 'lucide-react'

export default async function AdminDashboard() {
  const admin = await requireAdmin()

  // Fetch all statistics
  const [statsResult, activityResult, activeUsersResult, growthResult] = await Promise.all([
    getPlatformStats(),
    getRecentActivity(10),
    getActiveUsersToday(),
    getGrowthStats()
  ])

  const stats = statsResult.success ? statsResult.data : null
  const activities = activityResult.success ? activityResult.data : []
  const activeToday = activeUsersResult.success ? activeUsersResult.data : 0
  const growth = growthResult.success ? growthResult.data : null

  // Get admin name
  const adminName = `${admin.profile.first_name || ''} ${admin.profile.last_name || ''}`.trim() || 'Admin'

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {adminName}! 👋
          </h2>
          <p className="text-blue-100">
            Here&apos;s what&apos;s happening with your platform today.
          </p>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats?.users?.total || 0}
            description={`${stats?.users?.students || 0} students, ${stats?.users?.lecturers || 0} lecturers`}
            icon={Users}
            iconColor="text-blue-500"
            trend={growth?.userGrowth ? {
              value: growth.userGrowth,
              isPositive: growth.userGrowth > 0
            } : undefined}
          />

          <StatsCard
            title="Total Courses"
            value={stats?.courses || 0}
            description={`${stats?.enrollments || 0} total enrollments`}
            icon={BookOpen}
            iconColor="text-green-500"
          />

          <StatsCard
            title="Platform Revenue"
            value={`₦${(stats?.platformRevenue || 0).toLocaleString()}`}
            description="All-time earnings (27%)"
            icon={DollarSign}
            iconColor="text-yellow-500"
            trend={growth?.revenueGrowth ? {
              value: growth.revenueGrowth,
              isPositive: growth.revenueGrowth > 0
            } : undefined}
          />

          <StatsCard
            title="Active Today"
            value={activeToday}
            description="Users online today"
            icon={TrendingUp}
            iconColor="text-purple-500"
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Assignments"
            value={stats?.assignments || 0}
            description="Platform-wide"
            icon={FileText}
            iconColor="text-orange-500"
          />

          <StatsCard
            title="Total Tests"
            value={stats?.tests || 0}
            description="Platform-wide"
            icon={ClipboardCheck}
            iconColor="text-pink-500"
          />

          <StatsCard
            title="Total Transactions"
            value={stats?.totalTransactions || 0}
            description="All-time"
            icon={TrendingUp}
            iconColor="text-indigo-500"
          />

          <StatsCard
            title="Wallet Balance"
            value={`₦${(stats?.totalWalletBalance || 0).toLocaleString()}`}
            description="Total across all users"
            icon={Wallet}
            iconColor="text-teal-500"
          />
        </div>

        {/* User Breakdown Card */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.users?.students || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Students</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {stats.users?.lecturers || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Lecturers</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">
                    {stats.users?.admins || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Admins</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-700">
                    {stats.users?.partners || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Partners</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Growth Card */}
        {growth && growth.newUsersThisMonth > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Growth This Month
                  </h3>
                  <p className="text-sm text-blue-800">
                    {growth.newUsersThisMonth} new users • ₦{growth.revenueThisMonth?.toLocaleString()} revenue
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">
                    {growth.userGrowth > 0 ? '+' : ''}{growth.userGrowth}%
                  </div>
                  <p className="text-xs text-blue-600">User growth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Manage Users</p>
                    <p className="text-2xl font-bold mt-1">{stats?.users?.total || 0}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500 opacity-20" />
                </div>
                <div className="flex items-center gap-2 mt-4 text-blue-600 text-sm font-medium">
                  Go to Users <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/finances">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Finances</p>
                    <p className="text-2xl font-bold mt-1">₦{(stats?.platformRevenue || 0).toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-yellow-500 opacity-20" />
                </div>
                <div className="flex items-center gap-2 mt-4 text-blue-600 text-sm font-medium">
                  Go to Finances <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/partners">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Partners</p>
                    <p className="text-2xl font-bold mt-1">{stats?.users?.partners || 0}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-orange-500 opacity-20" />
                </div>
                <div className="flex items-center gap-2 mt-4 text-blue-600 text-sm font-medium">
                  Go to Partners <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={activities} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}