'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getInstitutionAdminDashboard } from '@/lib/actions/institution.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import {
  Users, GraduationCap, BookOpen, CreditCard,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  ArrowRight, Building2, Loader2, RefreshCw,
  ChevronRight, BarChart3, Shield
} from 'lucide-react'

export default function InstitutionDashboard() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) { router.push('/auth/login'); return }
      if (currentUser.profile?.role !== 'institution_admin') { router.push('/'); return }
      setUser(currentUser)

      const result = await getInstitutionAdminDashboard()
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to load dashboard')
      } else {
        setData(result.data)
      }
      setIsLoading(false)
    }
    load()
  }, [router])

  if (isLoading) return <DashboardSkeleton />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const { institution, licenseStatus, studentCount, lecturerCount, totalSubmissions, recentPayments } = data

  const daysRemaining = licenseStatus.daysRemaining
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 14
  const licenseColor = !licenseStatus.isActive
    ? { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', badge: '#DC2626' }
    : isExpiringSoon
    ? { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', badge: '#D97706' }
    : { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', badge: '#16A34A' }

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F2', fontFamily: "'Instrument Sans', 'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        
        .inst-header {
          background: #0A1628;
          border-bottom: 1px solid #1e3a5f;
        }
        .stat-card {
          background: white;
          border: 1px solid #E8E6E0;
          border-radius: 16px;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .stat-card:hover {
          box-shadow: 0 8px 24px rgba(10,22,40,0.08);
          transform: translateY(-2px);
        }
        .license-card {
          border-radius: 16px;
          border-width: 1px;
          border-style: solid;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          transition: all 0.15s ease;
          text-decoration: none;
        }
        .nav-link:hover { color: white; background: rgba(255,255,255,0.08); }
        .nav-link.active { color: white; background: rgba(255,255,255,0.12); }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: white;
          border: 1px solid #E8E6E0;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .action-btn:hover {
          border-color: #0A1628;
          box-shadow: 0 4px 12px rgba(10,22,40,0.08);
        }
        .metric-num {
          font-family: 'Instrument Serif', serif;
          font-size: 2.5rem;
          line-height: 1;
          color: #0A1628;
        }
        .fade-up {
          animation: fadeUp 0.4s ease forwards;
          opacity: 0;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .payment-row { border-bottom: 1px solid #F0EEE8; }
        .payment-row:last-child { border-bottom: none; }
      `}</style>

      {/* Header */}
      <header className="inst-header">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                {institution.logo_url ? (
                  <img src={institution.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{institution.name}</p>
                  <p className="text-white/40 text-xs font-mono">{institution.code}</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <Link href="/institution/dashboard" className="nav-link active">Dashboard</Link>
                <Link href="/institution/students" className="nav-link">Students</Link>
                <Link href="/institution/lecturers" className="nav-link">Lecturers</Link>
                <Link href="/institution/license" className="nav-link">License</Link>
                <Link href="/institution/reports" className="nav-link">Reports</Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-sm hidden md:block">
                {user?.profile?.first_name} {user?.profile?.last_name}
              </span>
              <div className="w-8 h-8 bg-[#3B82F6]/20 rounded-full flex items-center justify-center">
                <span className="text-[#3B82F6] text-xs font-bold">
                  {user?.profile?.first_name?.[0]}{user?.profile?.last_name?.[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Page title */}
        <div className="fade-up" style={{ animationDelay: '0s' }}>
          <h1 className="text-2xl font-bold text-[#0A1628]" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Institution Dashboard
          </h1>
          <p className="text-sm text-[#0A1628]/50 mt-1">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* License Status Banner */}
        <div
          className="license-card p-5 fade-up"
          style={{
            animationDelay: '0.05s',
            background: licenseColor.bg,
            borderColor: licenseColor.border,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {!licenseStatus.isActive
                  ? <AlertTriangle className="w-5 h-5" style={{ color: licenseColor.badge }} />
                  : isExpiringSoon
                  ? <Clock className="w-5 h-5" style={{ color: licenseColor.badge }} />
                  : <CheckCircle className="w-5 h-5" style={{ color: licenseColor.badge }} />
                }
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: licenseColor.text }}>
                  {!licenseStatus.isActive
                    ? 'License Expired or Inactive'
                    : isExpiringSoon
                    ? `License expiring in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
                    : `License Active — ${daysRemaining} days remaining`
                  }
                </p>
                <p className="text-xs mt-0.5" style={{ color: licenseColor.text, opacity: 0.7 }}>
                  {licenseStatus.expiresAt
                    ? `Expires ${new Date(licenseStatus.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'No active license'
                  }
                  {licenseStatus.lecturerEarningPerSubmission > 0 && ` · Lecturer rate: ₦${licenseStatus.lecturerEarningPerSubmission}/submission`}
                </p>
              </div>
            </div>
            {(!licenseStatus.isActive || isExpiringSoon) && (
              <Link
                href="/institution/license"
                className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: licenseColor.badge }}
              >
                Renew Now
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up" style={{ animationDelay: '0.1s' }}>
          {[
            {
              label: 'Students', value: studentCount,
              icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
              bg: 'bg-blue-50', href: '/institution/students'
            },
            {
              label: 'Lecturers', value: lecturerCount,
              icon: <Users className="w-5 h-5 text-purple-600" />,
              bg: 'bg-purple-50', href: '/institution/lecturers'
            },
            {
              label: 'Submissions', value: totalSubmissions,
              icon: <BookOpen className="w-5 h-5 text-teal-600" />,
              bg: 'bg-teal-50', href: '/institution/reports'
            },
            {
              label: 'License Payments', value: recentPayments.length,
              icon: <CreditCard className="w-5 h-5 text-orange-600" />,
              bg: 'bg-orange-50', href: '/institution/license'
            },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <div className="stat-card p-5">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  {stat.icon}
                </div>
                <p className="metric-num">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-[#0A1628]/50 mt-1 font-medium">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <div className="fade-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs font-mono tracking-widest uppercase text-[#0A1628]/30 mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[
                { href: '/institution/students', label: 'Manage Students', sub: 'View, invite, remove', icon: <GraduationCap className="w-4 h-4 text-blue-600" /> },
                { href: '/institution/lecturers', label: 'Manage Lecturers', sub: 'View and manage staff', icon: <Users className="w-4 h-4 text-purple-600" /> },
                { href: '/institution/license', label: 'License & Billing', sub: 'Renew or upgrade plan', icon: <Shield className="w-4 h-4 text-teal-600" /> },
                { href: '/institution/reports', label: 'Usage Reports', sub: 'Submission analytics', icon: <BarChart3 className="w-4 h-4 text-orange-600" /> },
              ].map((action) => (
                <Link key={action.href} href={action.href} className="action-btn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F7F6F2] rounded-lg flex items-center justify-center">
                      {action.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0A1628]">{action.label}</p>
                      <p className="text-xs text-[#0A1628]/40">{action.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0A1628]/30" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="md:col-span-2 fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono tracking-widest uppercase text-[#0A1628]/30">Recent Payments</p>
              <Link href="/institution/license" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="stat-card overflow-hidden">
              {recentPayments.length === 0 ? (
                <div className="py-12 text-center">
                  <CreditCard className="w-10 h-10 text-[#0A1628]/15 mx-auto mb-3" />
                  <p className="text-sm text-[#0A1628]/40 font-medium">No payments yet</p>
                  <p className="text-xs text-[#0A1628]/25 mt-1">License payments will appear here</p>
                  <Link
                    href="/institution/license"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Activate License <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-[#F7F6F2] border-b border-[#E8E6E0]">
                    {['Date', 'Plan', 'Students', 'Amount'].map(h => (
                      <p key={h} className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40">{h}</p>
                    ))}
                  </div>
                  {recentPayments.map((payment: any) => (
                    <div key={payment.id} className="payment-row grid grid-cols-4 gap-4 px-5 py-4 items-center">
                      <p className="text-sm text-[#0A1628]">
                        {new Date(payment.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </p>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full w-fit ${
                        payment.billing_cycle === 'yearly'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {payment.billing_cycle}
                      </span>
                      <p className="text-sm text-[#0A1628]">{payment.student_count}</p>
                      <p className="text-sm font-semibold text-[#0A1628]">
                        ₦{Number(payment.total_amount).toLocaleString('en-NG')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Institution Info Footer */}
        <div className="stat-card p-5 fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs text-[#0A1628]/40 font-mono uppercase tracking-wider">Institution</p>
              <p className="text-sm font-semibold text-[#0A1628] mt-0.5">{institution.name}</p>
            </div>
            <div>
              <p className="text-xs text-[#0A1628]/40 font-mono uppercase tracking-wider">Code</p>
              <p className="text-sm font-mono font-semibold text-[#0A1628] mt-0.5">{institution.code}</p>
            </div>
            {institution.city && (
              <div>
                <p className="text-xs text-[#0A1628]/40 font-mono uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-[#0A1628] mt-0.5">{institution.city}, {institution.state}</p>
              </div>
            )}
            {institution.self_register_code && institution.self_register_enabled && (
              <div>
                <p className="text-xs text-[#0A1628]/40 font-mono uppercase tracking-wider">Self-Register Code</p>
                <p className="text-sm font-mono font-bold text-blue-600 mt-0.5 tracking-widest">
                  {institution.self_register_code}
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <div className="bg-[#0A1628] h-16" />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-lg font-semibold text-[#0A1628]">Something went wrong</p>
        <p className="text-sm text-[#0A1628]/50 mt-1">{message}</p>
        <button onClick={() => window.location.reload()} className="mt-4 flex items-center gap-2 mx-auto text-sm text-blue-600">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  )
}