'use client'

// components/dashboard/dashboard-header.tsx
// Client component wrapper for dashboard header with notification bell

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import NotificationBell from '@/components/notifications/notification-bell'

interface DashboardHeaderProps {
  title: string
  subtitle: string
  userName: string
  userDetail: string
  userTitle?: string
}

export default function DashboardHeader({
  title,
  subtitle,
  userName,
  userDetail,
  userTitle,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/images/logo/assessify-logo-icon.png"
              alt="Assessify"
              width={40}
              height={40}
              className="rounded flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-xs md:text-sm text-gray-600 truncate">{subtitle}</p>
            </div>
          </div>

          {/* Right: User Info and Actions */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs md:text-sm font-medium truncate">
                {userTitle && `${userTitle} `}
                {userName}
              </p>
              <p className="text-xs text-gray-600 truncate">{userDetail}</p>
            </div>
            
            {/* Notification Bell */}
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>
            
            {/* Logout Button */}
            <form action="/api/auth/signout" method="POST" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="text-xs md:text-sm">
                Logout
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile User Info */}
        <div className="mt-3 sm:hidden text-xs">
          <p className="font-medium truncate">
            {userTitle && `${userTitle} `}
            {userName}
          </p>
          <p className="text-gray-600 truncate">{userDetail}</p>
        </div>
      </div>
    </header>
  )
}