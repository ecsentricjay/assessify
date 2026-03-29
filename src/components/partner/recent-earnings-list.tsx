// components/partner/recent-earnings-list.tsx
import { Badge } from '@/components/ui/badge'
import { DollarSign, FileText, ClipboardCheck } from 'lucide-react'
import { PartnerEarningWithDetails } from '@/lib/types/partner.types'

interface RecentEarningsListProps {
  earnings: PartnerEarningWithDetails[]
}

export default function RecentEarningsList({ earnings }: RecentEarningsListProps) {
  if (earnings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No earnings yet</p>
        <p className="text-xs mt-1">Earnings will appear when lecturers receive submissions</p>
      </div>
    )
  }

  const getSourceIcon = (sourceType: string) => {
    if (sourceType === 'assignment_submission') {
      return <FileText className="h-4 w-4 text-blue-600" />
    }
    return <ClipboardCheck className="h-4 w-4 text-green-600" />
  }

  const getSourceLabel = (sourceType: string) => {
    if (sourceType === 'assignment_submission') {
      return 'Assignment'
    }
    return 'Test'
  }

  return (
    <div className="space-y-3">
      {earnings.slice(0, 5).map((earning) => (
        <div
          key={earning.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              {getSourceIcon(earning.source_type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">
                  {getSourceLabel(earning.source_type)}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {earning.commission_rate}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {earning.created_at ? new Date(earning.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-green-600">
              +₦{Number(earning.amount).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              from ₦{Number(earning.source_amount).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}