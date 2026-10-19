-- =====================================================================
-- CraveDash Expanded Food Catalog Seed Script
-- San Carlos City, Negros Occidental, Philippines
--
-- Safe to re-run:
--  - Creates tables IF NOT EXISTS so it never fails on fresh databases.
--  - Does NOT delete existing orders, customer data, or profiles.
--  - Uses ON CONFLICT and WHERE NOT EXISTS to prevent duplicates.
--  - Adds 12 diverse food categories and 36 products across San Carlos City restaurants.
-- =====================================================================

-- 0. Ensure base tables and sequence exist
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.food_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  emoji text,
  address text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  rating numeric(2,1) not null default 4.5 check (rating between 0 and 5),
  delivery_time_min int not null default 30 check (delivery_time_min > 0),
  is_open boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.food_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(8,2) not null check (price >= 0),
  image_url text,
  emoji text,
  is_available boolean not null default true,
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  avatar_url text,
  vehicle_type text not null default 'Motorbike',
  rating numeric(2,1) not null default 4.5 check (rating between 0 and 5),
  completed_deliveries int not null default 0 check (completed_deliveries >= 0),
  base_fee numeric(6,2) not null default 40.00 check (base_fee >= 0),
  eta_minutes int not null default 30 check (eta_minutes > 0),
  is_available boolean not null default true,
  last_lat double precision check (last_lat between -90 and 90),
  last_lng double precision check (last_lng between -180 and 180),
  last_location_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare
  -- Categories
  c_burg uuid; c_pizz uuid; c_chick uuid; c_fil uuid; c_rice uuid; c_silog uuid;
  c_nood uuid; c_snack uuid; c_dess uuid; c_milk uuid; c_coff uuid; c_combo uuid;

  -- Restaurants
  r_smoke uuid; r_forn uuid; r_kusina uuid; r_silog uuid; r_nood uuid; r_tea uuid;
begin

  -- 1. Insert / Upsert 12 Categories
  insert into public.food_categories (name, emoji, sort_order) values
    ('Burgers & Sandwiches', '🍔', 1),
    ('Pizza & Pasta', '🍕', 2),
    ('Fried Chicken', '🍗', 3),
    ('Filipino Dishes', '🍲', 4),
    ('Rice Meals', '🍚', 5),
    ('Silog Meals', '🍳', 6),
    ('Noodles', '🍜', 7),
    ('Snacks & Street Food', '🍢', 8),
    ('Desserts', '🍰', 9),
    ('Milk Tea & Beverages', '🧋', 10),
    ('Coffee', '☕', 11),
    ('Budget & Combo Meals', '🍱', 12)
  on conflict (name) do update set emoji = excluded.emoji, sort_order = excluded.sort_order;

  -- Retrieve category IDs
  select id into c_burg  from public.food_categories where name = 'Burgers & Sandwiches';
  select id into c_pizz  from public.food_categories where name = 'Pizza & Pasta';
  select id into c_chick from public.food_categories where name = 'Fried Chicken';
  select id into c_fil   from public.food_categories where name = 'Filipino Dishes';
  select id into c_rice  from public.food_categories where name = 'Rice Meals';
  select id into c_silog from public.food_categories where name = 'Silog Meals';
  select id into c_nood  from public.food_categories where name = 'Noodles';
  select id into c_snack from public.food_categories where name = 'Snacks & Street Food';
  select id into c_dess  from public.food_categories where name = 'Desserts';
  select id into c_milk  from public.food_categories where name = 'Milk Tea & Beverages';
  select id into c_coff  from public.food_categories where name = 'Coffee';
  select id into c_combo from public.food_categories where name = 'Budget & Combo Meals';

  -- 2. Insert or update San Carlos City Restaurants
  -- Smokehouse Burgers
  select id into r_smoke from public.restaurants where name = 'Smokehouse Burgers & Ribs' or name = 'Smokehouse Burgers' limit 1;
  if r_smoke is null then
    insert into public.restaurants (name, description, emoji, image_url, address, latitude, longitude, rating, delivery_time_min, is_featured, is_open)
    values ('Smokehouse Burgers & Ribs', 'Flame-grilled Angus burgers, smoky ribs, and loaded sides', '🍔', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600', 'Barangay I, San Carlos City, Negros Occidental', 10.4939, 123.4273, 4.8, 25, true, true)
    returning id into r_smoke;
  else
    update public.restaurants set name = 'Smokehouse Burgers & Ribs', latitude = 10.4939, longitude = 123.4273, address = 'Barangay I, San Carlos City, Negros Occidental', image_url = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600' where id = r_smoke;
  end if;

  -- Fornace Pizzeria
  select id into r_forn from public.restaurants where name = 'Fornace Pizzeria & Pasta' or name = 'Fornace Pizzeria' limit 1;
  if r_forn is null then
    insert into public.restaurants (name, description, emoji, image_url, address, latitude, longitude, rating, delivery_time_min, is_featured, is_open)
    values ('Fornace Pizzeria & Pasta', 'Wood-fired sourdough pizza and artisanal Italian pasta', '🍕', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', 'Barangay III, San Carlos City, Negros Occidental', 10.4844, 123.4236, 4.7, 30, true, true)
    returning id into r_forn;
  else
    update public.restaurants set name = 'Fornace Pizzeria & Pasta', latitude = 10.4844, longitude = 123.4236, address = 'Barangay III, San Carlos City, Negros Occidental', image_url = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600' where id = r_forn;
  end if;

  -- Kusina Negrense
  select id into r_kusina from public.restaurants where name = 'Kusina Negrense & Inasal' limit 1;
  if r_kusina is null then
    insert into public.restaurants (name, description, emoji, image_url, address, latitude, longitude, rating, delivery_time_min, is_featured, is_open)
    values ('Kusina Negrense & Inasal', 'Authentic Bacolod-style chicken inasal, sizzling sisig, and classic Filipino dishes', '🍗', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600', 'Barangay II, San Carlos City, Negros Occidental', 10.4862, 123.4208, 4.9, 20, true, true)
    returning id into r_kusina;
  end if;

  -- Silog & Rice Hub
  select id into r_silog from public.restaurants where name = 'San Carlos Silog & Rice Hub' limit 1;
  if r_silog is null then
    insert into public.restaurants (name, description, emoji, image_url, address, latitude, longitude, rating, delivery_time_min, is_featured, is_open)
    values ('San Carlos Silog & Rice Hub', 'All-day hearty silog meals, beef pares, and budget rice toppings', '🍳', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600', 'Public Market Area, San Carlos City, Negros Occidental', 10.4851, 123.4220, 4.6, 20, false, true)
    returning id into r_silog;
  end if;

  -- Wok & Noodle House
  select id into r_nood from public.restaurants where name = 'Wok & Noodle House' limit 1;
  if r_nood is null then
    insert into public.restaurants (name, description, emoji, image_url, address, latitude, longitude, rating, delivery_time_min, is_featured, is_open)
    values ('Wok & Noodle House', 'Traditional Pancit Canton, Bihon, Batchoy, and stir-fried Asian noodles', '🍜', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', 'Ylagan Street, San Carlos City, Negros Occidental', 10.4837, 123.4185, 4.7, 25, false, true)
    returning id into r_nood;
  end if;

  -- Boba Bliss & Coffee Cafe
  select id into r_tea from public.restaurants where name = 'Boba Bliss & Coffee Cafe' limit 1;
  if r_tea is null then
    insert into public.restaurants (name, description, emoji, image_url, address, latitude, longitude, rating, delivery_time_min, is_featured, is_open)
    values ('Boba Bliss & Coffee Cafe', 'Brown sugar pearl milk tea, specialty espresso coffee, and decadent pastries', '🧋', 'https://images.unsplash.com/photo-1558857563-b37cfb8b7245?w=600', 'Rizal Boulevard, San Carlos City, Negros Occidental', 10.4829, 123.4215, 4.9, 15, true, true)
    returning id into r_tea;
  end if;

  -- Ensure riders exist for delivery testing
  insert into public.riders (full_name, phone, vehicle_type, rating, completed_deliveries, base_fee, eta_minutes, is_available)
  select 'Amir Khan', '0917-555-0192', 'Motorbike', 4.9, 312, 45.00, 20, true
  where not exists (select 1 from public.riders where full_name = 'Amir Khan');

  insert into public.riders (full_name, phone, vehicle_type, rating, completed_deliveries, base_fee, eta_minutes, is_available)
  select 'Lena Ortiz', '0928-555-0144', 'Bicycle', 4.8, 188, 30.00, 28, true
  where not exists (select 1 from public.riders where full_name = 'Lena Ortiz');

  insert into public.riders (full_name, phone, vehicle_type, rating, completed_deliveries, base_fee, eta_minutes, is_available)
  select 'Marcus Bell', '0939-555-0188', 'Scooter', 4.7, 251, 40.00, 24, true
  where not exists (select 1 from public.riders where full_name = 'Marcus Bell');

  update public.riders set phone = '0917-555-0192' where full_name = 'Amir Khan' and phone is null;
  update public.riders set phone = '0928-555-0144' where full_name = 'Lena Ortiz' and phone is null;
  update public.riders set phone = '0939-555-0188' where full_name = 'Marcus Bell' and phone is null;

  -- 3. Insert 36 diverse menu items if not already existing
  -- 1. Burgers & Sandwiches
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_smoke, c_burg, 'Classic Flame-Grilled Cheeseburger', '100% pure beef patty seared on fire, melted sharp cheddar cheese, lettuce, tomatoes, and secret Crave house burger sauce on toasted brioche.', 139.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', '🍔', true, true
  where not exists (select 1 from public.menu_items where name = 'Classic Flame-Grilled Cheeseburger' and restaurant_id = r_smoke);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_smoke, c_burg, 'Smoky Bacon & Mushroom Burger', 'Double Angus beef patties, thick smoked honey bacon, sautéed butter mushrooms, caramelized sweet onions, and hickory BBQ drizzle.', 199.00, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600', '🍔', true, true
  where not exists (select 1 from public.menu_items where name = 'Smoky Bacon & Mushroom Burger' and restaurant_id = r_smoke);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_smoke, c_burg, 'Crispy Chicken Katsu Sandwich', 'Golden panko breaded chicken breast fillet, crunchy Japanese slaw, kewpie mayo, and sweet katsu glaze on soft milk bread.', 155.00, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600', '🥪', true, false
  where not exists (select 1 from public.menu_items where name = 'Crispy Chicken Katsu Sandwich' and restaurant_id = r_smoke);

  -- 2. Pizza & Pasta
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_forn, c_pizz, 'Classic Margherita Wood-Fired Pizza', 'Hand-stretched sourdough crust baked in Italian wood oven, fresh San Marzano tomato sauce, mozzarella fior di latte, and fresh sweet basil leaves.', 299.00, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600', '🍕', true, true
  where not exists (select 1 from public.menu_items where name = 'Classic Margherita Wood-Fired Pizza' and restaurant_id = r_forn);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_forn, c_pizz, 'Overloaded Pepperoni & Hot Honey Pizza', 'Loaded with double layers of crisp pepperoni slices, melted stretchy mozzarella, and a light drizzle of chili-infused wildflower honey.', 360.00, 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600', '🍕', true, true
  where not exists (select 1 from public.menu_items where name = 'Overloaded Pepperoni & Hot Honey Pizza' and restaurant_id = r_forn);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_forn, c_pizz, 'Creamy Truffle Carbonara Pasta', 'Al dente fettuccine tossed in rich parmesan egg yolk sauce, crispy bacon bits, cracked black pepper, and white truffle oil perfume.', 245.00, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600', '🍝', true, false
  where not exists (select 1 from public.menu_items where name = 'Creamy Truffle Carbonara Pasta' and restaurant_id = r_forn);

  -- 3. Fried Chicken
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_kusina, c_chick, 'Crispy Negrense Fried Chicken (6 pcs)', 'Golden-fried whole chicken cuts marinated in local spices, garlic, calamansi, and annatto oil. Super crispy skin and juicy tender meat with house gravy.', 349.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600', '🍗', true, true
  where not exists (select 1 from public.menu_items where name = 'Crispy Negrense Fried Chicken (6 pcs)' and restaurant_id = r_kusina);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_kusina, c_chick, 'Garlic Parmesan Crispy Wings', '6 pieces of golden chicken wings glazed with roasted garlic butter, showered with shredded aged parmesan cheese and fresh chopped parsley.', 220.00, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600', '🍗', true, true
  where not exists (select 1 from public.menu_items where name = 'Garlic Parmesan Crispy Wings' and restaurant_id = r_kusina);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_smoke, c_chick, 'Spicy Honey-Glazed Chicken Tenders', 'Crispy white meat chicken tenders tossed in sweet & spicy habanero honey glaze, served with a side of cool buttermilk ranch dipping sauce.', 185.00, 'https://images.unsplash.com/photo-1527477321055-43615862e771?w=600', '🍗', true, false
  where not exists (select 1 from public.menu_items where name = 'Spicy Honey-Glazed Chicken Tenders' and restaurant_id = r_smoke);

  -- 4. Filipino Dishes
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_kusina, c_fil, 'Authentic Bacolod Chicken Inasal (Pecho)', 'Charcoal-grilled chicken breast and wing skewered and basted with sinamak vinegar, ginger, lemongrass, garlic, and golden annatto chicken oil.', 165.00, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600', '🍗', true, true
  where not exists (select 1 from public.menu_items where name = 'Authentic Bacolod Chicken Inasal (Pecho)' and restaurant_id = r_kusina);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_kusina, c_fil, 'Sizzling Pork Sisig with Fresh Egg', 'Finely chopped crispy pork cheeks and ears, seasoned with onions, chilies, and liver spread, served sizzling with fresh egg and calamansi.', 195.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', '🥘', true, true
  where not exists (select 1 from public.menu_items where name = 'Sizzling Pork Sisig with Fresh Egg' and restaurant_id = r_kusina);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_kusina, c_fil, 'Pork Sinigang sa Sampalok', 'Tender pork belly simmered in sour tamarind broth loaded with kangkong leaves, radish, eggplant, okra, and green long chili.', 240.00, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600', '🍲', true, false
  where not exists (select 1 from public.menu_items where name = 'Pork Sinigang sa Sampalok' and restaurant_id = r_kusina);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_kusina, c_fil, 'Crispy Pork Belly Lechon Kawali', 'Deep-fried pork belly boiled until tender and flash-fried to blistering crispy skin perfection. Served with authentic spiced liver gravy.', 260.00, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600', '🥓', true, true
  where not exists (select 1 from public.menu_items where name = 'Crispy Pork Belly Lechon Kawali' and restaurant_id = r_kusina);

  -- 5. Rice Meals
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_silog, c_rice, 'Slow-Braised Beef Pares with Garlic Rice', 'Tender chunks of beef brisket simmered in sweet-savory star anise broth, served with fried garlic rice, chili oil, and hot beef soup.', 145.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600', '🍚', true, true
  where not exists (select 1 from public.menu_items where name = 'Slow-Braised Beef Pares with Garlic Rice' and restaurant_id = r_silog);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_silog, c_rice, 'Sweet & Savory Pork BBQ Rice Plate', 'Two large skewers of charcoal-grilled caramelized pork barbecue served with garlic sinangag rice, pickled atchara, and spiced vinegar dip.', 135.00, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600', '🍢', true, false
  where not exists (select 1 from public.menu_items where name = 'Sweet & Savory Pork BBQ Rice Plate' and restaurant_id = r_silog);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_smoke, c_rice, 'Roast Beef & Mushroom Gravy Rice Bowl', 'Tender sliced roasted beef smothered in rich brown mushroom gravy, served atop hot steamed jasmine rice and buttered sweet corn.', 175.00, 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600', '🥩', true, false
  where not exists (select 1 from public.menu_items where name = 'Roast Beef & Mushroom Gravy Rice Bowl' and restaurant_id = r_smoke);

  -- 6. Silog Meals
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_silog, c_silog, 'Tapsilog Special King', 'Tender cured marinated beef tapa strips seared to perfection, paired with toasted garlic rice (sinangag), sunny-side-up egg (itlog), and atchara.', 140.00, 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600', '🍳', true, true
  where not exists (select 1 from public.menu_items where name = 'Tapsilog Special King' and restaurant_id = r_silog);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_silog, c_silog, 'Tocilog Sweet Cured Pork Plate', 'Sweet caramelized pork tocino glazed in its own pan juices, served with golden garlic sinangag rice, fried egg, and sliced fresh tomatoes.', 125.00, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600', '🍳', true, true
  where not exists (select 1 from public.menu_items where name = 'Tocilog Sweet Cured Pork Plate' and restaurant_id = r_silog);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_silog, c_silog, 'Bangsilog (Crispy Daing na Bangus)', 'Half deboned milkfish marinated in vinegar, crushed garlic, and black pepper, fried until crispy golden. Served with garlic rice and fried egg.', 150.00, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', '🐟', true, false
  where not exists (select 1 from public.menu_items where name = 'Bangsilog (Crispy Daing na Bangus)' and restaurant_id = r_silog);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_silog, c_silog, 'Longsilog (Sweet Lucban Longganisa)', 'Three sweet and garlicky Filipino pork sausages cooked until caramelized, accompanied by garlic fried rice, sunny egg, and pickled cucumber.', 120.00, 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600', '🍳', true, false
  where not exists (select 1 from public.menu_items where name = 'Longsilog (Sweet Lucban Longganisa)' and restaurant_id = r_silog);

  -- 7. Noodles
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_nood, c_nood, 'Pancit Canton Especial Fiesta Platter', 'Stir-fried thick egg noodles packed with pork slices, chicken liver, plump shrimp, cabbage, carrots, snow peas, and calamansi wedges on the side.', 185.00, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', '🍜', true, true
  where not exists (select 1 from public.menu_items where name = 'Pancit Canton Especial Fiesta Platter' and restaurant_id = r_nood);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_nood, c_nood, 'Authentic Beef La Paz Batchoy', 'Rich slow-simmered beef & pork marrow bone broth with round egg noodles, tender beef slices, crispy chicharon bits, toasted garlic, and fresh egg.', 155.00, 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600', '🍜', true, true
  where not exists (select 1 from public.menu_items where name = 'Authentic Beef La Paz Batchoy' and restaurant_id = r_nood);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_nood, c_nood, 'Pancit Bihon Guisado', 'Light and savory rice vermicelli noodles sautéed with shredded chicken, crunchy vegetables, wood ear mushrooms, and fragrant sesame soy sauce.', 165.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600', '🍜', true, false
  where not exists (select 1 from public.menu_items where name = 'Pancit Bihon Guisado' and restaurant_id = r_nood);

  -- 8. Snacks & Street Food
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_nood, c_snack, 'Pinoy Street Food Platter (Kwek-Kwek & Fishballs)', 'Crispy orange-battered quail eggs (kwek-kwek), golden fishballs, and kikiam skewers served with sweet brown sauce and spicy vinegar dip.', 110.00, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600', '🍢', true, true
  where not exists (select 1 from public.menu_items where name = 'Pinoy Street Food Platter (Kwek-Kwek & Fishballs)' and restaurant_id = r_nood);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_smoke, c_snack, 'Loaded Chili Cheese Nachos', 'Crispy stone-ground corn tortilla chips piled with savory minced beef chili, melted cheddar cheese sauce, jalapeno slices, and sour cream.', 175.00, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600', '🧀', true, false
  where not exists (select 1 from public.menu_items where name = 'Loaded Chili Cheese Nachos' and restaurant_id = r_smoke);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_kusina, c_snack, 'Crispy Lumpiang Shanghai (10 pcs)', 'Golden fried spring rolls stuffed with seasoned ground pork, carrots, minced onions, and herbs, served with sweet chili dipping sauce.', 130.00, 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600', '🥢', true, true
  where not exists (select 1 from public.menu_items where name = 'Crispy Lumpiang Shanghai (10 pcs)' and restaurant_id = r_kusina);

  -- 9. Desserts
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_dess, 'Special Halo-Halo Overload with Leche Flan', 'Shaved ice infused with evaporated milk, layered with sweet beans, nata de coco, kaong, ube halaya, toasted pinipig, and a slice of creamy leche flan.', 135.00, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', '🍧', true, true
  where not exists (select 1 from public.menu_items where name = 'Special Halo-Halo Overload with Leche Flan' and restaurant_id = r_tea);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_dess, 'Warm Belgian Chocolate Lava Cake', 'Rich dark chocolate cake with an oozy warm molten center, lightly dusted with confectioners sugar and served with vanilla gelato.', 165.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600', '🍰', true, false
  where not exists (select 1 from public.menu_items where name = 'Warm Belgian Chocolate Lava Cake' and restaurant_id = r_tea);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_dess, 'Classic Ube Leche Flan Slice', 'Velvety smooth Filipino caramel custard with caramelized amber sugar syrup, layered over rich purple yam ube fudge cake.', 110.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600', '🍮', true, true
  where not exists (select 1 from public.menu_items where name = 'Classic Ube Leche Flan Slice' and restaurant_id = r_tea);

  -- 10. Milk Tea & Beverages
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_milk, 'Brown Sugar Tiger Pearl Milk Tea', 'Warm brown sugar chewy tapioca boba pearls coated around fresh whole milk and slow-brewed black Assam tea, topped with cream foam.', 120.00, 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600', '🧋', true, true
  where not exists (select 1 from public.menu_items where name = 'Brown Sugar Tiger Pearl Milk Tea' and restaurant_id = r_tea);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_milk, 'Okinawa Roasted Milk Tea with Pudding', 'Distinct roasted brown sugar aroma blended with creamy black tea and silky egg pudding custard cubes on ice.', 115.00, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600', '🧋', true, false
  where not exists (select 1 from public.menu_items where name = 'Okinawa Roasted Milk Tea with Pudding' and restaurant_id = r_tea);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_milk, 'Fresh Mango Fruit Shake with Chia', 'Blended fresh Philippine sweet Carabao mango chunks, crushed ice, milk, and healthy chia seeds. 100% real fruit, no artificial syrups.', 125.00, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600', '🥭', true, true
  where not exists (select 1 from public.menu_items where name = 'Fresh Mango Fruit Shake with Chia' and restaurant_id = r_tea);

  -- 11. Coffee
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_coff, 'Iced Spanish Vanilla Latte', 'Double shot of locally roasted Arabica espresso shaken with sweet condensed milk, fresh whole milk, and Madagascar vanilla bean over ice.', 130.00, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600', '☕', true, true
  where not exists (select 1 from public.menu_items where name = 'Iced Spanish Vanilla Latte' and restaurant_id = r_tea);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_coff, 'Caramel Macchiato Cloud', 'Steamed velvety milk marked with dark espresso shots and finished with buttery golden salted caramel drizzle.', 140.00, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', '☕', true, false
  where not exists (select 1 from public.menu_items where name = 'Caramel Macchiato Cloud' and restaurant_id = r_tea);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_tea, c_coff, 'Vietnamese Condensed Milk Cold Brew', 'Slow-steeped dark roast coffee poured over sweet condensed milk and crushed ice for a rich, bold morning kick.', 135.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600', '☕', true, true
  where not exists (select 1 from public.menu_items where name = 'Vietnamese Condensed Milk Cold Brew' and restaurant_id = r_tea);

  -- 12. Budget & Combos
  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_kusina, c_combo, 'Student Budget Chicken Inasal + Rice + Drink Combo', '1 pc Chicken Inasal with unlimited garlic chicken oil rice and a refreshing cold iced tea. Specially priced for students and value seekers.', 129.00, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600', '🍱', true, true
  where not exists (select 1 from public.menu_items where name = 'Student Budget Chicken Inasal + Rice + Drink Combo' and restaurant_id = r_kusina);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_smoke, c_combo, 'Barkada Burger, Wings & Fries Combo Feast', '2 Classic Cheeseburgers, 6 pcs Garlic Parmesan Wings, large loaded seasoned fries, and 2 drinks. Perfect for sharing with friends.', 499.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600', '🍱', true, true
  where not exists (select 1 from public.menu_items where name = 'Barkada Burger, Wings & Fries Combo Feast' and restaurant_id = r_smoke);

  insert into public.menu_items (restaurant_id, category_id, name, description, price, image_url, emoji, is_available, is_popular)
  select r_smoke, c_combo, 'Double Burger & Fries Duo', '2 Classic Flame-Grilled Cheeseburgers with two orders of crispy fries and iced drinks.', 299.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600', '🍱', true, false
  where not exists (select 1 from public.menu_items where name = 'Double Burger & Fries Duo' and restaurant_id = r_smoke);

end $$;
