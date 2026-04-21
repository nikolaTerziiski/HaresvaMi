-- HaresvaMi — roles and admin policies (Phase 1)
-- Apply after 0003_indexes_and_triggers.sql.

-- ============================================================================
-- profiles
-- One row per auth user. Created automatically on signup via trigger.
-- Stores the user's role. Keeping it separate from restaurants so the role
-- exists even before the onboarding wizard creates the restaurant row.
-- ============================================================================
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- ============================================================================
-- Trigger: create profile row on every new signup (email + Google OAuth)
-- Inserts into public.profiles — never touches the auth schema directly.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'owner')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Helper function: is the current user an admin?
-- Used in RLS policies — avoids repeating the subquery everywhere.
-- SECURITY DEFINER so it can always read profiles regardless of caller.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================================
-- Admin RLS policies
-- Admins can read everything. Admins can update restaurants (tier management).
-- All other write operations (insert/delete) still go through owner policies.
-- ============================================================================

CREATE POLICY "admin_read_all_restaurants"
  ON restaurants FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_update_all_restaurants"
  ON restaurants FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "admin_read_all_menu_items"
  ON menu_items FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_read_all_aliases"
  ON receipt_aliases FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_read_all_sessions"
  ON feedback_sessions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_read_all_ratings"
  ON feedback_ratings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_read_all_usage"
  ON usage_counters FOR SELECT
  USING (public.is_admin());

-- ============================================================================
-- To grant admin to yourself (run once in Supabase SQL editor):
--
--   UPDATE public.profiles SET role = 'admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
--
-- ============================================================================
