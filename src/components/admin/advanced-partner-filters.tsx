// components/admin/advanced-partner-filters.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X } from 'lucide-react'

export default function AdvancedPartnerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    minEarnings: searchParams.get('minEarnings') || '',
    maxEarnings: searchParams.get('maxEarnings') || '',
    minReferrals: searchParams.get('minReferrals') || '',
    maxReferrals: searchParams.get('maxReferrals') || '',
    minCommission: searchParams.get('minCommission') || '',
    maxCommission: searchParams.get('maxCommission') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  })

  const applyFilters = () => {
    const params = new URLSearchParams()

    // Add non-empty filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      }
    })

    // Reset to page 1
    params.set('page', '1')

    router.push(`/admin/partners?${params.toString()}`)
    setOpen(false)
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      minEarnings: '',
      maxEarnings: '',
      minReferrals: '',
      maxReferrals: '',
      minCommission: '',
      maxCommission: '',
      dateFrom: '',
      dateTo: '',
    })
    router.push('/admin/partners')
    setOpen(false)
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value && value !== 'all'
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Advanced Filters
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Filter partners by multiple criteria
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Earnings Range */}
          <div className="space-y-2">
            <Label>Total Earnings Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="Min (₦)"
                  value={filters.minEarnings}
                  onChange={(e) => setFilters({ ...filters, minEarnings: e.target.value })}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max (₦)"
                  value={filters.maxEarnings}
                  onChange={(e) => setFilters({ ...filters, maxEarnings: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Referrals Range */}
          <div className="space-y-2">
            <Label>Total Referrals Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minReferrals}
                  onChange={(e) => setFilters({ ...filters, minReferrals: e.target.value })}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxReferrals}
                  onChange={(e) => setFilters({ ...filters, maxReferrals: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Commission Rate Range */}
          <div className="space-y-2">
            <Label>Commission Rate Range (%)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="Min %"
                  min="0"
                  max="100"
                  value={filters.minCommission}
                  onChange={(e) => setFilters({ ...filters, minCommission: e.target.value })}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max %"
                  min="0"
                  max="100"
                  value={filters.maxCommission}
                  onChange={(e) => setFilters({ ...filters, maxCommission: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Join Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}