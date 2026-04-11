'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/actions/auth.actions';

interface AdminSubscription {
  id: string;
  student_id: string;
  bundle_id: string;
  bundle_name: string;
  course_id: string;
  course_title: string;
  status: 'active' | 'expired' | 'cancelled';
  purchase_date: string;
  expiry_date: string;
  sessions_taken: number;
  max_sessions: number;
  student_email: string;
}

// Create service client for admin operations
function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Admin Access Checker
async function checkAdminAccess() {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== 'admin') {
    return { authorized: false, error: 'Unauthorized access' };
  }
  return { authorized: true, user };
}

/**
 * Get all student subscriptions for admin view
 */
export async function getAllSubscriptions() {
  try {
    // Check admin authorization
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.authorized) {
      return { success: false, error: adminCheck.error };
    }

    const supabase = await createClient();
    const adminClient = createServiceClient();

    // 1. Get all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('cbt_student_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subError) {
      console.error('[getAllSubscriptions] Subscriptions error:', subError);
      return { success: false, error: 'Failed to fetch subscriptions' };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, subscriptions: [] };
    }

    // 2. Build sets of IDs
    const bundleIds = Array.from(new Set(subscriptions.map(s => s.bundle_id)));
    const courseIds = Array.from(new Set(subscriptions.map(s => s.course_id)));
    const studentIds = Array.from(new Set(subscriptions.map(s => s.student_id)));

    // 3. Fetch bundles (only bundle_name and validity_days)
    let bundlesMap = new Map();
    if (bundleIds.length > 0) {
      const { data: bundles, error: bundlesError } = await supabase
        .from('cbt_subscription_bundles')
        .select('id, bundle_name, validity_days')
        .in('id', bundleIds);

      if (bundlesError) {
        console.error('[getAllSubscriptions] Bundles error:', bundlesError);
      } else if (bundles) {
        bundles.forEach((b) => bundlesMap.set(b.id, b));
      }
    }

    // 4. Fetch courses
    let coursesMap = new Map();
    if (courseIds.length > 0) {
      const { data: courses, error: coursesError } = await supabase
        .from('cbt_courses')
        .select('id, course_title')
        .in('id', courseIds);

      if (coursesError) {
        console.error('[getAllSubscriptions] Courses error:', coursesError);
      } else if (courses) {
        courses.forEach((c) => coursesMap.set(c.id, c));
      }
    }

    // 5. Fetch student emails from auth.users (using service client)
    let emailsMap = new Map();
    if (studentIds.length > 0) {
      try {
        const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();

        if (authError) {
          console.error('[getAllSubscriptions] Auth users error:', authError);
        } else if (authUsers?.users) {
          authUsers.users.forEach((user) => {
            emailsMap.set(user.id, user.email);
          });
        }
      } catch (authError) {
        console.error('[getAllSubscriptions] Error fetching auth users:', authError);
      }
    }

    // 6. Enrich subscriptions
    const now = new Date();
    const enrichedSubscriptions: AdminSubscription[] = subscriptions
      .map((sub) => {
        const bundle = bundlesMap.get(sub.bundle_id);
        const course = coursesMap.get(sub.course_id);
        const studentEmail = emailsMap.get(sub.student_id);

        // Calculate status
        let status: 'active' | 'expired' | 'cancelled' = 'active';
        if (!sub.is_active) {
          status = 'cancelled';
        } else if (new Date(sub.expiry_date) < now) {
          status = 'expired';
        }

        return {
          id: sub.id,
          student_id: sub.student_id,
          bundle_id: sub.bundle_id,
          bundle_name: bundle?.bundle_name || 'Unknown Bundle',
          course_id: sub.course_id,
          course_title: course?.course_title || 'Unknown Course',
          status,
          purchase_date: sub.created_at,
          expiry_date: sub.expiry_date,
          sessions_taken: sub.sessions_taken || 0,
          max_sessions: 0, // Not available in schema - using 0 as placeholder
          student_email: studentEmail || 'Unknown Email',
        };
      })
      .filter(Boolean);

    return {
      success: true,
      subscriptions: enrichedSubscriptions,
    };
  } catch (error) {
    console.error('[getAllSubscriptions] Error:', error);
    return { success: false, error: 'Failed to fetch subscriptions' };
  }
}
