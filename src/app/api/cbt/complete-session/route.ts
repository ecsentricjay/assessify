import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserId } from '@/lib/services/cbt-access.service';
import { finalizeSession } from '@/lib/services/cbt-session.service';

/**
 * POST { sessionId, answers?: Record<questionId, 'A'|'B'|'C'|'D'> }
 * Idempotent: calling it twice (double-click, retry, auto-submit + manual submit) scores the session once.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { sessionId, answers } = await request.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const outcome = await finalizeSession(
      supabase,
      userId,
      sessionId,
      answers && typeof answers === 'object' ? (answers as Record<string, string>) : undefined
    );

    if (!outcome.success) {
      const status = outcome.error === 'Session not found' ? 404 : 400;
      return NextResponse.json({ success: false, error: outcome.error }, { status });
    }

    return NextResponse.json({ success: true, alreadyCompleted: outcome.alreadyCompleted });
  } catch (error) {
    console.error('[complete-session]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
