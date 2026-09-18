alter table public.calendar_blocks
  add column if not exists external_uid text,
  add column if not exists synced_at timestamptz;

create unique index if not exists calendar_blocks_google_uid_unique
  on public.calendar_blocks(external_uid)
  where source = 'google-calendar' and external_uid is not null;

create or replace function public.sync_google_calendar_blocks(
  p_property_slug text,
  p_events jsonb
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_property_id uuid;
  v_imported integer;
begin
  if jsonb_typeof(p_events) is distinct from 'array' then raise exception 'Events must be an array'; end if;
  select id into v_property_id from public.properties where slug = p_property_slug;
  if not found then raise exception 'Property not found'; end if;

  insert into public.calendar_blocks(property_id, start_date, end_date, reason, source, external_uid, synced_at)
  select
    v_property_id,
    (event->>'start_date')::date,
    (event->>'end_date')::date,
    left(coalesce(nullif(event->>'summary', ''), 'Google Calendar block'), 500),
    'google-calendar',
    nullif(event->>'uid', ''),
    now()
  from jsonb_array_elements(p_events) event
  where nullif(event->>'uid', '') is not null
    and (event->>'end_date')::date > (event->>'start_date')::date
  on conflict (external_uid) where source = 'google-calendar' and external_uid is not null
  do update set
    property_id = excluded.property_id,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    reason = excluded.reason,
    synced_at = excluded.synced_at;

  get diagnostics v_imported = row_count;

  delete from public.calendar_blocks block
  where block.property_id = v_property_id
    and block.source = 'google-calendar'
    and not exists (
      select 1
      from jsonb_array_elements(p_events) event
      where event->>'uid' = block.external_uid
    );

  return v_imported;
end;
$$;

revoke all on function public.sync_google_calendar_blocks(text,jsonb) from public;
revoke all on function public.sync_google_calendar_blocks(text,jsonb) from anon, authenticated;
grant execute on function public.sync_google_calendar_blocks(text,jsonb) to service_role;
