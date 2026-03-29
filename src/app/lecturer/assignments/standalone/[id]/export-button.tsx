// Save as: src/app/lecturer/assignments/standalone/[id]/export-button.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportStandaloneSubmissions } from '@/lib/actions/standalone-assignment.actions'

interface ExportButtonProps {
  assignmentId: string
}

export default function ExportButton({ assignmentId }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await exportStandaloneSubmissions(assignmentId, 'csv')
      
      if (result.success && result.data && result.filename) {
        // Create a blob and download it
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        alert(result.error || 'Failed to export submissions')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export submissions')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      size="sm"
      disabled={exporting}
    >
      {exporting ? 'Exporting...' : '📥 Export CSV'}
    </Button>
  )
}