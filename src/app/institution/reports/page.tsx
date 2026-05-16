'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getInstitutionUsageReport, getInstitutionAdminDashboard } from '@/lib/actions/institution.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import {
  BarChart3, Download, Calendar, Loader2,
  TrendingUp, BookOpen, Users, Building2,
  ArrowDownLeft, Filter
} from 'lucide-react'

const NAV = [
  { href: '/institution/dashboard', label: 'Dashboard' },
  { href: '/institution/students', label: 'Students' },
  { href: '/institution/lecturers', label: 'Lecturers' },
  { href: '/institution/license', label: 'License' },
  { href: '/institution/reports', label: 'Reports' },
]

export default function InstitutionReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [report, setReport] = useState<any>(null)
  const [dashboard, setDashboard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterLoading, setFilterLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) { router.push('/auth/login'); return }
      if (currentUser.profile?.role !== 'institution_admin') { router.push('/'); return }
      setUser(currentUser)

      const [reportResult, dashResult] = await Promise.all([
        getInstitutionUsageReport(),
        getInstitutionAdminDashboard(),
      ])

      if (reportResult.success) setReport(reportResult.report)
      if (dashResult.success) setDashboard(dashResult.data)
      setIsLoading(false)
    }
    load()
  }, [router])

  const handleFilter = async () => {
    setFilterLoading(true)
    const result = await getInstitutionUsageReport(
      dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
    )
    if (result.success) setReport(result.report)
    setFilterLoading(false)
  }

  const handleExportCSV = () => {
    if (!report?.transactions?.length) return

    const rows = [
      ['Date', 'Type', 'Amount', 'Reference', 'Description'],
      ...report.transactions.map((t: any) => [
        new Date(t.created_at).toLocaleDateString('en-NG'),
        t.purpose || t.type,
        `₦${Number(t.amount).toLocaleString()}`,
        t.reference || '',
        t.description || '',
      ])
    ]

    const csv = rows.map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Group transactions by week for a simple chart
  const getWeeklyData = () => {
    if (!report?.transactions?.length) return []
    const weeks: Record<string, number> = {}
    report.transactions.forEach((t: any) => {
      const d = new Date(t.created_at)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const key = weekStart.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
      weeks[key] = (weeks[key] || 0) + 1
    })
    return Object.entries(weeks).slice(-8).map(([week, count]) => ({ week, count }))
  }

  const weeklyData = getWeeklyData()
  const maxCount = Math.max(...weeklyData.map(w => w.count), 1)

  if (isLoading) return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#0A1628]/30" />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F2', fontFamily: "'Instrument Sans', 'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        .inst-header { background: #0A1628; border-bottom: 1px solid #1e3a5f; }
        .nav-link { display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:8px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.6); transition:all 0.15s; text-decoration:none; }
        .nav-link:hover { color:white; background:rgba(255,255,255,0.08); }
        .nav-link.active { color:white; background:rgba(255,255,255,0.12); }
        .card { background:white; border:1px solid #E8E6E0; border-radius:16px; }
        .stat-card { background:white; border:1px solid #E8E6E0; border-radius:14px; padding:20px; }
        .input { border:1px solid #E8E6E0; border-radius:10px; padding:9px 14px; font-size:14px; outline:none; transition:border-color 0.15s; }
        .input:focus { border-color:#3B82F6; }
        .btn { border-radius:10px; padding:9px 18px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .btn-primary { background:#0A1628; color:white; border:none; }
        .btn-primary:hover { background:#0d1f3c; }
        .btn-outline { background:white; color:#0A1628; border:1px solid #E8E6E0; }
        .btn-outline:hover { border-color:#0A1628; }
        .tx-row { border-bottom:1px solid #F0EEE8; transition:background 0.1s; }
        .tx-row:last-child { border-bottom:none; }
        .tx-row:hover { background:#FAFAF8; }
        .metric-num { font-family:'Instrument Serif',serif; font-size:2.2rem; line-height:1; color:#0A1628; }
        .fade-up { animation:fadeUp 0.35s ease forwards; opacity:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .bar { background:#3B82F6; border-radius:4px 4px 0 0; transition:height 0.3s ease; min-height:4px; }
        .bar:hover { background:#2563EB; }
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
                  <Link key={n.href} href={n.href} className={`nav-link ${n.href === '/institution/reports' ? 'active' : ''}`}>
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

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between fade-up">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">Usage Reports</h1>
            <p className="text-sm text-[#0A1628]/50 mt-1">Submission and engagement analytics for your institution</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={!report?.transactions?.length}
            className="btn btn-outline flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up" style={{ animationDelay: '0.05s' }}>
          {[
            {
              label: 'Total Submissions',
              value: report?.totalSubmissions || 0,
              icon: <BookOpen className="w-5 h-5 text-blue-600" />,
              bg: 'bg-blue-50',
            },
            {
              label: 'Total Students',
              value: dashboard?.studentCount || 0,
              icon: <Users className="w-5 h-5 text-purple-600" />,
              bg: 'bg-purple-50',
            },
            {
              label: 'Total Lecturers',
              value: dashboard?.lecturerCount || 0,
              icon: <Users className="w-5 h-5 text-teal-600" />,
              bg: 'bg-teal-50',
            },
            {
              label: 'Avg Submissions/Student',
              value: dashboard?.studentCount
                ? (report?.totalSubmissions / dashboard.studentCount).toFixed(1)
                : '0',
              icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
              bg: 'bg-orange-50',
            },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="metric-num">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-[#0A1628]/50 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        {weeklyData.length > 0 && (
          <div className="card p-6 fade-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-sm font-semibold text-[#0A1628] mb-5">Weekly Submission Activity</p>
            <div className="flex items-end gap-2 h-32">
              {weeklyData.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-[#0A1628]/50 font-mono">{w.count}</p>
                  <div
                    className="bar w-full"
                    style={{ height: `${Math.max((w.count / maxCount) * 96, 4)}px` }}
                    title={`${w.week}: ${w.count} submissions`}
                  />
                  <p className="text-[10px] text-[#0A1628]/30 font-mono text-center leading-tight">
                    {w.week}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Filter */}
        <div className="card p-5 fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 mb-1.5 block">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 mb-1.5 block">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
            </div>
            <button
              onClick={handleFilter}
              disabled={filterLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              {filterLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
              Apply Filter
            </button>
            {(dateFrom || dateTo) && (
              <button
                onClick={async () => {
                  setDateFrom('')
                  setDateTo('')
                  setFilterLoading(true)
                  const r = await getInstitutionUsageReport()
                  if (r.success) setReport(r.report)
                  setFilterLoading(false)
                }}
                className="btn btn-outline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Transaction Table */}
        <div className="card overflow-hidden fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="px-6 py-4 border-b border-[#E8E6E0] flex items-center justify-between">
            <p className="font-semibold text-[#0A1628]">Submission Transactions</p>
            <p className="text-sm text-[#0A1628]/40 font-mono">
              {report?.transactions?.length || 0} records
            </p>
          </div>

          {!report?.transactions?.length ? (
            <div className="py-14 text-center">
              <BarChart3 className="w-10 h-10 text-[#0A1628]/15 mx-auto mb-3" />
              <p className="text-sm text-[#0A1628]/40 font-medium">No submissions yet</p>
              <p className="text-xs text-[#0A1628]/25 mt-1">Covered submissions will appear here</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F7F6F2] border-b border-[#E8E6E0]">
                {['Date', 'Type', 'Description', 'Reference', 'Amount'].map((h, i) => (
                  <p key={i} className={`text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 ${
                    i === 2 ? 'col-span-4' : i === 0 ? 'col-span-2' : i === 3 ? 'col-span-3' : 'col-span-2'
                  }`}>
                    {h}
                  </p>
                ))}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {report.transactions.map((tx: any) => (
                  <div key={tx.id} className="tx-row grid grid-cols-12 gap-4 px-6 py-3.5 items-center">
                    <div className="col-span-2">
                      <p className="text-xs text-[#0A1628] font-mono">
                        {new Date(tx.created_at).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm text-[#0A1628] truncate">
                        {tx.description || (tx.purpose === 'assignment_payment' ? 'Assignment Submission' : 'Test Submission')}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs font-mono text-[#0A1628]/50 truncate">{tx.reference || '—'}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-sm font-semibold text-[#0A1628]">
                        ₦{Number(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  )
}