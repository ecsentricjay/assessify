// app/admin/reports/platform-reports-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Calendar, TrendingUp, Users, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { exportReportToCSV } from '@/lib/actions/admin-reports.actions'
import { toast } from 'sonner'
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
  ResponsiveContainer,
  Legend
} from 'recharts'
import type { 
  RevenueByPeriod, 
  FinancialReport,
  UserReport,
  ContentReport
} from '@/lib/actions/admin-reports.actions'

interface PlatformReportsClientProps {
  revenueData: RevenueByPeriod[]
  topLecturers: Array<{ id: string; name: string; avatar: string | null; total: number }>
  financialReport: FinancialReport | null
  userReport: UserReport | null
  contentReport: ContentReport | null
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export default function PlatformReportsClient({
  revenueData,
  topLecturers,
  financialReport,
  userReport,
  contentReport
}: PlatformReportsClientProps) {
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const handleDateFilter = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    router.push(`/admin/reports?${params.toString()}`)
  }

  const clearDateFilter = () => {
    setStartDate('')
    setEndDate('')
    router.push('/admin/reports')
  }

  const handleExportReport = async () => {
    setIsExporting(true)
    try {
      const result = await exportReportToCSV('financial')
      
      if (result.success && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename || 'platform_report.csv'
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Report exported successfully')
      } else {
        toast.error(result.error || 'Failed to export report')
      }
    } catch (error) {
      toast.error('An error occurred while exporting')
    } finally {
      setIsExporting(false)
    }
  }

  // Prepare user distribution data for pie chart
  const userDistribution = userReport ? [
    { name: 'Students', value: userReport.students, color: '#3b82f6' },
    { name: 'Lecturers', value: userReport.lecturers, color: '#8b5cf6' },
    { name: 'Admins', value: userReport.admins, color: '#10b981' }
  ] : []

  // Prepare content distribution data
  const contentDistribution = contentReport ? [
    { name: 'Courses', value: contentReport.totalCourses },
    { name: 'Assignments', value: contentReport.totalAssignments },
    { name: 'Tests', value: contentReport.totalTests },
    { name: 'Submissions', value: contentReport.totalSubmissions }
  ] : []

  return (
    <div className="space-y-6">
      {/* Date Filter & Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Controls
            </CardTitle>
            <Button
              onClick={handleExportReport}
              disabled={isExporting}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDateFilter}>Apply Filter</Button>
              {(startDate || endDate) && (
                <Button variant="outline" onClick={clearDateFilter}>Clear</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Content
          </TabsTrigger>
        </TabsList>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No revenue data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                    />
                    <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Revenue"
                      dot={{ fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Lecturers */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Earning Lecturers</CardTitle>
            </CardHeader>
            <CardContent>
              {topLecturers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No lecturer earnings data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topLecturers.map((lecturer, index) => (
                    <div
                      key={lecturer.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={lecturer.avatar || undefined} />
                          <AvatarFallback>
                            {lecturer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lecturer.name}</p>
                          <p className="text-xs text-muted-foreground">Lecturer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ₦{lecturer.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Total earnings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          {financialReport && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="font-medium">Total Revenue</span>
                    <span className="text-lg font-bold text-green-700">
                      ₦{financialReport.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="font-medium">Withdrawals</span>
                    <span className="text-lg font-bold text-red-700">
                      -₦{financialReport.totalWithdrawals.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="font-medium">Refunds</span>
                    <span className="text-lg font-bold text-orange-700">
                      -₦{financialReport.totalRefunds.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="font-bold text-lg">Net Revenue</span>
                    <span className="text-2xl font-bold text-primary">
                      ₦{financialReport.netRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {userDistribution.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No user data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {userReport && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Students</span>
                      <span className="text-xl font-bold text-blue-600">{userReport.students}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">Lecturers</span>
                      <span className="text-xl font-bold text-purple-600">{userReport.lecturers}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Admins</span>
                      <span className="text-xl font-bold text-green-600">{userReport.admins}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <span className="font-medium">New This Month</span>
                      <span className="text-xl font-bold text-orange-600">+{userReport.newUsersThisMonth}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Active Users</span>
                      <span className="text-xl font-bold">{userReport.activeUsers}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Content Distribution Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Content Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {contentDistribution.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No content data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={contentDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name="Count" radius={[8, 8, 0, 0]}>
                      {contentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Content Stats */}
          {contentReport && (
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">Total Courses</p>
                    <p className="text-3xl font-bold text-blue-700">{contentReport.totalCourses}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-1">Total Assignments</p>
                    <p className="text-3xl font-bold text-purple-700">{contentReport.totalAssignments}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-1">Total Tests</p>
                    <p className="text-3xl font-bold text-green-700">{contentReport.totalTests}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium mb-1">Average Grade</p>
                    <p className="text-3xl font-bold text-orange-700">{contentReport.averageGrade.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}