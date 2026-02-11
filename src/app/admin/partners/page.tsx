// app/admin/partners/page.tsx (FIXED FOR NEXT.JS 15+)
import { Suspense } from 'react'
import { getAllPartners } from '@/lib/actions/partner.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PartnerTable from '@/components/admin/partner-table'
import PartnerStatsCards from '@/components/admin/partner-stats-cards'
import CreatePartnerButton from '@/components/admin/create-partner-button'
import ExportPartnersButton from '@/components/admin/export-partners-button'
import AdvancedPartnerFilters from '@/components/admin/advanced-partner-filters'
import PartnerPerformanceCharts from '@/components/admin/partner-performance-charts'
import { BarChart3 } from 'lucide-react'

interface SearchParams {
  page?: string
  search?: string
  status?: string
  sort?: string
  minEarnings?: string
  maxEarnings?: string
  minReferrals?: string
  maxReferrals?: string
  minCommission?: string
  maxCommission?: string
  dateFrom?: string
  dateTo?: string
}

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  // Await searchParams before accessing properties (Next.js 15+ requirement)
  const params = await searchParams
  
  const page = Number(params.page) || 1
  const search = params.search || ''
  const status = params.status as 'active' | 'inactive' | 'suspended' | undefined
  const sortBy = params.sort || 'created_at'

  // Fetch partners with filters
  const result = await getAllPartners({
    page,
    search,
    status,
    sortBy: sortBy as any,
    sortOrder: 'desc',
    limit: 20,
  })

  const partners = result.data?.data || []
  const total = result.data?.total || 0
  const totalPages = result.data?.totalPages || 1

  // Apply client-side filters for advanced criteria
  let filteredPartners = partners

  if (params.minEarnings || params.maxEarnings) {
    const min = Number(params.minEarnings) || 0
    const max = Number(params.maxEarnings) || Infinity
    filteredPartners = filteredPartners.filter(p => {
      const earnings = Number(p.stats?.total_earnings || 0)
      return earnings >= min && earnings <= max
    })
  }

  if (params.minReferrals || params.maxReferrals) {
    const min = Number(params.minReferrals) || 0
    const max = Number(params.maxReferrals) || Infinity
    filteredPartners = filteredPartners.filter(p => {
      const referrals = p.stats?.total_referrals || 0
      return referrals >= min && referrals <= max
    })
  }

  if (params.minCommission || params.maxCommission) {
    const min = Number(params.minCommission) || 0
    const max = Number(params.maxCommission) || 100
    filteredPartners = filteredPartners.filter(p => {
      const rate = Number(p.commission_rate)
      return rate >= min && rate <= max
    })
  }

  if (params.dateFrom || params.dateTo) {
    const from = params.dateFrom ? new Date(params.dateFrom) : new Date(0)
    const to = params.dateTo ? new Date(params.dateTo) : new Date()
    filteredPartners = filteredPartners.filter(p => {
      const created = p.created_at ? new Date(p.created_at) : new Date(0)
      return created >= from && created <= to
    })
  }

  // Calculate quick stats
  const activeCount = filteredPartners.filter(p => p.status === 'active').length
  const totalEarnings = filteredPartners.reduce((sum, p) => sum + Number(p.total_earnings || 0), 0)
  const totalReferrals = filteredPartners.reduce((sum, p) => sum + Number(p.total_referrals || 0), 0)

  // Check if advanced filters are applied
  const hasAdvancedFilters = !!(
    params.minEarnings || params.maxEarnings ||
    params.minReferrals || params.maxReferrals ||
    params.minCommission || params.maxCommission ||
    params.dateFrom || params.dateTo
  )

  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold mb-2">Partners</h1>
          <p className="text-muted-foreground">
            Manage partner accounts and referral codes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPartnersButton />
          <AdvancedPartnerFilters />
          <CreatePartnerButton />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="pb-4">
        <PartnerStatsCards
          totalPartners={total}
          activePartners={activeCount}
          totalEarnings={totalEarnings}
          totalReferrals={totalReferrals}
        />
      </div>

      {/* Tabs: Table View vs Analytics View */}
      <Tabs defaultValue="table" className="space-y-6">
        <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="table"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Partners List
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics & Charts
          </TabsTrigger>
        </TabsList>

        {/* Table View */}
        <TabsContent value="table" className="mt-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="px-6 py-5 border-b bg-muted/30">
              <CardTitle className="text-xl">All Partners</CardTitle>
              <CardDescription className="mt-1.5">
                {hasAdvancedFilters && (
                  <span className="text-blue-600 font-medium">
                    Advanced filters applied • 
                  </span>
                )}{' '}
                View and manage all partner accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading partners...</div>}>
                <PartnerTable
                  partners={filteredPartners}
                  currentPage={page}
                  totalPages={totalPages}
                  total={filteredPartners.length}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics View */}
        <TabsContent value="analytics" className="mt-6">
          <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading analytics...</div>}>
            <PartnerPerformanceCharts partners={filteredPartners} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}