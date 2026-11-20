'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import {
  CBT_SUBSCRIPTION_SETTING_KEY,
  isSubscriptionRequired,
  requireAdmin,
} from '@/lib/services/cbt-access.service';

/** Public: lets the UI show "Free" badges or "Subscribe" prompts. */
export async function getCbtAccessMode() {
  const required = await isSubscriptionRequired();
  return { success: true as const, subscriptionRequired: required };
}

/** Admin: turn the subscription requirement on or off. Takes effect immediately. */
export async function setCbtSubscriptionRequired(required: boolean) {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const { data: existing, error: readError } = await service
      .from('system_settings')
      .select('id')
      .eq('key', CBT_SUBSCRIPTION_SETTING_KEY)
      .maybeSingle();
    if (readError) throw readError;

    if (existing) {
      const { error } = await service
        .from('system_settings')
        .update({ value: String(required), updated_at: new Date().toISOString() })
        .eq('key', CBT_SUBSCRIPTION_SETTING_KEY);
      if (error) throw error;
    } else {
      const { error } = await service.from('system_settings').insert({
        key: CBT_SUBSCRIPTION_SETTING_KEY,
        value: String(required),
        description:
          'When true, students need an active bundle subscription to practise CBT. When false, practice is free.',
        category: 'cbt',
      });
      if (error) throw error;
    }

    revalidatePath('/admin/cbt');
    revalidatePath('/student/cbt', 'layout');
    return { success: true as const, subscriptionRequired: required };
  } catch (error) {
    return { success: false as const, error: (error as Error).message };
  }
}
