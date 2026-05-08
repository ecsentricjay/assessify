'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Building2, ShieldCheck } from 'lucide-react'
import { activateVirtualAccount } from '@/lib/actions/virtual-account.actions'

interface VirtualAccountModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (account: any) => void
}

export function VirtualAccountModal({ open, onClose, onSuccess }: VirtualAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleActivate = async () => {
    setError('')
    setIsLoading(true)

    try {
      const result = await activateVirtualAccount()

      if (!result.success) {
        setError(result.error || 'Activation failed. Please try again.')
        return
      }

      onSuccess(result.account)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl">Activate Virtual Account</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Get a dedicated bank account number to fund your wallet instantly via bank transfer from any Nigerian bank.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">What you get</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Personal Wema Bank account number</li>
              <li>✅ Fund from any Nigerian bank app</li>
              <li>✅ Transfers reflect instantly</li>
              <li>✅ No card details required</li>
              <li>✅ One-time setup — yours permanently</li>
            </ul>
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
            <p>Your account is powered by Paystack and secured by Wema Bank. Funds transfer directly to your Assessify wallet.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleActivate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate Now'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}