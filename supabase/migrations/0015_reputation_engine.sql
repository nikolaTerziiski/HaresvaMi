-- HaresvaMi — reputation engine (Phase 4)
-- Apply after 0014_*.sql (or 0013_push_subscriptions.sql if no 0014 exists).
--
-- Adds Google review linking fields to restaurants, a recovery comment field
-- to feedback_sessions, and a new telegram_links table for Telegram bot
-- notifications scoped to restaurant owners.
--
-- Security notes:
--   • RLS is enabled on telegram_links. Owners can SELECT and DELETE their
--     own rows via the restaurant ownership subquery.
--   • No INSERT policy — inserts happen via the service role (Telegram bot
--     webhook handler), which bypasses RLS.
--   • google_review_url and google_place_id are nullable; populated by the
--     owner through the settings UI.
--   • recovery_comment is constrained to <= 1000 chars to cap storage.

-- ============================================================================
-- restaurants — add Google Review linking fields
-- ============================================================================
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS google_review_url TEXT;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- ============================================================================
-- feedback_sessions — add recovery comment field
-- ============================================================================
ALTER TABLE public.feedback_sessions
  ADD COLUMN IF NOT EXISTS recovery_comment TEXT;

ALTER TABLE public.feedback_sessions
  ADD CONSTRAINT feedback_sessions_recovery_comment_len
  CHECK (recovery_comment IS NULL OR length(recovery_comment) <= 1000);

-- ============================================================================
-- telegram_links
-- Connects a restaurant to a Telegram chat for owner alert notifications.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  chat_id        BIGINT NOT NULL,
  username       TEXT,
  linked_by      UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (restaurant_id, chat_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_links_restaurant_id
  ON public.telegram_links(restaurant_id);

ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;

-- Owner can read their own telegram link rows.
CREATE POLICY "telegram_links_owner_select"
  ON public.telegram_links FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Owner can delete their own telegram link rows.
CREATE POLICY "telegram_links_owner_delete"
  ON public.telegram_links FOR DELETE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
