'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function CopyEnrollmentCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Button
      onClick={copyToClipboard}
      className="w-full"
      variant={copied ? 'default' : 'outline'}
    >
      {copied ? (
        <>
          <span className="mr-2">✓</span>
          Copied!
        </>
      ) : (
        <>
          <span className="mr-2">📋</span>
          Copy Code
        </>
      )}
    </Button>
  )
}