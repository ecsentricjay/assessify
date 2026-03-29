'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { resetPassword } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const result = await resetPassword(email)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(result.message || 'Password reset email sent! Please check your inbox.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-[#6B7280] group-hover:text-[#1F2A5A] transition-colors flex-shrink-0" />
              <Image
                src="/images/logo/assessify-logo-icon.png"
                alt="Assessify"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="text-lg sm:text-xl font-bold text-[#1F2A5A]">ASSESSIFY</span>
            </Link>
            <div className="hidden md:block">
              <Link href="/auth/login" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium whitespace-nowrap">
                Back to Login
              </Link>
            </div>
            <div className="flex md:hidden">
              <Link href="/auth/login" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium whitespace-nowrap">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#2563EB]" />
            </div>
            <h1 className="text-4xl font-bold text-[#1F2A5A] mb-2">Reset Password</h1>
            <p className="text-[#6B7280] text-lg">We&apos;ll send you a link to reset your password</p>
          </div>

          {/* Reset Card */}
          <Card className="border-[#E5E7EB] shadow-lg">
            <CardContent className="pt-6">
              {success ? (
                <div className="space-y-6">
                  <div className="bg-[#DCFCE7] border-2 border-[#16A34A] rounded-lg p-6 text-center">
                    <CheckCircle2 className="w-16 h-16 text-[#16A34A] mx-auto mb-4" />
                    <h3 className="font-bold text-[#1F2A5A] text-lg mb-2">Email Sent!</h3>
                    <p className="text-sm text-[#16A34A]">{success}</p>
                  </div>

                  <div className="text-center space-y-4">
                    <p className="text-sm text-[#6B7280]">
                      Didn&apos;t receive the email? Check your spam folder or
                    </p>
                    <button
                      onClick={() => setSuccess(null)}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-medium text-sm"
                    >
                      Try again
                    </button>
                  </div>

                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full h-12 border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF]">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
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
                        autoFocus
                        className="pl-10 h-12 border-[#E5E7EB] focus:border-[#2563EB] focus:ring-[#2563EB]"
                      />
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      Enter the email associated with your account
                    </p>
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
                        Sending Email...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>

                  {/* Back to Login */}
                  <div className="text-center pt-4 border-t border-[#E5E7EB]">
                    <p className="text-sm text-[#6B7280]">
                      Remember your password?{' '}
                      <Link href="/auth/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
                        Back to Login
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}