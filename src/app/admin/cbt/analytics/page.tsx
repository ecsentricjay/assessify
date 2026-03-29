'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  Users,
  BarChart3,
  Tag,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { getCBTAnalytics, generateAnalyticsCSV } from '@/lib/actions/admin-cbt-analytics.actions'
import type {
  AnalyticsData,
  SummaryStats,
  RevenueDataPoint,
  BundleRevenue,
  PromoCodePerformance,
  TopReferrer,
  TopBundle,
  TopStudent,
  RecentActivity,
} from '@/lib/actions/admin-cbt-analytics.actions'

interface DateFilter {
  label: string
  getValue: () => { startDate?: string; endDate?: string }
}

const DATE_FILTERS: Record<string, DateFilter> = {
  today: {
    label: 'Today',
    getValue: () => {
      const date = new Date().toISOString().split('T')[0]
      return { startDate: date, endDate: date }
    },
  },
  week: {
    label: 'Last 7 Days',
    getValue: () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 7)
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      }
    },
  },
  month: {
    label: 'Last 30 Days',
    getValue: () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 30)
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      }
    },
  },
  quarter: {
    label: 'Last 90 Days',
    getValue: () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 90)
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      }
    },
  },
  allTime: {
    label: 'All Time',
    getValue: () => ({}),
  },
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${(Math.round(value * 100) / 100).toFixed(2)}%`
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
}: {
  title: string
  value: string | number
  icon: any
  color: string
  subtitle?: string
  trend?: { value: number; direction: 'up' | 'down' }
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h3 className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold">{value}</span>
              {trend && (
                <span className={`flex items-center gap-1 text-sm ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {formatPercent(trend.value)}
                </span>
              )}
            </h3>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
      </div>
      <div className="h-80 bg-gray-200 rounded-lg" />
      <div className="h-80 bg-gray-200 rounded-lg" />
    </div>
  )
}

export default function AdminCBTAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const dateFilter = DATE_FILTERS[selectedPeriod]
      const dateRange = dateFilter ? dateFilter.getValue() : {}

      const result = await getCBTAnalytics(dateRange)

      if (!result.success) {
        setError(result.error || 'Failed to fetch analytics')
        return
      }

      setData(result.data)
      setLastUpdated(new Date())
      toast.success('Analytics updated')
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('Failed to fetch analytics data')
      toast.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  // Initial load
  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchAnalytics()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, selectedPeriod])

  // Export to CSV
  const handleExport = async () => {
    if (!data) {
      toast.error('No data to export')
      return
    }

    try {
      const csv = await generateAnalyticsCSV(data)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cbt-analytics-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Analytics exported successfully')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export analytics')
    }
  }

  // Time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return 'Never'
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">{error}</h3>
              <p className="text-sm text-red-700 mt-1">Please try again or contact support if the problem persists.</p>
            </div>
            <Button onClick={() => fetchAnalytics()} variant="outline" className="ml-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CBT Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights into practice system performance</p>
            </div>
            <Button onClick={handleExport} className="gap-2" variant="outline">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DATE_FILTERS).map(([key, filter]) => (
                    <SelectItem key={key} value={key}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchAnalytics} variant="outline" size="sm">
              Refresh
            </Button>

            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>

            <div className="text-xs text-gray-500 ml-auto">
              Last updated: {getTimeSinceUpdate()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard
            title="Total Revenue"
            value={formatCurrency(data.summary.totalRevenue)}
            icon={DollarSign}
            color="text-green-600"
            subtitle={`${data.summary.bundlesSold} bundles sold`}
          />
          <SummaryCard
            title="Active Subscriptions"
            value={data.summary.activeSubscriptions}
            icon={Users}
            color="text-blue-600"
            subtitle={`${data.summary.expiringSubscriptions} expiring soon`}
          />
          <SummaryCard
            title="Practice Sessions"
            value={data.summary.totalSessions}
            icon={BarChart3}
            color="text-purple-600"
            subtitle={`Avg Score: ${formatPercent(data.summary.avgSessionScore)}`}
          />
          <SummaryCard
            title="Promo Code Earnings"
            value={formatCurrency(data.summary.promoEarnings)}
            icon={Tag}
            color="text-orange-600"
            subtitle={`${data.summary.activePromoCodes} active codes`}
          />
          <SummaryCard
            title="Bundles Sold"
            value={data.summary.bundlesSold}
            icon={Package}
            color="text-pink-600"
          />
          <SummaryCard
            title="Avg Revenue Per User"
            value={formatCurrency(data.summary.avgRevenuePerUser)}
            icon={TrendingUp}
            color="text-indigo-600"
          />
        </div>

        {/* Revenue History Chart */}
        {data.revenueOverTime.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Over Time
              </CardTitle>
              <CardDescription>Daily revenue from bundle purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue (₦)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Two Column Section: Revenue by Bundle & Promo Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Bundle */}
          {data.revenueByBundle.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Revenue by Bundle
                </CardTitle>
                <CardDescription>Sales and revenue per bundle</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.revenueByBundle}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bundleName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₦)" />
                    <Bar dataKey="sold" fill="#10b981" name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Promo Impact */}
          {(data.promoImpact.withPromo > 0 || data.promoImpact.withoutPromo > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Promo Code Impact
                </CardTitle>
                <CardDescription>Revenue comparison with and without promos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'With Promo', value: data.promoImpact.withPromo },
                        { name: 'Without Promo', value: data.promoImpact.withoutPromo },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'With Promo', value: data.promoImpact.withPromo },
                        { name: 'Without Promo', value: data.promoImpact.withoutPromo },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Total Discount</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {formatCurrency(data.promoImpact.totalDiscount)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-xs text-orange-600 font-medium">Commission Paid</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      {formatCurrency(data.promoImpact.commissionPaid)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sessions & Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions Over Time */}
          {data.sessionsOverTime.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Sessions Over Time
                </CardTitle>
                <CardDescription>Daily completed practice sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.sessionsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" name="Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Performance Distribution */}
          {data.performanceDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Students by score ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.performanceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#f59e0b" name="Number of Students" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Course Popularity */}
        {data.coursePopularity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Course Popularity</CardTitle>
              <CardDescription>Sessions completed per course</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.coursePopularity}
                  layout="vertical"
                  margin={{ left: 200, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="courseName" type="category" width={190} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" fill="#3b82f6" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Promo Code Performance Table */}
        {data.promoPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Promo Code Performance
              </CardTitle>
              <CardDescription>Detailed promo code usage and earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search promo codes or owners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Promo Code</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-right">Uses</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Conversion</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.promoPerformance
                      .filter(
                        (promo) =>
                          promo.promoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          promo.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((promo) => (
                        <TableRow key={promo.id}>
                          <TableCell className="font-mono font-bold">{promo.promoCode}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{promo.ownerName}</p>
                              <p className="text-xs text-gray-500">{promo.ownerRole}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{promo.totalUses}</TableCell>
                          <TableCell className="text-right">{formatCurrency(promo.commissionEarned)}</TableCell>
                          <TableCell className="text-right">{formatPercent(promo.conversionRate)}</TableCell>
                          <TableCell>
                            <Badge variant={promo.status === 'Active' ? 'default' : 'secondary'}>
                              {promo.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {data.promoPerformance.filter(
                (promo) =>
                  promo.promoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  promo.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No promo codes found matching "{searchTerm}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top Performers Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Referrers */}
          {data.topReferrers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Referrers
                </CardTitle>
                <CardDescription>By commission earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topReferrers.map((referrer, idx) => (
                    <div key={referrer.id} className="flex items-center gap-3 pb-4 border-b last:border-0">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{referrer.name}</p>
                        <p className="text-xs text-gray-500">
                          {referrer.code} • {referrer.uses} uses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-green-600">
                          {formatCurrency(referrer.earnings)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Bundles */}
          {data.topBundles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Top Bundles
                </CardTitle>
                <CardDescription>By sales count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topBundles.map((bundle, idx) => (
                    <div key={bundle.id} className="flex items-center gap-3 pb-4 border-b last:border-0">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{bundle.name}</p>
                        <p className="text-xs text-gray-500">{bundle.sales} sales</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-blue-600">
                          {formatCurrency(bundle.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Students */}
          {data.topStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Students
                </CardTitle>
                <CardDescription>By sessions completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topStudents.map((student, idx) => (
                    <div key={student.id} className="flex items-center gap-3 pb-4 border-b last:border-0">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        <p className="text-xs text-gray-500">
                          {student.sessions} sessions • {formatPercent(student.avgScore)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        {data.recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest transactions and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-600">
                        {activity.userName} • {activity.timestamp}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="font-bold text-lg">{formatCurrency(activity.amount)}</p>
                      <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
