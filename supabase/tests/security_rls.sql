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
