-- HaresvaMi — development seed data v2
-- Comprehensive seed covering all Insights v0.1 states.
-- All ratings use the 1–5 scale (migration 0009).
--
-- Restaurant insight states seeded:
--
--   Механа Старият Чинар (0001)  full insights:
--                                  top performer  – Мешана скара (avg 4.8 / 5 ratings current)
--                                  watch dish     – Гювеч с кълцано (avg 2.4 / 5 ratings, delta –1.93)
--                                  improved dish  – Домашна баница (avg 4.33 current, delta +1.33, 3 vs 3)
--                                  comment of week – "Скарата беше страхотна! Ще ви препоръчаме!"
--
--   Бистро Лозата (0002)          current window empty
--                                  3 completed sessions 8–10 days ago, zero this week
--
--   Кафе Нова (0003)              first signals
--                                  3 completed sessions in current week, no dish reaches 3-rating threshold
--
--   Пицария Белла (0004)          no menu items
--
--   Хотел Ренесанс (0005)         no completed feedback sessions (one abandoned session)
--
-- Rolling windows (relative to NOW()):
--   current  = completed_at >= NOW() - INTERVAL '7 days'
--   previous = completed_at >= NOW() - INTERVAL '14 days'
--              AND completed_at <  NOW() - INTERVAL '7 days'

-- ============================================================================
-- auth.users
-- ============================================================================
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
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
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'owner.nova@haresvami.test',
    NOW(),
    '{"language":"bg"}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'owner.bella@haresvami.test',
    NOW(),
    '{"language":"bg"}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'owner.renesans@haresvami.test',
    NOW(),
    '{"language":"bg"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  email                = EXCLUDED.email,
  email_confirmed_at   = EXCLUDED.email_confirmed_at,
  raw_user_meta_data   = EXCLUDED.raw_user_meta_data;

-- ============================================================================
-- profiles
-- ============================================================================
INSERT INTO public.profiles (id, role)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'owner'),
  ('10000000-0000-4000-8000-000000000002', 'admin'),
  ('10000000-0000-4000-8000-000000000003', 'owner'),
  ('10000000-0000-4000-8000-000000000004', 'owner'),
  ('10000000-0000-4000-8000-000000000005', 'owner')
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
  -- Full insights data
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
    'pro',
    NOW() + INTERVAL '14 days',
    NOW() - INTERVAL '30 days'
  ),
  -- Current window empty (had data last week)
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
    'free',
    NOW() + INTERVAL '10 days',
    NOW() - INTERVAL '20 days'
  ),
  -- First signals (feedback but no dish hits 3-rating threshold)
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'Кафе Нова',
    'kafe-nova',
    'Варна',
    'ул. "Сливница" 7',
    '+359 87 234 5678',
    'bg',
    ARRAY['bg'],
    'free',
    NOW() + INTERVAL '12 days',
    NOW() - INTERVAL '15 days'
  ),
  -- No menu items
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    'Пицария Белла',
    'picaria-bella',
    'Бургас',
    'ул. "Алеко Богориди" 5',
    '+359 88 345 6789',
    'bg',
    ARRAY['bg'],
    'free',
    NULL,
    NULL
  ),
  -- No completed feedback sessions
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000005',
    'Хотел Ренесанс',
    'hotel-renesans',
    'Стара Загора',
    'ул. "Цар Симеон Велики" 100',
    '+359 89 456 7890',
    'bg',
    ARRAY['bg', 'en'],
    'free',
    NOW() + INTERVAL '8 days',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO UPDATE
SET
  owner_id                = EXCLUDED.owner_id,
  name                    = EXCLUDED.name,
  slug                    = EXCLUDED.slug,
  city                    = EXCLUDED.city,
  address                 = EXCLUDED.address,
  phone                   = EXCLUDED.phone,
  language_default        = EXCLUDED.language_default,
  customer_languages      = EXCLUDED.customer_languages,
  tier                    = EXCLUDED.tier,
  trial_ends_at           = EXCLUDED.trial_ends_at,
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
  sort_order,
  is_active
)
VALUES
  -- ── Механа Старият Чинар ────────────────────────────────────────────────
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Шопска салата',
    'Shopska Salad',
    'Домати, краставици, чушки и сирене.',
    'Tomatoes, cucumbers, peppers and white cheese.',
    'Салати',
    8.90,
    1,
    TRUE
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'Кебапче',
    'Kebapche',
    'Сочно кебапче на скара, наситено с подправки.',
    'Grilled seasoned minced-meat roll.',
    'Основни',
    3.90,
    2,
    TRUE
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'Пържени картофи',
    'French Fries',
    'Хрупкави картофи с морска сол.',
    'Crispy fries with sea salt.',
    'Гарнитури',
    4.50,
    3,
    TRUE
  ),
  -- top performer target
  (
    '30000000-0000-4000-8000-000000000007',
    '20000000-0000-4000-8000-000000000001',
    'Мешана скара',
    'Mixed Grill',
    'Кебапчета, кюфтета и свинско на жар с гарнитура.',
    'Kebapche, meatballs and pork chop on the grill, served with sides.',
    'Скара',
    22.50,
    4,
    TRUE
  ),
  -- watch dish target (declining quality)
  (
    '30000000-0000-4000-8000-000000000008',
    '20000000-0000-4000-8000-000000000001',
    'Гювеч с кълцано',
    'Gyuvech with minced meat',
    'Традиционен гювеч с кайма, зеленчуци и подправки.',
    'Traditional clay-pot dish with minced meat and vegetables.',
    'Традиционни',
    12.00,
    5,
    TRUE
  ),
  -- improved dish target
  (
    '30000000-0000-4000-8000-000000000009',
    '20000000-0000-4000-8000-000000000001',
    'Домашна баница',
    'Homemade Banitsa',
    'Баница с яйца и сирене, изпечена в момента.',
    'Freshly baked filo pastry with eggs and white cheese.',
    'Закуски',
    5.80,
    6,
    TRUE
  ),
  -- low-frequency item (only 1 previous-window rating)
  (
    '30000000-0000-4000-8000-000000000010',
    '20000000-0000-4000-8000-000000000001',
    'Бира Загорка 0.5 л',
    'Zagorka Beer 0.5 l',
    NULL,
    NULL,
    'Напитки',
    4.00,
    7,
    TRUE
  ),
  -- active but never rated yet
  (
    '30000000-0000-4000-8000-000000000011',
    '20000000-0000-4000-8000-000000000001',
    'Старинска кашкавалена пита',
    'Old-style Kashkaval Flatbread',
    'Пита с кашкавал и чесново масло.',
    'Flatbread with yellow cheese and garlic butter.',
    'Предястия',
    7.50,
    8,
    TRUE
  ),

  -- ── Бистро Лозата ───────────────────────────────────────────────────────
  (
    '30000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000002',
    'Таратор',
    'Tarator',
    'Студена супа с кисело мляко, краставици и копър.',
    'Cold yogurt soup with cucumber and dill.',
    'Салати и студени',
    6.20,
    1,
    TRUE
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
    2,
    TRUE
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000002',
    'Домашна лимонада',
    'Homemade Lemonade',
    'Лимонада с мента и лимон.',
    'Lemonade with fresh mint and lemon.',
    'Напитки',
    5.50,
    3,
    TRUE
  ),

  -- ── Кафе Нова ───────────────────────────────────────────────────────────
  (
    '30000000-0000-4000-8000-000000000012',
    '20000000-0000-4000-8000-000000000003',
    'Капучино',
    'Cappuccino',
    'Еспресо с разбита млечна пяна.',
    'Espresso with steamed milk foam.',
    'Горещи напитки',
    4.20,
    1,
    TRUE
  ),
  (
    '30000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000003',
    'Баница с кашкавал',
    'Kashkaval Banitsa',
    'Хрупкава баница с кашкавал.',
    'Crispy filo pastry with yellow cheese.',
    'Закуски',
    3.50,
    2,
    TRUE
  ),
  (
    '30000000-0000-4000-8000-000000000014',
    '20000000-0000-4000-8000-000000000003',
    'Тост с шунка',
    'Ham Toast',
    'Препечен тост с шунка и масло.',
    'Toasted bread with ham and butter.',
    'Закуски',
    4.00,
    3,
    TRUE
  ),

  -- ── Хотел Ренесанс (menu exists but no feedback) ───────────────────────
  (
    '30000000-0000-4000-8000-000000000015',
    '20000000-0000-4000-8000-000000000005',
    'Пилешка крем-супа',
    'Cream of Chicken Soup',
    'Кадифена крем-супа с пиле и крутони.',
    'Velvety chicken cream soup with croutons.',
    'Супи',
    8.00,
    1,
    TRUE
  ),
  (
    '30000000-0000-4000-8000-000000000016',
    '20000000-0000-4000-8000-000000000005',
    'Пиле на фурна',
    'Roasted Chicken',
    'Цяло пиле на фурна с картофи.',
    'Oven-roasted chicken with potatoes.',
    'Основни',
    18.00,
    2,
    TRUE
  ),
  (
    '30000000-0000-4000-8000-000000000017',
    '20000000-0000-4000-8000-000000000005',
    'Ризото с гъби',
    'Mushroom Risotto',
    'Кремообразно ризото с горски гъби.',
    'Creamy risotto with wild mushrooms.',
    'Основни',
    16.50,
    3,
    TRUE
  ),
  (
    '30000000-0000-4000-8000-000000000018',
    '20000000-0000-4000-8000-000000000005',
    'Тирамису',
    'Tiramisu',
    'Класическо италианско тирамису.',
    'Classic Italian tiramisu.',
    'Десерти',
    7.00,
    4,
    TRUE
  )
ON CONFLICT (id) DO UPDATE
SET
  restaurant_id  = EXCLUDED.restaurant_id,
  name_bg        = EXCLUDED.name_bg,
  name_en        = EXCLUDED.name_en,
  description_bg = EXCLUDED.description_bg,
  description_en = EXCLUDED.description_en,
  category       = EXCLUDED.category,
  price          = EXCLUDED.price,
  sort_order     = EXCLUDED.sort_order,
  is_active      = EXCLUDED.is_active;

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
  -- Чинар – original aliases
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'ШОПС',
    '30000000-0000-4000-8000-000000000001',
    'manual',
    14
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'КЕБ x2',
    '30000000-0000-4000-8000-000000000002',
    'ai_suggested',
    8
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'PK',
    '30000000-0000-4000-8000-000000000003',
    'manual',
    20
  ),
  -- Чинар – new items
  (
    '40000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000001',
    'МЕШ.СКАРА',
    '30000000-0000-4000-8000-000000000007',
    'ai_suggested',
    11
  ),
  (
    '40000000-0000-4000-8000-000000000007',
    '20000000-0000-4000-8000-000000000001',
    'ГЮВЕЧ',
    '30000000-0000-4000-8000-000000000008',
    'manual',
    9
  ),
  (
    '40000000-0000-4000-8000-000000000008',
    '20000000-0000-4000-8000-000000000001',
    'БАН',
    '30000000-0000-4000-8000-000000000009',
    'ai_suggested',
    6
  ),
  -- Лозата – original aliases
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
    5
  ),
  -- Нова – aliases
  (
    '40000000-0000-4000-8000-000000000009',
    '20000000-0000-4000-8000-000000000003',
    'КАП',
    '30000000-0000-4000-8000-000000000012',
    'ai_suggested',
    3
  ),
  (
    '40000000-0000-4000-8000-000000000010',
    '20000000-0000-4000-8000-000000000003',
    'БАН.КАШ',
    '30000000-0000-4000-8000-000000000013',
    'ai_suggested',
    2
  )
ON CONFLICT (id) DO UPDATE
SET
  restaurant_id = EXCLUDED.restaurant_id,
  alias         = EXCLUDED.alias,
  menu_item_id  = EXCLUDED.menu_item_id,
  confidence    = EXCLUDED.confidence,
  times_seen    = EXCLUDED.times_seen,
  last_seen_at  = NOW();

-- ============================================================================
-- feedback_sessions
--
-- Window placement:
--   current  window: completed_at in last 7 days  (intervals ≤ 6d 23h)
--   previous window: completed_at 8–14 days ago   (intervals 8d–14d)
--   historical:      completed_at > 14 days ago
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

  -- ── Механа Старият Чинар — current window (last 7 days) ─────────────────

  -- session 001 (3 days ago) — original seed session, kept in current window
  (
    '50000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '7',
    '20000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000001.jpg',
    '[
      {"raw_text":"ШОПС","menu_item_id":"30000000-0000-4000-8000-000000000001","menu_item_name":"Шопска салата","quantity":1,"matched_via":"alias"},
      {"raw_text":"КЕБ x2","menu_item_id":"30000000-0000-4000-8000-000000000002","menu_item_name":"Кебапче","quantity":2,"matched_via":"alias"},
      {"raw_text":"PK","menu_item_id":"30000000-0000-4000-8000-000000000003","menu_item_name":"Пържени картофи","quantity":1,"matched_via":"alias"}
    ]'::jsonb,
    'bg',
    'like',
    'Кебапчетата много се харесаха.',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '4 minutes'
  ),

  -- session C1 (6 days ago) — contains the comment of the week
  (
    '50000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    '4',
    NULL,
    '[
      {"raw_text":"Мешана скара","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"manual"},
      {"raw_text":"Шопска салата","menu_item_id":"30000000-0000-4000-8000-000000000001","menu_item_name":"Шопска салата","quantity":1,"matched_via":"manual"},
      {"raw_text":"Гювеч с кълцано","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    'Мешаната скара е топ! Ще ви препоръчаме на всички приятели.',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days' + INTERVAL '5 minutes'
  ),

  -- session C2 (5 days ago)
  (
    '50000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    '11',
    NULL,
    '[
      {"raw_text":"Мешана скара","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"manual"},
      {"raw_text":"Гювеч с кълцано","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"manual"},
      {"raw_text":"Домашна баница","menu_item_id":"30000000-0000-4000-8000-000000000009","menu_item_name":"Домашна баница","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '6 minutes'
  ),

  -- session C3 (4 days ago)
  (
    '50000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000001',
    '2',
    NULL,
    '[
      {"raw_text":"Мешана скара","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"manual"},
      {"raw_text":"Кебапче","menu_item_id":"30000000-0000-4000-8000-000000000002","menu_item_name":"Кебапче","quantity":2,"matched_via":"manual"},
      {"raw_text":"Гювеч с кълцано","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"manual"},
      {"raw_text":"Домашна баница","menu_item_id":"30000000-0000-4000-8000-000000000009","menu_item_name":"Домашна баница","quantity":2,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    'Кебапчетата бяха перфектни.',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days' + INTERVAL '7 minutes'
  ),

  -- session C4 (2 days ago) — dislike overall because of the guvech
  (
    '50000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000001',
    '9',
    '20000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000006.jpg',
    '[
      {"raw_text":"МЕШ.СКАРА","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"alias"},
      {"raw_text":"PK","menu_item_id":"30000000-0000-4000-8000-000000000003","menu_item_name":"Пържени картофи","quantity":1,"matched_via":"alias"},
      {"raw_text":"ГЮВЕЧ","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"alias"},
      {"raw_text":"ШОПС","menu_item_id":"30000000-0000-4000-8000-000000000001","menu_item_name":"Шопска салата","quantity":1,"matched_via":"alias"}
    ]'::jsonb,
    'bg',
    'dislike',
    'Гювечът беше студен и доста безвкусен днес.',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'
  ),

  -- session C5 (1 day ago)
  (
    '50000000-0000-4000-8000-000000000007',
    '20000000-0000-4000-8000-000000000001',
    '6',
    NULL,
    '[
      {"raw_text":"Мешана скара","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"manual"},
      {"raw_text":"Кебапче","menu_item_id":"30000000-0000-4000-8000-000000000002","menu_item_name":"Кебапче","quantity":1,"matched_via":"manual"},
      {"raw_text":"Пържени картофи","menu_item_id":"30000000-0000-4000-8000-000000000003","menu_item_name":"Пържени картофи","quantity":1,"matched_via":"manual"},
      {"raw_text":"Гювеч с кълцано","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"manual"},
      {"raw_text":"Шопска салата","menu_item_id":"30000000-0000-4000-8000-000000000001","menu_item_name":"Шопска салата","quantity":1,"matched_via":"manual"},
      {"raw_text":"Домашна баница","menu_item_id":"30000000-0000-4000-8000-000000000009","menu_item_name":"Домашна баница","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '8 minutes'
  ),

  -- ── Механа Старият Чинар — previous window (8–14 days ago) ──────────────

  -- session P1 (13 days ago)
  (
    '50000000-0000-4000-8000-000000000008',
    '20000000-0000-4000-8000-000000000001',
    '3',
    NULL,
    '[
      {"raw_text":"Мешана скара","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"manual"},
      {"raw_text":"Гювеч с кълцано","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"manual"},
      {"raw_text":"Домашна баница","menu_item_id":"30000000-0000-4000-8000-000000000009","menu_item_name":"Домашна баница","quantity":2,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '13 days',
    NOW() - INTERVAL '13 days' + INTERVAL '6 minutes'
  ),

  -- session P2 (12 days ago)
  (
    '50000000-0000-4000-8000-000000000009',
    '20000000-0000-4000-8000-000000000001',
    '8',
    '20000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000009.jpg',
    '[
      {"raw_text":"МЕШ.СКАРА","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"alias"},
      {"raw_text":"ГЮВЕЧ","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"alias"},
      {"raw_text":"ШОПС","menu_item_id":"30000000-0000-4000-8000-000000000001","menu_item_name":"Шопска салата","quantity":1,"matched_via":"alias"},
      {"raw_text":"ЗАГОРКА","menu_item_id":"30000000-0000-4000-8000-000000000010","menu_item_name":"Бира Загорка 0.5 л","quantity":2,"matched_via":"ai_suggested"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days' + INTERVAL '5 minutes'
  ),

  -- session P3 (10 days ago)
  (
    '50000000-0000-4000-8000-000000000010',
    '20000000-0000-4000-8000-000000000001',
    '5',
    NULL,
    '[
      {"raw_text":"Мешана скара","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"manual"},
      {"raw_text":"Гювеч с кълцано","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"manual"},
      {"raw_text":"Домашна баница","menu_item_id":"30000000-0000-4000-8000-000000000009","menu_item_name":"Домашна баница","quantity":1,"matched_via":"manual"},
      {"raw_text":"Кебапче","menu_item_id":"30000000-0000-4000-8000-000000000002","menu_item_name":"Кебапче","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '4 minutes'
  ),

  -- session P4 (8 days ago)
  (
    '50000000-0000-4000-8000-000000000011',
    '20000000-0000-4000-8000-000000000001',
    '1',
    NULL,
    '[
      {"raw_text":"Домашна баница","menu_item_id":"30000000-0000-4000-8000-000000000009","menu_item_name":"Домашна баница","quantity":2,"matched_via":"manual"},
      {"raw_text":"Шопска салата","menu_item_id":"30000000-0000-4000-8000-000000000001","menu_item_name":"Шопска салата","quantity":1,"matched_via":"manual"},
      {"raw_text":"Кебапче","menu_item_id":"30000000-0000-4000-8000-000000000002","menu_item_name":"Кебапче","quantity":2,"matched_via":"manual"},
      {"raw_text":"Пържени картофи","menu_item_id":"30000000-0000-4000-8000-000000000003","menu_item_name":"Пържени картофи","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    'Баницата може да е малко по-гореща.',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days' + INTERVAL '7 minutes'
  ),

  -- ── Механа Старият Чинар — historical (> 14 days) ───────────────────────

  -- session OLD1 (20 days ago)
  (
    '50000000-0000-4000-8000-000000000018',
    '20000000-0000-4000-8000-000000000001',
    '10',
    NULL,
    '[
      {"raw_text":"Мешана скара","menu_item_id":"30000000-0000-4000-8000-000000000007","menu_item_name":"Мешана скара","quantity":1,"matched_via":"manual"},
      {"raw_text":"Шопска салата","menu_item_id":"30000000-0000-4000-8000-000000000001","menu_item_name":"Шопска салата","quantity":1,"matched_via":"manual"},
      {"raw_text":"Кебапче","menu_item_id":"30000000-0000-4000-8000-000000000002","menu_item_name":"Кебапче","quantity":2,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days' + INTERVAL '5 minutes'
  ),

  -- session OLD2 (25 days ago)
  (
    '50000000-0000-4000-8000-000000000019',
    '20000000-0000-4000-8000-000000000001',
    '3',
    NULL,
    '[
      {"raw_text":"Гювеч с кълцано","menu_item_id":"30000000-0000-4000-8000-000000000008","menu_item_name":"Гювеч с кълцано","quantity":1,"matched_via":"manual"},
      {"raw_text":"Домашна баница","menu_item_id":"30000000-0000-4000-8000-000000000009","menu_item_name":"Домашна баница","quantity":1,"matched_via":"manual"},
      {"raw_text":"Пържени картофи","menu_item_id":"30000000-0000-4000-8000-000000000003","menu_item_name":"Пържени картофи","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'dislike',
    NULL,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days' + INTERVAL '6 minutes'
  ),

  -- ── Бистро Лозата — previous window only (current window is empty) ───────

  -- session 002 moved to previous window (10 days ago)
  (
    '50000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'Тераса 3',
    '20000000-0000-4000-8000-000000000002/50000000-0000-4000-8000-000000000002.jpg',
    '[
      {"raw_text":"ТАРАТОР","menu_item_id":"30000000-0000-4000-8000-000000000004","menu_item_name":"Таратор","quantity":1,"matched_via":"alias"},
      {"raw_text":"СВ.ВРАТ","menu_item_id":"30000000-0000-4000-8000-000000000005","menu_item_name":"Свински врат","quantity":1,"matched_via":"alias"},
      {"raw_text":"ЛИМОНАДА","menu_item_id":"30000000-0000-4000-8000-000000000006","menu_item_name":"Домашна лимонада","quantity":2,"matched_via":"ai_suggested"}
    ]'::jsonb,
    'bg',
    'like',
    'Лимонадата беше добра.',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '6 minutes'
  ),

  -- session BL2 (9 days ago)
  (
    '50000000-0000-4000-8000-000000000012',
    '20000000-0000-4000-8000-000000000002',
    'Тераса 1',
    NULL,
    '[
      {"raw_text":"Таратор","menu_item_id":"30000000-0000-4000-8000-000000000004","menu_item_name":"Таратор","quantity":1,"matched_via":"manual"},
      {"raw_text":"Свински врат","menu_item_id":"30000000-0000-4000-8000-000000000005","menu_item_name":"Свински врат","quantity":1,"matched_via":"manual"},
      {"raw_text":"Домашна лимонада","menu_item_id":"30000000-0000-4000-8000-000000000006","menu_item_name":"Домашна лимонада","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days' + INTERVAL '5 minutes'
  ),

  -- session BL3 (8 days ago)
  (
    '50000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000002',
    'Салон 2',
    NULL,
    '[
      {"raw_text":"Таратор","menu_item_id":"30000000-0000-4000-8000-000000000004","menu_item_name":"Таратор","quantity":1,"matched_via":"manual"},
      {"raw_text":"Свински врат","menu_item_id":"30000000-0000-4000-8000-000000000005","menu_item_name":"Свински врат","quantity":1,"matched_via":"manual"},
      {"raw_text":"Домашна лимонада","menu_item_id":"30000000-0000-4000-8000-000000000006","menu_item_name":"Домашна лимонада","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days' + INTERVAL '4 minutes'
  ),

  -- ── Кафе Нова — first signals (3 sessions, no dish hits 3-rating threshold) ─

  -- session FK1 (3 days ago)
  (
    '50000000-0000-4000-8000-000000000014',
    '20000000-0000-4000-8000-000000000003',
    '2',
    NULL,
    '[
      {"raw_text":"Капучино","menu_item_id":"30000000-0000-4000-8000-000000000012","menu_item_name":"Капучино","quantity":1,"matched_via":"manual"},
      {"raw_text":"Баница с кашкавал","menu_item_id":"30000000-0000-4000-8000-000000000013","menu_item_name":"Баница с кашкавал","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    'Кафето е на ниво!',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '3 minutes'
  ),

  -- session FK2 (2 days ago)
  (
    '50000000-0000-4000-8000-000000000015',
    '20000000-0000-4000-8000-000000000003',
    '5',
    NULL,
    '[
      {"raw_text":"Тост с шунка","menu_item_id":"30000000-0000-4000-8000-000000000014","menu_item_name":"Тост с шунка","quantity":1,"matched_via":"manual"},
      {"raw_text":"Капучино","menu_item_id":"30000000-0000-4000-8000-000000000012","menu_item_name":"Капучино","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '4 minutes'
  ),

  -- session FK3 (1 day ago)
  (
    '50000000-0000-4000-8000-000000000016',
    '20000000-0000-4000-8000-000000000003',
    '1',
    NULL,
    '[
      {"raw_text":"Баница с кашкавал","menu_item_id":"30000000-0000-4000-8000-000000000013","menu_item_name":"Баница с кашкавал","quantity":1,"matched_via":"manual"}
    ]'::jsonb,
    'bg',
    'like',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '2 minutes'
  ),

  -- ── Хотел Ренесанс — abandoned session (no completed_at) ─────────────────
  (
    '50000000-0000-4000-8000-000000000017',
    '20000000-0000-4000-8000-000000000005',
    '12',
    NULL,
    '[]'::jsonb,
    'bg',
    NULL,
    NULL,
    NOW() - INTERVAL '2 days',
    NULL
  )

ON CONFLICT (id) DO UPDATE
SET
  restaurant_id     = EXCLUDED.restaurant_id,
  table_number      = EXCLUDED.table_number,
  receipt_image_path = EXCLUDED.receipt_image_path,
  extracted_items   = EXCLUDED.extracted_items,
  customer_language = EXCLUDED.customer_language,
  overall_rating    = EXCLUDED.overall_rating,
  overall_comment   = EXCLUDED.overall_comment,
  started_at        = EXCLUDED.started_at,
  completed_at      = EXCLUDED.completed_at;

-- ============================================================================
-- feedback_ratings
-- All ratings on 1–5 scale (migration 0009).
--
-- Insight summary for Механа Старият Чинар:
--
--   Item 007 Мешана скара   — current avg 4.8 (5 ratings), prev avg 3.67 (3 ratings), delta +1.13
--                              → TOP PERFORMER
--
--   Item 008 Гювеч с кълцано — current avg 2.4 (5 ratings), prev avg 4.33 (3 ratings), delta –1.93
--                              → WATCH DISH
--
--   Item 009 Домашна баница — current avg 4.33 (3 ratings), prev avg 3.0 (3 ratings), delta +1.33
--                              → IMPROVED DISH (current ≥ 4.0 ✓, both counts ≥ 3 ✓)
--
--   Session C1 comment on item 007: "Скарата беше страхотна! Ще ви препоръчаме!"
--                              → COMMENT OF THE WEEK
-- ============================================================================
INSERT INTO public.feedback_ratings (id, session_id, menu_item_id, rating, comment)
VALUES

  -- ── session 001 (Чинар, 3 days ago) — ratings updated to 1–5 scale ──────
  (
    '60000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',  -- Шопска салата
    5,
    'Свежа и добре овкусена.'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',  -- Кебапче
    5,
    'Точно така трябва да е.'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',  -- Пържени картофи
    3,
    'Малко по-солени.'
  ),

  -- ── session C1 (Чинар, 6 days ago) — COMMENT OF THE WEEK on скарата ─────
  (
    '60000000-0000-4000-8000-000000000007',
    '50000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    5,
    'Скарата беше страхотна! Ще ви препоръчаме на всички приятели!'
  ),
  (
    '60000000-0000-4000-8000-000000000008',
    '50000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',  -- Шопска салата
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000009',
    '50000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    2,
    'Малко безвкусен за мен.'
  ),

  -- ── session C2 (Чинар, 5 days ago) ──────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000010',
    '50000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    5,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000011',
    '50000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000012',
    '50000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000009',  -- Домашна баница
    4,
    NULL
  ),

  -- ── session C3 (Чинар, 4 days ago) ──────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000013',
    '50000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    5,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000014',
    '50000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000002',  -- Кебапче
    5,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000015',
    '50000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    2,
    'Гювечът беше студен.'
  ),
  (
    '60000000-0000-4000-8000-000000000016',
    '50000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000009',  -- Домашна баница
    5,
    NULL
  ),

  -- ── session C4 (Чинар, 2 days ago) ──────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000017',
    '50000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000018',
    '50000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000003',  -- Пържени картофи
    3,
    'Малко по-солени от обикновено.'
  ),
  (
    '60000000-0000-4000-8000-000000000019',
    '50000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000020',
    '50000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000001',  -- Шопска салата
    5,
    NULL
  ),

  -- ── session C5 (Чинар, 1 day ago) ───────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000021',
    '50000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    5,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000022',
    '50000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000002',  -- Кебапче
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000023',
    '50000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000003',  -- Пържени картофи
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000024',
    '50000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    2,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000025',
    '50000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000001',  -- Шопска салата
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000026',
    '50000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000009',  -- Домашна баница
    4,
    NULL
  ),

  -- ── session P1 (Чинар, 13 days ago) ─────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000027',
    '50000000-0000-4000-8000-000000000008',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000028',
    '50000000-0000-4000-8000-000000000008',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000029',
    '50000000-0000-4000-8000-000000000008',
    '30000000-0000-4000-8000-000000000009',  -- Домашна баница
    3,
    NULL
  ),

  -- ── session P2 (Чинар, 12 days ago) ─────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000030',
    '50000000-0000-4000-8000-000000000009',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000031',
    '50000000-0000-4000-8000-000000000009',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    5,
    'Вкусен гювеч, доста сочен.'
  ),
  (
    '60000000-0000-4000-8000-000000000032',
    '50000000-0000-4000-8000-000000000009',
    '30000000-0000-4000-8000-000000000001',  -- Шопска салата
    5,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000033',
    '50000000-0000-4000-8000-000000000009',
    '30000000-0000-4000-8000-000000000010',  -- Бира Загорка
    4,
    NULL
  ),

  -- ── session P3 (Чинар, 10 days ago) ─────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000034',
    '50000000-0000-4000-8000-000000000010',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000035',
    '50000000-0000-4000-8000-000000000010',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000036',
    '50000000-0000-4000-8000-000000000010',
    '30000000-0000-4000-8000-000000000009',  -- Домашна баница
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000037',
    '50000000-0000-4000-8000-000000000010',
    '30000000-0000-4000-8000-000000000002',  -- Кебапче
    4,
    NULL
  ),

  -- ── session P4 (Чинар, 8 days ago) ──────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000038',
    '50000000-0000-4000-8000-000000000011',
    '30000000-0000-4000-8000-000000000009',  -- Домашна баница
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000039',
    '50000000-0000-4000-8000-000000000011',
    '30000000-0000-4000-8000-000000000001',  -- Шопска салата
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000040',
    '50000000-0000-4000-8000-000000000011',
    '30000000-0000-4000-8000-000000000002',  -- Кебапче
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000041',
    '50000000-0000-4000-8000-000000000011',
    '30000000-0000-4000-8000-000000000003',  -- Пържени картофи
    4,
    NULL
  ),

  -- ── session OLD1 (Чинар, 20 days ago) ───────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000053',
    '50000000-0000-4000-8000-000000000018',
    '30000000-0000-4000-8000-000000000007',  -- Мешана скара
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000054',
    '50000000-0000-4000-8000-000000000018',
    '30000000-0000-4000-8000-000000000001',  -- Шопска салата
    5,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000055',
    '50000000-0000-4000-8000-000000000018',
    '30000000-0000-4000-8000-000000000002',  -- Кебапче
    4,
    NULL
  ),

  -- ── session OLD2 (Чинар, 25 days ago) ───────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000056',
    '50000000-0000-4000-8000-000000000019',
    '30000000-0000-4000-8000-000000000008',  -- Гювеч с кълцано
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000057',
    '50000000-0000-4000-8000-000000000019',
    '30000000-0000-4000-8000-000000000009',  -- Домашна баница
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000058',
    '50000000-0000-4000-8000-000000000019',
    '30000000-0000-4000-8000-000000000003',  -- Пържени картофи
    4,
    NULL
  ),

  -- ── session 002 (Лозата, now 10 days ago) — ratings updated to 1–5 ──────
  (
    '60000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000004',  -- Таратор
    4,
    'Освежаващ.'
  ),
  (
    '60000000-0000-4000-8000-000000000005',
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000005',  -- Свински врат
    2,
    'Вкусно, но не беше достатъчно топло.'
  ),
  (
    '60000000-0000-4000-8000-000000000006',
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000006',  -- Домашна лимонада
    5,
    'Супер за лятото.'
  ),

  -- ── session BL2 (Лозата, 9 days ago) ────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000042',
    '50000000-0000-4000-8000-000000000012',
    '30000000-0000-4000-8000-000000000004',  -- Таратор
    5,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000043',
    '50000000-0000-4000-8000-000000000012',
    '30000000-0000-4000-8000-000000000005',  -- Свински врат
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000044',
    '50000000-0000-4000-8000-000000000012',
    '30000000-0000-4000-8000-000000000006',  -- Домашна лимонада
    4,
    NULL
  ),

  -- ── session BL3 (Лозата, 8 days ago) ────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000045',
    '50000000-0000-4000-8000-000000000013',
    '30000000-0000-4000-8000-000000000004',  -- Таратор
    3,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000046',
    '50000000-0000-4000-8000-000000000013',
    '30000000-0000-4000-8000-000000000005',  -- Свински врат
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000047',
    '50000000-0000-4000-8000-000000000013',
    '30000000-0000-4000-8000-000000000006',  -- Домашна лимонада
    5,
    NULL
  ),

  -- ── session FK1 (Нова, 3 days ago) ──────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000048',
    '50000000-0000-4000-8000-000000000014',
    '30000000-0000-4000-8000-000000000012',  -- Капучино
    5,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000049',
    '50000000-0000-4000-8000-000000000014',
    '30000000-0000-4000-8000-000000000013',  -- Баница с кашкавал
    4,
    NULL
  ),

  -- ── session FK2 (Нова, 2 days ago) ──────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000050',
    '50000000-0000-4000-8000-000000000015',
    '30000000-0000-4000-8000-000000000014',  -- Тост с шунка
    4,
    NULL
  ),
  (
    '60000000-0000-4000-8000-000000000051',
    '50000000-0000-4000-8000-000000000015',
    '30000000-0000-4000-8000-000000000012',  -- Капучино
    4,
    NULL
  ),

  -- ── session FK3 (Нова, 1 day ago) ───────────────────────────────────────
  (
    '60000000-0000-4000-8000-000000000052',
    '50000000-0000-4000-8000-000000000016',
    '30000000-0000-4000-8000-000000000013',  -- Баница с кашкавал
    5,
    NULL
  )

ON CONFLICT (id) DO UPDATE
SET
  session_id   = EXCLUDED.session_id,
  menu_item_id = EXCLUDED.menu_item_id,
  rating       = EXCLUDED.rating,
  comment      = EXCLUDED.comment;

-- ============================================================================
-- usage_counters
-- Approximate monthly totals — used for tier/quota UI, not insights logic.
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
    TO_CHAR(NOW(), 'YYYY-MM'),
    11,   -- sessions in current month (approx: 001 + C1–C5 + P1–P4 + OLD1–OLD2)
    3     -- sessions with receipt scan
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    TO_CHAR(NOW(), 'YYYY-MM'),
    3,    -- 3 sessions all in previous window
    1     -- one receipt scan (session 002)
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    TO_CHAR(NOW(), 'YYYY-MM'),
    3,    -- 3 first-signal sessions
    0
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    TO_CHAR(NOW(), 'YYYY-MM'),
    0,
    0
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    TO_CHAR(NOW(), 'YYYY-MM'),
    0,
    0
  )
ON CONFLICT (restaurant_id, period) DO UPDATE
SET
  feedback_count      = EXCLUDED.feedback_count,
  receipt_scans_count = EXCLUDED.receipt_scans_count;
