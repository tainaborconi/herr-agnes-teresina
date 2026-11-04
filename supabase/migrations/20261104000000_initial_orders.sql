-- HERR AGNES: order management foundation
-- Public clients must submit orders through a validated Edge Function using
-- the server-side service role. No anonymous table access is granted here.

create extension if not exists pgcrypto;

create sequence if not exists public.order_number_seq
  start with 100
  increment by 1
  minvalue 1;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create type public.order_status as enum (
  'pending',
  'in_progress',
  'confirmed',
  'cancelled'
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null unique default nextval('public.order_number_seq'),
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  delivery_reference text not null,
  delivery_date date not null,
  delivery_time time not null,
  payment_method text not null check (
    payment_method in ('Pix', 'Cartão de crédito', 'Cartão de débito')
  ),
  payment_condition text,
  notes text,
  total numeric(12,2) not null check (total >= 0),
  confirmed_total numeric(12,2) check (confirmed_total is null or confirmed_total >= 0),
  status public.order_status not null default 'pending',
  fbp text,
  fbc text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  lead_event_id text,
  purchase_event_id text unique,
  sale_confirmed_at timestamptz,
  purchase_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_name text not null,
  keg_size integer not null check (keg_size in (30, 50)),
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- A signed-in user can read only their own profile. Profile provisioning is
-- performed by the project owner through the Supabase SQL editor.
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

-- Only the explicitly provisioned admin can read and update orders.
drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

-- Admins can read order items only when the parent order is visible to them.
drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    join public.profiles on profiles.id = (select auth.uid())
    where orders.id = order_items.order_id
      and profiles.role = 'admin'
  )
);

-- Intentionally no anon/authenticated INSERT, DELETE, or broad UPDATE policies.
-- The public order endpoint will validate payloads in an Edge Function and
-- write with the server-side service role. Never expose that key in the browser.
