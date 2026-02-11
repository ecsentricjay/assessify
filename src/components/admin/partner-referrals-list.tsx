// components/admin/partner-referrals-list.tsx
import { getPartnerReferrals } from '@/lib/actions/partner-earnings.actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Mail, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface PartnerReferralsListProps {
  partnerId: string
}

export default async function PartnerReferralsList({ partnerId }: PartnerReferralsListProps) {
  const result = await getPartnerReferrals(partnerId, {
    limit: 50,
    sortBy: 'partner_earnings',
    sortOrder: 'desc',
  })

  const referrals = result.data?.data || []

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      pending: 'secondary',
      inactive: 'secondary',
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    )
  }

  if (referrals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No referrals yet</p>
        <p className="text-sm mt-1">This partner hasn&apos;t referred any lecturers</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lecturer</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead className="text-right">Revenue Generated</TableHead>
              <TableHead className="text-right">Partner Earnings</TableHead>
              <TableHead className="text-right">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{referral.lecturer?.full_name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      {referral.lecturer?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{referral.lecturer?.department}</p>
                    <p className="text-xs text-muted-foreground">{referral.lecturer?.faculty}</p>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(referral.status || 'inactive')}</TableCell>
                <TableCell className="text-right font-medium">
                  {referral.total_submissions}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₦{Number(referral.total_revenue).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  ₦{Number(referral.partner_earnings).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {referral.created_at ? new Date(referral.created_at).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/users/${referral.referred_lecturer_id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Total: {referrals.length} referral{referrals.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Total Submissions: </span>
            <span className="font-medium">
              {referrals.reduce((sum, r) => sum + (r.total_submissions ?? 0), 0)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Revenue: </span>
            <span className="font-medium">
              ₦{referrals.reduce((sum, r) => sum + Number(r.total_revenue), 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Earnings: </span>
            <span className="font-medium text-green-600">
              ₦{referrals.reduce((sum, r) => sum + Number(r.partner_earnings), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}