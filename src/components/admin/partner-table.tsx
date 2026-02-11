// components/admin/partner-table.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Ban, 
  CheckCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { PartnerWithStats } from '@/lib/types/partner.types'
import { updatePartnerStatus } from '@/lib/actions/partner.actions'
import { toast } from 'sonner'

interface PartnerTableProps {
  partners: PartnerWithStats[]
  currentPage: number
  totalPages: number
  total: number
}

export default function PartnerTable({
  partners,
  currentPage,
  totalPages,
  total,
}: PartnerTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm) {
      params.set('search', searchTerm)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/admin/partners?${params.toString()}`)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    const params = new URLSearchParams(searchParams.toString())
    if (status !== 'all') {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    router.push(`/admin/partners?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/admin/partners?${params.toString()}`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleStatusChange = async (partnerId: string, status: 'active' | 'inactive' | 'suspended') => {
    setLoading(partnerId)
    // You'll need to pass the admin ID here
    const result = await updatePartnerStatus(partnerId, status, 'admin-id')
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Partner ${status === 'active' ? 'activated' : status === 'suspended' ? 'suspended' : 'deactivated'}`)
      router.refresh()
    }
    setLoading(null)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className={
        status === 'active' ? 'bg-success text-white' :
        status === 'suspended' ? 'bg-error text-white' :
        'bg-warning text-white'
      }>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-gray" />
            <Input
              placeholder="Search by name, email, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Code</TableHead>
              <TableHead>Business Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Referrals</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-text-gray">
                  No partners found
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      {partner.partner_code}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(partner.partner_code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner.business_name || (
                      <span className="text-text-gray">
                        {partner.profiles ? `${partner.profiles.first_name} ${partner.profiles.last_name}`.trim() : ''}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {partner.profiles?.email || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(partner.status || 'inactive')}</TableCell>
                  <TableCell className="text-right">
                    {partner.commission_rate}%
                  </TableCell>
                  <TableCell className="text-right">
                    {partner.stats?.total_referrals || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{Number(partner.stats?.total_earnings || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={loading === partner.id}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/partners/${partner.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/partners/${partner.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {partner.status !== 'active' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(partner.id, 'active')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {partner.status === 'active' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(partner.id, 'inactive')}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(partner.id, 'suspended')}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 20 + 1} to{' '}
            {Math.min(currentPage * 20, total)} of {total} partners
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 
                  ? i + 1 
                  : currentPage >= totalPages - 2
                  ? totalPages - 4 + i
                  : currentPage - 2 + i
                
                if (page < 1 || page > totalPages) return null
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}