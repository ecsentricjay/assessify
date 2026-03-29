'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { getAllBundles, deleteBundle, toggleBundleStatus } from '@/lib/actions/admin-cbt-bundles.actions';
import { toast } from 'sonner';

interface Bundle {
  id: string;
  bundle_name: string;
  bundle_description: string;
  base_price: number;
  discount_amount: number;
  commission_amount: number;
  validity_days: number;
  max_practice_sessions: number;
  is_active: boolean;
  created_at: string;
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [filteredBundles, setFilteredBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadBundles();
  }, []);

  useEffect(() => {
    setFilteredBundles(
      bundles.filter((bundle) =>
        bundle.bundle_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, bundles]);

  async function loadBundles() {
    try {
      setLoading(true);
      const res = await getAllBundles();
      if (res.success && res.bundles) {
        setBundles(res.bundles as Bundle[]);
      }
    } catch (error) {
      console.error('[loadBundles]', error);
      toast.error('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(bundleId: string) {
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    try {
      setDeleting(bundleId);
      const res = await deleteBundle(bundleId);
      if (res.success) {
        setBundles(bundles.filter((b) => b.id !== bundleId));
        toast.success('Bundle deleted successfully');
      } else {
        toast.error(res.error || 'Failed to delete bundle');
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleStatus(bundleId: string) {
    try {
      const res = await toggleBundleStatus(bundleId);
      if (res.success) {
        setBundles(
          bundles.map((b) => (b.id === bundleId ? { ...b, is_active: !b.is_active } : b))
        );
        toast.success('Bundle status updated');
      } else {
        toast.error(res.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('[handleToggleStatus]', error);
      toast.error('Failed to update status');
    }
  }

  const getStudentPrice = (bundle: Bundle) => bundle.base_price - bundle.discount_amount;
  const getPlatformKeep = (bundle: Bundle) =>
    bundle.base_price - bundle.discount_amount - bundle.commission_amount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CBT Bundles</h1>
            <p className="text-gray-600 mt-1">Manage bundle pricing and availability</p>
          </div>
          <Button asChild>
            <Link href="/admin/cbt/bundles/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Bundle
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="Search bundles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Bundles Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bundles ({filteredBundles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading bundles...</div>
            ) : filteredBundles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No bundles found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-sm">
                      <th className="text-left py-2 px-4">Bundle Name</th>
                      <th className="text-right py-2 px-4">Base Price</th>
                      <th className="text-right py-2 px-4">Student Pays</th>
                      <th className="text-right py-2 px-4">Referrer Earns</th>
                      <th className="text-right py-2 px-4">Platform Keeps</th>
                      <th className="text-center py-2 px-4">Validity</th>
                      <th className="text-center py-2 px-4">Status</th>
                      <th className="text-right py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBundles.map((bundle) => (
                      <tr key={bundle.id} className="border-b hover:bg-gray-50 text-sm">
                        <td className="py-3 px-4">
                          <div className="font-medium">{bundle.bundle_name}</div>
                          <div className="text-xs text-gray-500">{bundle.bundle_description}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          ₦{bundle.base_price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-green-600 font-medium">
                          ₦{getStudentPrice(bundle).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-600 font-medium">
                          ₦{bundle.commission_amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-600 font-medium">
                          ₦{getPlatformKeep(bundle).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                            {bundle.validity_days}d
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(bundle.id)}
                            className="inline-flex items-center gap-1 text-sm"
                          >
                            {bundle.is_active ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <Eye className="w-4 h-4" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500">
                                <EyeOff className="w-4 h-4" />
                                Inactive
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/admin/cbt/bundles/${bundle.id}/edit`}>
                                <Edit2 className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(bundle.id)}
                              disabled={deleting === bundle.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Pricing Structure</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            <p>
              <strong>Student Pays:</strong> Base Price - Discount Amount
            </p>
            <p>
              <strong>Referrer Earns:</strong> Fixed commission amount per sale
            </p>
            <p>
              <strong>Platform Keeps:</strong> Student Pays - Referrer Commission
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
