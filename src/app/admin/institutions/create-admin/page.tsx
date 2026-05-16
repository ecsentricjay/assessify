// app/admin/institutions/create-admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createInstitutionAdmin, getAllInstitutions } from '@/lib/actions/institution.actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Building2, User, Mail, Phone, Lock,
  ChevronLeft, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff
} from 'lucide-react'

export default function CreateInstitutionAdminPage() {
  const router = useRouter()
  const [institutions, setInstitutions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingInstitutions, setLoadingInstitutions] = useState(true)
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    institutionId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    getAllInstitutions().then(res => {
      if (res.success) setInstitutions(res.institutions)
      setLoadingInstitutions(false)
    })
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.institutionId) newErrors.institutionId = 'Select an institution'
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!form.email.trim() || !form.email.includes('@')) newErrors.email = 'Valid email is required'
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required'
    if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setResult(null)

    const res = await createInstitutionAdmin({
      institutionId: form.institutionId,
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      password: form.password,
      phone: form.phone,
    })

    setResult({
      success: res.success,
      message: res.success
        ? `Institution admin created successfully. They can log in with ${form.email}`
        : res.error || 'Failed to create admin',
    })

    if (res.success) {
      setForm({ institutionId: '', firstName: '', lastName: '', email: '', phone: '', password: '' })
      setTimeout(() => router.push('/admin/institutions'), 2500)
    }

    setIsLoading(false)
  }

  const selectedInstitution = institutions.find(i => i.id === form.institutionId)

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back link */}
        <Link
          href="/admin/institutions"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Institutions
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Institution Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create an admin account for an institution. They will manage their institution's students, lecturers, and license.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Institution Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Institution
              </CardTitle>
              <CardDescription>Select which institution this admin belongs to</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInstitutions ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading institutions...
                </div>
              ) : (
                <div>
                  <select
                    value={form.institutionId}
                    onChange={set('institutionId')}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors bg-white ${
                      errors.institutionId ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select an institution...</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.code})
                      </option>
                    ))}
                  </select>
                  {errors.institutionId && (
                    <p className="text-xs text-red-500 mt-1">{errors.institutionId}</p>
                  )}
                  {selectedInstitution && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">{selectedInstitution.name}</p>
                        <p className="text-xs text-blue-600">
                          {selectedInstitution.studentCount} students · {selectedInstitution.lecturerCount} lecturers ·{' '}
                          <span className={selectedInstitution.licenseActive ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                            {selectedInstitution.licenseActive ? 'License Active' : 'No Active License'}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Admin Details
              </CardTitle>
              <CardDescription>Personal information for the institution admin account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={set('firstName')}
                    placeholder="e.g. John"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors ${
                      errors.firstName ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={set('lastName')}
                    placeholder="e.g. Doe"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors ${
                      errors.lastName ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="admin@university.edu.ng"
                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors ${
                      errors.email ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+2348012345678"
                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors ${
                      errors.phone ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Minimum 8 characters"
                    className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors ${
                      errors.password ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                <p className="text-xs text-gray-400 mt-1.5">
                  Share this password with the admin securely. They can change it after first login.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
              result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {result.success
                ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              }
              <div>
                <p className="font-semibold">{result.success ? 'Admin Created!' : 'Error'}</p>
                <p className="mt-0.5 font-normal">{result.message}</p>
                {result.success && (
                  <p className="mt-1 text-green-700 text-xs">Redirecting to institutions list...</p>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating Admin...</>
            ) : (
              'Create Institution Admin'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}