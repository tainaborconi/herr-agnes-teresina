# HERR AGNES — Supabase setup

## Frontend environment

Configure these variables in the hosting/build environment:

- `VITE_SUPABASE_URL`: `https://efdgljkcrngtaztazxgb.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key.
- `VITE_TURNSTILE_SITE_KEY`: the public Cloudflare Turnstile site key for `www.herragnesteresina.com.br`.

The publishable key and Turnstile site key are public values. Never place a Supabase secret/service-role key, database password, or Turnstile secret in a `VITE_*` variable, frontend source file, or Git commit.

## Current database state

The Supabase project already contains:

- `profiles`: administrator allowlist.
- `orders`: customer, delivery, payment, totals, status, and attribution fields.
- `order_items`: products/kegs belonging to an order.

RLS is enabled on all three tables. The existing policies allow an authenticated administrator profile to read orders and items and update order status. The public order form writes through the server-side Edge Function; it does not insert directly into these tables.

**Migration-history warning:** the remote migration history currently lists `20261104203046_harden_public_trigger_functions`, but does not list `20261104000000_initial_orders`, even though the schema objects and policies from the initial migration exist. The initial migration file in this repository has been made idempotent, but this history/schema drift must be reconciled before running `supabase db push` or applying migrations. Do not re-run the initial migration manually without reviewing the remote schema and migration history.

## Edge Function

The `create-order` Edge Function is already deployed and active (version 4). It:

- Accepts requests from the production site origin.
- Validates required fields, products, quantities, and server-side prices.
- Verifies the Cloudflare Turnstile token and expected hostname/action.
- Writes the order and its items using the server-side service-role credential.
- Returns the database-generated order number before the browser opens WhatsApp.

Required server-side secret:

- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret.

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function runtime. Keep these values server-side only.

## Administrator access

The administrator account and its `profiles.role = 'admin'` record already exist. Public sign-ups should remain disabled. The `/admin` page validates the authenticated user's profile role before loading orders.

## Remaining checks before publication

1. Confirm `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_TURNSTILE_SITE_KEY` are set in the production build environment.
2. Confirm `TURNSTILE_SECRET_KEY` remains configured in Supabase Edge Function secrets.
3. Run a production build and inspect the generated TanStack route tree for `/admin`.
4. Test administrator login, order listing, status changes, Turnstile verification, and one explicitly authorized test order.
5. Reconcile the migration-history drift before any future schema deployment.
6. Do not merge or publish until the owner has reviewed and explicitly approved the changes.

## Not implemented

- Meta Conversions API Purchase event after a sale is confirmed.
- Automated payment processing/gateway.
