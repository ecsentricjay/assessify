// components/partner/partner-sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Wallet,
  User,
  LogOut,
  TrendingUp,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth.actions'

const navigation = [
  {
    name: 'Dashboard',
    href: '/partner',
    icon: LayoutDashboard,
  },
  {
    name: 'My Referrals',
    href: '/partner/referrals',
    icon: Users,
  },
  {
    name: 'My Earnings',
    href: '/partner/earnings',
    icon: TrendingUp,
  },
  {
    name: 'Withdrawals',
    href: '/partner/withdrawals',
    icon: Wallet,
  },
  {
    name: 'Profile',
    href: '/partner/profile',
    icon: User,
  },
]

export default function PartnerSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/partner" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl">Assessify Partner</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border-gray">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}