// Save as: src/components/copy-code-button.tsx

'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface CopyCodeButtonProps {
  code: string
}

export default function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button onClick={handleCopy} variant={copied ? "secondary" : "default"}>
      {copied ? '✅ Copied!' : '📋 Copy Code'}
    </Button>
  )
}