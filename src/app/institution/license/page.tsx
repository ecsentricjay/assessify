'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getInstitutionAdminDashboard,
  calculateLicensePrice,
  initializeLicensePayment,
} from '@/lib/actions/institution.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import {
  Shield, CheckCircle, AlertTriangle, Clock,
  CreditCard, Loader2, X, ChevronDown, Building2,
  ArrowRight, RefreshCw, Info
} from 'lucide-react'

const NAV = [
  { href: '/institution/dashboard', label: 'Dashboard' },
  { href: '/institution/students', label: 'Students' },
  { href: '/institution/lecturers', label: 'Lecturers' },
  { href: '/institution/license', label: 'License' },
  { href: '/institution/reports', label: 'Reports' },
]

export default function InstitutionLicensePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Payment form state
  const [studentCount, setStudentCount] = useState<number>(100)
  const [billingCycle, setBillingCycle] = useState<'quarterly' | 'yearly'>('quarterly')
  const [pricePreview, setPricePreview] = useState<{ pricePerStudent: number; totalAmount: number; periodMonths: number } | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) { router.push('/auth/login'); return }
      if (currentUser.profile?.role !== 'institution_admin') { router.push('/'); return }
      setUser(currentUser)

      const result = await getInstitutionAdminDashboard()
      if (result.success && result.data) {
        setData(result.data)
        setStudentCount(result.data.institution.student_count || 100)
      }
      setIsLoading(false)
    }
    load()
  }, [router])

  // Recalculate price when inputs change
  useEffect(() => {
    if (!data?.institution?.id) return
    const debounce = setTimeout(async () => {
      if (studentCount < 1) return
      setPriceLoading(true)
      const preview = await calculateLicensePrice(data.institution.id, studentCount, billingCycle)
      setPricePreview(preview)
      setPriceLoading(false)
    }, 400)
    return () => clearTimeout(debounce)
  }, [studentCount, billingCycle, data])

  const handlePayment = async () => {
    setPaymentError('')
    if (studentCount < 1) { setPaymentError('Student count must be at least 1'); return }
    setPaymentLoading(true)

    const result = await initializeLicensePayment({ studentCount, billingCycle })
    if (!result.success || !result.authorizationUrl) {
      setPaymentError(result.error || 'Failed to initialize payment')
      setPaymentLoading(false)
      return
    }

    // Redirect to Paystack
    window.location.href = result.authorizationUrl
  }

  if (isLoading) return <LicenseSkeleton />
  if (!data) return null

  const { institution, licenseStatus, recentPayments } = data
  const daysRemaining = licenseStatus.daysRemaining
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 14

  const statusConfig = !licenseStatus.isActive
    ? { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Expired / Inactive', icon: <AlertTriangle className="w-5 h-5 text-red-600" /> }
    : isExpiringSoon
    ? { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: `Expiring in ${daysRemaining} days`, icon: <Clock className="w-5 h-5 text-amber-600" /> }
    : { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Active', icon: <CheckCircle className="w-5 h-5 text-green-600" /> }

  const yearlyDiscount = 15

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F2', fontFamily: "'Instrument Sans', 'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        .inst-header { background: #0A1628; border-bottom: 1px solid #1e3a5f; }
        .nav-link { display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:8px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.6); transition:all 0.15s; text-decoration:none; }
        .nav-link:hover { color:white; background:rgba(255,255,255,0.08); }
        .nav-link.active { color:white; background:rgba(255,255,255,0.12); }
        .card { background:white; border:1px solid #E8E6E0; border-radius:16px; }
        .cycle-btn { flex:1; padding:10px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.15s; border:2px solid transparent; }
        .cycle-btn.active { background:#0A1628; color:white; border-color:#0A1628; }
        .cycle-btn.inactive { background:white; color:#0A1628; border-color:#E8E6E0; }
        .cycle-btn.inactive:hover { border-color:#0A1628; }
        .input { width:100%; border:1px solid #E8E6E0; border-radius:10px; padding:10px 14px; font-size:14px; outline:none; transition:border-color 0.15s; }
        .input:focus { border-color:#3B82F6; }
        .btn-pay { background:#0A1628; color:white; border:none; border-radius:12px; padding:14px 24px; font-size:15px; font-weight:700; cursor:pointer; width:100%; transition:background 0.15s; }
        .btn-pay:hover:not(:disabled) { background:#0d1f3c; }
        .btn-pay:disabled { opacity:0.5; cursor:not-allowed; }
        .price-num { font-family:'Instrument Serif',serif; font-size:3rem; line-height:1; color:#0A1628; }
        .payment-row { border-bottom:1px solid #F0EEE8; }
        .payment-row:last-child { border-bottom:none; }
        .fade-up { animation:fadeUp 0.35s ease forwards; opacity:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .info-box { background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; padding:14px; }
      `}</style>

      <header className="inst-header">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                </div>
                <span className="text-white font-semibold text-sm">Institution Admin</span>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                {NAV.map(n => (
                  <Link key={n.href} href={n.href} className={`nav-link ${n.href === '/institution/license' ? 'active' : ''}`}>
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
            <span className="text-white/40 text-sm hidden md:block">
              {user?.profile?.first_name} {user?.profile?.last_name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="fade-up">
          <h1 className="text-2xl font-bold text-[#0A1628]">License & Billing</h1>
          <p className="text-sm text-[#0A1628]/50 mt-1">Manage your institution's Assessify license</p>
        </div>

        {/* Current Status */}
        <div
          className="card p-6 fade-up"
          style={{ animationDelay: '0.05s', background: statusConfig.bg, borderColor: statusConfig.border }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {statusConfig.icon}
              <div>
                <p className="font-semibold text-[#0A1628]">
                  License Status: <span style={{ color: statusConfig.color }}>{statusConfig.label}</span>
                </p>
                {licenseStatus.expiresAt && (
                  <p className="text-sm text-[#0A1628]/60 mt-1">
                    {licenseStatus.isActive ? 'Expires' : 'Expired'}{' '}
                    {new Date(licenseStatus.expiresAt).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                )}
                {licenseStatus.lecturerEarningPerSubmission > 0 && (
                  <p className="text-sm text-[#0A1628]/60 mt-0.5">
                    Lecturer rate: ₦{licenseStatus.lecturerEarningPerSubmission.toLocaleString()} per submission
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40">Institution</p>
              <p className="text-sm font-semibold text-[#0A1628] mt-0.5">{institution.name}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Payment Form */}
          <div className="card p-6 fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-[#0A1628] text-sm">
                  {licenseStatus.isActive ? 'Renew License' : 'Activate License'}
                </p>
                <p className="text-xs text-[#0A1628]/40">Pay via Paystack</p>
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="mb-4">
              <label className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 mb-2 block">
                Billing Cycle
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBillingCycle('quarterly')}
                  className={`cycle-btn ${billingCycle === 'quarterly' ? 'active' : 'inactive'}`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`cycle-btn ${billingCycle === 'yearly' ? 'active' : 'inactive'} relative`}
                >
                  Yearly
                  <span className="absolute -top-2.5 -right-1 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    -{yearlyDiscount}%
                  </span>
                </button>
              </div>
            </div>

            {/* Student Count */}
            <div className="mb-5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 mb-2 block">
                Number of Students
              </label>
              <input
                type="number"
                min={1}
                max={50000}
                value={studentCount}
                onChange={e => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="input"
                placeholder="e.g. 500"
              />
              <p className="text-xs text-[#0A1628]/40 mt-1.5">
                Enter the total number of students to cover under this license
              </p>
            </div>

            {/* Price Preview */}
            {pricePreview && !priceLoading && (
              <div className="bg-[#F7F6F2] rounded-xl p-4 mb-5">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 mb-1">Total Amount</p>
                    <p className="price-num">₦{pricePreview.totalAmount.toLocaleString('en-NG')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#0A1628]/40">
                      ₦{pricePreview.pricePerStudent.toLocaleString()}/student/month
                    </p>
                    <p className="text-xs text-[#0A1628]/40 mt-0.5">
                      {pricePreview.periodMonths} month{pricePreview.periodMonths > 1 ? 's' : ''} coverage
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#0A1628]/60">
                    <span>{studentCount.toLocaleString()} students × ₦{pricePreview.pricePerStudent}/month × {pricePreview.periodMonths} months</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Yearly discount ({yearlyDiscount}%)</span>
                      <span>-₦{(pricePreview.pricePerStudent * studentCount * pricePreview.periodMonths * 0.15).toLocaleString('en-NG')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {priceLoading && (
              <div className="bg-[#F7F6F2] rounded-xl p-4 mb-5 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0A1628]/40" />
                <span className="text-sm text-[#0A1628]/40">Calculating price...</span>
              </div>
            )}

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{paymentError}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={paymentLoading || priceLoading || !pricePreview || pricePreview.totalAmount === 0}
              className="btn-pay flex items-center justify-center gap-2"
            >
              {paymentLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Pay ₦{pricePreview?.totalAmount.toLocaleString('en-NG') || '—'}</>
              )}
            </button>

            <div className="info-box mt-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Payment is processed securely via Paystack. Once confirmed, your license activates immediately and all covered students get free submissions.
                </p>
              </div>
            </div>
          </div>

          {/* What's included */}
          <div className="space-y-4 fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="card p-5">
              <p className="text-sm font-semibold text-[#0A1628] mb-4">What's included</p>
              <div className="space-y-3">
                {[
                  { label: 'Free submissions for all covered students', sub: 'Students pay ₦0 per assignment or test' },
                  { label: 'Lecturer earnings per submission', sub: `₦${licenseStatus.lecturerEarningPerSubmission.toLocaleString() || '—'} paid per submission from institution funds` },
                  { label: 'Institution admin dashboard', sub: 'Manage students, lecturers, and usage' },
                  { label: 'Usage reports', sub: 'Track submissions and engagement' },
                  { label: 'Email invitations', sub: 'Invite students and lecturers directly' },
                  { label: 'Self-registration code', sub: 'Students can sign up using your institution code' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0A1628]">{item.label}</p>
                      <p className="text-xs text-[#0A1628]/50 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {institution.self_register_code && institution.self_register_enabled && (
              <div className="card p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 mb-2">Self-Register Code</p>
                <p className="text-2xl font-mono font-bold text-blue-600 tracking-widest">
                  {institution.self_register_code}
                </p>
                <p className="text-xs text-[#0A1628]/50 mt-2">
                  Share this code with students and lecturers to let them self-register under your institution
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="card overflow-hidden fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="px-6 py-4 border-b border-[#E8E6E0]">
            <p className="font-semibold text-[#0A1628]">Payment History</p>
          </div>
          {recentPayments.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="w-10 h-10 text-[#0A1628]/15 mx-auto mb-3" />
              <p className="text-sm text-[#0A1628]/40">No payments yet</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-[#F7F6F2] border-b border-[#E8E6E0]">
                {['Date', 'Cycle', 'Students', 'Period', 'Amount'].map(h => (
                  <p key={h} className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40">{h}</p>
                ))}
              </div>
              {recentPayments.map((p: any) => (
                <div key={p.id} className="payment-row grid grid-cols-5 gap-4 px-6 py-4 items-center">
                  <p className="text-sm text-[#0A1628]">
                    {new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full w-fit ${
                    p.billing_cycle === 'yearly' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {p.billing_cycle}
                  </span>
                  <p className="text-sm text-[#0A1628]">{p.student_count?.toLocaleString()}</p>
                  <p className="text-xs text-[#0A1628]/60">
                    {new Date(p.period_start).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' })}
                    {' → '}
                    {new Date(p.period_end).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' })}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0A1628]">
                      ₦{Number(p.total_amount).toLocaleString('en-NG')}
                    </p>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

function LicenseSkeleton() {
  return (
    <div className="min-screen bg-[#F7F6F2]">
      <div className="bg-[#0A1628] h-16" />
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}