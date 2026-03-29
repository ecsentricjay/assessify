'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Users, TrendingUp, Clock, Trophy } from 'lucide-react';
import Link from 'next/link';
import { getMyActiveSubscriptions, getMySubscriptions } from '@/lib/actions/student-cbt-purchase.actions';
import { getMyPromoCode, getMyPromoStats } from '@/lib/actions/promo-codes.actions';
import { toast } from 'sonner';

interface Stats {
  activeSubscriptions: number;
  totalCourses: number;
  totalSessionsTaken: number;
  promoEarnings: number;
}

export default function CBTDashboard() {
  const [stats, setStats] = useState<Stats>({
    activeSubscriptions: 0,
    totalCourses: 0,
    totalSessionsTaken: 0,
    promoEarnings: 0,
  });
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [subsRes, promoRes, statsRes] = await Promise.all([
        getMyActiveSubscriptions(),
        getMyPromoCode(),
        getMyPromoStats(),
      ]);

      if (subsRes.success && subsRes.subscriptions) {
        const subs = subsRes.subscriptions as any[];
        setStats((prev) => ({
          ...prev,
          activeSubscriptions: subs.length,
          totalCourses: subs.length,
        }));
      }

      if (promoRes.success && promoRes.code) {
        setPromoCode(promoRes.code.code);
      }

      if (statsRes.success && statsRes.stats) {
        setStats((prev) => ({
          ...prev,
          promoEarnings: statsRes.stats.totalEarnings || 0,
        }));
      }
    } catch (error) {
      console.error('[loadData]', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My CBT Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your progress and manage your subscriptions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-gray-500 mt-1">Active bundles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-gray-500 mt-1">Courses you have access to</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promo Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats.promoEarnings.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">From referrals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions Taken</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessionsTaken}</div>
              <p className="text-xs text-gray-500 mt-1">Practice sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Start Practicing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Begin a practice session on one of your active courses.
              </p>
              <Button asChild className="w-full">
                <Link href="/student/cbt/courses">My Courses</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Browse Bundles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Explore and purchase new practice test bundles.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/student/cbt/bundles">View Bundles</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Share & Earn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                {promoCode
                  ? 'Share your promo code and earn from referrals.'
                  : 'Get a promo code and start earning referral commissions.'}
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/student/profile/promo">My Promo Code</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-600" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                See how you rank against other students on practice bundles.
              </p>
              <Button asChild className="w-full" variant="default">
                <Link href="/student/cbt/leaderboard">View Rankings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Promo Code Section */}
        {promoCode && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle>Your Promo Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Share this code with friends and family to earn commissions on their purchases.
                </p>
                <div className="p-4 bg-white border-2 border-green-300 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Your Referral Code</p>
                  <p className="text-3xl font-mono font-bold text-green-600">{promoCode}</p>
                </div>
                <p className="text-sm text-gray-600">
                  💡 When someone uses your code, you earn part of their purchase!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <p>Browse available practice test bundles</p>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <p>Purchase a bundle using wallet or card</p>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <p>Start practicing with random questions</p>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <p>Review results and track progress</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pro Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                ✓ <strong>Take multiple sessions</strong> - Each session has different random questions
              </p>
              <p>
                ✓ <strong>Review mistakes</strong> - Learn from wrong answers to improve
              </p>
              <p>
                ✓ <strong>Track progress</strong> - Monitor your score improvements over time
              </p>
              <p>
                ✓ <strong>Use promo codes</strong> - Get discounts when purchasing bundles
              </p>
              <p>
                ✓ <strong>Share your code</strong> - Earn commissions by referring friends
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
