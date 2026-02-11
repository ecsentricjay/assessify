'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { enrollWithCode } from '@/lib/actions/course.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EnrollWithCodeForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const code = formData.get('code') as string

    const result = await enrollWithCode(code.trim().toUpperCase())

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(result.message || 'Enrolled successfully!')
      setTimeout(() => {
        router.refresh()
      }, 1500)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Enrollment Code</Label>
        <Input
          id="code"
          name="code"
          placeholder="e.g., ABC12XYZ"
          required
          maxLength={20}
          className="uppercase"
          disabled={loading}
        />
        <p className="text-xs text-gray-500">
          Enter the 8-character code from your lecturer
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-md text-sm">
          {success}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </Button>
    </form>
  )
}