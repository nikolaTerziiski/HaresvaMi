-- HaresvaMi — initial schema (Phase 0)
-- Run this first, then 0002_rls_policies.sql, then 0003_indexes_and_triggers.sql.

-- ============================================================================
-- restaurants
-- One per owner in v1. Schema supports multi-restaurant later.
-- ============================================================================
CREATE TABLE restaurants (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  slug                     TEXT UNIQUE NOT NULL,
  city                     TEXT,
  address                  TEXT,
  phone                    TEXT,
  language_default         TEXT NOT NULL DEFAULT 'bg' CHECK (language_default IN ('bg', 'en')),
  customer_languages       TEXT[] NOT NULL DEFAULT ARRAY['bg'],
  logo_url                 TEXT,
  tier                     TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'group')),
  trial_ends_at            TIMESTAMPTZ,
  stripe_customer_id       TEXT UNIQUE,
  stripe_subscription_id   TEXT UNIQUE,
  onboarding_completed_at  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- menu_items
-- Dishes the restaurant sells. Soft-deletable so historical ratings survive.
-- ============================================================================
CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name_bg         TEXT NOT NULL,
  name_en         TEXT,
  description_bg  TEXT,
  description_en  TEXT,
  category        TEXT,
  price           NUMERIC(8, 2),
  image_url       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- receipt_aliases
-- Learned dictionary mapping receipt abbreviations to menu items.
-- ============================================================================
CREATE TABLE receipt_aliases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  alias          TEXT NOT NULL,
  menu_item_id   UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  confidence     TEXT NOT NULL DEFAULT 'manual' CHECK (confidence IN ('manual', 'ai_suggested')),
  times_seen     INT NOT NULL DEFAULT 1,
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (restaurant_id, alias)
);

-- ============================================================================
-- feedback_sessions
-- One receipt scan = one session. Anonymous customer interaction.
-- ============================================================================
CREATE TABLE feedback_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number        TEXT,
  receipt_image_path  TEXT,
  extracted_items     JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_language   TEXT NOT NULL DEFAULT 'bg' CHECK (customer_language IN ('bg', 'en')),
  overall_rating      TEXT CHECK (overall_rating IN ('like', 'dislike')),
  overall_comment     TEXT,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- feedback_ratings
-- Per-item rating inside a session (1–10).
-- ============================================================================
CREATE TABLE feedback_ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES feedback_sessions(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 10),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- usage_counters
-- Tracks tier-limit usage per restaurant per calendar month ("2026-04").
-- ============================================================================
CREATE TABLE usage_counters (
  restaurant_id        UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  period               TEXT NOT NULL,
  feedback_count       INT NOT NULL DEFAULT 0,
  receipt_scans_count  INT NOT NULL DEFAULT 0,

  PRIMARY KEY (restaurant_id, period)
);
