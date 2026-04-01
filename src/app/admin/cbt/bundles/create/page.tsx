'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBundle } from '@/lib/actions/admin-cbt-bundles.actions';
import { getAllCourses } from '@/lib/actions/admin-cbt-courses.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Course {
  id: string;
  course_code: string;
  course_title: string;
}

export default function CreateBundlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    bundleName: '',
    bundleDescription: '',
    courseIds: [] as string[],
    basePrice: 5000,
    discountAmount: 1000,
    commissionAmount: 1500,
    validityDays: 90,
    maxPracticeSessions: 50,
  });

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const res = await getAllCourses();
      if (res.success && res.courses) {
        setCourses(res.courses as Course[]);
      }
    } catch (error) {
      console.error('[loadCourses]', error);
    }
  }

  // Calculate pricing
  const studentPays = formData.basePrice - formData.discountAmount;
  const platformKeeps = studentPays - formData.commissionAmount;
  const pricingValid =
    formData.basePrice >= 2500 &&
    formData.basePrice <= 10000 &&
    formData.discountAmount >= 0 &&
    formData.discountAmount < formData.basePrice &&
    formData.commissionAmount >= 0 &&
    platformKeeps >= 0;

  function toggleCourse(courseId: string) {
    setFormData((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.bundleName) {
      toast.error('Bundle name is required');
      return;
    }

    if (formData.courseIds.length === 0) {
      toast.error('Please select at least one course');
      return;
    }

    if (!pricingValid) {
      toast.error('Invalid pricing configuration');
      return;
    }

    setLoading(true);
    
    // Convert camelCase to snake_case for the API
    const res = await createBundle({
      bundle_name: formData.bundleName,
      bundle_description: formData.bundleDescription,
      course_ids: formData.courseIds,
      base_price: formData.basePrice,
      discount_amount: formData.discountAmount,
      commission_amount: formData.commissionAmount,
      validity_days: formData.validityDays,
      is_active: true,
    });

    if (res.success) {
      toast.success('Bundle created successfully!');
      router.push('/admin/cbt/bundles');
    } else {
      toast.error(res.error || 'Failed to create bundle');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin/cbt/bundles" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Bundles
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create CBT Bundle</h1>
          <p className="text-gray-600 mt-1">Create a new course bundle with FIXED pricing</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Bundle Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Bundle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bundle Name */}
              <div>
                <Label htmlFor="bundleName" className="text-base font-medium">
                  Bundle Name *
                </Label>
                <Input
                  id="bundleName"
                  placeholder="e.g., UTME Biology + Chemistry Pack"
                  value={formData.bundleName}
                  onChange={(e) => setFormData({ ...formData, bundleName: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Complete preparation for UTME with biology and chemistry practice exams..."
                  value={formData.bundleDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, bundleDescription: e.target.value })
                  }
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Validity & Sessions */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="validityDays" className="text-base font-medium">
                    Validity (Days) *
                  </Label>
                  <Input
                    id="validityDays"
                    type="number"
                    min={1}
                    value={formData.validityDays}
                    onChange={(e) =>
                      setFormData({ ...formData, validityDays: Number(e.target.value) })
                    }
                    required
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">How long subscription is valid</p>
                </div>

                <div>
                  <Label htmlFor="maxSessions" className="text-base font-medium">
                    Max Practice Sessions *
                  </Label>
                  <Input
                    id="maxSessions"
                    type="number"
                    min={1}
                    value={formData.maxPracticeSessions}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPracticeSessions: Number(e.target.value) })
                    }
                    required
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">Maximum session limit per student</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Configuration */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Pricing Configuration</CardTitle>
              <p className="text-sm text-gray-600 mt-2">All amounts must be in Naira (₦)</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing Inputs */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="basePrice" className="text-base font-medium">
                    Base Price (₦) *
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    min={2500}
                    max={10000}
                    step={100}
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: Number(e.target.value) })
                    }
                    required
                    className="mt-2 text-lg font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Range: ₦2,500 - ₦10,000
                  </p>
                </div>

                <div>
                  <Label htmlFor="discountAmount" className="text-base font-medium">
                    Discount Amount (₦)
                  </Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min={0}
                    max={formData.basePrice - 1}
                    step={100}
                    value={formData.discountAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, discountAmount: Number(e.target.value) })
                    }
                    className="mt-2 text-lg font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Student discount from base price
                  </p>
                </div>

                <div>
                  <Label htmlFor="commissionAmount" className="text-base font-medium">
                    Commission Amount (₦) *
                  </Label>
                  <Input
                    id="commissionAmount"
                    type="number"
                    min={0}
                    step={100}
                    value={formData.commissionAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionAmount: Number(e.target.value) })
                    }
                    required
                    className="mt-2 text-lg font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Fixed amount referrer earns per sale
                  </p>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold mb-3 text-gray-900">Pricing Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-gray-700">
                      Student Pays <span className="text-xs text-gray-500">(Base - Discount)</span>:
                    </span>
                    <span className="font-bold text-green-700 text-lg">
                      ₦{studentPays.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-gray-700">Referrer Earns:</span>
                    <span className="font-bold text-blue-700 text-lg">
                      ₦{formData.commissionAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-gray-700">Platform Keeps:</span>
                    <span className="font-bold text-purple-700 text-lg">
                      ₦{platformKeeps.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Messages */}
              {!pricingValid && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                  {formData.basePrice < 2500
                    ? '❌ Base price must be at least ₦2,500'
                    : formData.basePrice > 10000
                      ? '❌ Base price cannot exceed ₦10,000'
                      : formData.discountAmount >= formData.basePrice
                        ? '❌ Discount must be less than base price'
                        : platformKeeps < 0
                          ? '❌ Platform keeps cannot be negative'
                          : '❌ Invalid pricing configuration'}
                </div>
              )}
              {pricingValid && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
                  ✓ Pricing configuration is valid
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Courses *</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Choose at least one course for this bundle
              </p>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No courses available. Please create courses first.</p>
                  <Button asChild variant="outline" className="mt-2">
                    <Link href="/admin/cbt/courses/create">Create Course</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {courses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.courseIds.includes(course.id)}
                        onChange={() => toggleCourse(course.id)}
                        className="w-4 h-4 rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{course.course_title}</div>
                        <div className="text-sm text-gray-500">{course.course_code}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-3 text-sm text-gray-600">
                Selected: {formData.courseIds.length} course{formData.courseIds.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !pricingValid || formData.courseIds.length === 0}
            >
              {loading ? 'Creating...' : 'Create Bundle'}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/cbt/bundles">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
