// components/admin/edit-partner-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import { updatePartner } from '@/lib/actions/partner.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { toast } from 'sonner'
import { PartnerWithStats } from '@/lib/types/partner.types'
import { Separator } from '@/components/ui/separator'

interface EditPartnerFormProps {
  partner: PartnerWithStats
}

export default function EditPartnerForm({ partner }: EditPartnerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: partner.business_name || '',
    phoneNumber: partner.phone_number || '',
    commissionRate: partner.commission_rate,
    status: partner.status || 'active',
    bankName: partner.bank_name || '',
    accountNumber: partner.account_number || '',
    accountName: partner.account_name || '',
    notes: partner.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current admin user
      const adminUser = await getCurrentUser()
      if (!adminUser) {
        toast.error('Not authenticated')
        return
      }

      const result = await updatePartner(
        partner.id,
        {
          businessName: formData.businessName,
          phoneNumber: formData.phoneNumber,
          commissionRate: formData.commissionRate,
          status: formData.status as 'active' | 'inactive' | 'suspended',
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          notes: formData.notes,
        },
        adminUser.id
      )

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Partner updated successfully!')
        router.push(`/admin/partners/${partner.id}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Update partner error:', error)
      toast.error('Failed to update partner')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Partner Code (Read-only) */}
      <div className="space-y-2">
        <Label>Partner Code</Label>
        <Input
          value={partner.partner_code}
          disabled
          className="font-mono bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Partner code cannot be changed
        </p>
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          value={partner.profiles?.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          User email cannot be changed
        </p>
      </div>

      <Separator />

      {/* Business Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Business Information</h3>

        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            placeholder="Optional business name"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+234 xxx xxx xxxx"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Inactive/suspended partners cannot earn new commissions
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
          <Input
            id="commissionRate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.commissionRate}
            onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
            required
          />
          <p className="text-xs text-muted-foreground">
            Partner earns this percentage from each submission to referred lecturers
          </p>
        </div>
      </div>

      <Separator />

      {/* Bank Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Bank Details</h3>
        <p className="text-sm text-muted-foreground">
          Required for processing withdrawal requests
        </p>

        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name</Label>
          <Input
            id="bankName"
            placeholder="e.g., GTBank"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            placeholder="0123456789"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountName">Account Name</Label>
          <Input
            id="accountName"
            placeholder="Account holder name"
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      {/* Admin Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Admin Notes</Label>
        <Textarea
          id="notes"
          placeholder="Internal notes about this partner..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          These notes are only visible to admins
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/partners/${partner.id}`)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>

      {/* Warning for Status Change */}
      {formData.status !== partner.status && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm font-medium text-yellow-900">
            ⚠️ Status Change Warning
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            {formData.status === 'suspended' && 
              'Suspending this partner will prevent them from earning future commissions.'}
            {formData.status === 'inactive' && 
              'Deactivating this partner will prevent them from earning future commissions.'}
            {formData.status === 'active' && 
              'Activating this partner will allow them to earn commissions again.'}
          </p>
        </div>
      )}

      {/* Warning for Commission Rate Change */}
      {formData.commissionRate !== partner.commission_rate && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium text-blue-900">
            ℹ️ Commission Rate Change
          </p>
          <p className="text-sm text-blue-700 mt-1">
            New commission rate will apply to all future earnings. Existing earnings remain unchanged.
          </p>
        </div>
      )}
    </form>
  )
}