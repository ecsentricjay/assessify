// components/admin/stats-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  iconColor?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor = 'text-text-gray'
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary-dark">{value}</div>
        {description && (
          <p className="text-xs text-text-gray mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-error'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-text-gray">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}