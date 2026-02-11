// lib/actions/notifications.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  Notification,
  CreateNotificationInput,
  NotificationFilters,
  NotificationType,
  NotificationMetadata,
} from '@/lib/types/notification.types'

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: input.metadata,
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return { error: error.message || 'Failed to create notification' }
  }
}

/**
 * Create notifications for multiple users (bulk)
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, 'user_id'>
) {
  try {
    const supabase = await createClient()

    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      metadata: notification.metadata,
      is_read: false,
    }))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) throw error

    return { success: true, data, count: data.length }
  } catch (error: any) {
    console.error('Error creating bulk notifications:', error)
    return { error: error.message || 'Failed to create notifications' }
  }
}

/**
 * Get notifications for current user with optional filters
 */
export async function getUserNotifications(filters?: NotificationFilters) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, notifications: data as Notification[] }
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return { error: error.message || 'Failed to fetch notifications' }
  }
}

/**
 * Get unread notification count for current user
 */
export async function getUnreadCount() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error

    return { success: true, count: count || 0 }
  } catch (error: any) {
    console.error('Error getting unread count:', error)
    return { error: error.message || 'Failed to get unread count' }
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user owns this notification
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    return { error: error.message || 'Failed to mark notification as read' }
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllAsRead() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select()

    if (error) throw error

    return { success: true, count: data.length }
  } catch (error: any) {
    console.error('Error marking all as read:', error)
    return { error: error.message || 'Failed to mark all as read' }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user owns this notification

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return { error: error.message || 'Failed to delete notification' }
  }
}

/**
 * Delete all read notifications for current user
 */
export async function deleteAllRead() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('is_read', true)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting read notifications:', error)
    return { error: error.message || 'Failed to delete read notifications' }
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(notificationId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return { success: true, notification: data as Notification }
  } catch (error: any) {
    console.error('Error fetching notification:', error)
    return { error: error.message || 'Failed to fetch notification' }
  }
}