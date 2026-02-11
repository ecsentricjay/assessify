// components/admin/export-partners-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { getAllPartners } from '@/lib/actions/partner.actions'
import { toast } from 'sonner'

export default function ExportPartnersButton() {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = async () => {
    setExporting(true)
    try {
      // Fetch all partners (no pagination)
      const result = await getAllPartners({
        limit: 10000, // Get all
        sortBy: 'created_at',
        sortOrder: 'desc',
      })

      if (result.error || !result.data) {
        toast.error('Failed to export partners')
        return
      }

      const partners = result.data.data

      // Create CSV content
      const headers = [
        'Partner Code',
        'Business Name',
        'Full Name',
        'Email',
        'Phone',
        'Status',
        'Commission Rate (%)',
        'Total Referrals',
        'Active Referrals',
        'Total Submissions',
        'Total Revenue',
        'Total Earnings',
        'Pending Earnings',
        'Total Withdrawn',
        'Bank Name',
        'Account Number',
        'Account Name',
        'Created At',
        'Last Payout At',
      ]

      const rows = partners.map(partner => [
        partner.partner_code,
        partner.business_name || '',
        `${partner.profiles?.first_name || ''} ${partner.profiles?.last_name || ''}`.trim(),
        partner.profiles?.email || '',
        partner.phone_number || '',
        partner.status,
        partner.commission_rate,
        partner.stats?.total_referrals || 0,
        partner.stats?.active_referrals || 0,
        partner.stats?.total_submissions || 0,
        partner.stats?.total_revenue || 0,
        partner.stats?.total_earnings || 0,
        partner.stats?.pending_earnings || 0,
        partner.stats?.total_withdrawn || 0,
        partner.bank_name || '',
        partner.account_number || '',
        partner.account_name || '',
        partner.created_at ? new Date(partner.created_at).toLocaleString() : '',
        partner.last_payout_at ? new Date(partner.last_payout_at).toLocaleString() : '',
      ])

      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => 
            // Escape commas and quotes
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(',')
        )
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `partners_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Exported ${partners.length} partners to CSV`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export partners')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={exportToCSV}
      disabled={exporting}
    >
      {exporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </>
      )}
    </Button>
  )
}