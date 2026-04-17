-- HaresvaMi — indexes + triggers (Phase 0)
-- Apply after 0001_initial_schema.sql and 0002_rls_policies.sql.

-- ============================================================================
-- restaurants
-- ============================================================================
CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
-- slug already has a UNIQUE constraint + implicit index; no extra index needed.

-- ============================================================================
-- menu_items
-- Partial indexes skip soft-deleted rows — most queries want active items only.
-- ============================================================================
CREATE INDEX idx_menu_items_restaurant_id
  ON menu_items(restaurant_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_menu_items_active
  ON menu_items(restaurant_id, is_active)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- receipt_aliases
-- ============================================================================
CREATE INDEX idx_receipt_aliases_restaurant_id ON receipt_aliases(restaurant_id);
CREATE INDEX idx_receipt_aliases_lookup        ON receipt_aliases(restaurant_id, alias);

-- ============================================================================
-- feedback_sessions
-- ============================================================================
CREATE INDEX idx_feedback_sessions_restaurant_id
  ON feedback_sessions(restaurant_id, created_at DESC);

CREATE INDEX idx_feedback_sessions_completed
  ON feedback_sessions(restaurant_id, completed_at)
  WHERE completed_at IS NOT NULL;

-- ============================================================================
-- feedback_ratings
-- ============================================================================
CREATE INDEX idx_feedback_ratings_session_id ON feedback_ratings(session_id);
CREATE INDEX idx_feedback_ratings_menu_item  ON feedback_ratings(menu_item_id, created_at DESC);

-- ============================================================================
-- usage_counters
-- ============================================================================
CREATE INDEX idx_usage_counters_restaurant ON usage_counters(restaurant_id);

-- ============================================================================
-- Triggers — auto-update updated_at columns
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
