'use client'

// components/notifications/notification-bell.tsx
// Bell icon with unread count badge and dropdown

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import NotificationDropdown from './notification-dropdown'
import { getUnreadCount } from '@/lib/actions/notifications.actions'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // Load unread count on mount and every 30 seconds
  useEffect(() => {
    // Initial load
    async function fetchCount() {
      const result = await getUnreadCount()
      if (result.success && result.count !== undefined) {
        setUnreadCount(result.count)
      }
    }
    
    fetchCount()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchCount()
    }, 30000)

    return () => clearInterval(interval)
  }, []) // Empty dependency array is correct here

  // Refresh count when dropdown is closed
  async function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) {
      const result = await getUnreadCount()
      if (result.success && result.count !== undefined) {
        setUnreadCount(result.count)
      }
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <NotificationDropdown 
          onUpdate={async () => {
            const result = await getUnreadCount()
            if (result.success && result.count !== undefined) {
              setUnreadCount(result.count)
            }
          }} 
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}