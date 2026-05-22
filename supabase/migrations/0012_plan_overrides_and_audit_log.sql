-- HaresvaMi — plan_overrides and billing_audit_log (Phase 5 prep)
-- Apply after 0011_tier_enforcement.sql.
--
-- Introduces two tables:
--   plan_overrides     — per-restaurant admin override that beats restaurants.tier
--   billing_audit_log  — append-only record of every admin billing change
--
-- Security notes:
--   • Neither table stores customer names, receipt images, review comments,
--     access tokens, Stripe secrets, or raw receipt text.
--   • INSERT / UPDATE / DELETE on both tables is allowed only to the service role.
--     RLS blocks all other write paths by default when no matching policy exists.
--   • Restaurant owners can SELECT their own plan_overrides row so the dashboard
--     can show "you have extra credits via admin grant".
--   • Admins (role = 'admin' in public.profiles) can SELECT all rows on both tables.

-- ============================================================================
-- plan_overrides
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.plan_overrides (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id          UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,

  -- Nullable: if NULL, the override only adjusts limits without changing tier.
  override_tier          TEXT CHECK (override_tier IN ('free', 'starter', 'pro')),

  -- Nullable: if NULL, use the tier's default from plans.ts.
  override_feedback_limit INT CHECK (override_feedback_limit IS NULL OR override_feedback_limit >= 0),

  -- Nullable: if NULL, use the tier's default from plans.ts.
  override_scan_limit    INT CHECK (override_scan_limit IS NULL OR override_scan_limit >= 0),

  -- Required justification for every override — audit hygiene.
  reason                 TEXT NOT NULL,

  granted_by             UUID NOT NULL REFERENCES auth.users(id),
  starts_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at             TIMESTAMPTZ,            -- NULL means indefinite
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT plan_overrides_expires_after_starts
    CHECK (expires_at IS NULL OR expires_at > starts_at)
);

-- Lookup index: fetch the active override for a restaurant in one seek.
CREATE INDEX IF NOT EXISTS idx_plan_overrides_restaurant_expires
  ON public.plan_overrides(restaurant_id, expires_at);

ALTER TABLE public.plan_overrides ENABLE ROW LEVEL SECURITY;

-- Owners can read their own restaurant's overrides (dashboard visibility).
CREATE POLICY "plan_overrides_owner_select"
  ON public.plan_overrides FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Admins can read all overrides.
CREATE POLICY "plan_overrides_admin_select"
  ON public.plan_overrides FOR SELECT
  USING (public.is_admin());

-- ============================================================================
-- billing_audit_log
-- ============================================================================
-- Append-only table. Every row is an immutable record of a single field change
-- made by an admin. No UPDATE or DELETE policies are granted.
--
-- Do NOT store in this table: customer names, receipt images, review comments,
-- access tokens, Stripe secrets, or raw receipt text.
CREATE TABLE IF NOT EXISTS public.billing_audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  UUID NOT NULL REFERENCES auth.users(id),
  restaurant_id  UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,

  -- Name of the field that was changed, e.g. 'tier', 'override_scan_limit',
  -- 'scan_credits_granted'.
  field          TEXT NOT NULL,

  -- Previous value as JSONB so it can hold a string, number, or null uniformly.
  -- NULL when the field had no previous value (first-time set).
  previous_value JSONB,

  -- New value. Required — every logged change must record what it became.
  new_value      JSONB NOT NULL,

  -- Required justification supplied by the admin at write time.
  reason         TEXT NOT NULL,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chronological index per restaurant for the admin billing history view.
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_restaurant_created
  ON public.billing_audit_log(restaurant_id, created_at DESC);

ALTER TABLE public.billing_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read the full audit log.
CREATE POLICY "billing_audit_log_admin_select"
  ON public.billing_audit_log FOR SELECT
  USING (public.is_admin());

-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
