// Save as: src/app/lecturer/assignments/standalone/copy-button.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  text: string
  label?: string
}

export default function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleCopy}
      variant={copied ? "default" : "outline"}
    >
      {copied ? '✓ Copied!' : label}
    </Button>
  )
}