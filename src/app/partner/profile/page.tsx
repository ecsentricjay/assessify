// app/partner/profile/page.tsx
export const dynamic = 'force-dynamic'

import { getMyPartnerProfile } from '@/lib/actions/partner.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PartnerProfileForm from '@/components/partner/partner-profile-form'

export default async function PartnerProfilePage() {
  const profileResult = await getMyPartnerProfile()
  const partner = profileResult.data

  if (!partner) {
    return <div>Partner not found</div>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your partner account information
        </p>
      </div>

      {/* Account Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your partner account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Partner Code</Label>
              <p className="font-mono text-lg font-bold text-blue-600">
                {partner.partner_code}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <div className="mt-1">
                {getStatusBadge(partner.status)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Commission Rate</Label>
              <p className="text-lg font-semibold">{partner.commission_rate}%</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Member Since</Label>
              <p className="text-lg font-semibold">
                {new Date(partner.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-lg font-semibold">{partner.profiles?.email}</p>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Full Name</Label>
            <p className="text-lg font-semibold">{partner.profiles?.full_name}</p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 Contact an administrator to update your partner code, status, commission rate, email, or name.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Update your business and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartnerProfileForm partner={partner} />
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for labels
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={className}>{children}</p>
}