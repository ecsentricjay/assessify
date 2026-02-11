// components/admin/partner-performance-charts.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { PartnerWithStats } from '@/lib/types/partner.types'

interface PartnerPerformanceChartsProps {
  partners: PartnerWithStats[]
}

export default function PartnerPerformanceCharts({ partners }: PartnerPerformanceChartsProps) {
  // Top 10 partners by earnings
  const topPartnersByEarnings = partners
    .sort((a, b) => Number(b.stats?.total_earnings || 0) - Number(a.stats?.total_earnings || 0))
    .slice(0, 10)
    .map(p => ({
      name: p.business_name || `${p.profiles?.first_name} ${p.profiles?.last_name}` || p.partner_code,
      earnings: Number(p.stats?.total_earnings || 0),
      referrals: p.stats?.total_referrals || 0,
    }))

  // Status distribution
  const statusDistribution = [
    {
      name: 'Active',
      value: partners.filter(p => p.status === 'active').length,
      color: '#10b981',
    },
    {
      name: 'Inactive',
      value: partners.filter(p => p.status === 'inactive').length,
      color: '#6b7280',
    },
    {
      name: 'Suspended',
      value: partners.filter(p => p.status === 'suspended').length,
      color: '#ef4444',
    },
  ].filter(item => item.value > 0)

  // Commission rate distribution
  const commissionRateGroups = [
    { range: '0-10%', min: 0, max: 10, count: 0 },
    { range: '10-15%', min: 10, max: 15, count: 0 },
    { range: '15-20%', min: 15, max: 20, count: 0 },
    { range: '20%+', min: 20, max: 100, count: 0 },
  ]

  partners.forEach(p => {
    const rate = Number(p.commission_rate)
    for (const group of commissionRateGroups) {
      if (rate >= group.min && rate < group.max) {
        group.count++
        break
      }
    }
  })

  const commissionData = commissionRateGroups.filter(g => g.count > 0)

  // Earnings vs Referrals scatter
  const earningsVsReferrals = partners
    .filter(p => p.stats && (p.stats.total_earnings > 0 || p.stats.total_referrals > 0))
    .map(p => ({
      name: p.business_name || p.partner_code,
      referrals: p.stats?.total_referrals || 0,
      earnings: Number(p.stats?.total_earnings || 0),
      avgPerReferral: p.stats?.avg_earnings_per_referral || 0,
    }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 15)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Top Partners by Earnings */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Top 10 Partners by Earnings</CardTitle>
          <CardDescription>Highest earning partners on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPartnersByEarnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number | undefined) => value !== undefined ? [`₦${value.toLocaleString()}`, 'Earnings'] : ['₦0', 'Earnings']}
              />
              <Legend />
              <Bar dataKey="earnings" fill="#10b981" name="Total Earnings" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Status Distribution</CardTitle>
          <CardDescription>Active vs inactive partners</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Commission Rate Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Rate Distribution</CardTitle>
          <CardDescription>Partners by commission rate range</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={commissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Partners" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Earnings vs Referrals */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Earnings vs Referrals</CardTitle>
          <CardDescription>Partner performance comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsVsReferrals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="earnings" 
                stroke="#10b981" 
                name="Total Earnings (₦)"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="referrals" 
                stroke="#3b82f6" 
                name="Total Referrals"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}