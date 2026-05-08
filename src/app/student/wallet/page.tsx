'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getPaymentHistory } from '@/lib/actions/payment.actions'
import { VirtualAccountModal } from '@/components/virtual-account-modal'
import { getVirtualAccount } from '@/lib/actions/virtual-account.actions'
import { PaystackPaymentButton } from '@/components/paystack-payment-button'
import { Card } from '@/components/ui/card'
import {
  Loader2, Wallet, TrendingUp, Clock, ArrowRight,
  Copy, CheckCircle, Landmark, ShieldCheck,
  ChevronDown, RefreshCw, CreditCard, ArrowUpRight,
  ArrowDownLeft, Building2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface User {
  id: string
  email?: string
  profile: {
    first_name: string
    last_name: string
  }
}

interface WalletInfo {
  balance: number
  totalFunded: number
  totalSpent: number
}

interface Payment {
  id: string
  reference: string
  amount: number
  status: string
  created_at: string
  description: string
  type?: 'debit' | 'credit'
  purpose?: string
}

export default function StudentWalletPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [virtualAccount, setVirtualAccount] = useState<any>(null)
  const [vaStatus, setVaStatus] = useState<'active' | 'pending' | 'none'>('none')
  const [showNinModal, setShowNinModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showCardOption, setShowCardOption] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) { router.push('/auth/login'); return }
        if (currentUser.profile?.role !== 'student') { router.push('/'); return }
        setUser(currentUser)

        const response = await fetch('/api/student/wallet')
        if (response.ok) {
          const data = await response.json()
          setWallet(data.wallet)
        }

        const history = await getPaymentHistory(10)
        if (history.success) setPayments(history.payments)

        const vaResult = await getVirtualAccount()
        if (vaResult.success && vaResult.hasAccount) {
          setVirtualAccount(vaResult.account)
          setVaStatus(vaResult.isPending ? 'pending' : 'active')
        } else {
          setVaStatus('none')
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading wallet data:', error)
        setIsLoading(false)
      }
    }
    loadData()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#0A1628] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#0A1628]/50 font-mono tracking-widest uppercase">Loading</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const balance = wallet?.balance || 0
  const totalFunded = wallet?.totalFunded || 0
  const totalSpent = wallet?.totalSpent || 0

  return (
    <div className="min-h-screen bg-[#f5f4f0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
        
        .balance-card {
          background: #0A1628;
          position: relative;
          overflow: hidden;
        }
        .balance-card::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.12);
        }
        .balance-card::after {
          content: '';
          position: absolute;
          bottom: -40px; left: -20px;
          width: 160px; height: 160px;
          border-radius: 50%;
          background: rgba(14, 116, 144, 0.1);
        }
        .dva-card {
          background: linear-gradient(135deg, #0e7490 0%, #0A1628 100%);
          position: relative;
          overflow: hidden;
        }
        .dva-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .account-number {
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.15em;
        }
        .stat-pill {
          background: white;
          border: 1px solid #e5e3df;
        }
        .tx-row:hover { background: #f9f8f6; }
        .copy-btn {
          transition: transform 0.15s ease;
        }
        .copy-btn:active { transform: scale(0.9); }
        .fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-toggle {
          transition: all 0.2s ease;
        }
        .card-toggle-open {
          border-color: #3B82F6 !important;
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-[#e5e3df]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#0A1628]">Wallet</h1>
            <p className="text-xs text-[#0A1628]/40 mt-0.5">
              {user.profile?.first_name} {user.profile?.last_name}
            </p>
          </div>
          <Link href="/student/dashboard">
            <Button variant="ghost" size="sm" className="text-[#0A1628]/60 hover:text-[#0A1628] gap-1.5">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Balance Card */}
        <div className="balance-card rounded-2xl p-6 text-white fade-in">
          <div className="relative z-10">
            <p className="text-xs font-mono tracking-widest uppercase text-white/40 mb-3">Available Balance</p>
            <p className="text-5xl font-light text-white mb-1">
              ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-white/40 mt-1">Ready for assignments & tests</p>

            {/* Stats row */}
            <div className="flex gap-3 mt-6">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Funded</p>
                  <p className="text-sm font-medium text-white">
                    ₦{totalFunded.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Spent</p>
                  <p className="text-sm font-medium text-white">
                    ₦{totalSpent.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PRIMARY FUNDING: DVA ── */}
        <div className="fade-in" style={{ animationDelay: '0.05s' }}>
          
          {vaStatus === 'active' && virtualAccount && (
            <div className="dva-card rounded-2xl p-6 text-white">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-mono tracking-widest uppercase text-white/50">Fund via Transfer</p>
                      <p className="text-sm font-medium text-white">Dedicated Bank Account</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-green-400/20 text-green-300 border border-green-400/30 px-2 py-1 rounded-full font-mono tracking-wider uppercase">
                    Active
                  </span>
                </div>

                {/* Account details */}
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Bank</span>
                    <span className="text-sm font-medium text-white">{virtualAccount.bank_name}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Account Name</span>
                    <span className="text-sm font-medium text-white truncate max-w-[180px] text-right">
                      {virtualAccount.account_name}
                    </span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="account-number text-xl font-medium text-white">
                        {virtualAccount.account_number}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(virtualAccount.account_number)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="copy-btn w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                        title="Copy account number"
                      >
                        {copied
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-300" />
                          : <Copy className="w-3.5 h-3.5 text-white" />
                        }
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  Transfer any amount — credits reflect instantly to your wallet
                </p>
              </div>
            </div>
          )}

          {vaStatus === 'pending' && (
            <div className="bg-white border border-[#e5e3df] rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0A1628]">Setting up your bank account...</p>
                  <p className="text-xs text-[#0A1628]/50 mt-1">
                    Your dedicated Wema Bank account is being created. This usually takes under a minute.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh to check
                  </button>
                </div>
              </div>
            </div>
          )}

          {vaStatus === 'none' && (
            <div className="dva-card rounded-2xl p-6 text-white">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-mono tracking-widest uppercase text-white/50">Fund via Transfer</p>
                    <p className="text-sm font-medium text-white">Dedicated Bank Account</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-5 leading-relaxed">
                  Get your own Wema Bank account number. Transfer from any Nigerian bank app — funds land instantly.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {['No card needed', 'Instant credit', 'Yours permanently'].map(f => (
                    <span key={f} className="text-[11px] bg-white/10 border border-white/20 text-white/70 px-2.5 py-1 rounded-full">
                      ✓ {f}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setShowNinModal(true)}
                  className="w-full bg-white text-[#0A1628] font-semibold text-sm py-3 rounded-xl hover:bg-white/90 transition-colors"
                >
                  Activate Bank Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── SECONDARY FUNDING: Card ── */}
        <div className="fade-in" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => setShowCardOption(p => !p)}
            className={`card-toggle w-full bg-white border rounded-2xl p-4 flex items-center justify-between text-left transition-all hover:border-[#3B82F6]/40 ${showCardOption ? 'card-toggle-open border-[#3B82F6]' : 'border-[#e5e3df]'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#f5f4f0] rounded-xl flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#0A1628]/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0A1628]">Pay with Card</p>
                <p className="text-xs text-[#0A1628]/40">Debit or credit card via Paystack</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#0A1628]/40 transition-transform duration-200 ${showCardOption ? 'rotate-180' : ''}`} />
          </button>

          {showCardOption && (
            <div className="mt-2 bg-white border border-[#e5e3df] rounded-2xl p-5 fade-in">
              <p className="text-xs text-[#0A1628]/50 mb-4">
                Secure card payment processed by Paystack. Funds reflect immediately after successful payment.
              </p>
              <PaystackPaymentButton
                variant="default"
                className="w-full bg-[#0A1628] hover:bg-[#0d1f3c] text-white font-medium text-sm py-3 rounded-xl"
                onSuccess={(newBalance) => {
                  setWallet(prev => prev ? { ...prev, balance: newBalance } : null)
                  setShowCardOption(false)
                }}
              />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="fade-in" style={{ animationDelay: '0.15s' }}>
          <p className="text-xs font-mono tracking-widest uppercase text-[#0A1628]/30 mb-3 px-1">Quick Actions</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/student/assignments/access', label: 'Submit Assignment', icon: '📝', color: 'bg-blue-50' },
              { href: '/student/tests', label: 'Take a Test', icon: '📋', color: 'bg-purple-50' },
              { href: '/student/wallet/withdrawals', label: 'Withdraw', icon: '💸', color: 'bg-green-50' },
            ].map(action => (
              <Link key={action.href} href={action.href}>
                <div className="bg-white border border-[#e5e3df] rounded-2xl p-4 hover:border-[#0A1628]/20 hover:shadow-sm transition-all text-center">
                  <div className={`w-9 h-9 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-2 text-lg`}>
                    {action.icon}
                  </div>
                  <p className="text-xs font-medium text-[#0A1628] leading-tight">{action.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs font-mono tracking-widest uppercase text-[#0A1628]/30 mb-3 px-1">
            Transaction History
          </p>
          <div className="bg-white border border-[#e5e3df] rounded-2xl overflow-hidden">
            {payments.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-12 h-12 bg-[#f5f4f0] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-[#0A1628]/30" />
                </div>
                <p className="text-sm font-medium text-[#0A1628]/50">No transactions yet</p>
                <p className="text-xs text-[#0A1628]/30 mt-1">Fund your wallet to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f5f4f0]">
                {payments.map((payment, i) => {
                  const isCredit = payment.type === 'credit'
                  const date = new Date(payment.created_at)
                  return (
                    <div key={payment.id} className="tx-row px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                          {isCredit
                            ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />
                            : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0A1628] truncate max-w-[180px]">
                            {payment.description || (payment.purpose === 'bank_transfer' ? 'Bank Transfer' : 'Payment')}
                          </p>
                          <p className="text-[11px] text-[#0A1628]/40 font-mono mt-0.5">
                            {date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}₦{Number(payment.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </p>
                        <span className={`text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-md ${
                          payment.status === 'completed' ? 'bg-green-50 text-green-700'
                          : payment.status === 'pending' ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-600'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#0A1628]/25 pb-6 font-mono">
          Secured by Paystack · Assessify Wallet
        </p>
      </div>

      {/* NIN / Activation Modal */}
      <VirtualAccountModal
        open={showNinModal}
        onClose={() => setShowNinModal(false)}
        onSuccess={(account) => {
          setVirtualAccount(account)
          setVaStatus(account?.is_active ? 'active' : 'pending')
          setShowNinModal(false)
        }}
      />
    </div>
  )
}