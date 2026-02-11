// app/admin/finances/reports/financial-reports-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Download, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { exportReportToCSV } from '@/lib/actions/admin-reports.actions'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import type { RevenueByPeriod, FinancialReport } from '@/lib/actions/admin-reports.actions'

interface FinancialReportsClientProps {
  revenueData: RevenueByPeriod[]
  topLecturers: Array<{ id: string; name: string; avatar: string | null; total: number }>
  financialReport: FinancialReport | null
}

export default function FinancialReportsClient({
  revenueData,
  topLecturers,
  financialReport
}: FinancialReportsClientProps) {
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const handleDateFilter = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    router.push(`/admin/finances/reports?${params.toString()}`)
  }

  const clearDateFilter = () => {
    setStartDate('')
    setEndDate('')
    router.push('/admin/finances/reports')
  }

  const handleExportFinancialReport = async () => {
    setIsExporting(true)
    try {
      const result = await exportReportToCSV('financial')
      
      if (result.success && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename || 'financial_report.csv'
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

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
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

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Over Time</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportFinancialReport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No revenue data available for the selected period</p>
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
                <YAxis
                  tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => {
                    const date = new Date(label)
                    return date.toLocaleDateString()
                  }}
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

      {/* Transaction Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No transaction data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => {
                    const date = new Date(label)
                    return date.toLocaleDateString()
                  }}
                />
                <Legend />
                <Bar
                  dataKey="transactions"
                  fill="#3b82f6"
                  name="Transactions"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Lecturers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earning Lecturers</CardTitle>
        </CardHeader>
        <CardContent>
          {topLecturers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No lecturer earnings data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topLecturers.map((lecturer, index) => (
                <div
                  key={lecturer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <Avatar>
                      <AvatarImage src={lecturer.avatar || undefined} />
                      <AvatarFallback>
                        {lecturer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{lecturer.name}</p>
                      <p className="text-sm text-muted-foreground">Lecturer</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
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
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">Total Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  ₦{financialReport.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">Total Withdrawals</span>
                <span className="text-lg font-bold text-red-600">
                  -₦{financialReport.totalWithdrawals.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">Total Refunds</span>
                <span className="text-lg font-bold text-orange-600">
                  -₦{financialReport.totalRefunds.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-bold text-lg">Net Revenue</span>
                  <span className="text-2xl font-bold text-primary">
                    ₦{financialReport.netRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Platform Share (30%)</p>
                  <p className="text-xl font-bold text-blue-700">
                    ₦{financialReport.platformEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Lecturer Share (70%)</p>
                  <p className="text-xl font-bold text-purple-700">
                    ₦{financialReport.lecturerEarnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}