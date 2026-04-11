'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllSubscriptions } from '@/lib/actions/admin-cbt-subscriptions.actions';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  student_id: string;
  bundle_id: string;
  bundle_name: string;
  course_id: string;
  course_title: string;
  status: 'active' | 'expired' | 'cancelled';
  purchase_date: string;
  expiry_date: string;
  sessions_taken: number;
  max_sessions: number;
  student_email: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'cancelled'>('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    let filtered = subscriptions;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.bundle_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.course_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubscriptions(filtered);
  }, [searchTerm, statusFilter, subscriptions]);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      const res = await getAllSubscriptions();
      if (res.success && res.subscriptions) {
        setSubscriptions(res.subscriptions as Subscription[]);
      } else {
        toast.error(res.error || 'Failed to load subscriptions');
      }
    } catch (error) {
      console.error('[loadSubscriptions]', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSessionsPercentage = (taken: number, max: number) => {
    return Math.round((taken / max) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin/cbt" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to CBT Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Student Subscriptions</h1>
          <p className="text-gray-600 mt-1">Monitor all active and expired subscriptions</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Search</label>
                <Input
                  placeholder="Search by email, bundle, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Subscriptions</option>
                  <option value="active">Active Only</option>
                  <option value="expired">Expired Only</option>
                  <option value="cancelled">Cancelled Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Subscriptions ({filteredSubscriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading subscriptions...</div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{subscriptions.length === 0 ? 'No subscriptions yet' : 'No matching subscriptions'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr className="text-sm font-medium">
                      <th className="text-left py-3 px-4">Student Email</th>
                      <th className="text-left py-3 px-4">Bundle</th>
                      <th className="text-left py-3 px-4">Course</th>
                      <th className="text-center py-3 px-4">Sessions</th>
                      <th className="text-center py-3 px-4">Expiry Date</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-gray-50 text-sm">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{sub.student_email}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{sub.bundle_name}</td>
                        <td className="py-3 px-4 text-gray-700">{sub.course_title}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium">
                              {sub.sessions_taken}/{sub.max_sessions}
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(getSessionsPercentage(sub.sessions_taken, sub.max_sessions), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">
                          {new Date(sub.expiry_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(sub.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {subscriptions.filter((s) => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Expired Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {subscriptions.filter((s) => s.status === 'expired').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
