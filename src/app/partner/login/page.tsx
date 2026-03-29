'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { loginAsPartner } from '@/lib/actions/partner-registration.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Loader2, ArrowLeft, Mail, Lock } from 'lucide-react'

export default function PartnerLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const result = await loginAsPartner(
      formData.get('email') as string,
      formData.get('password') as string
    )

    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Login failed')
    } else {
      // Redirect to partner dashboard
      router.push('/partner')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <ArrowLeft className="w-5 h-5 text-[#6B7280] group-hover:text-[#1F2A5A] transition-colors shrink-0" />
              <Image
                src="/images/logo/assessify-logo-icon.png"
                alt="Assessify"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="text-lg sm:text-xl font-bold text-[#1F2A5A]">ASSESSIFY</span>
            </Link>
            <div className="text-sm text-[#6B7280]">
              New partner?{' '}
              <Link href="/partner/register" className="text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#1F2A5A] mb-2">Partner Login</h1>
            <p className="text-[#6B7280] text-lg">Welcome back! Sign in to your account</p>
          </div>

          {/* Login Card */}
          <Card className="border-[#E5E7EB] shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#DC2626]">{error}</p>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#1F2A5A] font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-[#E5E7EB]"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[#1F2A5A] font-medium">
                      Password
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-[#E5E7EB]"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-base mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Register Link */}
              <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center">
                <p className="text-sm text-[#6B7280]">
                  Don't have an account?{' '}
                  <Link href="/partner/register" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
                    Register as Partner
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
