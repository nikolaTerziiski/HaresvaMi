-- HaresvaMi — development seed data.
-- Run manually after migrations + after creating at least one auth.users row.
-- Replace the owner_id placeholder below with a real auth.users.id.

-- INSERT INTO restaurants (owner_id, name, slug, city, language_default)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Механа Тестова', 'mehana-testova', 'Пловдив', 'bg');

-- INSERT INTO menu_items (restaurant_id, name_bg, name_en, category, price)
-- SELECT id, 'Кебапче', 'Kebapche', 'Основни', 2.50 FROM restaurants WHERE slug = 'mehana-testova';
