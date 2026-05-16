'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signUp } from '@/lib/actions/auth.actions'
import { validateInstitutionCode } from '@/lib/actions/institution.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CheckCircle, XCircle, Loader2, ArrowLeft, AlertCircle,
  User, Mail, Lock, Phone, Building2, GraduationCap,
  FileText, Hash
} from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'lecturer'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')
  const [level, setLevel] = useState<string>('')
  const [institutionId, setInstitutionId] = useState<string>('')
  const [institutions, setInstitutions] = useState<any[]>([])
  const [loadingInstitutions, setLoadingInstitutions] = useState(true)
  const [referralCode, setReferralCode] = useState<string>('')
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeStatus, setCodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [partnerName, setPartnerName] = useState<string>('')

  // Institution self-register code state
  const [institutionCode, setInstitutionCode] = useState<string>('')
  const [validatingInstCode, setValidatingInstCode] = useState(false)
  const [instCodeStatus, setInstCodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [instCodeName, setInstCodeName] = useState<string>('')
  const [instCodeId, setInstCodeId] = useState<string>('')

  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const response = await fetch('/api/institutions')
        const data = await response.json()
        setInstitutions(data.institutions || [])
      } catch (err) {
        console.error('Failed to load institutions:', err)
      } finally {
        setLoadingInstitutions(false)
      }
    }
    fetchInstitutions()
  }, [])

  // Validate partner referral code (lecturers only)
  useEffect(() => {
    if (role !== 'lecturer' || !referralCode.trim()) {
      setCodeStatus('idle')
      setPartnerName('')
      return
    }
    const timeoutId = setTimeout(async () => {
      await validateReferralCode(referralCode.trim().toUpperCase())
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [referralCode, role])

  // Validate institution self-register code
  useEffect(() => {
    if (!institutionCode.trim()) {
      setInstCodeStatus('idle')
      setInstCodeName('')
      setInstCodeId('')
      return
    }
    const timeoutId = setTimeout(async () => {
      await validateInstCode(institutionCode.trim().toUpperCase())
    }, 600)
    return () => clearTimeout(timeoutId)
  }, [institutionCode])

  async function validateReferralCode(code: string) {
    if (!code) { setCodeStatus('idle'); return }
    setValidatingCode(true)
    try {
      const response = await fetch(`/api/partners/validate-code?code=${code}`)
      const data = await response.json()
      if (data.valid) {
        setCodeStatus('valid')
        setPartnerName(data.partnerName || 'Valid Partner')
      } else {
        setCodeStatus('invalid')
        setPartnerName('')
      }
    } catch {
      setCodeStatus('invalid')
      setPartnerName('')
    } finally {
      setValidatingCode(false)
    }
  }

  async function validateInstCode(code: string) {
    if (!code) { setInstCodeStatus('idle'); return }
    setValidatingInstCode(true)
    try {
      const result = await validateInstitutionCode(code)
      if (result.valid && result.institution) {
        setInstCodeStatus('valid')
        setInstCodeName(result.institution.name)
        setInstCodeId(result.institution.id)
      } else {
        setInstCodeStatus('invalid')
        setInstCodeName('')
        setInstCodeId('')
      }
    } catch {
      setInstCodeStatus('invalid')
      setInstCodeName('')
      setInstCodeId('')
    } finally {
      setValidatingInstCode(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    // If institution code is valid and no institution selected, use the code's institution
    const resolvedInstitutionId = instCodeStatus === 'valid' && instCodeId
      ? instCodeId
      : institutionId

    if (!resolvedInstitutionId) {
      setError('Please select your institution or enter an institution code')
      setLoading(false)
      return
    }

    if (role === 'lecturer' && referralCode.trim() && codeStatus !== 'valid') {
      setError('Please enter a valid referral code or leave it empty')
      setLoading(false)
      return
    }

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      role,
      title: role === 'lecturer' ? title : undefined,
      institutionId: resolvedInstitutionId,
      matricNumber: role === 'student' ? (formData.get('matricNumber') as string) : undefined,
      staffId: role === 'lecturer' ? (formData.get('staffId') as string) : undefined,
      department: formData.get('department') as string,
      faculty: formData.get('faculty') as string,
      level: role === 'student' && level ? parseInt(level) : undefined,
      phone: formData.get('phone') as string,
      referralCode: role === 'lecturer' && referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
      // Pass institution code so auth.actions.ts can link them
      institutionCode: instCodeStatus === 'valid' ? institutionCode.trim().toUpperCase() : undefined,
    }

    const result = await signUp(data)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(result.message || 'Account created successfully!')
      setTimeout(() => router.push('/auth/login'), 2000)
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
              <Image src="/images/logo/assessify-logo-icon.png" alt="Assessify" width={32} height={32} className="rounded" />
              <span className="text-lg sm:text-xl font-bold text-[#1F2A5A]">ASSESSIFY</span>
            </Link>
            <div className="hidden md:block text-sm text-[#6B7280]">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-medium whitespace-nowrap">Login</Link>
            </div>
            <div className="flex md:hidden">
              <Link href="/auth/login" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium whitespace-nowrap">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#1F2A5A] mb-2">Create Your Account</h1>
            <p className="text-[#6B7280] text-lg">Join Assessify and transform your educational experience</p>
          </div>

          <Card className="border-[#E5E7EB] shadow-lg">
            <CardContent className="pt-6">
              <Tabs value={role} onValueChange={(v) => setRole(v as 'student' | 'lecturer')} className="mb-6">
                <TabsList className="grid w-full grid-cols-2 bg-[#F5F7FA] p-1 h-12">
                  <TabsTrigger value="student" className="data-[state=active]:bg-white data-[state=active]:text-[#2563EB] font-medium">
                    <GraduationCap className="w-4 h-4 mr-2" /> Student
                  </TabsTrigger>
                  <TabsTrigger value="lecturer" className="data-[state=active]:bg-white data-[state=active]:text-[#2563EB] font-medium">
                    <User className="w-4 h-4 mr-2" /> Lecturer
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#DC2626]">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="bg-[#DCFCE7] border border-[#16A34A] rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#16A34A]">{success}</p>
                  </div>
                )}

                {/* Institution — two ways to specify */}
                <div className="space-y-3">
                  <Label className="text-[#1F2A5A] font-medium">Institution *</Label>

                  {/* Option A: Select from dropdown */}
                  <Select
                    value={institutionId}
                    onValueChange={(v) => {
                      setInstitutionId(v)
                      // Clear code if they pick from dropdown
                      if (v) {
                        setInstitutionCode('')
                        setInstCodeStatus('idle')
                        setInstCodeName('')
                        setInstCodeId('')
                      }
                    }}
                    disabled={loadingInstitutions || instCodeStatus === 'valid'}
                  >
                    <SelectTrigger className="h-12 border-[#E5E7EB]">
                      <SelectValue placeholder={loadingInstitutions ? 'Loading...' : 'Select your institution'} />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name} ({inst.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#E5E7EB]" />
                    <span className="text-xs text-[#6B7280] font-medium">or enter institution code</span>
                    <div className="flex-1 h-px bg-[#E5E7EB]" />
                  </div>

                  {/* Option B: Institution self-register code */}
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                      <Input
                        value={institutionCode}
                        onChange={(e) => {
                          setInstitutionCode(e.target.value.toUpperCase())
                          // Clear dropdown selection if they type a code
                          if (e.target.value) {
                            setInstitutionId('')
                          }
                        }}
                        placeholder="e.g. UNIPORT01"
                        className="pl-9 pr-10 h-12 border-[#E5E7EB] font-mono tracking-wider"
                        maxLength={12}
                        disabled={!!institutionId}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {validatingInstCode && <Loader2 className="h-4 w-4 animate-spin text-[#6B7280]" />}
                        {!validatingInstCode && instCodeStatus === 'valid' && <CheckCircle className="h-4 w-4 text-[#16A34A]" />}
                        {!validatingInstCode && instCodeStatus === 'invalid' && <XCircle className="h-4 w-4 text-[#DC2626]" />}
                      </div>
                    </div>
                    {instCodeStatus === 'valid' && (
                      <p className="text-xs text-[#16A34A] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified: {instCodeName} — your submissions will be covered by your institution
                      </p>
                    )}
                    {instCodeStatus === 'invalid' && (
                      <p className="text-xs text-[#DC2626]">
                        Invalid or inactive institution code. Try selecting your institution from the dropdown above.
                      </p>
                    )}
                    {instCodeStatus === 'idle' && !institutionId && (
                      <p className="text-xs text-[#6B7280]">
                        Have a code from your institution? Enter it here to get free submissions.
                      </p>
                    )}
                  </div>
                </div>

                {/* Lecturer-specific: Title & Referral Code */}
                {role === 'lecturer' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#1F2A5A] font-medium">Title *</Label>
                      <Select value={title} onValueChange={setTitle} required>
                        <SelectTrigger className="h-12 border-[#E5E7EB]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Engr'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#1F2A5A] font-medium">Referral Code (Optional)</Label>
                      <div className="relative">
                        <Input
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="PART123"
                          className="h-12 pr-10 border-[#E5E7EB]"
                          maxLength={20}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validatingCode && <Loader2 className="h-4 w-4 animate-spin text-[#6B7280]" />}
                          {!validatingCode && codeStatus === 'valid' && <CheckCircle className="h-4 w-4 text-[#16A34A]" />}
                          {!validatingCode && codeStatus === 'invalid' && <XCircle className="h-4 w-4 text-[#DC2626]" />}
                        </div>
                      </div>
                      {codeStatus === 'valid' && (
                        <p className="text-xs text-[#16A34A]">✓ Valid code from {partnerName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#1F2A5A] font-medium">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input id="firstName" name="firstName" required className="pl-10 h-12 border-[#E5E7EB]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#1F2A5A] font-medium">Last Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input id="lastName" name="lastName" required className="pl-10 h-12 border-[#E5E7EB]" />
                    </div>
                  </div>
                </div>

                {/* Email & Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#1F2A5A] font-medium">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input id="email" name="email" type="email" required className="pl-10 h-12 border-[#E5E7EB]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#1F2A5A] font-medium">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input id="password" name="password" type="password" required minLength={6} className="pl-10 h-12 border-[#E5E7EB]" />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#1F2A5A] font-medium">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                    <Input id="phone" name="phone" type="tel" required placeholder="+234 xxx xxx xxxx" className="pl-10 h-12 border-[#E5E7EB]" />
                  </div>
                </div>

                {/* Student-specific */}
                {role === 'student' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="matricNumber" className="text-[#1F2A5A] font-medium">Matric Number *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                        <Input id="matricNumber" name="matricNumber" required placeholder="2020/123456" className="pl-10 h-12 border-[#E5E7EB]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#1F2A5A] font-medium">Level *</Label>
                      <Select value={level} onValueChange={setLevel} required>
                        <SelectTrigger className="h-12 border-[#E5E7EB]">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {['100', '200', '300', '400', '500'].map(l => (
                            <SelectItem key={l} value={l}>{l} Level</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Lecturer-specific: Staff ID */}
                {role === 'lecturer' && (
                  <div className="space-y-2">
                    <Label htmlFor="staffId" className="text-[#1F2A5A] font-medium">Staff ID *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input id="staffId" name="staffId" required placeholder="STAFF/2020/001" className="pl-10 h-12 border-[#E5E7EB]" />
                    </div>
                  </div>
                )}

                {/* Faculty & Department */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty" className="text-[#1F2A5A] font-medium">Faculty *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input id="faculty" name="faculty" required placeholder="e.g., Science" className="pl-10 h-12 border-[#E5E7EB]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-[#1F2A5A] font-medium">Department *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input id="department" name="department" required placeholder="e.g., Computer Science" className="pl-10 h-12 border-[#E5E7EB]" />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-base mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                  ) : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center">
                <p className="text-sm text-[#6B7280]">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">Login here</Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-[#6B7280] mt-6">
            By signing up, you agree to our{' '}
            <Link href="/legal/terms" className="text-[#2563EB] hover:underline">Terms</Link> and{' '}
            <Link href="/legal/privacy" className="text-[#2563EB] hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}