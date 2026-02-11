// components/partner/partner-profile-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { updateMyBankDetails } from '@/lib/actions/partner.actions'
import { toast } from 'sonner'
import { PartnerWithStats } from '@/lib/types/partner.types'

interface PartnerProfileFormProps {
  partner: PartnerWithStats
}

export default function PartnerProfileForm({ partner }: PartnerProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: partner.business_name || '',
    phoneNumber: partner.phone_number || '',
    bankName: partner.bank_name || '',
    accountNumber: partner.account_number || '',
    accountName: partner.account_name || '',
  })

  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Note: This action only updates bank details
      // Business name and phone would need separate admin update
      const result = await updateMyBankDetails({
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Bank details updated successfully!')
        setHasChanges(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            placeholder="Your business name (optional)"
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Contact admin to update business name
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+234 xxx xxx xxxx"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Contact admin to update phone number
          </p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium">Bank Details</h3>
        <p className="text-sm text-muted-foreground">
          These details will be used for processing your withdrawals
        </p>

        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name *</Label>
          <Input
            id="bankName"
            placeholder="e.g., GTBank, Access Bank, Zenith Bank"
            value={formData.bankName}
            onChange={(e) => handleChange('bankName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            type="text"
            inputMode="numeric"
            placeholder="0123456789"
            maxLength={10}
            value={formData.accountNumber}
            onChange={(e) => handleChange('accountNumber', e.target.value.replace(/[^0-9]/g, ''))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountName">Account Name *</Label>
          <Input
            id="accountName"
            placeholder="Account holder name"
            value={formData.accountName}
            onChange={(e) => handleChange('accountName', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={loading || !hasChanges}
        >
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
        {hasChanges && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                businessName: partner.business_name || '',
                phoneNumber: partner.phone_number || '',
                bankName: partner.bank_name || '',
                accountNumber: partner.account_number || '',
                accountName: partner.account_name || '',
              })
              setHasChanges(false)
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>

      {hasChanges && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-900">
            ℹ️ You have unsaved changes
          </p>
        </div>
      )}
    </form>
  )
}