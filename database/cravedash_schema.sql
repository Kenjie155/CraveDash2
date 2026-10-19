-- =====================================================================
-- CraveDash schema for Supabase PostgreSQL
-- Paste into Supabase > SQL Editor > New query > Run.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- Nothing here deletes existing data.
-- =====================================================================

-- ---------- 1. Helper functions ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- 2. Tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles are granted ONLY from the SQL Editor / service role. Clients can never write here.
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','rider')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  address_line text not null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses(user_id);

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

create table if not exists public.food_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text,
  sort_order int not null default 0,
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
create index if not exists menu_items_restaurant_idx on public.menu_items(restaurant_id);
create index if not exists menu_items_category_idx on public.menu_items(category_id);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,   -- optional: lets a rider log in later
  full_name text not null,
  phone text,
  avatar_url text,
  vehicle_type text not null default 'Motorbike',
  rating numeric(2,1) not null default 4.5 check (rating between 0 and 5),
  completed_deliveries int not null default 0 check (completed_deliveries >= 0),
  base_fee numeric(6,2) not null default 40.00 check (base_fee >= 0),
  eta_minutes int not null default 30 check (eta_minutes > 0),
  is_available boolean not null default true,
  -- Last RECORDED position (entered by an admin). Not live tracking.
  last_lat double precision check (last_lat between -90 and 90),
  last_lng double precision check (last_lng between -180 and 180),
  last_location_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null unique default nextval('public.order_number_seq'),
  customer_id uuid not null references public.profiles(id),
  restaurant_id uuid not null references public.restaurants(id),
  rider_id uuid references public.riders(id) on delete set null,
  status text not null default 'placed' check (status in
    ('placed','confirmed','preparing','ready_for_pickup','picked_up','out_for_delivery','delivered','cancelled')),
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  delivery_fee numeric(8,2) not null default 0 check (delivery_fee >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  delivery_address text not null,
  delivery_lat double precision check (delivery_lat between -90 and 90),
  delivery_lng double precision check (delivery_lng between -180 and 180),
  contact_name text not null,
  contact_phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders(customer_id, created_at desc);
create index if not exists orders_rider_idx on public.orders(rider_id);
create index if not exists orders_status_idx on public.orders(status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  unit_price numeric(8,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null check (line_total >= 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history(order_id, created_at);

-- Admin-entered position snapshots (history). Latest one is copied onto riders.last_*.
create table if not exists public.rider_locations (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  recorded_at timestamptz not null default now()
);
create index if not exists rider_locations_rider_idx on public.rider_locations(rider_id, recorded_at desc);

-- COD payment record, one per order.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  method text not null default 'cod' check (method in ('cod')),
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'unpaid' check (status in ('unpaid','paid')),
  collected_at timestamptz,
  collected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['profiles','customer_addresses','restaurants','food_categories',
    'menu_items','riders','orders','payments'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- 3. Security helpers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;

-- Profile is created by a trigger. Role is NEVER taken from sign-up data.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          nullif(new.raw_user_meta_data->>'phone', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Back-fill profiles for users that signed up before this script ran.
insert into public.profiles (id, full_name, phone)
select u.id, coalesce(u.raw_user_meta_data->>'full_name',''), nullif(u.raw_user_meta_data->>'phone','')
from auth.users u on conflict (id) do nothing;

create or replace function public.is_valid_transition(old_s text, new_s text) returns boolean
language sql immutable as $$
  select case old_s
    when 'placed'           then new_s in ('confirmed','cancelled')
    when 'confirmed'        then new_s in ('preparing','cancelled')
    when 'preparing'        then new_s in ('ready_for_pickup','cancelled')
    when 'ready_for_pickup' then new_s = 'picked_up'
    when 'picked_up'        then new_s = 'out_for_delivery'
    when 'out_for_delivery' then new_s = 'delivered'
    else false end;
$$;

-- Keep riders.last_* in sync with the newest rider_locations row.
create or replace function public.sync_rider_last_location() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.riders set last_lat = new.latitude, last_lng = new.longitude,
         last_location_at = new.recorded_at where id = new.rider_id;
  return new;
end $$;
drop trigger if exists sync_rider_location on public.rider_locations;
create trigger sync_rider_location after insert on public.rider_locations
  for each row execute function public.sync_rider_last_location();

-- ---------- 4. Sensitive operations (RPC) ----------
-- Customers place orders ONLY through this function. Prices, fee and total are computed here.
create or replace function public.place_order(
  p_restaurant_id uuid, p_items jsonb, p_rider_id uuid, p_address text,
  p_lat double precision, p_lng double precision, p_name text, p_phone text, p_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_rest public.restaurants%rowtype;
  v_rider public.riders%rowtype;
  v_menu public.menu_items%rowtype;
  v_line record;
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_active int;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty'; end if;
  if coalesce(trim(p_address),'') = '' or coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' then
    raise exception 'Name, phone and delivery address are required'; end if;

  select * into v_rest from public.restaurants where id = p_restaurant_id;
  if not found or not v_rest.is_open then raise exception 'This restaurant is not accepting orders'; end if;

  -- Lock the rider row so two customers cannot grab the same rider at once.
  select * into v_rider from public.riders where id = p_rider_id for update;
  if not found or not v_rider.is_available then raise exception 'That rider is not available'; end if;
  select count(*) into v_active from public.orders
   where rider_id = p_rider_id and status not in ('delivered','cancelled');
  if v_active >= 2 then raise exception 'That rider is busy. Please choose another.'; end if;

  insert into public.orders (customer_id, restaurant_id, rider_id, delivery_address, delivery_lat,
                             delivery_lng, contact_name, contact_phone, notes)
  values (v_uid, p_restaurant_id, p_rider_id, trim(p_address), p_lat, p_lng,
          trim(p_name), trim(p_phone), nullif(trim(coalesce(p_notes,'')), ''))
  returning id into v_order_id;

  for v_line in
    select (e->>'menu_item_id')::uuid as item_id, (e->>'quantity')::int as qty
    from jsonb_array_elements(p_items) e
  loop
    if v_line.qty is null or v_line.qty < 1 or v_line.qty > 50 then raise exception 'Invalid quantity'; end if;
    select * into v_menu from public.menu_items
     where id = v_line.item_id and restaurant_id = p_restaurant_id and is_available;
    if not found then raise exception 'An item in your cart is no longer available'; end if;
    insert into public.order_items (order_id, menu_item_id, name, unit_price, quantity, line_total)
    values (v_order_id, v_menu.id, v_menu.name, v_menu.price, v_line.qty, v_menu.price * v_line.qty);
    v_subtotal := v_subtotal + v_menu.price * v_line.qty;
  end loop;

  update public.orders set subtotal = v_subtotal, delivery_fee = v_rider.base_fee,
         total = v_subtotal + v_rider.base_fee where id = v_order_id;
  insert into public.payments (order_id, method, amount, status)
  values (v_order_id, 'cod', v_subtotal + v_rider.base_fee, 'unpaid');
  insert into public.order_status_history (order_id, status, changed_by) values (v_order_id, 'placed', v_uid);
  return v_order_id;
end $$;

create or replace function public.customer_cancel_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set status = 'cancelled'
   where id = p_order_id and customer_id = auth.uid() and status = 'placed';
  if not found then raise exception 'This order can no longer be cancelled'; end if;
  insert into public.order_status_history (order_id, status, changed_by) values (p_order_id, 'cancelled', auth.uid());
end $$;

create or replace function public.admin_update_order_status(p_order_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare v_old text; v_rider uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select status, rider_id into v_old, v_rider from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if not public.is_valid_transition(v_old, p_status) then
    raise exception 'Cannot change status from % to %', v_old, p_status; end if;
  update public.orders set status = p_status where id = p_order_id;
  insert into public.order_status_history (order_id, status, changed_by) values (p_order_id, p_status, auth.uid());
  if p_status = 'delivered' and v_rider is not null then
    update public.riders set completed_deliveries = completed_deliveries + 1 where id = v_rider;
  end if;
end $$;

create or replace function public.admin_assign_rider(p_order_id uuid, p_rider_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_status text; v_rider public.riders%rowtype; v_active int;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select status into v_status from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_status in ('delivered','cancelled') then raise exception 'This order is closed'; end if;
  select * into v_rider from public.riders where id = p_rider_id for update;
  if not found or not v_rider.is_available then raise exception 'Rider is not available'; end if;
  select count(*) into v_active from public.orders
   where rider_id = p_rider_id and id <> p_order_id and status not in ('delivered','cancelled');
  if v_active >= 2 then raise exception 'Rider already has 2 active orders'; end if;
  update public.orders set rider_id = p_rider_id where id = p_order_id;
end $$;

create or replace function public.admin_set_payment_status(p_order_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('unpaid','paid') then raise exception 'Invalid payment status'; end if;
  update public.orders set payment_status = p_status where id = p_order_id;
  if not found then raise exception 'Order not found'; end if;
  update public.payments set status = p_status,
         collected_at = case when p_status = 'paid' then now() else null end,
         collected_by = case when p_status = 'paid' then auth.uid() else null end
   where order_id = p_order_id;
end $$;

-- Only signed-in users may call the RPCs.
do $$
declare f text;
begin
  foreach f in array array[
    'place_order(uuid,jsonb,uuid,text,double precision,double precision,text,text,text)',
    'customer_cancel_order(uuid)', 'admin_update_order_status(uuid,text)',
    'admin_assign_rider(uuid,uuid)', 'admin_set_payment_status(uuid,text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ---------- 5. Row Level Security ----------
alter table public.profiles             enable row level security;
alter table public.user_roles           enable row level security;
alter table public.customer_addresses   enable row level security;
alter table public.restaurants          enable row level security;
alter table public.food_categories      enable row level security;
alter table public.menu_items           enable row level security;
alter table public.favorites            enable row level security;
alter table public.riders               enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.rider_locations      enable row level security;
alter table public.payments             enable row level security;

-- Orders, items, history and payments are written only by the RPCs above.
revoke insert, update, delete on public.orders, public.order_items,
  public.order_status_history, public.payments from anon, authenticated;
revoke insert, update, delete on public.user_roles from anon, authenticated;

-- profiles
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- user_roles (read-only for clients)
drop policy if exists "roles read own or admin" on public.user_roles;
create policy "roles read own or admin" on public.user_roles for select
  using (user_id = auth.uid() or public.is_admin());

-- addresses & favorites: owner only
drop policy if exists "addresses owner" on public.customer_addresses;
create policy "addresses owner" on public.customer_addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "favorites owner" on public.favorites;
create policy "favorites owner" on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- catalog: everyone signed in can read, only admins can write
do $$
declare t text;
begin
  foreach t in array array['restaurants','food_categories','menu_items'] loop
    execute format('drop policy if exists "catalog read" on public.%I', t);
    execute format('create policy "catalog read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "catalog admin write" on public.%I', t);
    execute format('create policy "catalog admin write" on public.%I for all
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- riders: signed-in users can read (needed to choose a rider); only admins write
drop policy if exists "riders read" on public.riders;
create policy "riders read" on public.riders for select to authenticated using (true);
drop policy if exists "riders admin write" on public.riders;
create policy "riders admin write" on public.riders for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "rider_locations admin" on public.rider_locations;
create policy "rider_locations admin" on public.rider_locations for all
  using (public.is_admin()) with check (public.is_admin());

-- orders: owner, admin, or the assigned rider can read
drop policy if exists "orders read" on public.orders;
create policy "orders read" on public.orders for select using (
  customer_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.riders r where r.id = orders.rider_id and r.user_id = auth.uid()));

-- child tables: visible when the parent order is visible
drop policy if exists "order_items read" on public.order_items;
create policy "order_items read" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id));
drop policy if exists "order_history read" on public.order_status_history;
create policy "order_history read" on public.order_status_history for select
  using (exists (select 1 from public.orders o where o.id = order_status_history.order_id));
drop policy if exists "payments read" on public.payments;
create policy "payments read" on public.payments for select
  using (exists (select 1 from public.orders o where o.id = payments.order_id));

-- ---------- 6. Storage (public bucket for food / restaurant / rider images) ----------
insert into storage.buckets (id, name, public) values ('cravedash-images','cravedash-images', true)
on conflict (id) do nothing;

drop policy if exists "cravedash images public read" on storage.objects;
create policy "cravedash images public read" on storage.objects for select
  using (bucket_id = 'cravedash-images');
drop policy if exists "cravedash images admin insert" on storage.objects;
create policy "cravedash images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'cravedash-images' and public.is_admin());
drop policy if exists "cravedash images admin update" on storage.objects;
create policy "cravedash images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'cravedash-images' and public.is_admin());
drop policy if exists "cravedash images admin delete" on storage.objects;
create policy "cravedash images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cravedash-images' and public.is_admin());

-- ---------- 7. Sample data (only inserted into an empty database) ----------
do $$
declare c_burg uuid; c_pizza uuid; c_sushi uuid; c_salad uuid; c_dess uuid; c_drink uuid;
        r1 uuid; r2 uuid; r3 uuid;
begin
  if exists (select 1 from public.restaurants) then return; end if;

  insert into public.food_categories (name, emoji, sort_order) values
    ('Burgers','🍔',1),('Pizza','🍕',2),('Sushi','🍣',3),('Salads','🥗',4),('Desserts','🍰',5),('Drinks','🧋',6)
  on conflict (name) do nothing;
  select id into c_burg  from public.food_categories where name='Burgers';
  select id into c_pizza from public.food_categories where name='Pizza';
  select id into c_sushi from public.food_categories where name='Sushi';
  select id into c_salad from public.food_categories where name='Salads';
  select id into c_dess  from public.food_categories where name='Desserts';
  select id into c_drink from public.food_categories where name='Drinks';

  -- Sample coordinates are approximate points in San Carlos City, Negros Occidental (not real addresses).
  -- Edit them in the admin dashboard to match your real restaurants.
  insert into public.restaurants (name, description, emoji, address, latitude, longitude, rating, delivery_time_min, is_featured)
  values ('Smokehouse Burgers','Flame-grilled burgers and fries','🍔','Barangay I, San Carlos City',10.4939,123.4273,4.7,25,true) returning id into r1;
  insert into public.restaurants (name, description, emoji, address, latitude, longitude, rating, delivery_time_min, is_featured)
  values ('Fornace Pizzeria','Wood-fired pizza','🍕','Barangay III, San Carlos City',10.4844,123.4236,4.6,30,true) returning id into r2;
  insert into public.restaurants (name, description, emoji, address, latitude, longitude, rating, delivery_time_min)
  values ('Kaito Sushi','Fresh rolls, bowls and sweets','🍣','City center, San Carlos City',10.4837,123.4129,4.8,35) returning id into r3;

  insert into public.menu_items (restaurant_id, category_id, name, description, price, emoji, is_popular) values
    (r1,c_burg,'Classic Cheeseburger','Beef patty, cheddar, pickles, house sauce',89.00,'🍔',true),
    (r1,c_burg,'Smoky BBQ Burger','Bacon, onion rings, BBQ glaze',139.00,'🍔',false),
    (r1,c_drink,'Fresh Lemonade','Squeezed daily, lightly sweet',45.00,'🍋',false),
    (r2,c_pizza,'Margherita Pizza','Tomato, mozzarella, fresh basil',249.00,'🍕',true),
    (r2,c_pizza,'Pepperoni Pizza','Double pepperoni, mozzarella',299.00,'🍕',true),
    (r2,c_salad,'Caesar Salad','Romaine, parmesan, croutons',129.00,'🥗',false),
    (r3,c_sushi,'Salmon Nigiri (6)','Fresh salmon over seasoned rice',299.00,'🍣',true),
    (r3,c_sushi,'Dragon Roll','Eel, avocado, cucumber, tobiko',329.00,'🍱',false),
    (r3,c_dess,'Chocolate Lava Cake','Warm center, vanilla ice cream',119.00,'🍰',false);

  insert into public.riders (full_name, vehicle_type, rating, completed_deliveries, base_fee, eta_minutes) values
    ('Amir Khan','Motorbike',4.9,312,45.00,20),
    ('Lena Ortiz','Bicycle',4.8,188,30.00,28),
    ('Marcus Bell','Scooter',4.7,251,40.00,24),
    ('Sofia Rossi','Car',4.6,97,80.00,22);
end $$;

-- If you ran an earlier version of this script, move its untouched New York sample
-- restaurants to San Carlos City. Only rows still at the old coordinates are changed.
update public.restaurants set latitude = 10.4939, longitude = 123.4273, address = 'Barangay I, San Carlos City'
  where name = 'Smokehouse Burgers' and latitude between 40 and 41;
update public.restaurants set latitude = 10.4844, longitude = 123.4236, address = 'Barangay III, San Carlos City'
  where name = 'Fornace Pizzeria' and latitude between 40 and 41;
update public.restaurants set latitude = 10.4837, longitude = 123.4129, address = 'City center, San Carlos City'
  where name = 'Kaito Sushi' and latitude between 40 and 41;

-- Pesos: if you ran an earlier (dollar) version, convert the untouched sample prices and fees.
alter table public.riders alter column base_fee set default 40.00;
update public.menu_items set price = 89   where name = 'Classic Cheeseburger' and price < 50;
update public.menu_items set price = 139  where name = 'Smoky BBQ Burger'     and price < 50;
update public.menu_items set price = 45   where name = 'Fresh Lemonade'       and price < 20;
update public.menu_items set price = 249  where name = 'Margherita Pizza'     and price < 50;
update public.menu_items set price = 299  where name = 'Pepperoni Pizza'      and price < 50;
update public.menu_items set price = 129  where name = 'Caesar Salad'         and price < 50;
update public.menu_items set price = 299  where name = 'Salmon Nigiri (6)'    and price < 50;
update public.menu_items set price = 329  where name = 'Dragon Roll'          and price < 50;
update public.menu_items set price = 119  where name = 'Chocolate Lava Cake'  and price < 50;
update public.riders set base_fee = 45 where full_name = 'Amir Khan'    and base_fee < 10;
update public.riders set base_fee = 30 where full_name = 'Lena Ortiz'   and base_fee < 10;
update public.riders set base_fee = 40 where full_name = 'Marcus Bell'  and base_fee < 10;
update public.riders set base_fee = 80 where full_name = 'Sofia Rossi'  and base_fee < 10;

-- ---------- 8. Create your first admin (run AFTER you have signed up) ----------
-- Replace the email, uncomment, and run once in the SQL Editor:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'you@example.com'
-- on conflict do nothing;
