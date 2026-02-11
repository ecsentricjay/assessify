// components/admin/partner-stats-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, DollarSign, UserCheck } from 'lucide-react'

interface PartnerStatsCardsProps {
  totalPartners: number
  activePartners: number
  totalEarnings: number
  totalReferrals: number
}

export default function PartnerStatsCards({
  totalPartners,
  activePartners,
  totalEarnings,
  totalReferrals,
}: PartnerStatsCardsProps) {
  const stats = [
    {
      title: 'Total Partners',
      value: totalPartners.toLocaleString(),
      icon: Users,
      description: `${activePartners} active`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Partners',
      value: activePartners.toLocaleString(),
      icon: UserCheck,
      description: `${Math.round((activePartners / totalPartners) * 100)}% of total`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Referrals',
      value: totalReferrals.toLocaleString(),
      icon: TrendingUp,
      description: `${(totalReferrals / (totalPartners || 1)).toFixed(1)} per partner`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Earnings',
      value: `₦${totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      description: `₦${(totalEarnings / (totalPartners || 1)).toFixed(0)} per partner`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}