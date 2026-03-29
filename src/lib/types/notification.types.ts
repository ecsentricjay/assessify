// lib/types/notification.types.ts
// Type definitions for the notification system

export type NotificationType =
  | 'grade_posted'
  | 'assignment_created'
  | 'test_available'
  | 'deadline_reminder'
  | 'enrollment_confirmed'
  | 'submission_received'
  | 'test_graded'
  | 'course_announcement'
  | 'system_alert';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  metadata?: NotificationMetadata;
  created_at: string;
}

export interface NotificationMetadata {
  course_id?: string;
  course_code?: string;
  course_title?: string;
  assignment_id?: string;
  assignment_title?: string;
  test_id?: string;
  test_title?: string;
  submission_id?: string;
  student_name?: string;
  score?: number;
  max_score?: number;
  deadline?: string;
  [key: string]: any;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: NotificationMetadata;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

// Helper type for notification with user profile info (for admin views)
export interface NotificationWithProfile extends Notification {
  profile?: {
    first_name: string;
    last_name: string;
    email?: string;
  };
}