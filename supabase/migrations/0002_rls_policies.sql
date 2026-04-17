-- HaresvaMi — RLS policies (Phase 0)
-- Apply after 0001_initial_schema.sql.
-- Every table has RLS enabled — no exceptions.

-- ============================================================================
-- Enable RLS on every table
-- ============================================================================
ALTER TABLE restaurants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_aliases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_ratings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters     ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- restaurants
-- ============================================================================
CREATE POLICY "owners_read_own_restaurant"
  ON restaurants FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "owners_create_restaurant"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owners_update_own_restaurant"
  ON restaurants FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "owners_delete_own_restaurant"
  ON restaurants FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- menu_items
-- Owner: full CRUD on their restaurant's items.
-- Anonymous (kiosk): read active, non-deleted items.
-- ============================================================================
CREATE POLICY "owners_manage_menu_items"
  ON menu_items FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "public_read_active_menu_items"
  ON menu_items FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL);

-- ============================================================================
-- receipt_aliases
-- Owner-only — kiosk flow hits the server API, not the table directly.
-- ============================================================================
CREATE POLICY "owners_manage_aliases"
  ON receipt_aliases FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- feedback_sessions
-- Owner reads, kiosk inserts + updates its own recent session.
-- The API route validates kiosk identity before inserting.
-- ============================================================================
CREATE POLICY "owners_read_sessions"
  ON feedback_sessions FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "public_create_sessions"
  ON feedback_sessions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "public_update_recent_sessions"
  ON feedback_sessions FOR UPDATE
  USING (created_at > NOW() - INTERVAL '30 minutes');

-- ============================================================================
-- feedback_ratings
-- Owner reads their restaurant's ratings. Kiosk inserts.
-- ============================================================================
CREATE POLICY "owners_read_ratings"
  ON feedback_ratings FOR SELECT
  USING (
    session_id IN (
      SELECT fs.id FROM feedback_sessions fs
      JOIN restaurants r ON r.id = fs.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "public_create_ratings"
  ON feedback_ratings FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================================
-- usage_counters
-- Owners read their own; only the service role writes (via API routes).
-- ============================================================================
CREATE POLICY "owners_read_usage"
  ON usage_counters FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );
