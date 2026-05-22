-- HaresvaMi — push_subscriptions (Phase 3 retention-loop)
-- Apply after 0012_plan_overrides_and_audit_log.sql.
--
-- Stores Web Push subscription records for restaurant owners who opt in to
-- push notifications (weekly insights, alerts).
--
-- Security notes:
--   • RLS is enabled. Owners can SELECT and DELETE their own rows.
--   • INSERT is allowed via owner policy (user_id = auth.uid() AND restaurant
--     belongs to them).
--   • No UPDATE policy — last_used_at updates are done by the weekly cron via
--     the service role, which bypasses RLS.
--   • Admins (public.is_admin()) can SELECT all rows.
--   • endpoint is UNIQUE to enforce one row per browser subscription endpoint.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint         TEXT NOT NULL UNIQUE,
  p256dh           TEXT NOT NULL,
  auth             TEXT NOT NULL,
  expiration_time  BIGINT,
  user_agent       TEXT CHECK (user_agent IS NULL OR length(user_agent) <= 500),
  last_used_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_restaurant_user
  ON public.push_subscriptions(restaurant_id, user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Owner can read their own push subscription rows.
CREATE POLICY "push_subs_owner_select"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Owner can insert a push subscription for their own restaurant.
CREATE POLICY "push_subs_owner_insert"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Owner can delete their own push subscription rows.
CREATE POLICY "push_subs_owner_delete"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Admins can read all push subscription rows.
CREATE POLICY "push_subs_admin_select"
  ON public.push_subscriptions FOR SELECT
  USING (public.is_admin());

-- Reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
