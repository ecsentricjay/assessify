'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Gift } from 'lucide-react';
import Link from 'next/link';
import { getAllActiveBundles, getMySubscriptions } from '@/lib/actions/student-cbt-purchase.actions';
import { toast } from 'sonner';

interface Bundle {
  id: string;
  bundleName: string;
  bundleDescription: string;
  basePrice: number;
  promoPrice: number | null;
  discountAmount: number;
  commissionAmount: number;
  validityDays: number;
  maxPracticeSessions: number | string;
  courseCount: number;
  is_active: boolean;
}

interface Subscription {
  bundle_id: string;
  course_id: string;
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [bundlesRes, subsRes] = await Promise.all([
        getAllActiveBundles(),
        getMySubscriptions(),
      ]);

      if (bundlesRes.success && bundlesRes.bundles) {
        setBundles(bundlesRes.bundles as Bundle[]);
      }

      if (subsRes.success && subsRes.subscriptions) {
        setSubscriptions(subsRes.subscriptions as Subscription[]);
      }
    } catch (error) {
      console.error('[loadData]', error);
      toast.error('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  }

  const hasSubscription = (bundleId: string) =>
    subscriptions.some((sub) => sub.bundle_id === bundleId);

  // Check if bundle is free
  const isFreeBundle = (bundle: Bundle) => {
    // A bundle is free if basePrice is 0 OR promoPrice is 0
    return bundle.basePrice === 0 || bundle.promoPrice === 0;
  };

  const studentPrice = (bundle: Bundle) => {
    // For free bundles, return 0
    if (isFreeBundle(bundle)) return 0;
    
    const effectivePrice = bundle.promoPrice !== null ? bundle.promoPrice : bundle.basePrice;
    return Math.max(0, effectivePrice - bundle.discountAmount);
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">CBT Practice Bundles</h1>
          <p className="text-gray-600 mt-2">
            Prepare for exams with our comprehensive practice test bundles
          </p>
        </div>

        {/* Bundles Grid */}
        {bundles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>No bundles available at the moment. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => {
              const isSubscribed = hasSubscription(bundle.id);
              const isFree = isFreeBundle(bundle);
              const finalPrice = studentPrice(bundle);

              return (
                <Card
                  key={bundle.id}
                  className={`flex flex-col transition-all hover:shadow-lg ${
                    isSubscribed 
                      ? 'border-green-200 bg-green-50' 
                      : isFree 
                      ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50'
                      : ''
                  }`}
                >
                  {/* Subscription/Free Badge */}
                  {isSubscribed ? (
                    <div className="bg-green-100 text-green-800 px-4 py-2 flex items-center gap-2 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      You have access
                    </div>
                  ) : isFree ? (
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold">
                      <Gift className="w-5 h-5" />
                      🎁 FREE BUNDLE
                    </div>
                  ) : null}

                  {/* Bundle Header */}
                  <CardHeader>
                    <CardTitle className="text-lg">{bundle.bundleName}</CardTitle>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {bundle.bundleDescription}
                    </p>
                  </CardHeader>

                  {/* Bundle Details */}
                  <CardContent className="flex-1 space-y-4">
                    {/* Course Count */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-sm text-gray-600">Courses Included</span>
                      <span className="font-bold text-lg text-blue-600">
                        {bundle.courseCount}
                      </span>
                    </div>

                    {/* Session Limit */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-sm text-gray-600">Practice Sessions</span>
                      <span className="font-bold text-lg text-purple-600">
                        {bundle.maxPracticeSessions}
                      </span>
                    </div>

                    {/* Validity */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-sm text-gray-600">Valid For</span>
                      <span className="font-bold text-lg text-orange-600">
                        {bundle.validityDays}d
                      </span>
                    </div>

                    {/* Pricing Section - Only for Paid Bundles */}
                    {isFree ? (
                      <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6 rounded-lg text-center">
                        <div className="text-white">
                          <div className="text-3xl font-bold mb-2">FREE</div>
                          <div className="text-sm opacity-90">No payment required!</div>
                          <div className="text-xs opacity-75 mt-2">
                            Get instant access to all courses
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Original Price:</span>
                            <span className="text-gray-800 line-through">
                              ₦{bundle.basePrice.toLocaleString()}
                            </span>
                          </div>
                          {bundle.promoPrice !== null && bundle.promoPrice < bundle.basePrice && (
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-600 font-medium">Promo Price:</span>
                              <span className="text-purple-600 font-medium">
                                ₦{bundle.promoPrice.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {bundle.discountAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600 font-medium">Discount:</span>
                              <span className="text-green-600 font-medium">
                                -₦{bundle.discountAmount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-blue-200">
                            <span>You Pay:</span>
                            <span className="text-blue-600">
                              ₦{finalPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info Footer */}
                    {!isFree && (
                      <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                        💡 Have a promo code? Get additional discounts at checkout!
                      </div>
                    )}
                  </CardContent>

                  {/* Action Buttons */}
                  <div className="p-4 border-t space-y-2">
                    {isSubscribed ? (
                      <>
                        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                          <Link href={`/student/cbt/courses?bundleId=${bundle.id}`}>
                            Start Practicing
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/student/cbt/bundle/${bundle.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </>
                    ) : isFree ? (
                      <>
                        <Button 
                          asChild 
                          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold"
                        >
                          <Link href={`/student/cbt/courses?bundleId=${bundle.id}`}>
                            <Gift className="w-4 h-4 mr-2" />
                            Start Practicing
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full border-emerald-300 hover:bg-emerald-50">
                          <Link href={`/student/cbt/bundle/${bundle.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild className="w-full">
                          <Link href={`/student/cbt/bundles/${bundle.id}/purchase`}>
                            Purchase Bundle
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/student/cbt/bundle/${bundle.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Random Questions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Each session randomly selects questions to ensure variety and prevent memorization.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instant Feedback</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Get immediate results and detailed explanations after completing each session.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Track Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Monitor your performance and improvements over time with detailed analytics.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}