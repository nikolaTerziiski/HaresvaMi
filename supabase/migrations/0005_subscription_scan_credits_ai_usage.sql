-- HaresvaMi — subscription status, scan credits, and AI usage logging
-- Apply after 0004_roles.sql.

-- ============================================================================
-- restaurants subscription state
-- ============================================================================
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS current_period_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMPTZ;

UPDATE public.restaurants
SET subscription_status = 'none'
WHERE subscription_status IS NULL;

ALTER TABLE public.restaurants
  ALTER COLUMN subscription_status SET DEFAULT 'none',
  ALTER COLUMN subscription_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'restaurants_subscription_status_check'
  ) THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_subscription_status_check
      CHECK (
        subscription_status IN (
          'none',
          'trialing',
          'active',
          'past_due',
          'canceled',
          'paused'
        )
      );
  END IF;
END;
$$;

-- ============================================================================
-- scan_credit_grants
-- Tracks credit batches. API code spends credits by increasing credits_used.
-- ============================================================================
CREATE TABLE public.scan_credit_grants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  source           TEXT NOT NULL CHECK (length(trim(source)) > 0),
  credits_granted  INT NOT NULL CHECK (credits_granted > 0),
  credits_used     INT NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  starts_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT scan_credit_grants_used_within_grant_check
    CHECK (credits_used <= credits_granted),
  CONSTRAINT scan_credit_grants_expiry_after_start_check
    CHECK (expires_at IS NULL OR expires_at > starts_at)
);

CREATE INDEX idx_scan_credit_grants_restaurant
  ON public.scan_credit_grants(restaurant_id, starts_at DESC);

CREATE INDEX idx_scan_credit_grants_available
  ON public.scan_credit_grants(restaurant_id, expires_at)
  WHERE credits_used < credits_granted;

-- ============================================================================
-- ai_usage_events
-- Metadata-only AI logs. Do not add receipt text, review comments, image data,
-- customer names, access tokens, API keys, or provider secrets to this table.
-- ============================================================================
CREATE TABLE public.ai_usage_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL CHECK (length(trim(event_type)) > 0),
  model               TEXT NOT NULL CHECK (length(trim(model)) > 0),
  input_tokens        INT NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens       INT NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  total_tokens        INT NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  estimated_cost_usd  NUMERIC(12, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost_usd >= 0),
  success             BOOLEAN NOT NULL,
  failure_reason      TEXT CHECK (failure_reason IS NULL OR length(failure_reason) <= 500),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ai_usage_events_total_tokens_check
    CHECK (total_tokens >= input_tokens + output_tokens)
);

COMMENT ON TABLE public.ai_usage_events IS
  'Metadata-only AI usage log. Never store receipt text, review comments, image data, customer names, access tokens, API keys, or provider secrets here.';

CREATE INDEX idx_ai_usage_events_restaurant_created
  ON public.ai_usage_events(restaurant_id, created_at DESC);

CREATE INDEX idx_ai_usage_events_restaurant_success
  ON public.ai_usage_events(restaurant_id, success, created_at DESC);

-- ============================================================================
-- RLS
-- Owners can read their own billing/AI metadata. Admins can read all.
-- Application writes should use the service role from authorized server routes.
-- ============================================================================
ALTER TABLE public.scan_credit_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_own_scan_credit_grants"
  ON public.scan_credit_grants FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "admin_read_all_scan_credit_grants"
  ON public.scan_credit_grants FOR SELECT
  USING (public.is_admin());

CREATE POLICY "owners_read_own_ai_usage_events"
  ON public.ai_usage_events FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "admin_read_all_ai_usage_events"
  ON public.ai_usage_events FOR SELECT
  USING (public.is_admin());
