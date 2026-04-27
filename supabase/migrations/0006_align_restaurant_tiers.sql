-- HaresvaMi - align restaurant tier constraint with v1 billing plans.
-- Apply after 0005_subscription_scan_credits_ai_usage.sql.

-- ============================================================================
-- restaurants.tier
-- V1 supports free, starter, and pro. Multi-restaurant/group plans are future.
-- ============================================================================
ALTER TABLE public.restaurants
  DROP CONSTRAINT IF EXISTS restaurants_tier_check;

-- Existing pre-v1 group rows map to pro before the stricter constraint applies.
UPDATE public.restaurants
SET tier = 'pro'
WHERE tier = 'group';

ALTER TABLE public.restaurants
  ADD CONSTRAINT restaurants_tier_check
  CHECK (tier IN ('free', 'starter', 'pro'));
