# 02 — Database Schema

## Design principles

- **Use Supabase Auth as the source of truth for users.** Owners are `auth.users` rows. We only store profile/restaurant data in our own tables.
- **One owner can have one restaurant in v1.** Multi-restaurant support is Phase 2+. Schema allows it (FK `owner_id` on restaurants), but UI only handles one.
- **RLS on every table. No exceptions.** Even tables that "shouldn't matter" — bots will probe them.
- **Soft deletes via `deleted_at` for menu_items only.** Everything else is hard-delete to keep things simple.
- **JSON for evolving data only.** Receipt extraction results are jsonb because the structure may evolve. Ratings are normalized rows.

## Tables

### `restaurants`
The owner's restaurant. One per user in v1.

```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT,
  address TEXT,
  phone TEXT,
  language_default TEXT NOT NULL DEFAULT 'bg' CHECK (language_default IN ('bg', 'en')),
  customer_languages TEXT[] NOT NULL DEFAULT ARRAY['bg'],
  logo_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'group')),
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
CREATE UNIQUE INDEX idx_restaurants_slug ON restaurants(slug);
```

### `menu_items`
Dishes the restaurant sells. Owner adds these manually during onboarding.

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name_bg TEXT NOT NULL,
  name_en TEXT,
  description_bg TEXT,
  description_en TEXT,
  category TEXT,
  price NUMERIC(8, 2),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_active ON menu_items(restaurant_id, is_active) WHERE deleted_at IS NULL;
```

### `receipt_aliases`
The learned dictionary mapping receipt text (often abbreviated) to menu items.

```sql
CREATE TABLE receipt_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,                    -- "PK", "Тел.буз", "ШОПС"
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  confidence TEXT NOT NULL DEFAULT 'manual' CHECK (confidence IN ('manual', 'ai_suggested')),
  times_seen INT NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (restaurant_id, alias)
);

CREATE INDEX idx_receipt_aliases_restaurant_id ON receipt_aliases(restaurant_id);
CREATE INDEX idx_receipt_aliases_lookup ON receipt_aliases(restaurant_id, alias);
```

### `feedback_sessions`
One scan = one session. Anonymous customer interaction.

```sql
CREATE TABLE feedback_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number TEXT,                      -- Optional, free text ("12", "Терасата 3")
  receipt_image_path TEXT,                -- Path in Supabase Storage
  extracted_items JSONB NOT NULL DEFAULT '[]'::jsonb,  -- AI raw output
  customer_language TEXT NOT NULL DEFAULT 'bg' CHECK (customer_language IN ('bg', 'en')),
  overall_rating TEXT CHECK (overall_rating IN ('like', 'dislike')),
  overall_comment TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_sessions_restaurant_id ON feedback_sessions(restaurant_id, created_at DESC);
CREATE INDEX idx_feedback_sessions_completed ON feedback_sessions(restaurant_id, completed_at) WHERE completed_at IS NOT NULL;
```

**`extracted_items` jsonb shape:**
```json
[
  {
    "raw_text": "Кеб. с лук",
    "menu_item_id": "uuid-here",
    "menu_item_name": "Кебапче с лук",
    "quantity": 2,
    "matched_via": "alias" 
  },
  {
    "raw_text": "PK",
    "menu_item_id": null,
    "menu_item_name": null,
    "quantity": 1,
    "matched_via": "unknown"
  }
]
```

### `feedback_ratings`
Per-item ratings within a session.

```sql
CREATE TABLE feedback_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES feedback_sessions(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 10),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_ratings_session_id ON feedback_ratings(session_id);
CREATE INDEX idx_feedback_ratings_menu_item ON feedback_ratings(menu_item_id, created_at DESC);
```

### `usage_counters`
Tracks tier limit usage per restaurant per month.

```sql
CREATE TABLE usage_counters (
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                   -- "2026-04" format
  feedback_count INT NOT NULL DEFAULT 0,
  receipt_scans_count INT NOT NULL DEFAULT 0,
  
  PRIMARY KEY (restaurant_id, period)
);

CREATE INDEX idx_usage_counters_restaurant ON usage_counters(restaurant_id);
```

## Row Level Security policies

Apply to all tables. Enable RLS first:

```sql
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
```

### restaurants policies

```sql
-- Owner can read their own restaurant
CREATE POLICY "owners_read_own_restaurant"
  ON restaurants FOR SELECT
  USING (auth.uid() = owner_id);

-- Owner can insert (during signup)
CREATE POLICY "owners_create_restaurant"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owner can update their own
CREATE POLICY "owners_update_own_restaurant"
  ON restaurants FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owner can delete their own
CREATE POLICY "owners_delete_own_restaurant"
  ON restaurants FOR DELETE
  USING (auth.uid() = owner_id);
```

### menu_items policies

```sql
-- Owner can do anything with their restaurant's menu items
CREATE POLICY "owners_manage_menu_items"
  ON menu_items FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Anonymous (kiosk) can read active menu items for any restaurant
-- Needed for the customer rating screen
CREATE POLICY "public_read_active_menu_items"
  ON menu_items FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL);
```

### receipt_aliases policies

```sql
CREATE POLICY "owners_manage_aliases"
  ON receipt_aliases FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );
```

### feedback_sessions policies

```sql
-- Owner can read all sessions for their restaurant
CREATE POLICY "owners_read_sessions"
  ON feedback_sessions FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Anonymous (kiosk) can insert sessions
-- We rely on the API route to validate the restaurant exists and belongs to the kiosk's session
CREATE POLICY "public_create_sessions"
  ON feedback_sessions FOR INSERT
  WITH CHECK (TRUE);

-- Anonymous (kiosk) can update their own session within 30 minutes
CREATE POLICY "public_update_recent_sessions"
  ON feedback_sessions FOR UPDATE
  USING (created_at > NOW() - INTERVAL '30 minutes');
```

### feedback_ratings policies

```sql
-- Owner can read all ratings for their restaurant's sessions
CREATE POLICY "owners_read_ratings"
  ON feedback_ratings FOR SELECT
  USING (
    session_id IN (
      SELECT fs.id FROM feedback_sessions fs
      JOIN restaurants r ON r.id = fs.restaurant_id
      WHERE r.owner_id = auth.uid()
    )
  );

-- Anonymous (kiosk) can insert ratings
CREATE POLICY "public_create_ratings"
  ON feedback_ratings FOR INSERT
  WITH CHECK (TRUE);
```

### usage_counters policies

```sql
CREATE POLICY "owners_read_usage"
  ON usage_counters FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Service role only writes (via API routes)
-- No insert/update policies for normal users
```

## Triggers

### Auto-update `updated_at`

```sql
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
```

### Auto-create restaurant slug

Handled in application code (slugify name + check uniqueness + append number if collision). No trigger needed.

## Storage buckets

Create these in Supabase dashboard:

### `menu-images` (public)
- Stores menu item photos uploaded by owners
- Public read, authenticated write
- Path pattern: `{restaurant_id}/{menu_item_id}.{ext}`
- Max file size: 5 MB
- Allowed types: image/jpeg, image/png, image/webp

### `receipt-images` (private)
- Stores receipt photos from kiosk scans
- No public access
- Path pattern: `{restaurant_id}/{session_id}.jpg`
- Max file size: 5 MB
- Allowed types: image/jpeg, image/png
- Lifecycle: auto-delete after 90 days (set up later)

### `restaurant-logos` (public)
- Stores restaurant logos
- Public read, authenticated write
- Path pattern: `{restaurant_id}.{ext}`
- Max file size: 2 MB
- Allowed types: image/jpeg, image/png, image/svg+xml

## Migration files

Create these three SQL files in `supabase/migrations/`:

1. **`0001_initial_schema.sql`** — All `CREATE TABLE` statements
2. **`0002_rls_policies.sql`** — All `ALTER TABLE ... ENABLE RLS` and `CREATE POLICY` statements
3. **`0003_indexes_and_triggers.sql`** — All `CREATE INDEX` and `CREATE TRIGGER` statements

Apply order matters. Run sequentially in Supabase SQL editor.

## Type generation

After applying migrations, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/types.ts
```

Re-run this any time the schema changes.
