// components/admin/activity-feed.tsx
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { UserPlus, BookOpen, DollarSign, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Activity = {
  type: 'user_signup' | 'course_created' | 'transaction'
  title: string
  description: string
  timestamp: string
  id: string
}

interface ActivityFeedProps {
  activities: Activity[]
  itemsPerPage?: number
}

export function ActivityFeed({ activities, itemsPerPage = 10 }: ActivityFeedProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(activities.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedActivities = activities.slice(startIdx, startIdx + itemsPerPage)

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
      <div className="space-y-3">
        {paginatedActivities.map((activity) => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Page {currentPage} of {totalPages} • {activities.length} total
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}