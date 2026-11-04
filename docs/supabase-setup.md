# HERR AGNES — Supabase setup

## Environment

Create a local `.env.local` from `.env.example` and set:

- `VITE_SUPABASE_URL`: the project base URL, without `/rest/v1/`.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key.

The publishable key is intended for browser use. Never use a Supabase secret/service-role key or database password in a `VITE_*` variable, frontend source file, or Git commit.

## Database migration

Apply the SQL migration in `supabase/migrations` to the Supabase project using the Supabase CLI or SQL Editor.

The migration creates:

- `orders`: customer, delivery, payment, totals, status, and Meta attribution fields.
- `order_items`: individual kegs/products in each order.
- `profiles`: the allowlist that grants the single business owner the admin role.

Row Level Security is enabled. Anonymous clients receive no direct table access. The public order form must submit through a validated Edge Function; the browser must never receive the service-role key.

## Provision the business owner

1. In Supabase Authentication, invite the business owner's email address. Keep public sign-ups disabled.
2. After the owner accepts the invitation, copy the user's UUID from Authentication → Users.
3. In the SQL Editor, run the following statement with the real UUID:

```sql
insert into public.profiles (id, role)
values ('OWNER-AUTH-USER-UUID', 'admin')
on conflict (id) do update set role = 'admin';
```

Do not create a profile for any other user. The admin route must still enforce authentication and the profile role; hiding the route in the UI alone is not security.

## Remaining implementation

- Add the Supabase client dependency and typed browser client.
- Implement the owner-only admin login and order dashboard.
- Implement a validated public order Edge Function that writes the order and items, then return the database-generated order number before opening WhatsApp.
- Add the owner action to confirm a sale and send a deduplicated Meta Purchase event through a server-side Edge Function.
- Configure Supabase Edge Function secrets in the Supabase dashboard; never commit them.
