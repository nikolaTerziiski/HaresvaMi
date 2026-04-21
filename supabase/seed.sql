-- HaresvaMi - development seed data
-- Runs after all migrations.
--
-- This file seeds:
--   1. deterministic auth.users rows for local/demo relational data
--   2. public.profiles rows with owner/admin roles
--   3. restaurants, menu items, receipt aliases, feedback sessions, ratings,
--      and usage counters
--
-- Note:
-- These auth.users rows are useful for local foreign keys and role testing.
-- They are not meant to be real password-login accounts for the UI.

-- ============================================================================
-- auth.users
-- Keep emails on the .test TLD so they never collide with real accounts.
-- ============================================================================
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'owner.seed@haresvami.test',
    NOW(),
    '{"language":"bg"}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'admin.seed@haresvami.test',
    NOW(),
    '{"language":"bg"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- ============================================================================
-- profiles
-- Trigger creates owner profiles on INSERT, but we upsert explicitly here so
-- reruns stay deterministic and admin role is always restored.
-- ============================================================================
INSERT INTO public.profiles (id, role)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'owner'),
  ('10000000-0000-4000-8000-000000000002', 'admin')
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role;

-- ============================================================================
-- restaurants
-- ============================================================================
INSERT INTO public.restaurants (
  id,
  owner_id,
  name,
  slug,
  city,
  address,
  phone,
  language_default,
  customer_languages,
  tier,
  trial_ends_at,
  onboarding_completed_at
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Механа Старият Чинар',
    'mehana-stariyat-chinar',
    'Пловдив',
    'ул. "Капитан Райчо" 12',
    '+359 88 123 4567',
    'bg',
    ARRAY['bg', 'en'],
    'free',
    NOW() + INTERVAL '14 days',
    NOW()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'Бистро Лозата',
    'bistro-lozata',
    'София',
    'бул. "Витоша" 44',
    '+359 89 765 4321',
    'bg',
    ARRAY['bg', 'en'],
    'pro',
    NOW() + INTERVAL '30 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE
SET
  owner_id = EXCLUDED.owner_id,
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  city = EXCLUDED.city,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  language_default = EXCLUDED.language_default,
  customer_languages = EXCLUDED.customer_languages,
  tier = EXCLUDED.tier,
  trial_ends_at = EXCLUDED.trial_ends_at,
  onboarding_completed_at = EXCLUDED.onboarding_completed_at;

-- ============================================================================
-- menu_items
-- ============================================================================
INSERT INTO public.menu_items (
  id,
  restaurant_id,
  name_bg,
  name_en,
  description_bg,
  description_en,
  category,
  price,
  sort_order
)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Шопска салата',
    'Shopska Salad',
    'Домати, краставици, сирене и печени чушки.',
    'Tomatoes, cucumbers, white cheese, and roasted peppers.',
    'Салати',
    8.90,
    1
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'Кебапче',
    'Kebapche',
    'Сочно кебапче на скара.',
    'Grilled seasoned minced meat.',
    'Основни',
    3.90,
    2
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'Пържени картофи',
    'French Fries',
    'Хрупкави картофи със сол.',
    'Crispy salted fries.',
    'Гарнитури',
    4.50,
    3
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000002',
    'Таратор',
    'Tarator',
    'Студена супа с кисело мляко, краставици и копър.',
    'Cold yogurt soup with cucumber and dill.',
    'Салати и студени',
    6.20,
    1
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000002',
    'Свински врат',
    'Pork Neck Steak',
    'Печен свински врат на жар.',
    'Char-grilled pork neck steak.',
    'Основни',
    14.80,
    2
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000002',
    'Домашна лимонада',
    'Homemade Lemonade',
    'Лимонада с мента и лимон.',
    'Lemonade with mint and lemon.',
    'Напитки',
    5.50,
    3
  )
ON CONFLICT (id) DO UPDATE
SET
  restaurant_id = EXCLUDED.restaurant_id,
  name_bg = EXCLUDED.name_bg,
  name_en = EXCLUDED.name_en,
  description_bg = EXCLUDED.description_bg,
  description_en = EXCLUDED.description_en,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- receipt_aliases
-- ============================================================================
INSERT INTO public.receipt_aliases (
  id,
  restaurant_id,
  alias,
  menu_item_id,
  confidence,
  times_seen
)
VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'ШОПС',
    '30000000-0000-4000-8000-000000000001',
    'manual',
    12
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'КЕБ x2',
    '30000000-0000-4000-8000-000000000002',
    'ai_suggested',
    5
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'PK',
    '30000000-0000-4000-8000-000000000003',
    'manual',
    18
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000002',
    'ТАРАТОР',
    '30000000-0000-4000-8000-000000000004',
    'manual',
    7
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000002',
    'СВ.ВРАТ',
    '30000000-0000-4000-8000-000000000005',
    'ai_suggested',
    4
  )
ON CONFLICT (id) DO UPDATE
SET
  restaurant_id = EXCLUDED.restaurant_id,
  alias = EXCLUDED.alias,
  menu_item_id = EXCLUDED.menu_item_id,
  confidence = EXCLUDED.confidence,
  times_seen = EXCLUDED.times_seen,
  last_seen_at = NOW();

-- ============================================================================
-- feedback_sessions
-- ============================================================================
INSERT INTO public.feedback_sessions (
  id,
  restaurant_id,
  table_number,
  receipt_image_path,
  extracted_items,
  customer_language,
  overall_rating,
  overall_comment,
  started_at,
  completed_at
)
VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '12',
    '20000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000001.jpg',
    '[
      {
        "raw_text": "ШОПС",
        "menu_item_id": "30000000-0000-4000-8000-000000000001",
        "menu_item_name": "Шопска салата",
        "quantity": 1,
        "matched_via": "alias"
      },
      {
        "raw_text": "КЕБ x2",
        "menu_item_id": "30000000-0000-4000-8000-000000000002",
        "menu_item_name": "Кебапче",
        "quantity": 2,
        "matched_via": "alias"
      },
      {
        "raw_text": "PK",
        "menu_item_id": "30000000-0000-4000-8000-000000000003",
        "menu_item_name": "Пържени картофи",
        "quantity": 1,
        "matched_via": "alias"
      }
    ]'::jsonb,
    'bg',
    'like',
    'Кебапчетата много се харесаха.',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '4 minutes'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'Тераса 3',
    '20000000-0000-4000-8000-000000000002/50000000-0000-4000-8000-000000000002.jpg',
    '[
      {
        "raw_text": "ТАРАТОР",
        "menu_item_id": "30000000-0000-4000-8000-000000000004",
        "menu_item_name": "Таратор",
        "quantity": 1,
        "matched_via": "alias"
      },
      {
        "raw_text": "СВ.ВРАТ",
        "menu_item_id": "30000000-0000-4000-8000-000000000005",
        "menu_item_name": "Свински врат",
        "quantity": 1,
        "matched_via": "alias"
      },
      {
        "raw_text": "ЛИМОНАДА",
        "menu_item_id": "30000000-0000-4000-8000-000000000006",
        "menu_item_name": "Домашна лимонада",
        "quantity": 2,
        "matched_via": "menu_name"
      }
    ]'::jsonb,
    'bg',
    'dislike',
    'Лимонадата беше добра, но месото дойде леко изстинало.',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '6 minutes'
  )
ON CONFLICT (id) DO UPDATE
SET
  restaurant_id = EXCLUDED.restaurant_id,
  table_number = EXCLUDED.table_number,
  receipt_image_path = EXCLUDED.receipt_image_path,
  extracted_items = EXCLUDED.extracted_items,
  customer_language = EXCLUDED.customer_language,
  overall_rating = EXCLUDED.overall_rating,
  overall_comment = EXCLUDED.overall_comment,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at;

-- ============================================================================
-- feedback_ratings
-- ============================================================================
INSERT INTO public.feedback_ratings (
  id,
  session_id,
  menu_item_id,
  rating,
  comment
)
VALUES
  (
    '60000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    9,
    'Свежа и добре овкусена.'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    10,
    'Точно така трябва да е.'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    7,
    'Малко по-солени.'
  ),
  (
    '60000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000004',
    8,
    'Освежаващ.'
  ),
  (
    '60000000-0000-4000-8000-000000000005',
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000005',
    4,
    'Вкусно, но не беше достатъчно топло.'
  ),
  (
    '60000000-0000-4000-8000-000000000006',
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000006',
    9,
    'Супер за лятото.'
  )
ON CONFLICT (id) DO UPDATE
SET
  session_id = EXCLUDED.session_id,
  menu_item_id = EXCLUDED.menu_item_id,
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment;

-- ============================================================================
-- usage_counters
-- ============================================================================
INSERT INTO public.usage_counters (
  restaurant_id,
  period,
  feedback_count,
  receipt_scans_count
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '2026-04',
    18,
    21
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '2026-04',
    43,
    48
  )
ON CONFLICT (restaurant_id, period) DO UPDATE
SET
  feedback_count = EXCLUDED.feedback_count,
  receipt_scans_count = EXCLUDED.receipt_scans_count;
