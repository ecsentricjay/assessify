'use client'

// components/notifications/notification-item.tsx
// Individual notification display with actions

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  markAsRead,
  deleteNotification,
} from '@/lib/actions/notifications.actions'
import type { Notification } from '@/lib/types/notification.types'

interface NotificationItemProps {
  notification: Notification
  onUpdate?: () => void
  compact?: boolean
}

export default function NotificationItem({
  notification,
  onUpdate,
  compact = false,
}: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleMarkAsRead() {
    await markAsRead(notification.id)
    onUpdate?.()
  }

  async function handleDelete() {
    setIsDeleting(true)
    await deleteNotification(notification.id)
    onUpdate?.()
  }

  const notificationIcons: Record<string, string> = {
    grade_posted: '🎓',
    assignment_created: '📚',
    test_available: '🎯',
    test_graded: '📝',
    deadline_reminder: '⏰',
    enrollment_confirmed: '✅',
    submission_received: '📥',
    course_announcement: '📢',
    system_alert: '🔔',
  }

  const icon = notificationIcons[notification.type] || '🔔'

  const content = (
    <div
      className={cn(
        'relative p-4 hover:bg-gray-50 transition-colors',
        !notification.is_read && 'bg-blue-50/50',
        compact && 'p-3',
        isDeleting && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium text-gray-900 truncate',
                compact && 'text-xs'
              )}>
                {notification.title}
              </p>
              <p className={cn(
                'text-sm text-gray-600 mt-1 line-clamp-2',
                compact && 'text-xs line-clamp-1'
              )}>
                {notification.message}
              </p>
            </div>

            {/* Unread indicator */}
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>

          {/* Time */}
          <p className={cn(
            'text-xs text-gray-500 mt-2',
            compact && 'mt-1'
          )}>
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            })}
          </p>

          {/* Actions (only show if not compact) */}
          {!compact && (
            <div className="flex items-center gap-2 mt-3">
              {!notification.is_read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark as read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // If notification has a link, wrap in Link component
  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={!notification.is_read ? handleMarkAsRead : undefined}
        className="block"
      >
        {content}
      </Link>
    )
  }

  // Otherwise, just show the content
  return content
}