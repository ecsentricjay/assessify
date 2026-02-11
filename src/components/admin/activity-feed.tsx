// components/admin/activity-feed.tsx
'use client'

import { formatDistanceToNow } from 'date-fns'
import { UserPlus, BookOpen, DollarSign, AlertCircle } from 'lucide-react'

type Activity = {
  type: 'user_signup' | 'course_created' | 'transaction'
  title: string
  description: string
  timestamp: string
  id: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-sm">No recent activity</p>
      </div>
    )
  }

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user_signup':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'course_created':
        return <BookOpen className="h-4 w-4 text-green-500" />
      case 'transaction':
        return <DollarSign className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex-shrink-0 mt-1">
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {activity.title}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {activity.description}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}