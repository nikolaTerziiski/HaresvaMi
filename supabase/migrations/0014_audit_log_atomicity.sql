-- HaresvaMi — audit-log atomicity and non-empty reason constraint (Phase 5 hardening)
-- Apply after 0013_push_subscriptions.sql.
--
-- Changes:
--   1. Adds CHECK (length(btrim(reason)) > 0) to plan_overrides and billing_audit_log
--      so that an empty-string reason cannot satisfy the NOT NULL constraint.
--   2. Creates apply_plan_override() — a SECURITY DEFINER function that writes a
--      plan_overrides row AND the corresponding billing_audit_log row in one
--      implicit transaction, ensuring the two are always written atomically.

-- ============================================================================
-- 1. Non-empty reason constraints
-- ============================================================================

-- plan_overrides
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'plan_overrides'
      AND constraint_name = 'plan_overrides_reason_nonempty'
  ) THEN
    ALTER TABLE public.plan_overrides
      ADD CONSTRAINT plan_overrides_reason_nonempty
      CHECK (length(btrim(reason)) > 0);
  END IF;
END;
$$;

-- billing_audit_log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'billing_audit_log'
      AND constraint_name = 'billing_audit_log_reason_nonempty'
  ) THEN
    ALTER TABLE public.billing_audit_log
      ADD CONSTRAINT billing_audit_log_reason_nonempty
      CHECK (length(btrim(reason)) > 0);
  END IF;
END;
$$;

-- ============================================================================
-- 2. Atomic plan override + audit log writer
-- ============================================================================
-- SECURITY DEFINER so it can INSERT into both tables (which have no INSERT
-- policy for regular authenticated users).  The function verifies at runtime
-- that the caller is an admin before proceeding.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_plan_override(
  p_restaurant_id         UUID,
  p_override_tier         TEXT,
  p_override_feedback_limit INT,
  p_override_scan_limit   INT,
  p_starts_at             TIMESTAMPTZ,
  p_expires_at            TIMESTAMPTZ,
  p_reason                TEXT,
  p_granted_by            UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override_id UUID;
BEGIN
  -- Security guard: caller must be the same user identified by p_granted_by
  -- AND must have the admin role.
  IF auth.uid() IS DISTINCT FROM p_granted_by THEN
    RAISE EXCEPTION 'apply_plan_override: p_granted_by must equal the authenticated user';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'apply_plan_override: caller must be an admin';
  END IF;

  -- Validate that reason is non-empty (belt-and-suspenders; constraint fires too).
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'apply_plan_override: reason must not be empty';
  END IF;

  -- Insert the override row.
  INSERT INTO public.plan_overrides (
    restaurant_id,
    override_tier,
    override_feedback_limit,
    override_scan_limit,
    reason,
    granted_by,
    starts_at,
    expires_at
  )
  VALUES (
    p_restaurant_id,
    p_override_tier,
    p_override_feedback_limit,
    p_override_scan_limit,
    p_reason,
    p_granted_by,
    COALESCE(p_starts_at, NOW()),
    p_expires_at
  )
  RETURNING id INTO v_override_id;

  -- Insert the corresponding audit log row in the same transaction.
  INSERT INTO public.billing_audit_log (
    admin_user_id,
    restaurant_id,
    field,
    previous_value,
    new_value,
    reason
  )
  VALUES (
    p_granted_by,
    p_restaurant_id,
    'plan_override',
    NULL,
    jsonb_build_object(
      'override_id',              v_override_id,
      'override_tier',            p_override_tier,
      'override_feedback_limit',  p_override_feedback_limit,
      'override_scan_limit',      p_override_scan_limit,
      'starts_at',                COALESCE(p_starts_at, NOW()),
      'expires_at',               p_expires_at
    ),
    p_reason
  );

  RETURN v_override_id;
END;
$$;

-- Only authenticated users may call this function; the body enforces admin check.
GRANT EXECUTE ON FUNCTION public.apply_plan_override(
  UUID, TEXT, INT, INT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, UUID
) TO authenticated;

-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
