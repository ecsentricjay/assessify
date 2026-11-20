-- ============================================================================
-- Assessify CBT overhaul (JAMB practice) — run ONCE in the Supabase SQL editor
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

-- 1. Diagram / image support -------------------------------------------------
ALTER TABLE public.cbt_questions
  ADD COLUMN IF NOT EXISTS question_image_url   text,
  ADD COLUMN IF NOT EXISTS option_a_image_url   text,
  ADD COLUMN IF NOT EXISTS option_b_image_url   text,
  ADD COLUMN IF NOT EXISTS option_c_image_url   text,
  ADD COLUMN IF NOT EXISTS option_d_image_url   text,
  ADD COLUMN IF NOT EXISTS solution_image_url   text;

-- Session questions are a frozen snapshot of the question at the time of the test
ALTER TABLE public.cbt_session_questions
  ADD COLUMN IF NOT EXISTS question_image_url   text,
  ADD COLUMN IF NOT EXISTS option_a_image_url   text,
  ADD COLUMN IF NOT EXISTS option_b_image_url   text,
  ADD COLUMN IF NOT EXISTS option_c_image_url   text,
  ADD COLUMN IF NOT EXISTS option_d_image_url   text,
  ADD COLUMN IF NOT EXISTS solution_image_url   text;

-- Public bucket for question diagrams (uploads happen server-side with the service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cbt-question-images', 'cbt-question-images', true, 3145728,
  ARRAY['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 3145728,
      allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'];

-- 2. Practice sessions: free mode, exam/study mode, difficulty ----------------
-- Free practice has no subscription, so subscription_id must be nullable.
ALTER TABLE public.cbt_practice_sessions
  ALTER COLUMN subscription_id DROP NOT NULL;

ALTER TABLE public.cbt_practice_sessions
  ADD COLUMN IF NOT EXISTS mode              varchar(10) NOT NULL DEFAULT 'exam',
  ADD COLUMN IF NOT EXISTS difficulty_filter varchar(10) NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS is_free_access    boolean     NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cbt_sessions_student_course_status
  ON public.cbt_practice_sessions (student_id, course_id, status);

-- Optional per-bundle cap on practice sessions (only applies while subscriptions are required).
-- NULL = unlimited. The column did not exist before, so no cap was ever enforced.
-- Example: UPDATE cbt_subscription_bundles SET max_practice_sessions = 30 WHERE id = '<bundle id>';
ALTER TABLE public.cbt_subscription_bundles
  ADD COLUMN IF NOT EXISTS max_practice_sessions integer;

-- 3. One answer per question per session --------------------------------------
-- The old upsert had no conflict target, so changing an answer inserted a second row.
-- Remove duplicates (keep the most recently inserted row), then enforce uniqueness.
DELETE FROM public.cbt_session_answers a
USING public.cbt_session_answers b
WHERE a.session_id  = b.session_id
  AND a.question_id = b.question_id
  AND a.ctid < b.ctid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cbt_session_answers_session_question_key'
  ) THEN
    ALTER TABLE public.cbt_session_answers
      ADD CONSTRAINT cbt_session_answers_session_question_key UNIQUE (session_id, question_id);
  END IF;
END $$;

-- 4. Admin switch: is a subscription required to practise? --------------------
-- 'false' = CBT practice is free for every student (current launch mode).
INSERT INTO public.system_settings (key, value, description, category)
SELECT 'cbt_subscription_required', 'false',
       'When true, students need an active bundle subscription to practise CBT. When false, practice is free.',
       'cbt'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'cbt_subscription_required');

-- 5. Atomic side-effects when a session completes ------------------------------
-- Replaces the old per-question read-then-write loop (2 queries per question).
-- Called exactly once per session, by whichever request wins the in_progress -> completed flip.
CREATE OR REPLACE FUNCTION public.cbt_finalize_session_effects(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student uuid;
  v_sub     uuid;
BEGIN
  SELECT student_id, subscription_id INTO v_student, v_sub
  FROM cbt_practice_sessions WHERE id = p_session_id;

  IF v_student IS NULL OR v_student <> auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF v_sub IS NOT NULL THEN
    UPDATE cbt_student_subscriptions
       SET sessions_taken = COALESCE(sessions_taken, 0) + 1
     WHERE id = v_sub;
  END IF;

  -- Only questions the student actually answered count as "attempted"
  UPDATE cbt_questions q
     SET times_attempted = COALESCE(q.times_attempted, 0) + 1,
         times_correct   = COALESCE(q.times_correct, 0) + CASE WHEN a.is_correct THEN 1 ELSE 0 END
    FROM cbt_session_answers a
   WHERE a.session_id = p_session_id
     AND a.question_id = q.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cbt_finalize_session_effects(uuid) TO authenticated;
