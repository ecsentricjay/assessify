'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { getMyActiveSubscriptions } from '@/lib/actions/student-cbt-purchase.actions';
import { toast } from 'sonner';

interface ActiveSubscription {
  id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  bundle_name: string;
  bundle_id: string;
  sessions_completed: number;
  average_score: number;
  expiry_date: string;
  days_remaining: number;
  is_expired: boolean;
}

export default function CoursesPage() {
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      const res = await getMyActiveSubscriptions();
      if (res.success && res.subscriptions) {
        setSubscriptions(res.subscriptions as ActiveSubscription[]);
      }
    } catch (error) {
      console.error('[loadSubscriptions]', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  const getDaysRemaining = (expiryDate: string) => {
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, days);
  };

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
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-2">
              Start practicing or continue where you left off
            </p>
          </div>
          <Button asChild>
            <Link href="/student/cbt/bundles">
              <Plus className="w-4 h-4 mr-2" />
              Browse Bundles
            </Link>
          </Button>
        </div>

        {/* Active Subscriptions */}
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You don't have any active subscriptions yet.</p>
              <Button asChild>
                <Link href="/student/cbt/bundles">Browse Practice Bundles</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((sub) => {
              const daysLeft = sub.days_remaining;
              const isNearingExpiry = daysLeft <= 7;
              const isExpired = sub.is_expired;

              return (
                <Card
                  key={sub.id}
                  className={`flex flex-col hover:shadow-lg transition-all ${
                    isExpired ? 'opacity-60' : ''
                  }`}
                >
                  {/* Status Bar */}
                  <div
                    className={`h-2 ${
                      isExpired ? 'bg-gray-400' : isNearingExpiry ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                  />

                  {/* Card Content */}
                  <CardHeader>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 font-medium">{sub.course_code}</div>
                      <CardTitle className="text-lg">{sub.course_title}</CardTitle>
                      <p className="text-xs text-gray-600">{sub.bundle_name}</p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {/* Practice Sessions Completed */}
                    <div>
                      <span className="text-sm font-medium text-gray-700">Practice Sessions</span>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{sub.sessions_completed}</p>
                      <p className="text-xs text-gray-500">completed</p>
                    </div>

                    {/* Average Score */}
                    {sub.sessions_completed > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Average Score</span>
                        <p className="text-2xl font-bold text-green-600 mt-1">{sub.average_score}%</p>
                      </div>
                    )}

                    {/* Expiry Info */}
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        isExpired
                          ? 'bg-gray-100 text-gray-700'
                          : isNearingExpiry
                            ? 'bg-orange-50 text-orange-800'
                            : 'bg-green-50 text-green-800'
                      }`}
                    >
                      {isExpired ? (
                        <p>
                          <strong>Expired</strong> on{' '}
                          {new Date(sub.expiry_date).toLocaleDateString()}
                        </p>
                      ) : (
                        <p>
                          <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</strong>{' '}
                          (expires {new Date(sub.expiry_date).toLocaleDateString()})
                        </p>
                      )}
                    </div>
                  </CardContent>

                  {/* Action Buttons */}
                  <div className="p-4 border-t">
                    {isExpired ? (
                      <Button asChild variant="outline" className="w-full" disabled>
                        Subscription Expired
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href={`/student/cbt/courses/${sub.course_id}/practice`}>
                          Start Practice
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Additional Info */}
        {subscriptions.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Select a course from your subscriptions</li>
                  <li>Click "Start Practice" to begin a session</li>
                  <li>Answer questions and submit your responses</li>
                  <li>Review your results and improve</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-1">
                <p>✓ Take multiple sessions to improve</p>
                <p>✓ Focus on areas with low scores</p>
                <p>✓ Track your progress over time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need More Courses?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <Button asChild className="w-full">
                  <Link href="/student/cbt/bundles">Explore More Bundles</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
