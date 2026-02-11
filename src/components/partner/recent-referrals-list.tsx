// components/partner/recent-referrals-list.tsx
import { Badge } from '@/components/ui/badge'
import { User, TrendingUp } from 'lucide-react'
import { ReferralWithDetails } from '@/lib/types/partner.types'

interface RecentReferralsListProps {
  referrals: ReferralWithDetails[]
}

export default function RecentReferralsList({ referrals }: RecentReferralsListProps) {
  if (referrals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No referrals yet</p>
        <p className="text-xs mt-1">Share your referral code to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {referrals.slice(0, 5).map((referral) => (
        <div
          key={referral.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {referral.lecturer?.full_name?.charAt(0) || 'L'}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{referral.lecturer?.full_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-text-gray">
                  {referral.lecturer?.department}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {referral.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-success font-medium">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">
                ₦{Number(referral.partner_earnings || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-text-gray mt-1">
              {referral.total_submissions} submissions
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}