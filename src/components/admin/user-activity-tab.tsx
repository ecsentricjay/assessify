// ============================================================================
// components/admin/user-activity-tab.tsx
// ============================================================================
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserActivity } from '@/lib/actions/admin-users.actions'
import { formatDistanceToNow } from 'date-fns'
import { Clock, User, DollarSign, BookOpen } from 'lucide-react'

export function UserActivityTab({ userId }: { userId: string }) {
  const [activity, setActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      const result = await getUserActivity(userId)
      if (result.success) {
        setActivity(result.data)
      }
      setLoading(false)
    }
    fetchActivity()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-8 text-gray-500">Loading activity...</p>
        </CardContent>
      </Card>
    )
  }

  const allActivities = [
    ...(activity?.adminActions || []).map((a: any) => ({
      type: 'admin',
      icon: User,
      title: a.action_type.replace(/_/g, ' '),
      description: `By ${a.admin?.first_name} ${a.admin?.last_name}`,
      time: a.created_at
    })),
    ...(activity?.transactions || []).map((t: any) => ({
      type: 'transaction',
      icon: DollarSign,
      title: `${t.type} - ${t.purpose.replace(/_/g, ' ')}`,
      description: `₦${t.amount.toLocaleString()}`,
      time: t.created_at
    })),
    ...(activity?.enrollments || []).map((e: any) => ({
      type: 'enrollment',
      icon: BookOpen,
      title: 'Enrolled in course',
      description: e.course?.course_title || 'Course',
      time: e.enrolled_at
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent user activity and admin actions</CardDescription>
      </CardHeader>
      <CardContent>
        {allActivities.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {allActivities.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}