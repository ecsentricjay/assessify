'use client'

import { useState } from 'react'
import { configureInstitution } from '@/lib/actions/institution.actions'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, Settings, X,
  Loader2, AlertTriangle, Building2, ChevronRight
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  code: string
  city?: string
  state?: string
  subscription_plan: string
  subscription_expires_at?: string
  price_per_student: number
  lecturer_earning_per_submission: number
  self_register_enabled: boolean
  self_register_code?: string
  plan_billing_cycle?: string
  studentCount: number
  lecturerCount: number
  licenseActive: boolean
  is_active: boolean
}

export function InstitutionsTable({ institutions }: { institutions: Institution[] }) {
  const router = useRouter()
  const [configTarget, setConfigTarget] = useState<Institution | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success?: boolean; message?: string } | null>(null)

  // Form state
  const [pricePerStudent, setPricePerStudent] = useState(0)
  const [lecturerEarning, setLecturerEarning] = useState(0)
  const [selfRegisterEnabled, setSelfRegisterEnabled] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'quarterly' | 'yearly'>('quarterly')

  const openConfig = (inst: Institution) => {
    setConfigTarget(inst)
    setPricePerStudent(Number(inst.price_per_student) || 0)
    setLecturerEarning(Number(inst.lecturer_earning_per_submission) || 0)
    setSelfRegisterEnabled(inst.self_register_enabled || false)
    setBillingCycle((inst.plan_billing_cycle as 'quarterly' | 'yearly') || 'quarterly')
    setSaveResult(null)
  }

  const handleSave = async () => {
    if (!configTarget) return
    setSaving(true)
    setSaveResult(null)

    const result = await configureInstitution(configTarget.id, {
      pricePerStudent,
      lecturerEarningPerSubmission: lecturerEarning,
      selfRegisterEnabled,
      planBillingCycle: billingCycle,
    })

    setSaveResult({
      success: result.success,
      message: result.success
        ? 'Configuration saved successfully'
        : result.error || 'Failed to save configuration',
    })

    if (result.success) {
      router.refresh()
      setTimeout(() => {
        setConfigTarget(null)
        setSaveResult(null)
      }, 1500)
    }

    setSaving(false)
  }

  if (institutions.length === 0) {
    return (
      <div className="py-16 text-center">
        <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500">No institutions yet</p>
        <p className="text-xs text-gray-400 mt-1">Institutions will appear here once added to the database</p>
      </div>
    )
  }

  return (
    <>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Institution', 'Location', 'Users', 'License', 'Price/Student', 'Lecturer Rate', 'Self-Register', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {institutions.map((inst) => {
              const expiresAt = inst.subscription_expires_at
                ? new Date(inst.subscription_expires_at)
                : null
              const daysLeft = expiresAt
                ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null

              return (
                <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{inst.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{inst.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">
                      {inst.city && inst.state ? `${inst.city}, ${inst.state}` : inst.city || inst.state || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{inst.studentCount} students</p>
                    <p className="text-xs text-gray-400">{inst.lecturerCount} lecturers</p>
                  </td>
                  <td className="px-4 py-4">
                    {inst.subscription_plan === 'institutional' ? (
                      inst.licenseActive ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                          {daysLeft !== null && (
                            <p className="text-xs text-gray-400 mt-1">
                              {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 px-2 py-1 rounded-full">
                          <XCircle className="w-3 h-3" /> Expired
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">
                      {Number(inst.price_per_student) > 0
                        ? `₦${Number(inst.price_per_student).toLocaleString()}/mo`
                        : <span className="text-gray-400">Not set</span>
                      }
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">
                      {Number(inst.lecturer_earning_per_submission) > 0
                        ? `₦${Number(inst.lecturer_earning_per_submission).toLocaleString()}/sub`
                        : <span className="text-gray-400">Not set</span>
                      }
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {inst.self_register_enabled ? (
                      <div>
                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          Enabled
                        </span>
                        {inst.self_register_code && (
                          <p className="text-xs font-mono text-gray-400 mt-1">{inst.self_register_code}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => openConfig(inst)}
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Settings className="w-3.5 h-3.5" /> Configure
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Configure Modal */}
      {configTarget && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setConfigTarget(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{configTarget.name}</h2>
                  <p className="text-sm text-gray-500">Configure institutional settings</p>
                </div>
              </div>
              <button
                onClick={() => setConfigTarget(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">

              {/* Billing Cycle */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Default Billing Cycle
                </label>
                <div className="flex gap-2">
                  {(['quarterly', 'yearly'] as const).map(cycle => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${
                        billingCycle === cycle
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price per Student */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Price Per Student Per Month (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₦</span>
                  <input
                    type="number"
                    min={0}
                    value={pricePerStudent}
                    onChange={e => setPricePerStudent(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="e.g. 500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Quarterly: ₦{(pricePerStudent * 3).toLocaleString()}/student · Yearly: ₦{Math.round(pricePerStudent * 12 * 0.85).toLocaleString()}/student (15% off)
                </p>
              </div>

              {/* Lecturer Earning */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Lecturer Earning Per Submission (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₦</span>
                  <input
                    type="number"
                    min={0}
                    value={lecturerEarning}
                    onChange={e => setLecturerEarning(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="e.g. 50"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Amount credited to lecturer's wallet per student submission under this institution's license
                </p>
              </div>

              {/* Self Register Toggle */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Self-Registration</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Allow students and lecturers to self-register using the institution code
                  </p>
                  {configTarget.self_register_code && (
                    <p className="text-xs font-mono text-blue-600 mt-1">
                      Code: {configTarget.self_register_code}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelfRegisterEnabled(p => !p)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 mt-0.5 ${
                    selfRegisterEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      selfRegisterEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Result message */}
              {saveResult && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                  saveResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {saveResult.success
                    ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  }
                  {saveResult.message}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setConfigTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}