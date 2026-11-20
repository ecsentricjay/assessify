-- ============================================================================
-- Jambite sub-profile for students — run ONCE in the Supabase SQL editor.
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

-- 1. New columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_type        varchar(12) NOT NULL DEFAULT 'university',
  ADD COLUMN IF NOT EXISTS jamb_institution_1  text,
  ADD COLUMN IF NOT EXISTS jamb_institution_2  text,
  ADD COLUMN IF NOT EXISTS jamb_course_1       text,
  ADD COLUMN IF NOT EXISTS jamb_course_2       text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_student_type_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_student_type_check CHECK (student_type IN ('university', 'jambite'));
  END IF;
END $$;

-- 2. Jambites have no matric number, level, faculty, department or enrolled institution.
-- Drop NOT NULL on whichever of these columns currently has it (no-op if already nullable).
DO $$
DECLARE c text;
BEGIN
  FOREACH c IN ARRAY ARRAY['institution_id', 'matric_number', 'level', 'faculty', 'department']
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
        AND column_name = c AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE public.profiles ALTER COLUMN %I DROP NOT NULL', c);
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_student_type ON public.profiles (student_type) WHERE student_type = 'jambite';
