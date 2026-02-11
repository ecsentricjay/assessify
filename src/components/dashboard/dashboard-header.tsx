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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo/assessify-logo-icon.png"
              alt="Assessify"
              width={40}
              height={40}
              className="rounded"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">
                {userTitle && `${userTitle} `}
                {userName}
              </p>
              <p className="text-xs text-gray-600">{userDetail}</p>
            </div>
            
            {/* Notification Bell */}
            <NotificationBell />
            
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" size="sm">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}