// app/admin/partners/[id]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getPartnerOverview } from '@/lib/actions/partner.actions'
import { getPartnerReferrals } from '@/lib/actions/partner-earnings.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  Copy, 
  Mail, 
  Phone, 
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import PartnerReferralsList from '@/components/admin/partner-referrals-list'
import PartnerEarningsList from '@/components/admin/partner-earnings-list'
import PartnerWithdrawalsList from '@/components/admin/partner-withdrawals-list'

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getPartnerOverview(id)

  if (result.error || !result.data) {
    notFound()
  }

  const { partner, statistics, recent_earnings, recent_referrals, pending_withdrawals } = result.data

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/partners">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {partner.business_name || partner.profiles?.full_name}
              </h1>
              {getStatusBadge(partner.status)}
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <span className="font-mono text-sm">{partner.partner_code}</span>
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/partners/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Partner
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_referrals}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.active_referrals} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_submissions}</div>
            <p className="text-xs text-muted-foreground">
              ₦{statistics.total_revenue.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{statistics.total_earnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {partner.commission_rate}% commission rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{statistics.pending_earnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ₦{statistics.total_withdrawn.toLocaleString()} withdrawn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Partner Info & Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Partner contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{partner.profiles?.email}</p>
              </div>
            </div>
            {partner.phone_number && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{partner.phone_number}</p>
                </div>
              </div>
            )}
            {partner.business_name && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Business</p>
                  <p className="text-sm text-muted-foreground">{partner.business_name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Joined</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(partner.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>Withdrawal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partner.bank_name ? (
              <>
                <div>
                  <p className="text-sm font-medium">Bank Name</p>
                  <p className="text-sm text-muted-foreground">{partner.bank_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Account Number</p>
                  <p className="text-sm text-muted-foreground font-mono">{partner.account_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Account Name</p>
                  <p className="text-sm text-muted-foreground">{partner.account_name}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No bank details provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Notes */}
      {partner.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{partner.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Referrals, Earnings, Withdrawals */}
      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referrals">
            Referrals ({statistics.total_referrals})
          </TabsTrigger>
          <TabsTrigger value="earnings">
            Earnings ({statistics.total_earnings > 0 ? '₦' + statistics.total_earnings.toLocaleString() : '0'})
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            Withdrawals ({pending_withdrawals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Referred Lecturers</CardTitle>
              <CardDescription>
                Lecturers referred by this partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading referrals...</div>}>
                <PartnerReferralsList partnerId={id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Earnings History</CardTitle>
              <CardDescription>
                Commission earned from submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading earnings...</div>}>
                <PartnerEarningsList partnerId={id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>
                Payout history and pending requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading withdrawals...</div>}>
                <PartnerWithdrawalsList partnerId={id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}