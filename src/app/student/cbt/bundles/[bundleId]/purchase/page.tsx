'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { purchaseBundle, getBundleDetails } from '@/lib/actions/student-cbt-purchase.actions';
import { validatePromoCode } from '@/lib/actions/promo-codes.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Bundle {
  id: string;
  bundleName: string;
  bundleDescription: string;
  basePrice: number;
  discountAmount: number;
  commissionAmount: number;
  validityDays: number;
  maxPracticeSessions: number | string;
  courseCount: number;
  courses: Array<{ id: string; courseTitle: string }>;
}

interface PromoResult {
  valid: boolean;
  referrerName?: string;
  referrerType?: string;
  discountApplied?: number;
  message?: string;
}

export default function PurchaseBundlePage() {
  const params = useParams();
  const router = useRouter();
  const bundleId = params.bundleId as string;

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoData, setPromoData] = useState<PromoResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'wallet' | null>(null);
  
  // ✅ NEW: Purchase feedback states
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    loadBundle();
  }, [bundleId]);

  async function loadBundle() {
    try {
      setLoading(true);
      const res = await getBundleDetails(bundleId);
      if (res.success && res.bundle) {
        setBundle(res.bundle as Bundle);
      } else {
        toast.error('Bundle not found');
        router.push('/student/cbt/bundles');
      }
    } catch (error) {
      console.error('[loadBundle]', error);
      toast.error('Failed to load bundle');
    } finally {
      setLoading(false);
    }
  }

  async function validateCode() {
    if (!promoCode.trim()) {
      setPromoValid(null);
      setPromoData(null);
      return;
    }

    setValidating(true);
    try {
      const res = await validatePromoCode(promoCode);
      setPromoData(res as PromoResult);
      setPromoValid(res.valid);

      if (!res.valid) {
        toast.error(res.message || 'Invalid promo code');
      }
    } catch (error) {
      console.error('[validateCode]', error);
      toast.error('Error validating promo code');
      setPromoValid(false);
    } finally {
      setValidating(false);
    }
  }

  async function handlePurchase(paymentMethod: 'wallet') {
    if (!bundle) return;

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const res = await purchaseBundle({
        bundleId,
        paymentMethod,
        promoCode: promoValid ? promoCode.trim() : undefined,
      });

      if (res.success) {
        // ✅ Show success
        toast.success('Bundle purchased successfully! 🎉');
        setPurchaseDetails(res);
        setShowSuccessModal(true);

        // ✅ Auto-redirect after 3 seconds with countdown
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          countdown--;
          setRedirectCountdown(countdown);

          if (countdown <= 0) {
            clearInterval(countdownInterval);
            router.push('/student/cbt/courses');
          }
        }, 1000);
      } else {
        // ✅ Show error based on message
        const errorMessage = res.error || 'Purchase failed. Please try again.';
        setPurchaseError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('[handlePurchase]', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setPurchaseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-500 mb-4">Bundle not found</p>
          <Button asChild>
            <Link href="/student/cbt/bundles">Back to Bundles</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ✅ Helper function to determine error type and show appropriate action
  function getErrorAction() {
    if (!purchaseError) return null;

    if (purchaseError.toLowerCase().includes('insufficient')) {
      return (
        <Button asChild size="sm" className="ml-3">
          <Link href="/student/wallet">Fund Wallet</Link>
        </Button>
      );
    }

    if (purchaseError.toLowerCase().includes('already') || purchaseError.toLowerCase().includes('active subscription')) {
      return (
        <Button asChild size="sm" className="ml-3">
          <Link href="/student/cbt/courses">View My Courses</Link>
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        className="ml-3"
        onClick={() => {
          setPurchaseError(null);
        }}
      >
        Try Again
      </Button>
    );
  }

  // Calculate pricing
  const basePrice = bundle.basePrice;
  const discountAmount = promoValid ? bundle.discountAmount : 0;
  const finalPrice = basePrice - discountAmount;
  const referrerEarns = bundle.commissionAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6" disabled={purchasing}>
          <Link href="/student/cbt/bundles" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Bundles
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
          <p className="text-gray-600 mt-2">
            Get instant access to {bundle.courseCount} courses and {bundle.maxPracticeSessions} practice sessions
          </p>
        </div>

        {/* ✅ Error Alert */}
        {purchaseError && (
          <Alert variant="destructive" className="mb-6 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{purchaseError}</span>
              {getErrorAction()}
            </AlertDescription>
          </Alert>
        )}

        {/* Bundle Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{bundle.bundleName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{bundle.bundleDescription}</p>

            {/* Bundle Details Grid */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{bundle.courseCount}</div>
                <div className="text-xs text-gray-500 mt-1">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{bundle.maxPracticeSessions}</div>
                <div className="text-xs text-gray-500 mt-1">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{bundle.validityDays}d</div>
                <div className="text-xs text-gray-500 mt-1">Validity</div>
              </div>
            </div>

            {/* Included Courses */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Included Courses:</h3>
              <ul className="space-y-1">
                {bundle.courses.map((course) => (
                  <li key={course.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {course.courseTitle}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Promo Code Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Promo Code (Optional)</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Have a referral code? Enter it to get a discount!
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promoCode" className="text-sm font-medium">
                Promo Code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoValid(null);
                    setPromoData(null);
                  }}
                  onBlur={validateCode}
                  placeholder="Enter your promo code"
                  className="uppercase flex-1"
                  disabled={validating}
                />
                {validating && (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin mt-2" />
                )}
                {promoValid === true && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-2" />
                )}
                {promoValid === false && <XCircle className="w-5 h-5 text-red-500 mt-2" />}
              </div>
            </div>

            {/* Promo Feedback */}
            {promoValid === true && promoData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>✓ Valid Code!</strong> Shared by{' '}
                  <strong>{promoData.referrerName}</strong> ({promoData.referrerType})
                </p>
                {promoData.discountApplied && (
                  <p className="text-sm text-green-700 font-medium mt-1">
                    You save: ₦{promoData.discountApplied.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {promoValid === false && promoData?.message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>✗ Invalid Code:</strong> {promoData.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Base Price:</span>
              <span className="text-gray-900 font-medium">
                ₦{basePrice.toLocaleString()}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Discount (from promo):</span>
                <span className="font-medium">
                  -₦{discountAmount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="border-t border-blue-200 pt-3">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total You Pay:</span>
                <span className="text-blue-600">₦{finalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white bg-opacity-60 rounded p-2 text-xs text-gray-600 mt-3">
              <p>
                💡 <strong>Referrer Earning:</strong> The person who shared this code earns{' '}
                <strong>₦{referrerEarns.toLocaleString()}</strong> for this purchase.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Wallet Payment */}
            <button
              onClick={() => {
                if (selectedPayment === 'wallet') {
                  handlePurchase('wallet');
                } else {
                  setSelectedPayment('wallet');
                }
              }}
              disabled={purchasing}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedPayment === 'wallet'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Pay from Wallet</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Use your account balance for instant purchase
                  </p>
                </div>
                {selectedPayment === 'wallet' && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>

            {selectedPayment === 'wallet' && (
              <Button
                onClick={() => handlePurchase('wallet')}
                disabled={purchasing}
                className="w-full h-12"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Complete Purchase - ₦{finalPrice.toLocaleString()}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔒 Your payment is secure and encrypted. We never store your card details.</p>
        </div>
      </div>

      {/* ✅ Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <Loader2 className="w-4 h-4 text-green-500 absolute bottom-2 right-2 animate-spin" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900">
              Purchase Successful! 🎉
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bundle Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{bundle.bundleName}</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  <span className="text-gray-600">Amount Paid:</span>{' '}
                  <span className="font-semibold">₦{finalPrice.toLocaleString()}</span>
                </p>
                <p>
                  <span className="text-gray-600">Courses Included:</span>{' '}
                  <span className="font-semibold">{bundle.courseCount} courses</span>
                </p>
                <p>
                  <span className="text-gray-600">Practice Sessions:</span>{' '}
                  <span className="font-semibold">{bundle.maxPracticeSessions}</span>
                </p>
                <p>
                  <span className="text-gray-600">Valid For:</span>{' '}
                  <span className="font-semibold">{bundle.validityDays} days</span>
                </p>
              </div>
            </div>

            {/* Countdown Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-700">
                Redirecting to courses in <span className="font-bold text-blue-600">{redirectCountdown}</span> seconds...
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                asChild
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Link href="/student/cbt/courses">
                  Start Practicing
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="flex-1"
              >
                <Link href="/student/cbt/courses">
                  View My Courses
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
