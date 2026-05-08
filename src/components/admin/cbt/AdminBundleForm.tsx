'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBundle, updateBundle, type BundleWithDetails } from '@/lib/actions/admin-cbt-bundles.actions'
import { toast } from 'sonner'

interface Course {
  id: string
  course_code: string
  course_title: string
}

interface AdminBundleFormProps {
  mode: 'create' | 'edit'
  courses: Course[]
  bundle?: BundleWithDetails
}

interface FormData {
  bundle_name: string
  bundle_description: string
  course_ids: string[]
  base_price: number
  promo_price?: number | null
  referrer_commission: number
  validity_days: number
  is_active: boolean
}

export default function AdminBundleForm({ mode, courses, bundle }: AdminBundleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    bundle_name: bundle?.bundle_name || '',
    bundle_description: bundle?.bundle_description || '',
    course_ids: bundle?.course_ids || [],
    base_price: bundle?.base_price || 5000,
    promo_price: bundle?.promo_price || null,
    referrer_commission: bundle?.referrer_commission || 1500,
    validity_days: bundle?.validity_days || 90,
    is_active: bundle?.is_active || true,
  })

  const studentPrice = formData.base_price - (formData.promo_price || 0)
  const platformKeeps = studentPrice - formData.referrer_commission

  const isFormValid =
    formData.bundle_name.trim() &&
    formData.course_ids.length > 0 &&
    formData.base_price >= 0 &&
    formData.referrer_commission >= 0 &&
    platformKeeps >= 0

  function toggleCourse(courseId: string) {
    setFormData((prev) => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter((id) => id !== courseId)
        : [...prev.course_ids, courseId],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isFormValid) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    setLoading(true)

    try {
      let result

      if (mode === 'create') {
        result = await createBundle(formData)
      } else {
        if (!bundle?.id) {
          toast.error('Bundle ID is missing')
          return
        }
        result = await updateBundle(bundle.id, formData)
      }

      if (result.success) {
        toast.success(`Bundle ${mode === 'create' ? 'created' : 'updated'} successfully!`)
        router.push('/admin/cbt/bundles')
      } else {
        toast.error(result.error || `Failed to ${mode} bundle`)
      }
    } catch (error) {
      console.error('[AdminBundleForm]', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bundle Information */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-2xl font-bold mb-6">Bundle Information</h2>

          <div className="space-y-4">
            {/* Bundle Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Bundle Name *</label>
              <input
                type="text"
                value={formData.bundle_name}
                onChange={(e) => setFormData({ ...formData, bundle_name: e.target.value })}
                placeholder="e.g., UTME Biology + Chemistry"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.bundle_description}
                onChange={(e) => setFormData({ ...formData, bundle_description: e.target.value })}
                placeholder="Describe what's included in this bundle..."
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Validity Days */}
            <div>
              <label className="block text-sm font-medium mb-2">Validity (Days) *</label>
              <input
                type="number"
                min="1"
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Active (visible to students)
              </label>
            </div>
          </div>
        </div>

        {/* Pricing Configuration */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-bold mb-6">Pricing Configuration</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Base Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Base Price (₦) *</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Promo Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Promo Price (₦)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.promo_price || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promo_price: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Leave empty for no discount"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Referrer Commission */}
            <div>
              <label className="block text-sm font-medium mb-2">Referrer Commission (₦) *</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.referrer_commission}
                onChange={(e) => setFormData({ ...formData, referrer_commission: Number(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-700">Student Pays:</span>
              <span className="text-xl font-bold text-green-600">₦{studentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-700">Referrer Earns:</span>
              <span className="text-xl font-bold text-blue-600">
                ₦{formData.referrer_commission.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Platform Keeps:</span>
              <span
                className={`text-xl font-bold ${platformKeeps >= 0 ? 'text-purple-600' : 'text-red-600'}`}
              >
                ₦{platformKeeps.toLocaleString()}
              </span>
            </div>
            {platformKeeps < 0 && (
              <p className="text-sm text-red-600 mt-2">❌ Invalid: Platform keeps cannot be negative</p>
            )}
          </div>
        </div>

        {/* Course Selection */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-2xl font-bold mb-6">Select Courses *</h2>

          {courses.length === 0 ? (
            <p className="text-gray-500">No courses available. Please create courses first.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courses.map((course) => (
                <label
                  key={course.id}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.course_ids.includes(course.id)}
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

          <p className="text-sm text-gray-600 mt-4">
            Selected: {formData.course_ids.length} course{formData.course_ids.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? `${mode === 'create' ? 'Creating' : 'Updating'}...` : `${mode === 'create' ? 'Create' : 'Update'} Bundle`}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
