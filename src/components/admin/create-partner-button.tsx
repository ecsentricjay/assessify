// components/admin/create-partner-button.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Loader2, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { createPartner } from '@/lib/actions/partner.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { toast } from 'sonner'

export default function CreatePartnerButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [createdPartner, setCreatedPartner] = useState<{
    email: string
    password: string
    partnerCode: string
  } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    commissionRate: 15,
    bankName: '',
    accountNumber: '',
    accountName: '',
    notes: '',
  })

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success(`${fieldName} copied to clipboard`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // Get current admin user
      const adminUser = await getCurrentUser()
      if (!adminUser) {
        toast.error('Not authenticated')
        return
      }

      const result = await createPartner(
        {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          businessName: formData.businessName || undefined,
          commissionRate: formData.commissionRate,
          bankName: formData.bankName || undefined,
          accountNumber: formData.accountNumber || undefined,
          accountName: formData.accountName || undefined,
          notes: formData.notes || undefined,
        },
        adminUser.id
      )

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        toast.success('Partner account created successfully!')
        setCreatedPartner({
          email: result.data.email,
          password: result.data.temporaryPassword,
          partnerCode: result.data.partnerCode,
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Create partner error:', error)
      toast.error('Failed to create partner')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      businessName: '',
      commissionRate: 15,
      bankName: '',
      accountNumber: '',
      accountName: '',
      notes: '',
    })
    setCreatedPartner(null)
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      resetForm()
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose()
      else setOpen(true)
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Partner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {createdPartner ? 'Partner Created Successfully' : 'Create New Partner Account'}
          </DialogTitle>
          <DialogDescription>
            {createdPartner 
              ? 'Share these login credentials with the partner. They can change their password after first login.'
              : 'Create a new partner account with login credentials'
            }
          </DialogDescription>
        </DialogHeader>

        {createdPartner ? (
          // Success view with credentials
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Partner account has been created successfully. Please share these credentials with the partner.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <div className="flex gap-2">
                  <Input value={createdPartner.email} readOnly className="bg-white" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(createdPartner.email, 'Email')}
                  >
                    {copiedField === 'Email' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Temporary Password</Label>
                <div className="flex gap-2">
                  <Input value={createdPartner.password} readOnly className="bg-white font-mono" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(createdPartner.password, 'Password')}
                  >
                    {copiedField === 'Password' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Partner should change this password after first login
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Partner Code</Label>
                <div className="flex gap-2">
                  <Input value={createdPartner.partnerCode} readOnly className="bg-white font-mono" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(createdPartner.partnerCode, 'Partner Code')}
                  >
                    {copiedField === 'Partner Code' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This code is used for lecturer referrals
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 text-sm">Next Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Share the email and password with the partner</li>
                <li>Partner can login at your platform URL</li>
                <li>Partner should change password immediately after first login</li>
                <li>Partner can view their dashboard and start referring lecturers</li>
              </ul>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Form view
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium text-sm text-gray-700">Personal Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="partner@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used for login
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 xxx xxx xxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium text-sm text-gray-700">Business Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Optional"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
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
                  Default is 15%. Partner earns this percentage from each submission by referred lecturers.
                </p>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium text-sm text-gray-700">Bank Details (Optional)</h3>
              
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

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes about this partner..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 text-sm">
                A temporary password will be generated automatically. The partner will receive their login credentials after account creation.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Partner Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}