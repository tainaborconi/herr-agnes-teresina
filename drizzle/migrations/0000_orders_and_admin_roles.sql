create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can read their own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create sequence public.order_number_seq start 51;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null unique default nextval('public.order_number_seq'),
  idempotency_key text not null unique,
  customer_name text not null,
  phone text not null,
  address text not null,
  reference text not null,
  delivery_date date not null,
  delivery_time text not null,
  payment_method text not null,
  card_condition text,
  notes text,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'confirmado', 'cancelado')),
  subtotal numeric(10,2) not null,
  final_value numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
grant usage on sequence public.order_number_seq to service_role;
alter table public.orders enable row level security;
create policy "Admins can read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  flavor text not null,
  size_liters integer not null check (size_liters in (30, 50)),
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null
);
grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Admins can read order items" on public.order_items for select to authenticated using (public.has_role(auth.uid(), 'admin'));