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
      {referrals.slice(0, 5).map((referral) => {
        // FIXED: Use full_name directly since it's already in the type
        const lecturer = referral.lecturer
        const fullName = lecturer?.full_name || lecturer?.department || 'Unknown Lecturer'
        
        // Get initials from full name
        const initials = fullName
          .split(' ')
          .map(n => n.charAt(0))
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'L'

        return (
          <div
            key={referral.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {initials}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{fullName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {lecturer?.department || 'No department'}
                  </p>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {referral.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">
                  ₦{Number(referral.partner_earnings || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {referral.total_submissions || 0} submissions
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}