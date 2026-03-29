// app/admin/finances/wallets/wallets-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WalletAdjustmentModal } from '@/components/admin/wallet-adjustment-modal'
import { Search, Plus, Minus, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { WalletWithUser } from '@/lib/actions/admin-wallet.actions'

interface WalletsClientProps {
  initialWallets: WalletWithUser[]
  initialTotal: number
  initialPage: number
  initialSearch: string
}

export default function WalletsClient({
  initialWallets,
  initialTotal,
  initialPage,
  initialSearch
}: WalletsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedWallet, setSelectedWallet] = useState<WalletWithUser | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'credit' | 'debit'>('credit')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter !== 'all') params.set('role', roleFilter)
    router.push(`/admin/finances/wallets?${params.toString()}`)
  }

  const handleAdjustWallet = (wallet: WalletWithUser, type: 'credit' | 'debit') => {
    setSelectedWallet(wallet)
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    setSelectedWallet(null)
    router.refresh()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800'
      case 'lecturer': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-red-100 text-red-800'
      case 'partner': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // ✅ Filter by role
  const filteredWallets = roleFilter === 'all' 
    ? initialWallets 
    : initialWallets.filter(w => w.profiles?.role === roleFilter)

  const totalPages = Math.ceil(filteredWallets.length / 20)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Wallets ({filteredWallets.length})</CardTitle>
          
          {/* Search & Filters */}
          <div className="space-y-3 mt-4">
            {/* ✅ Role Filter */}
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="lecturer">Lecturers</SelectItem>
                  <SelectItem value="partner">Partners</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              
              <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
                {(search || roleFilter !== 'all') && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setSearch('')
                      setRoleFilter('all')
                      router.push('/admin/finances/wallets')
                    }}
                  >
                    Clear
                  </Button>
                )}
              </form>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredWallets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {search ? 'No wallets found matching your search' : 'No wallets found'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWallets.map((wallet: any) => {
                const isPartner = wallet.profiles?.role === 'partner'
                
                return (
                  <div 
                    key={wallet.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {wallet.profiles && (
                        <>
                          <Avatar>
                            <AvatarImage src={wallet.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {`${wallet.profiles.first_name[0]}${wallet.profiles.last_name[0]}`.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{wallet.profiles.first_name} {wallet.profiles.last_name}</p>
                            <p className="text-sm text-muted-foreground truncate">ID: {wallet.user_id.substring(0, 8)}...</p>
                          </div>

                          <Badge className={getRoleBadgeColor(wallet.profiles.role)}>
                            {wallet.profiles.role}
                          </Badge>
                        </>
                      )}
                    </div>

                    {/* Balance/Earnings */}
                    <div className="flex items-center gap-4">
                      {isPartner && wallet.partner_stats ? (
                        // ✅ Partner: Show earnings breakdown
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Partner Earnings</p>
                          <p className="text-lg font-bold text-green-600">
                            ₦{wallet.partner_stats.total_earned.toLocaleString()}
                          </p>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span className="text-yellow-600">Pending: ₦{wallet.partner_stats.pending.toLocaleString()}</span>
                            <span className="text-gray-600">Withdrawn: ₦{wallet.partner_stats.withdrawn.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        // Regular wallet balance
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Balance</p>
                          <p className={`text-lg font-bold ${wallet.balance > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            ₦{wallet.balance.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {!isPartner && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustWallet(wallet, 'credit')}
                            className="gap-1 bg-green-50 hover:bg-green-100 text-green-700"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustWallet(wallet, 'debit')}
                            className="gap-1 bg-red-50 hover:bg-red-100 text-red-700"
                            disabled={wallet.balance <= 0}
                          >
                            <Minus className="h-3 w-3" />
                            Deduct
                          </Button>
                        </div>
                      )}
                      
                      {/* ✅ Partner: View Earnings Link */}
                      {isPartner && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/partners/${wallet.user_id}`)}
                          className="gap-1"
                        >
                          <TrendingUp className="h-3 w-3" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {initialPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={initialPage <= 1}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (search) params.set('search', search)
                    if (roleFilter !== 'all') params.set('role', roleFilter)
                    params.set('page', String(initialPage - 1))
                    router.push(`/admin/finances/wallets?${params.toString()}`)
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={initialPage >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (search) params.set('search', search)
                    if (roleFilter !== 'all') params.set('role', roleFilter)
                    params.set('page', String(initialPage + 1))
                    router.push(`/admin/finances/wallets?${params.toString()}`)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Adjustment Modal */}
      {selectedWallet && (
        <WalletAdjustmentModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedWallet(null)
          }}
          onSuccess={handleModalSuccess}
          userId={selectedWallet.user_id}
          type={modalType}
          currentBalance={selectedWallet.balance}
        />
      )}
    </>
  )
}