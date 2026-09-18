create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_users a
      where a.user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated, service_role;

alter table public.site_settings enable row level security;

drop policy if exists "public_read_site_settings" on public.site_settings;
drop policy if exists "admin_manage_site_settings" on public.site_settings;

create policy "public_read_site_settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "admin_manage_site_settings"
on public.site_settings
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

revoke insert, update, delete, truncate on table public.site_settings from anon;
grant select on table public.site_settings to anon;
grant select, insert, update, delete on table public.site_settings to authenticated;
