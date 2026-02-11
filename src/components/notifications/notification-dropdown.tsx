'use client'

// components/notifications/notification-dropdown.tsx
// Dropdown menu showing recent notifications

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import NotificationItem from './notification-item'
import {
  getUserNotifications,
  markAllAsRead,
} from '@/lib/actions/notifications.actions'
import type { Notification } from '@/lib/types/notification.types'

interface NotificationDropdownProps {
  onUpdate?: () => void
}

export default function NotificationDropdown({ onUpdate }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      const result = await getUserNotifications({ limit: 5 })
      if (result.success && result.notifications) {
        setNotifications(result.notifications)
      }
      setLoading(false)
    }
    
    fetchNotifications()
  }, []) // Empty dependency array is correct here

  async function handleMarkAllAsRead() {
    const result = await markAllAsRead()
    if (result.success) {
      // Reload notifications
      const updated = await getUserNotifications({ limit: 5 })
      if (updated.success && updated.notifications) {
        setNotifications(updated.notifications)
      }
      onUpdate?.()
    }
  }

  async function handleNotificationUpdate() {
    // Reload notifications
    const updated = await getUserNotifications({ limit: 5 })
    if (updated.success && updated.notifications) {
      setNotifications(updated.notifications)
    }
    onUpdate?.()
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Loading notifications...
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-2">🔔</div>
        <p className="text-sm font-medium text-gray-900">No notifications</p>
        <p className="text-xs text-gray-500 mt-1">
          You&apos;re all caught up!
        </p>
      </div>
    )
  }

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs h-7"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="divide-y">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onUpdate={handleNotificationUpdate}
            compact
          />
        ))}
      </div>

      {/* Footer */}
      <Separator />
      <div className="p-2">
        <Link href="/notifications">
          <Button variant="ghost" className="w-full text-sm" size="sm">
            View all notifications →
          </Button>
        </Link>
      </div>
    </div>
  )
}