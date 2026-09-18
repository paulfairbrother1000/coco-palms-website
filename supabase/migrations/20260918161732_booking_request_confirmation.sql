alter table public.quotes
  add column if not exists booking_request_email_sent_at timestamptz;

create unique index if not exists quote_events_one_book_now_request
  on public.quote_events (quote_id, event_type)
  where event_type = 'book_now_requested';

create unique index if not exists quote_events_one_book_now_notification
  on public.quote_events (quote_id, event_type)
  where event_type = 'book_now_notification_sent';

create or replace function public.accept_website_quote(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_quote public.quotes%rowtype;
  v_first_request boolean;
begin
  select * into v_quote
  from public.quotes
  where public_token = p_token
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if v_quote.accepted_at is null
     and v_quote.expires_at is not null
     and v_quote.expires_at < now() then
    return jsonb_build_object('outcome', 'expired');
  end if;

  v_first_request := v_quote.accepted_at is null;

  if v_first_request then
    update public.quotes
    set status = 'accepted', accepted_at = now()
    where id = v_quote.id
    returning * into v_quote;

    insert into public.quote_events (quote_id, event_type, event_payload)
    values (
      v_quote.id,
      'book_now_requested',
      jsonb_build_object('source', 'website', 'requested_at', v_quote.accepted_at)
    )
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'outcome', 'accepted',
    'quote_id', v_quote.id,
    'requested_at', v_quote.accepted_at,
    'first_request', v_first_request,
    'notification_sent', v_quote.booking_request_email_sent_at is not null
  );
end;
$$;

create or replace function public.mark_website_booking_request_notified(p_quote_id uuid)
returns timestamptz
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_sent_at timestamptz;
begin
  update public.quotes
  set booking_request_email_sent_at = coalesce(booking_request_email_sent_at, now())
  where id = p_quote_id
  returning booking_request_email_sent_at into v_sent_at;

  if v_sent_at is null then
    raise exception 'Quotation not found';
  end if;

  insert into public.quote_events (quote_id, event_type, event_payload)
  values (p_quote_id, 'book_now_notification_sent', jsonb_build_object('sent_at', v_sent_at))
  on conflict do nothing;

  return v_sent_at;
end;
$$;

revoke all on function public.accept_website_quote(text) from public, anon, authenticated;
revoke all on function public.mark_website_booking_request_notified(uuid) from public, anon, authenticated;
grant execute on function public.accept_website_quote(text) to service_role;
grant execute on function public.mark_website_booking_request_notified(uuid) to service_role;
