-- Keep the trigger helper's search path immutable.
ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog;

-- This event-trigger function runs automatically on DDL and must not be callable through the public Data API.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
