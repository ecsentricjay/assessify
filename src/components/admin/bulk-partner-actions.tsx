// components/admin/bulk-partner-actions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Loader2, Ban, CheckCircle } from 'lucide-react'
import { updatePartnerStatus } from '@/lib/actions/partner.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { toast } from 'sonner'
import { PartnerWithStats } from '@/lib/types/partner.types'

interface BulkPartnerActionsProps {
  partners: PartnerWithStats[]
}

export default function BulkPartnerActions({ partners }: BulkPartnerActionsProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: 'activate' | 'deactivate' | 'suspend' | null
  }>({ open: false, action: null })

  const toggleSelection = (partnerId: string) => {
    setSelectedIds(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === partners.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(partners.map(p => p.id))
    }
  }

  const handleBulkAction = async () => {
    if (!confirmDialog.action) return

    setLoading(true)
    try {
      const adminUser = await getCurrentUser()
      if (!adminUser) {
        toast.error('Not authenticated')
        return
      }

      const statusMap: Record<string, 'active' | 'inactive' | 'suspended'> = {
        activate: 'active',
        deactivate: 'inactive',
        suspend: 'suspended',
      }

      const newStatus = statusMap[confirmDialog.action]
      let successCount = 0
      let errorCount = 0

      // Process each partner
      for (const partnerId of selectedIds) {
        const result = await updatePartnerStatus(partnerId, newStatus, adminUser.id)
        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} partner${successCount > 1 ? 's' : ''}`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} partner${errorCount > 1 ? 's' : ''}`)
      }

      setSelectedIds([])
      setConfirmDialog({ open: false, action: null })
      router.refresh()
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Failed to perform bulk action')
    } finally {
      setLoading(false)
    }
  }

  const openConfirmDialog = (action: 'activate' | 'deactivate' | 'suspend') => {
    setConfirmDialog({ open: true, action })
  }

  const selectedPartners = partners.filter(p => selectedIds.includes(p.id))

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selectedIds.length === partners.length && partners.length > 0}
            onCheckedChange={toggleAll}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer"
          >
            Select All
          </label>
        </div>

        {/* Selection Count */}
        {selectedIds.length > 0 && (
          <Badge variant="secondary">
            {selectedIds.length} selected
          </Badge>
        )}

        {/* Bulk Actions Dropdown */}
        {selectedIds.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Bulk Actions
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Bulk Actions ({selectedIds.length})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openConfirmDialog('activate')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Activate Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openConfirmDialog('deactivate')}>
                <Ban className="mr-2 h-4 w-4 text-gray-600" />
                Deactivate Selected
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openConfirmDialog('suspend')}
                className="text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Suspend Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Partner Selection Checkboxes (to be added to table rows) */}
      {/* This would be integrated into the PartnerTable component */}

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ open, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'activate' && 'Activate Partners'}
              {confirmDialog.action === 'deactivate' && 'Deactivate Partners'}
              {confirmDialog.action === 'suspend' && 'Suspend Partners'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to {confirmDialog.action} {selectedIds.length} partner{selectedIds.length > 1 ? 's' : ''}.
              
              {confirmDialog.action === 'suspend' && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-900 font-medium">
                    ⚠️ Warning: Suspended partners cannot earn new commissions.
                  </p>
                </div>
              )}

              <div className="mt-4 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium mb-2">Selected partners:</p>
                <ul className="text-sm space-y-1">
                  {selectedPartners.slice(0, 10).map(partner => (
                    <li key={partner.id} className="text-muted-foreground">
                      • {partner.business_name || `${partner.profiles?.first_name} ${partner.profiles?.last_name}`} ({partner.partner_code})
                    </li>
                  ))}
                  {selectedPartners.length > 10 && (
                    <li className="text-muted-foreground">
                      ... and {selectedPartners.length - 10} more
                    </li>
                  )}
                </ul>
              </div>

              <p className="mt-4 text-sm">
                This action can be reversed later. Do you want to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={loading}
              className={confirmDialog.action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}