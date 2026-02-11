// components/partner/referral-code-display.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Share2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ReferralCodeDisplayProps {
  partnerCode: string
}

export default function ReferralCodeDisplay({ partnerCode }: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(partnerCode)
    setCopied(true)
    toast.success('Referral code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareCode = () => {
    const text = `Join Assessify using my referral code: ${partnerCode}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Assessify Referral Code',
        text: text,
      }).catch(() => {
        // Fallback to copy
        copyToClipboard()
      })
    } else {
      copyToClipboard()
    }
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Your Referral Code
        </CardTitle>
        <CardDescription>
          Share this code with lecturers to earn commissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white rounded-lg p-4 border-2 border-blue-200">
            <p className="text-xs text-muted-foreground mb-1">Referral Code</p>
            <p className="text-3xl font-bold font-mono text-blue-600 tracking-wider">
              {partnerCode}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="lg"
              onClick={copyToClipboard}
              className="flex-col h-auto py-4"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 mb-1" />
                  <span className="text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mb-1" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={shareCode}
              className="flex-col h-auto py-4"
            >
              <Share2 className="h-5 w-5 mb-1" />
              <span className="text-xs">Share</span>
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-100 rounded-md">
          <p className="text-sm text-blue-900">
            <strong>How it works:</strong> When a lecturer signs up using your code,
            you&apos;ll earn {' '}
            <strong>15% commission</strong> from every assignment submission they receive.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}