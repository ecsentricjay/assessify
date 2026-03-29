// components/partner/partner-header.tsx
'use client'

import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useSidebar } from '@/lib/context/sidebar-context'

interface PartnerHeaderProps {
  user: any
}

export default function PartnerHeader({ user }: PartnerHeaderProps) {
  const { toggle } = useSidebar()
  
  const initials = user.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'P'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      {/* Left side - Mobile Menu Button */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="text-gray-600 hover:text-gray-900"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-sm md:text-lg font-semibold text-gray-900 truncate">
          Welcome, {user.last_name || 'Partner'}!
        </h2>
      </div>

      {/* Desktop Welcome Message */}
      <div className="hidden lg:block">
        <h2 className="text-lg font-semibold text-gray-900">
          Welcome back, {user.last_name || 'Partner'}!
        </h2>
      </div>

      {/* Right side - Notifications & User Menu */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-gray-900">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 md:gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-white">{initials}</span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/partner/profile">Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/partner">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}