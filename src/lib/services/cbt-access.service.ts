import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const CBT_SUBSCRIPTION_SETTING_KEY = 'cbt_subscription_required';

/**
 * Is a paid subscription required to practise CBT?
 * Defaults to FALSE (free) when the setting row is missing or unreadable,
 * so a missing migration never locks students out.
 * Read with the service client because students can't read system_settings under RLS.
 */
export async function isSubscriptionRequired(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { data } = await service
      .from('system_settings')
      .select('value')
      .eq('key', CBT_SUBSCRIPTION_SETTING_KEY)
      .maybeSingle();
    return String(data?.value ?? 'false').toLowerCase() === 'true';
  } catch {
    return false;
  }
}

export interface CbtAccess {
  allowed: boolean;
  mode: 'free' | 'subscription';
  /** Set only in subscription mode */
  subscription: {
    id: string;
    bundleId: string | null;
    sessionsTaken: number;
    expiryDate: string;
    maxSessions: number | null;
  } | null;
  reason?: string;
  needsSubscription?: boolean;
}

/**
 * Decides whether this student may practise this course right now.
 * - Free mode: always allowed, no session cap, sessions are not tied to a subscription.
 * - Subscription mode: needs an unexpired subscription covering the course, and the
 *   bundle's max_practice_sessions cap (if any) must not be used up.
 */
export async function resolveCbtAccess(
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<CbtAccess> {
  const required = await isSubscriptionRequired();
  if (!required) {
    return { allowed: true, mode: 'free', subscription: null };
  }

  const { data: subs, error } = await supabase
    .from('cbt_student_subscriptions')
    .select('id, bundle_id, sessions_taken, expiry_date')
    .eq('student_id', userId)
    .eq('course_id', courseId)
    .eq('is_active', true)
    .gt('expiry_date', new Date().toISOString())
    .order('expiry_date', { ascending: false })
    .limit(1);

  if (error) {
    return { allowed: false, mode: 'subscription', subscription: null, reason: error.message };
  }

  const sub = subs?.[0];
  if (!sub) {
    return {
      allowed: false,
      mode: 'subscription',
      subscription: null,
      needsSubscription: true,
      reason: 'You need an active subscription to practise this course.',
    };
  }

  let maxSessions: number | null = null;
  if (sub.bundle_id) {
    const { data: bundle } = await supabase
      .from('cbt_subscription_bundles')
      .select('max_practice_sessions')
      .eq('id', sub.bundle_id)
      .maybeSingle();
    const cap = bundle?.max_practice_sessions;
    maxSessions = typeof cap === 'number' && cap > 0 ? cap : null;
  }

  const subscription = {
    id: sub.id as string,
    bundleId: (sub.bundle_id as string | null) ?? null,
    sessionsTaken: (sub.sessions_taken as number | null) ?? 0,
    expiryDate: sub.expiry_date as string,
    maxSessions,
  };

  if (maxSessions !== null && subscription.sessionsTaken >= maxSessions) {
    return {
      allowed: false,
      mode: 'subscription',
      subscription,
      needsSubscription: true,
      reason: `You have used all ${maxSessions} practice sessions on this subscription.`,
    };
  }

  return { allowed: true, mode: 'subscription', subscription };
}

/** Authenticated user id only (1 query — used on hot paths like saving an answer). */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Throws unless the caller is an admin / super_admin. Use at the top of every admin server action. */
export async function requireAdmin(): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Admin access required');
  }
  return { id: user.id };
}
