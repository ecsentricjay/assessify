'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllBundles, toggleBundleStatus, deleteBundle, type BundleWithDetails } from '@/lib/actions/admin-cbt-bundles.actions'

export default function AdminBundlesPage() {
  const router = useRouter()
  const [bundles, setBundles] = useState<BundleWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBundles()
  }, [])

  async function loadBundles() {
    const result = await getAllBundles()
    if (result.success) {
      setBundles(result.bundles || [])
    } else {
      alert(result.error || 'Failed to load bundles')
    }
    setLoading(false)
  }

  async function handleToggle(bundleId: string) {
    if (confirm('Toggle bundle status?')) {
      const result = await toggleBundleStatus(bundleId)
      if (result.success) {
        loadBundles()
      } else {
        alert(result.error || 'Failed to toggle status')
      }
    }
  }

  async function handleDelete(bundleId: string) {
    if (confirm('Are you sure? This cannot be undone.')) {
      const result = await deleteBundle(bundleId)
      alert(result.message || result.error)
      if (result.success) loadBundles()
    }
  }

  // Helper to get effective price
  const getEffectivePrice = (bundle: any) => {
    return bundle.promo_price ?? bundle.base_price ?? 0
  }

  // Helper to check if free
  const isFree = (bundle: any) => {
    return getEffectivePrice(bundle) === 0
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">CBT Bundles</h1>
          <p className="text-gray-600">Manage course bundles and pricing</p>
        </div>
        <button
          onClick={() => router.push('/admin/cbt/bundles/create')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          + Create Bundle
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bundles...</p>
          </div>
        </div>
      ) : bundles.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <p className="text-6xl mb-4">📦</p>
          <h3 className="text-xl font-semibold mb-2">No bundles yet</h3>
          <p className="text-gray-600 mb-6">Create your first CBT bundle to get started</p>
          <button
            onClick={() => router.push('/admin/cbt/bundles/create')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Create First Bundle
          </button>
        </div>
      ) : (
        /* Bundles Grid */
        <div className="grid gap-4">
          {bundles.map((bundle: any) => {
            const effectivePrice = getEffectivePrice(bundle)
            const bundleIsFree = isFree(bundle)
            
            return (
              <div
                key={bundle.id}
                className={`bg-white p-6 rounded-lg shadow border-2 transition ${
                  bundleIsFree
                    ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                    : bundle.is_active
                    ? 'border-gray-200 hover:border-blue-300'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  {/* Left Side - Bundle Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{bundle.bundle_name}</h3>
                      {bundleIsFree && (
                        <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          🎁 FREE
                        </span>
                      )}
                      {!bundle.is_active && (
                        <span className="bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">
                      {bundle.bundle_description || 'No description'}
                    </p>
                    
                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Price:</span>
                        {bundleIsFree ? (
                          <span className="text-green-600 font-bold">FREE</span>
                        ) : (
                          <span className="font-semibold">
                            ₦{effectivePrice.toLocaleString()}
                            {bundle.promo_price && bundle.promo_price < bundle.base_price && (
                              <span className="text-xs text-gray-500 ml-1">
                                (was ₦{bundle.base_price.toLocaleString()})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Courses:</span>
                        <span>{bundle.course_ids?.length || 0}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Validity:</span>
                        <span>{bundle.validity_days || 0} days</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Active Subs:</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          {bundle.active_subscriptions || 0}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Total Subs:</span>
                        <span>{bundle.total_subscriptions || 0}</span>
                      </div>
                      
                      {!bundleIsFree && bundle.total_revenue > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Revenue:</span>
                          <span className="text-green-600 font-semibold">
                            ₦{bundle.total_revenue.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/admin/cbt/bundles/${bundle.id}/edit`)}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                      title="Edit Bundle"
                    >
                      ✏️ Edit
                    </button>
                    
                    <button
                      onClick={() => handleToggle(bundle.id)}
                      className={`px-4 py-2 rounded-lg transition font-medium ${
                        bundle.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title={bundle.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {bundle.is_active ? '✓ Active' : '○ Inactive'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(bundle.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                      title="Delete Bundle"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}