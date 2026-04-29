-- HaresvaMi - secure kiosk sessions.
-- Apply after 0006_align_restaurant_tiers.sql.

-- ============================================================================
-- kiosk_sessions
-- Stores hashed kiosk access tokens for tablet/customer flows.
-- Raw tokens are returned only once by server-side creation logic.
-- ============================================================================
CREATE TABLE public.kiosk_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  token_hash     TEXT UNIQUE NOT NULL,
  label          TEXT,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  expires_at     TIMESTAMPTZ NOT NULL,
  last_used_at   TIMESTAMPTZ,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kiosk_sessions_restaurant_id
  ON public.kiosk_sessions(restaurant_id);

CREATE INDEX idx_kiosk_sessions_token_hash
  ON public.kiosk_sessions(token_hash);

CREATE INDEX idx_kiosk_sessions_status_expires_at
  ON public.kiosk_sessions(status, expires_at);

-- ============================================================================
-- RLS
-- Owners can read sessions for their own restaurant.
-- No public insert/update/delete policies: service role handles writes.
-- ============================================================================
ALTER TABLE public.kiosk_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_own_kiosk_sessions"
  ON public.kiosk_sessions FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );
