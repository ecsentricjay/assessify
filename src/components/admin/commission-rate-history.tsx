// components/admin/commission-rate-history.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CommissionHistoryProps {
  partnerId: string
  currentRate: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface HistoryEntry {
  id: string
  action_type: string
  created_at: string
  admin_name: string
  details: {
    commission_rate?: number
    old_rate?: number
    new_rate?: number
    reason?: string
  }
}

export default function CommissionRateHistory({
  partnerId,
  currentRate,
  open,
  onOpenChange,
}: CommissionHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open, partnerId])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          id,
          action_type,
          created_at,
          details,
          admin:profiles!admin_actions_admin_id_fkey (
            full_name
          )
        `)
        .eq('target_id', partnerId)
        .in('action_type', ['update_commission_rate', 'create_partner'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedHistory: HistoryEntry[] = (data || []).map((entry: any) => ({
        id: entry.id,
        action_type: entry.action_type,
        created_at: entry.created_at,
        admin_name: entry.admin?.full_name || 'Unknown Admin',
        details: entry.details || {},
      }))

      setHistory(formattedHistory)
    } catch (error) {
      console.error('Failed to fetch commission history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRateDifference = (entry: HistoryEntry) => {
    if (entry.action_type === 'create_partner') {
      return {
        type: 'new',
        value: entry.details.commission_rate || 0,
        icon: null,
      }
    }

    const oldRate = entry.details.old_rate || 0
    const newRate = entry.details.commission_rate || entry.details.new_rate || 0
    const diff = newRate - oldRate

    if (diff > 0) {
      return {
        type: 'increase',
        value: diff,
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      }
    } else if (diff < 0) {
      return {
        type: 'decrease',
        value: Math.abs(diff),
        icon: <TrendingDown className="h-4 w-4 text-red-600" />,
      }
    } else {
      return {
        type: 'no-change',
        value: 0,
        icon: <Minus className="h-4 w-4 text-gray-600" />,
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Commission Rate History
          </DialogTitle>
          <DialogDescription>
            Track all commission rate changes for this partner
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No commission rate changes recorded
          </div>
        ) : (
          <>
            {/* Current Rate */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-900">Current Commission Rate</p>
              <p className="text-2xl font-bold text-blue-600">{currentRate}%</p>
            </div>

            {/* History Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => {
                    const rateDiff = getRateDifference(entry)
                    const rate = entry.details.commission_rate || entry.details.new_rate || 0

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">
                          {new Date(entry.created_at).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.action_type === 'create_partner' ? 'default' : 'secondary'}>
                            {entry.action_type === 'create_partner' ? 'Created' : 'Updated'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {rate}%
                        </TableCell>
                        <TableCell>
                          {rateDiff.type === 'new' ? (
                            <span className="text-sm text-muted-foreground">Initial rate</span>
                          ) : rateDiff.type === 'no-change' ? (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              {rateDiff.icon}
                              No change
                            </span>
                          ) : (
                            <span className={`text-sm font-medium flex items-center gap-1 ${
                              rateDiff.type === 'increase' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {rateDiff.icon}
                              {rateDiff.type === 'increase' ? '+' : '-'}{rateDiff.value}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.admin_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.details.reason || '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Total changes: {history.filter(h => h.action_type === 'update_commission_rate').length}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}