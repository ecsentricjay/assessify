'use client'

// app/notifications/page.tsx
// Full notifications page with filtering and search

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import NotificationItem from '@/components/notifications/notification-item'
import {
  getUserNotifications,
  markAllAsRead,
  deleteAllRead,
} from '@/lib/actions/notifications.actions'
import type { Notification } from '@/lib/types/notification.types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Load notifications on mount
  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      const result = await getUserNotifications()
      if (result.success && result.notifications) {
        setNotifications(result.notifications)
      }
      setLoading(false)
    }
    
    fetchNotifications()
  }, [])

  // Compute filtered notifications using useMemo
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.is_read)
    } else if (activeTab === 'read') {
      filtered = filtered.filter(n => n.is_read)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [notifications, searchQuery, activeTab])

  async function reloadNotifications() {
    const result = await getUserNotifications()
    if (result.success && result.notifications) {
      setNotifications(result.notifications)
    }
  }

  async function handleMarkAllAsRead() {
    const result = await markAllAsRead()
    if (result.success) {
      await reloadNotifications()
    }
  }

  async function handleDeleteAllRead() {
    if (!confirm('Are you sure you want to delete all read notifications?')) {
      return
    }

    const result = await deleteAllRead()
    if (result.success) {
      await reloadNotifications()
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const readCount = notifications.filter(n => n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-600 mt-1">
                Stay updated with your activities
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
              {readCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAllRead}
                >
                  Clear read
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read">
              Read ({readCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Loading notifications...</p>
                </CardContent>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">
                    {searchQuery ? '🔍' : '🔔'}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'No results found' : 'No notifications'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : activeTab === 'unread'
                      ? "You're all caught up!"
                      : activeTab === 'read'
                      ? 'No read notifications'
                      : 'You have no notifications yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onUpdate={reloadNotifications}
                    />
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}