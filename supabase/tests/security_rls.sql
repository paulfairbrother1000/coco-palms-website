do $$
declare
  function_definition text;
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'site_settings'
      and c.relrowsecurity
  ) then
    raise exception 'site_settings must have RLS enabled';
  end if;

  select pg_get_functiondef('public.is_admin()'::regprocedure)
  into function_definition;

  if function_definition ilike '%count(*) = 0%' then
    raise exception 'is_admin must not bootstrap from an empty admin table';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'public_read_site_settings'
      and cmd = 'SELECT'
  ) then
    raise exception 'public read policy is missing';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'admin_manage_site_settings'
      and cmd = 'ALL'
  ) then
    raise exception 'admin management policy is missing';
  end if;

  if has_table_privilege('anon', 'public.site_settings', 'INSERT')
     or has_table_privilege('anon', 'public.site_settings', 'UPDATE')
     or has_table_privilege('anon', 'public.site_settings', 'DELETE')
     or has_table_privilege('anon', 'public.site_settings', 'TRUNCATE') then
    raise exception 'anon must not have site_settings mutation privileges';
  end if;

  if public.is_admin() then
    raise exception 'unauthenticated is_admin must return false';
  end if;

  if has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') then
    raise exception 'anon must not execute is_admin directly';
  end if;
end
$$;

-- Catch missing booking-request schema or accidental public RPC exposure.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quotes'
      and column_name = 'booking_request_email_sent_at'
      and data_type = 'timestamp with time zone'
  ) then
    raise exception 'quotes.booking_request_email_sent_at is missing';
  end if;

  if to_regprocedure('public.accept_website_quote(text)') is null then
    raise exception 'accept_website_quote(text) is missing';
  end if;

  if to_regprocedure('public.mark_website_booking_request_notified(uuid)') is null then
    raise exception 'mark_website_booking_request_notified(uuid) is missing';
  end if;

  if has_function_privilege('anon', 'public.accept_website_quote(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.accept_website_quote(text)', 'EXECUTE') then
    raise exception 'public roles must not execute accept_website_quote';
  end if;

  if has_function_privilege('anon', 'public.mark_website_booking_request_notified(uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.mark_website_booking_request_notified(uuid)', 'EXECUTE') then
    raise exception 'public roles must not execute mark_website_booking_request_notified';
  end if;

  if not has_function_privilege('service_role', 'public.accept_website_quote(text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.mark_website_booking_request_notified(uuid)', 'EXECUTE') then
    raise exception 'service_role must execute both booking-request functions';
  end if;

  if exists (
    select 1 from pg_proc
    where oid in (
      'public.accept_website_quote(text)'::regprocedure,
      'public.mark_website_booking_request_notified(uuid)'::regprocedure
    )
      and prosecdef
  ) then
    raise exception 'booking-request functions must use security invoker';
  end if;

  if exists (
    select 1
    from (values ('quotes'), ('quote_events')) as required_tables(table_name)
    where not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = required_tables.table_name
        and c.relrowsecurity
    )
  ) then
    raise exception 'quotes and quote_events must retain RLS';
  end if;
end
$$;
