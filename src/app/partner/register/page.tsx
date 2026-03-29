'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { registerAsPartner } from '@/lib/actions/partner-registration.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Loader2, ArrowLeft, User, Mail, Lock, Phone, Building2 } from 'lucide-react'

export default function PartnerRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; partnerCode: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const businessName = formData.get('businessName') as string

    const result = await registerAsPartner({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      phone: formData.get('phone') as string,
      businessName: businessName?.trim() || undefined,
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Registration failed')
    } else {
      setSuccess({
        message: result.message || 'Partner account created successfully!',
        partnerCode: result.data?.partnerCode || '',
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/partner/login')
      }, 3000)
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
              Already a partner?{' '}
              <Link href="/partner/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                Login
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
            <h1 className="text-4xl font-bold text-[#1F2A5A] mb-2">Partner Registration</h1>
            <p className="text-[#6B7280] text-lg">Join our partnership program and start earning</p>
          </div>

          {/* Registration Card */}
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

                {/* Success Message */}
                {success && (
                  <div className="bg-[#DCFCE7] border border-[#16A34A] rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[#16A34A] font-medium">{success.message}</p>
                        <p className="text-xs text-[#16A34A] mt-1">Redirecting to login...</p>
                      </div>
                    </div>
                    <div className="bg-white border border-[#16A34A] rounded p-3 mt-3">
                      <p className="text-xs text-[#6B7280] mb-1">Your Partner Code:</p>
                      <p className="text-lg font-mono font-bold text-[#16A34A]">{success.partnerCode}</p>
                      <p className="text-xs text-[#6B7280] mt-2">Save this code. Share it with lecturers to earn referral commissions.</p>
                    </div>
                  </div>
                )}

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#1F2A5A] font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        disabled={loading || !!success}
                        className="pl-10 h-12 border-[#E5E7EB]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#1F2A5A] font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        disabled={loading || !!success}
                        className="pl-10 h-12 border-[#E5E7EB]"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#1F2A5A] font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      disabled={loading || !!success}
                      className="pl-10 h-12 border-[#E5E7EB]"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#1F2A5A] font-medium">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      disabled={loading || !!success}
                      className="pl-10 h-12 border-[#E5E7EB]"
                    />
                  </div>
                  <p className="text-xs text-[#6B7280]">Minimum 6 characters</p>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#1F2A5A] font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+234 xxx xxx xxxx"
                      disabled={loading || !!success}
                      className="pl-10 h-12 border-[#E5E7EB]"
                    />
                  </div>
                </div>

                {/* Business Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-[#1F2A5A] font-medium">
                    Business Name <span className="text-[#6B7280] text-xs">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Leave blank for individual registration"
                      disabled={loading || !!success}
                      className="pl-10 h-12 border-[#E5E7EB]"
                    />
                  </div>
                  <p className="text-xs text-[#6B7280]">💡 Leave blank if registering as individual</p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-base mt-6"
                  disabled={loading || !!success}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Account...
                    </span>
                  ) : success ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Account Created!
                    </span>
                  ) : (
                    'Register as Partner'
                  )}
                </Button>
              </form>

              {/* Login Link */}
              <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center">
                <p className="text-sm text-[#6B7280]">
                  Already have an account?{' '}
                  <Link href="/partner/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
                    Login here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <p className="text-center text-xs text-[#6B7280] mt-6">
            By signing up, you agree to our{' '}
            <Link href="/legal/terms" className="text-[#2563EB] hover:underline">
              Terms
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
