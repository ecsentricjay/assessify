'use client';

import { useEffect, useState } from 'react';
import { Gift, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { getCbtAccessMode, setCbtSubscriptionRequired } from '@/lib/actions/cbt-settings.actions';
import { cn } from '@/lib/utils';

/** Admin control: CBT practice is free for all, or requires an active subscription. Takes effect immediately. */
export function CbtAccessToggle() {
  const [required, setRequired] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCbtAccessMode().then((res) => setRequired(res.subscriptionRequired));
  }, []);

  async function choose(next: boolean) {
    if (required === next || saving) return;
    if (next && !window.confirm('Turn ON subscriptions? Students without an active bundle will immediately lose access to practice tests.')) return;

    setSaving(true);
    const res = await setCbtSubscriptionRequired(next);
    setSaving(false);
    if (res.success) {
      setRequired(res.subscriptionRequired);
      toast.success(next ? 'Subscriptions are now required' : 'CBT practice is now free for everyone');
    } else {
      toast.error(res.error ?? 'Could not update the setting');
    }
  }

  const options = [
    { value: false, title: 'Free for everyone', detail: 'Any signed-in student can practise every subject. No session limits.', icon: <Gift className="h-5 w-5" /> },
    { value: true, title: 'Subscription required', detail: 'Students need an active bundle for each subject. Bundle session limits apply.', icon: <Lock className="h-5 w-5" /> },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Practice access</h2>
          <p className="text-sm text-slate-500">Switch any time — takes effect immediately.</p>
        </div>
        {(required === null || saving) && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const active = required === o.value;
          return (
            <button
              key={String(o.value)}
              disabled={required === null || saving}
              onClick={() => choose(o.value)}
              className={cn(
                'flex items-start gap-3 rounded-lg border-2 p-4 text-left transition disabled:opacity-60',
                active ? (o.value ? 'border-amber-500 bg-amber-50' : 'border-emerald-500 bg-emerald-50') : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? (o.value ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white') : 'bg-slate-100 text-slate-500')}>
                {o.icon}
              </span>
              <span>
                <span className="flex items-center gap-2 font-semibold text-slate-900">
                  {o.title}
                  {active && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Active</span>}
                </span>
                <span className="text-xs text-slate-600">{o.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
