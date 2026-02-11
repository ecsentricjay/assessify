'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const message = searchParams.get('message')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn(email, password)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : null
      if (error && !error.message.includes('NEXT_REDIRECT')) {
        setError('An unexpected error occurred. Please try again.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <ArrowLeft className="w-5 h-5 text-[#6B7280] group-hover:text-[#1F2A5A] transition-colors" />
              <Image
                src="/images/logo/assessify-logo-icon.png"
                alt="Assessify"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="text-xl font-bold text-[#1F2A5A]">ASSESSIFY</span>
            </Link>
            <div className="text-sm text-[#6B7280]">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#1F2A5A] mb-2">Welcome Back</h1>
            <p className="text-[#6B7280] text-lg">Login to continue to your dashboard</p>
          </div>

          {/* Login Card */}
          <Card className="border-[#E5E7EB] shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Success message */}
                {message && (
                  <div className="bg-[#DCFCE7] border border-[#16A34A] rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#16A34A]">{message}</p>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#DC2626]">{error}</p>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#1F2A5A] font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-[#E5E7EB] focus:border-[#2563EB] focus:ring-[#2563EB]"
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
                      href="/auth/reset-password"
                      className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium"
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
                      placeholder="Enter your password"
                      required
                      minLength={6}
                      disabled={loading}
                      className="pl-10 h-12 border-[#E5E7EB] focus:border-[#2563EB] focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    'Login to Dashboard'
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center">
                <p className="text-sm text-[#6B7280]">
                  New to Assessify?{' '}
                  <Link href="/auth/signup" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
                    Create an account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <p className="text-center text-xs text-[#6B7280] mt-6">
            By continuing, you agree to Assessify's{' '}
            <Link href="/legal/terms" className="text-[#2563EB] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-[#2563EB] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}