-- HaresvaMi — restaurants UPDATE column-level grants (security hardening)
-- Apply after 0015_reputation_engine.sql.
--
-- Problem: the existing "owners_update_own_restaurant" policy (0002) only
-- enforces *which rows* an owner may update; it does not restrict *which
-- columns* may be written. A malicious or compromised client can therefore
-- escalate its own plan by writing directly to billing columns such as
-- tier, subscription_status, or stripe_customer_id.
--
-- Fix: revoke the broad UPDATE privilege on public.restaurants from the
-- authenticated and anon roles, then re-grant UPDATE on only the safe,
-- owner-editable profile columns. Billing/subscription columns are
-- intentionally excluded and may only be written by the service role
-- (via secure API routes that call Stripe or admin tooling).
--
-- Excluded billing columns (service-role writes only):
--   tier, subscription_status,
--   trial_started_at, trial_ends_at, trial_used_at,
--   stripe_customer_id, stripe_subscription_id,
--   current_period_ends_at

-- ============================================================================
-- Step 1: revoke broad UPDATE from public roles
-- ============================================================================
REVOKE UPDATE ON public.restaurants FROM authenticated, anon;

-- ============================================================================
-- Step 2: re-grant UPDATE on safe profile columns only
-- ============================================================================
GRANT UPDATE (
  name, city, address, phone,
  language_default, customer_languages, logo_url,
  google_review_url, google_place_id
) ON public.restaurants TO authenticated;

-- ============================================================================
-- Step 3: tighten the RLS policy to also enforce WITH CHECK
-- The original policy only had USING; adding WITH CHECK makes Postgres
-- re-verify ownership after the write, preventing row-hijack attempts.
-- ============================================================================
ALTER POLICY "owners_update_own_restaurant" ON public.restaurants
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
