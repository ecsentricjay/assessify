// components/admin/admin-sidebar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  BookOpen,
  HandshakeIcon,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { useSidebar } from '@/lib/context/sidebar-context'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Finances',
    href: '/admin/finances',
    icon: DollarSign,
    submenu: [
      { name: 'Transactions', href: '/admin/finances/transactions' },
      { name: 'Wallets', href: '/admin/finances/wallets' },
      { name: 'Withdrawals', href: '/admin/finances/withdrawals' },
      { name: 'Refunds', href: '/admin/finances/refunds' },
    ]
  },
  {
    name: 'Content',
    href: '/admin/content',
    icon: BookOpen,
  },
  {
    name: 'Partners',
    href: '/admin/partners',
    icon: HandshakeIcon,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const { isOpen, close } = useSidebar()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Desktop Sidebar - Fixed and always visible on large screens */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-border-gray z-30 flex-col overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border-gray flex-shrink-0">
            <Image
              src="/images/logo/assessify-logo-icon.png"
              alt="Assessify"
              width={32}
              height={32}
              className="rounded"
            />
            <div>
              <h1 className="text-lg font-bold text-primary-dark">Assessify</h1>
              <p className="text-xs text-text-gray">Admin</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const itemIsActive = isActive(item.href)
              const Icon = item.icon
              const isExpanded = expandedMenu === item.name

              return (
                <div key={item.name}>
                  {item.submenu ? (
                    <button
                      onClick={() => {
                        setExpandedMenu(isExpanded ? null : item.name)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                        itemIsActive
                          ? 'bg-blue-50 text-primary-blue'
                          : 'text-foreground hover:bg-bg-light hover:text-primary-dark'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded ? 'rotate-180' : ''
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors block w-full',
                        itemIsActive
                          ? 'bg-blue-50 text-primary-blue'
                          : 'text-foreground hover:bg-bg-light hover:text-primary-dark'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  )}

                  {/* Submenu */}
                  {item.submenu && isExpanded && (
                    <div className="pl-6 mt-1 space-y-1">
                      {item.submenu.map((subitem) => {
                        const subitemIsActive = isActive(subitem.href)
                        return (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors block w-full',
                              subitemIsActive
                                ? 'text-primary-blue font-medium bg-blue-50'
                                : 'text-text-gray hover:text-foreground hover:bg-bg-light'
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {subitem.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-gray flex-shrink-0">
            <p className="text-xs text-text-gray text-center">
              Assessify Admin v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar - Overlay that slides in */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen w-64 bg-white border-r border-border-gray z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto',
          'lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border-gray flex-shrink-0">
            <Image
              src="/images/logo/assessify-logo-icon.png"
              alt="Assessify"
              width={32}
              height={32}
              className="rounded"
            />
            <div>
              <h1 className="text-lg font-bold text-primary-dark">Assessify</h1>
              <p className="text-xs text-text-gray">Admin</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const itemIsActive = isActive(item.href)
              const Icon = item.icon
              const isExpanded = expandedMenu === item.name

              return (
                <div key={item.name}>
                  {item.submenu ? (
                    <button
                      onClick={() => {
                        setExpandedMenu(isExpanded ? null : item.name)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                        itemIsActive
                          ? 'bg-blue-50 text-primary-blue'
                          : 'text-foreground hover:bg-bg-light hover:text-primary-dark'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded ? 'rotate-180' : ''
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={close}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors block w-full',
                        itemIsActive
                          ? 'bg-blue-50 text-primary-blue'
                          : 'text-foreground hover:bg-bg-light hover:text-primary-dark'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  )}

                  {/* Submenu */}
                  {item.submenu && isExpanded && (
                    <div className="pl-6 mt-1 space-y-1">
                      {item.submenu.map((subitem) => {
                        const subitemIsActive = isActive(subitem.href)
                        return (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            onClick={close}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors block w-full',
                              subitemIsActive
                                ? 'text-primary-blue font-medium bg-blue-50'
                                : 'text-text-gray hover:text-foreground hover:bg-bg-light'
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {subitem.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-gray flex-shrink-0">
            <p className="text-xs text-text-gray text-center">
              Assessify Admin v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
    </>
  )
}