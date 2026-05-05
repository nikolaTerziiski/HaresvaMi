-- HaresvaMi - remove anonymous feedback table writes.
-- Apply after 0007_kiosk_sessions.sql.

-- Kiosk writes are authorized in Next.js API routes and executed with the
-- service role. Owners keep their existing read policies from 0002.
DROP POLICY IF EXISTS "public_create_sessions" ON public.feedback_sessions;
DROP POLICY IF EXISTS "public_update_recent_sessions" ON public.feedback_sessions;
DROP POLICY IF EXISTS "public_create_ratings" ON public.feedback_ratings;
