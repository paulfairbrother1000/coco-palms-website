alter table public.quotes
  add column if not exists adults_count integer,
  add column if not exists children_6_17_count integer;

alter table public.quotes
  add constraint quotes_adults_count_check check (adults_count is null or adults_count >= 1),
  add constraint quotes_children_6_17_count_check check (children_6_17_count is null or children_6_17_count >= 0);

create or replace function public.create_website_quote_v2(
  p_property_slug text,
  p_start_date date,
  p_end_date date,
  p_adults_count integer,
  p_children_6_17_count integer,
  p_under6_count integer,
  p_contact_email text,
  p_contact_name text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_property_id uuid;
  v_party_size integer;
  v_customer_id uuid;
  v_calc jsonb;
  v_quote_id uuid;
  v_token text;
begin
  if nullif(trim(p_contact_name), '') is null then raise exception 'Name is required'; end if;
  if p_contact_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  if p_adults_count < 1 or p_children_6_17_count < 0 or p_under6_count < 0 then raise exception 'Invalid party composition'; end if;

  v_party_size := p_adults_count + p_children_6_17_count + p_under6_count;
  select id into v_property_id from public.properties where slug = p_property_slug;
  if not found then raise exception 'Property not found'; end if;
  if exists (
    select 1 from public.get_unavailable_ranges(p_start_date, p_end_date) r
    where r.start_date < p_end_date and r.end_date > p_start_date
  ) then raise exception 'Coco Palms is not available for those dates'; end if;

  v_calc := public.calculate_website_quote(v_property_id, p_start_date, p_end_date, v_party_size, p_under6_count, null)
    || jsonb_build_object('adults_count', p_adults_count, 'children_6_17_count', p_children_6_17_count);

  insert into public.customers(email, first_name, last_name)
  values(lower(trim(p_contact_email)), split_part(trim(p_contact_name), ' ', 1), nullif(regexp_replace(trim(p_contact_name), '^\S+\s*', ''), ''))
  on conflict(email) do update set first_name = excluded.first_name, last_name = excluded.last_name
  returning id into v_customer_id;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.quotes(
    property_id, customer_id, start_date, end_date, nights, party_size, adults_count, children_6_17_count,
    under6_count, base_total, discount_total, abst_total, levy_total, security_deposit, fees_total,
    grand_total, currency, breakdown, quote_token, public_token, expires_at, status, contact_email,
    contact_name, blended_rate, rate_breakdown, source, deposit_due, balance_due, balance_due_date, pricing_version
  ) values (
    v_property_id, v_customer_id, p_start_date, p_end_date, (v_calc->>'nights')::int, v_party_size,
    p_adults_count, p_children_6_17_count, p_under6_count, (v_calc->>'base_total')::numeric,
    (v_calc->>'discount_total')::numeric, (v_calc->>'abst_total')::numeric, (v_calc->>'levy_total')::numeric,
    (v_calc->>'security_deposit')::numeric, (v_calc->>'fees_total')::numeric, (v_calc->>'quotation_total')::numeric,
    'USD', v_calc, encode(extensions.gen_random_bytes(16), 'hex'), v_token, now() + interval '72 hours',
    'quotation', lower(trim(p_contact_email)), trim(p_contact_name), (v_calc->>'blended_rate')::numeric,
    v_calc->'rate_breakdown', 'website', (v_calc->>'deposit_due')::numeric, (v_calc->>'balance_due')::numeric,
    (v_calc->>'balance_due_date')::date, 'calculator-v15-website'
  ) returning id into v_quote_id;

  insert into public.quote_items(quote_id, item_type, label, total_amount, sort_order, metadata) values
    (v_quote_id, 'accommodation', 'Accommodation', (v_calc->>'base_total')::numeric, 10, jsonb_build_object('rate_breakdown', v_calc->'rate_breakdown')),
    (v_quote_id, 'discount', 'Long-stay discount', (v_calc->>'long_stay_discount')::numeric, 20, '{}'),
    (v_quote_id, 'adjustment', 'Four-night short-stay charge', (v_calc->>'short_stay_levy')::numeric, 35, '{}'),
    (v_quote_id, 'tax', 'ABST government sales tax', (v_calc->>'abst_total')::numeric, 40, '{}'),
    (v_quote_id, 'levy', 'Government levy', (v_calc->>'levy_total')::numeric, 50, jsonb_build_object('under_6_excluded', true)),
    (v_quote_id, 'fee', 'Banking and administration fees', (v_calc->>'fees_total')::numeric, 60, jsonb_build_object('security_in_fee_base', true)),
    (v_quote_id, 'security', 'Refundable security deposit', (v_calc->>'security_deposit')::numeric, 70, jsonb_build_object('not_in_quotation_total', true));

  delete from public.quote_items
  where quote_id = v_quote_id and total_amount = 0 and item_type in ('discount', 'adjustment');

  insert into public.quote_events(quote_id, event_type, event_payload)
  values(v_quote_id, 'created', v_calc || jsonb_build_object('source', 'website'));

  return jsonb_build_object('quote_id', v_quote_id, 'public_token', v_token, 'calculation', v_calc);
end;
$$;

revoke all on function public.create_website_quote_v2(text,date,date,integer,integer,integer,text,text) from public;
revoke all on function public.create_website_quote_v2(text,date,date,integer,integer,integer,text,text) from anon, authenticated;
grant execute on function public.create_website_quote_v2(text,date,date,integer,integer,integer,text,text) to service_role;

create or replace function public.get_public_quote(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'token', q.public_token,
    'name', q.contact_name,
    'email', q.contact_email,
    'arrival', q.start_date,
    'departure', q.end_date,
    'nights', q.nights,
    'party_size', q.party_size,
    'adults_count', q.adults_count,
    'children_6_17_count', q.children_6_17_count,
    'under6_count', q.under6_count,
    'calculation', q.breakdown,
    'created_at', q.created_at,
    'expires_at', q.expires_at,
    'status', q.status
  )
  from public.quotes q
  where q.public_token = p_token
  limit 1;
$$;

revoke all on function public.get_public_quote(text) from public;
grant execute on function public.get_public_quote(text) to anon, authenticated, service_role;
