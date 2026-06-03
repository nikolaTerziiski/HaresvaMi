-- HaresvaMi — feedback comment length constraint (Phase 4 follow-up)
-- Apply after 0017_decrement_feedback_usage.sql.
--
-- Mirrors the recovery_comment length constraint from 0015_reputation_engine.sql
-- for the overall_comment field on feedback_sessions.
--
-- Security notes:
--   • overall_comment is constrained to <= 500 chars to cap storage and prevent
--     abuse via the public-facing kiosk feedback form.

-- ============================================================================
-- feedback_sessions — add overall comment length constraint
-- ============================================================================
ALTER TABLE public.feedback_sessions
  ADD CONSTRAINT feedback_sessions_overall_comment_len
  CHECK (overall_comment IS NULL OR char_length(overall_comment) <= 500);

-- Reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
