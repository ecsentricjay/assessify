// components/admin/partner-earnings-list.tsx
import { getPartnerEarnings } from '@/lib/actions/partner-earnings.actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DollarSign, FileText, ClipboardCheck } from 'lucide-react'

interface PartnerEarningsListProps {
  partnerId: string
}

export default async function PartnerEarningsList({ partnerId }: PartnerEarningsListProps) {
  const result = await getPartnerEarnings(partnerId, {
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const earnings = result.data?.data || []

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      paid: 'default',
      withdrawn: 'default',
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
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

  if (earnings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No earnings yet</p>
        <p className="text-sm mt-1">Earnings will appear when referred lecturers receive submissions</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Submission Fee</TableHead>
              <TableHead className="text-right">Lecturer Amount</TableHead>
              <TableHead className="text-right">Commission Rate</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.map((earning) => (
              <TableRow key={earning.id}>
                <TableCell className="text-sm">
                  {earning.created_at ? new Date(earning.created_at).toLocaleDateString() : 'N/A'}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {earning.created_at ? new Date(earning.created_at).toLocaleTimeString() : 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSourceIcon(earning.source_type)}
                    <span className="text-sm">{getSourceLabel(earning.source_type)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {earning.student?.full_name || 'Unknown'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₦{Number(earning.source_amount).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  ₦{Number(earning.lecturer_amount).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {earning.commission_rate}%
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  ₦{Number(earning.amount).toLocaleString()}
                </TableCell>
                <TableCell>{getStatusBadge(earning.status || 'pending')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Total: {earnings.length} earning{earnings.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Total Submissions: </span>
            <span className="font-medium">
              ₦{earnings.reduce((sum, e) => sum + Number(e.source_amount), 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Pending: </span>
            <span className="font-medium">
              ₦{earnings.filter(e => e.status === 'pending')
                .reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Earned: </span>
            <span className="font-medium text-green-600">
              ₦{earnings.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}