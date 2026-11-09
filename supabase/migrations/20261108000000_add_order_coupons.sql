-- Store coupon details alongside the final discounted order total.
alter table public.orders
  add column if not exists coupon_code text,
  add column if not exists discount_percent numeric(5,2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100),
  add column if not exists discount_amount numeric(12,2) not null default 0
    check (discount_amount >= 0);
