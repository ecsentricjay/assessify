'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Package, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { getAllCourses } from '@/lib/actions/admin-cbt-courses.actions';
import { getAllBundles } from '@/lib/actions/admin-cbt-bundles.actions';
import { getAllSubscriptions } from '@/lib/actions/admin-cbt-subscriptions.actions';

interface Stats {
  totalCourses: number;
  totalQuestions: number;
  totalBundles: number;
  activeSubscriptions: number;
}

export default function AdminCBTDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalQuestions: 0,
    totalBundles: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [coursesRes, bundlesRes, subscriptionsRes] = await Promise.all([
        getAllCourses(),
        getAllBundles(),
        getAllSubscriptions(),
      ]);

      let totalQuestions = 0;
      if (coursesRes.success && coursesRes.courses) {
        totalQuestions = (coursesRes.courses as any[]).reduce((sum, course) => sum + (course.question_count ?? 0), 0);
      }

      let activeSubscriptions = 0;
      if (subscriptionsRes.success && subscriptionsRes.subscriptions) {
        activeSubscriptions = (subscriptionsRes.subscriptions as any[]).filter(
          (sub) => sub.status === 'active'
        ).length;
      }

      setStats({
        totalCourses: coursesRes.success ? (coursesRes.courses?.length ?? 0) : 0,
        totalQuestions,
        totalBundles: bundlesRes.success ? (bundlesRes.bundles?.length ?? 0) : 0,
        activeSubscriptions,
      });
    } catch (error) {
      console.error('[loadStats]', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CBT Management</h1>
            <p className="text-gray-600 mt-1">Manage courses, questions, bundles, and subscriptions</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/cbt/courses/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/cbt/bundles/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Bundle
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-gray-500 mt-1">Active CBT courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              <p className="text-xs text-gray-500 mt-1">Across all courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBundles}</div>
              <p className="text-xs text-gray-500 mt-1">Available for purchase</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-gray-500 mt-1">Student subscriptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">Manage CBT practice courses</p>
              <Button asChild className="w-full">
                <Link href="/admin/cbt/courses">View Courses</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Bundles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">Create and manage pricing bundles</p>
              <Button asChild className="w-full">
                <Link href="/admin/cbt/bundles">View Bundles</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">Monitor student subscriptions</p>
              <Button asChild className="w-full">
                <Link href="/admin/cbt/subscriptions">View Subscriptions</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">View revenue and performance analytics</p>
              <Button asChild className="w-full">
                <Link href="/admin/cbt/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>About CBT System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Courses:</strong> Create and manage CBT practice courses with topics and questions.
            </p>
            <p>
              <strong>Bundles:</strong> Package courses with FIXED pricing (not percentages). Set base price (₦2,500-₦10,000), discount amount, and commission.
            </p>
            <p>
              <strong>Earnings:</strong> Referrers earn fixed commissions per bundle purchase. Students pay: Base Price - Discount = Final Price.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
