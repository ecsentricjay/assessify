'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getInstitutionStudents, inviteInstitutionUser, removeInstitutionUser } from '@/lib/actions/institution.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import {
  GraduationCap, Search, Plus, Trash2, Mail,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle,
  CheckCircle, X, Building2, Users, BookOpen, Shield, BarChart3
} from 'lucide-react'

const NAV = [
  { href: '/institution/dashboard', label: 'Dashboard' },
  { href: '/institution/students', label: 'Students' },
  { href: '/institution/lecturers', label: 'Lecturers' },
  { href: '/institution/license', label: 'License' },
  { href: '/institution/reports', label: 'Reports' },
]

export default function InstitutionStudentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [removeTarget, setRemoveTarget] = useState<any>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [institution, setInstitution] = useState<any>(null)
  const LIMIT = 20

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) { router.push('/auth/login'); return }
      if (currentUser.profile?.role !== 'institution_admin') { router.push('/'); return }
      setUser(currentUser)
      await loadStudents(1)
    }
    load()
  }, [router])

  const loadStudents = async (p: number) => {
    setIsLoading(true)
    const result = await getInstitutionStudents(p, LIMIT)
    if (result.success) {
      setStudents(result.students)
      setTotal(result.total ?? 0)
      setPage(p as number)
    }
    setIsLoading(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    setInviteResult(null)
    const result = await inviteInstitutionUser({ email: inviteEmail.toLowerCase(), role: 'student' })
    setInviteResult({
      success: result.success,
      message: result.success ? `Invitation sent to ${inviteEmail}` : result.error,
    })
    if (result.success) {
      setInviteEmail('')
      setTimeout(() => { setShowInviteModal(false); setInviteResult(null) }, 2000)
    }
    setInviteLoading(false)
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoveLoading(true)
    const result = await removeInstitutionUser(removeTarget.id)
    if (result.success) {
      setStudents(prev => prev.filter(s => s.id !== removeTarget.id))
      setTotal(prev => prev - 1)
    }
    setRemoveTarget(null)
    setRemoveLoading(false)
  }

  const filtered = students.filter(s =>
    search === '' ||
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.matric_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F2', fontFamily: "'Instrument Sans', 'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .inst-header { background: #0A1628; border-bottom: 1px solid #1e3a5f; }
        .nav-link { display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:8px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.6); transition:all 0.15s; text-decoration:none; }
        .nav-link:hover { color:white; background:rgba(255,255,255,0.08); }
        .nav-link.active { color:white; background:rgba(255,255,255,0.12); }
        .card { background:white; border:1px solid #E8E6E0; border-radius:16px; }
        .student-row { border-bottom:1px solid #F0EEE8; transition:background 0.1s; }
        .student-row:last-child { border-bottom:none; }
        .student-row:hover { background:#FAFAF8; }
        .badge { font-size:11px; font-family:'DM Mono',monospace; padding:2px 8px; border-radius:20px; font-weight:500; }
        .modal-overlay { position:fixed; inset:0; background:rgba(10,22,40,0.5); backdrop-filter:blur(4px); z-index:50; display:flex; align-items:center; justify-content:center; padding:16px; }
        .modal { background:white; border-radius:20px; padding:28px; width:100%; max-width:440px; }
        .input { width:100%; border:1px solid #E8E6E0; border-radius:10px; padding:10px 14px; font-size:14px; outline:none; transition:border-color 0.15s; }
        .input:focus { border-color:#3B82F6; }
        .btn-primary { background:#0A1628; color:white; border:none; border-radius:10px; padding:10px 20px; font-size:14px; font-weight:600; cursor:pointer; transition:background 0.15s; }
        .btn-primary:hover:not(:disabled) { background:#0d1f3c; }
        .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
        .btn-outline { background:white; color:#0A1628; border:1px solid #E8E6E0; border-radius:10px; padding:10px 20px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .btn-outline:hover { border-color:#0A1628; }
        .fade-up { animation:fadeUp 0.35s ease forwards; opacity:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
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
                  <Link key={n.href} href={n.href} className={`nav-link ${n.href === '/institution/students' ? 'active' : ''}`}>
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm hidden md:block">
                {user?.profile?.first_name} {user?.profile?.last_name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-start justify-between fade-up">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
              Students
            </h1>
            <p className="text-sm text-[#0A1628]/50 mt-1">
              {total.toLocaleString()} total student{total !== 1 ? 's' : ''} enrolled
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Invite Student
          </button>
        </div>

        {/* Search */}
        <div className="fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A1628]/30" />
            <input
              type="text"
              placeholder="Search by name, matric number, or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-11"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden fade-up" style={{ animationDelay: '0.1s' }}>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F7F6F2] border-b border-[#E8E6E0]">
            {['Name', 'Matric No.', 'Department', 'Level', 'Status', ''].map((h, i) => (
              <p key={i} className={`text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 ${
                i === 0 ? 'col-span-3' : i === 2 ? 'col-span-3' : i === 4 ? 'col-span-2' : i === 5 ? 'col-span-1' : 'col-span-1'
              }`}>
                {h}
              </p>
            ))}
          </div>

          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0A1628]/30" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <GraduationCap className="w-12 h-12 text-[#0A1628]/15 mx-auto mb-3" />
              <p className="text-sm font-medium text-[#0A1628]/50">
                {search ? 'No students match your search' : 'No students yet'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Invite your first student →
                </button>
              )}
            </div>
          ) : (
            filtered.map((student) => (
              <div key={student.id} className="student-row grid grid-cols-12 gap-4 px-6 py-4 items-center">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-600">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0A1628] truncate">
                      {student.first_name} {student.last_name}
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-mono text-[#0A1628]/70">
                    {student.matric_number || '—'}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-[#0A1628]/70 truncate">
                    {student.department || '—'}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm text-[#0A1628]/70">
                    {student.level ? `${student.level}L` : '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className={`badge ${student.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => setRemoveTarget(student)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#0A1628]/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove from institution"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between fade-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-sm text-[#0A1628]/40 font-mono">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadStudents(page - 1)}
                disabled={page === 1}
                className="btn-outline px-3 py-2 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadStudents(page + 1)}
                disabled={page === totalPages}
                className="btn-outline px-3 py-2 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowInviteModal(false) }}>
          <div className="modal">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#0A1628]">Invite Student</h2>
                <p className="text-sm text-[#0A1628]/50 mt-0.5">Send an email invitation to join your institution</p>
              </div>
              <button onClick={() => { setShowInviteModal(false); setInviteResult(null) }} className="w-8 h-8 rounded-lg bg-[#F7F6F2] flex items-center justify-center">
                <X className="w-4 h-4 text-[#0A1628]/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-[#0A1628]/40 mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A1628]/30" />
                  <input
                    type="email"
                    placeholder="student@university.edu.ng"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    className="input pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {inviteResult && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                  inviteResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {inviteResult.success
                    ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  }
                  {inviteResult.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowInviteModal(false); setInviteResult(null) }} className="btn-outline flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {removeTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setRemoveTarget(null) }}>
          <div className="modal">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-[#0A1628] mb-2">Remove Student</h2>
            <p className="text-sm text-[#0A1628]/60 mb-6">
              Are you sure you want to remove <span className="font-semibold text-[#0A1628]">{removeTarget.first_name} {removeTarget.last_name}</span> from your institution? Their account will remain but they will lose institutional access.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveTarget(null)} className="btn-outline flex-1">Cancel</button>
              <button
                onClick={handleRemove}
                disabled={removeLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none rounded-xl py-2.5 text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                {removeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Remove Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}