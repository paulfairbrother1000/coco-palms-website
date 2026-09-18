update public.booking_policies
set long_stay_discount = 0.20
where is_active = true;

create or replace function public.get_unavailable_ranges(
  p_start date default current_date,
  p_end date default (current_date + 548)
)
returns table(start_date date, end_date date)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select ranges.start_date, ranges.end_date
  from (
    select cb.start_date, cb.end_date
    from public.calendar_blocks cb
    where cb.start_date < p_end and cb.end_date > p_start
    union all
    select b.start_date, b.end_date
    from public.bookings b
    where b.status in ('deposit_paid', 'balance_paid', 'complete')
      and b.start_date < p_end and b.end_date > p_start
    union all
    select h.start_date, h.end_date
    from public.holds h
    where h.expires_at > now()
      and h.start_date < p_end and h.end_date > p_start
  ) ranges
  order by ranges.start_date;
$$;

revoke all on function public.get_unavailable_ranges(date,date) from public;
grant execute on function public.get_unavailable_ranges(date,date) to anon, authenticated, service_role;

create or replace function public.calculate_website_quote(
  p_property_id uuid,
  p_start_date date,
  p_end_date date,
  p_party_size integer,
  p_under6_count integer default 0,
  p_optional_discount text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_property public.properties%rowtype;
  v_policy public.booking_policies%rowtype;
  v_nights integer;
  v_festive_nights integer;
  v_base numeric;
  v_blended numeric;
  v_long_discount numeric := 0;
  v_secondary_type text;
  v_secondary_rate numeric := 0;
  v_secondary_discount numeric := 0;
  v_discounted_base numeric;
  v_short_stay_levy numeric := 0;
  v_taxable_subtotal numeric;
  v_abst numeric;
  v_levy_guests integer;
  v_levy numeric;
  v_security numeric;
  v_fees numeric;
  v_total numeric;
  v_rate_breakdown jsonb;
begin
  select * into v_property from public.properties where id = p_property_id;
  if not found then raise exception 'Property not found'; end if;
  select * into v_policy from public.booking_policies where property_id = p_property_id and is_active order by created_at desc limit 1;
  if not found then raise exception 'No active booking policy'; end if;

  v_nights := p_end_date - p_start_date;
  if v_nights <= 0 then raise exception 'Departure must be after arrival'; end if;
  if p_party_size < 1 or p_party_size > v_property.max_guests then raise exception 'Coco Palms accommodates 1 to 8 guests'; end if;
  if p_under6_count < 0 or p_under6_count > p_party_size then raise exception 'Invalid under-6 guest count'; end if;

  select count(*) into v_festive_nights
  from generate_series(p_start_date, p_end_date - 1, interval '1 day') d
  where public.month_day_in_period(d::date, v_property.festive_start, v_property.festive_end);

  if v_festive_nights > 0 and v_nights < v_property.festive_min_nights then
    raise exception 'A minimum stay of 10 nights applies over the festive period';
  elsif v_festive_nights = 0 and v_nights < 4 then
    raise exception 'The minimum stay is 5 nights; 4 nights are available with a short-stay levy';
  end if;
  if v_nights = 4 then v_short_stay_levy := v_property.short_stay_levy; end if;

  with priced as (
    select d::date stay_date, r.name, r.per_night
    from generate_series(p_start_date, p_end_date - 1, interval '1 day') d
    join lateral (
      select rp.name, rp.per_night
      from public.rate_periods rp
      where rp.property_id = p_property_id and rp.is_active
        and ((rp.is_annual_recurring and public.month_day_in_period(d::date, rp.start_date, rp.end_date))
          or (not rp.is_annual_recurring and d::date >= rp.start_date and d::date < rp.end_date))
      order by rp.sort_order
      limit 1
    ) r on true
  ), grouped as (
    select name, per_night, count(*) nights, sum(per_night) total from priced group by name, per_night
  )
  select sum(total), jsonb_agg(jsonb_build_object('period',name,'nights',nights,'rate',per_night,'total',total) order by per_night)
  into v_base, v_rate_breakdown from grouped;
  if v_base is null or v_base <= 0 then raise exception 'No published rate for one or more dates'; end if;

  v_blended := round(v_base / v_nights, 2);
  if v_nights > v_policy.long_stay_min_nights then
    v_long_discount := round(-1 * (v_nights - v_policy.long_stay_min_nights) * v_blended * v_policy.long_stay_discount, 2);
  end if;

  if p_party_size < 3 then
    v_secondary_type := 'single-occupancy'; v_secondary_rate := v_policy.single_occupancy_discount;
  elsif lower(coalesce(p_optional_discount,'')) = 'two-week' then
    v_secondary_type := 'two-week'; v_secondary_rate := v_policy.notice_2_weeks_discount;
  elsif lower(coalesce(p_optional_discount,'')) = 'four-week' then
    v_secondary_type := 'four-week'; v_secondary_rate := v_policy.notice_4_weeks_discount;
  elsif lower(coalesce(p_optional_discount,'')) = 'early-bird' then
    v_secondary_type := 'early-bird'; v_secondary_rate := v_policy.early_bird_discount;
  end if;
  if v_secondary_rate > 0 then
    v_secondary_discount := round(-1 * (v_base + v_long_discount) * v_secondary_rate, 2);
  end if;

  v_discounted_base := v_base + v_long_discount + v_secondary_discount;
  v_taxable_subtotal := v_discounted_base + v_short_stay_levy;
  v_abst := round(v_taxable_subtotal * v_policy.abst_rate, 2);
  v_levy_guests := p_party_size - p_under6_count;
  v_levy := round(v_levy_guests * v_nights * v_policy.govt_levy_per_person_per_night, 2);
  v_security := v_policy.security_deposit;
  v_fees := round((v_taxable_subtotal + v_abst + v_levy + v_security) * v_policy.fee_rate, 2);
  v_total := round(v_taxable_subtotal + v_abst + v_levy + v_fees, 2);

  return jsonb_build_object(
    'nights',v_nights,'party_size',p_party_size,'under6_count',p_under6_count,'levy_guests',v_levy_guests,
    'base_total',v_base,'blended_rate',v_blended,'rate_breakdown',coalesce(v_rate_breakdown,'[]'::jsonb),
    'long_stay_discount',v_long_discount,'secondary_discount_type',v_secondary_type,'secondary_discount',v_secondary_discount,
    'discount_total',v_long_discount + v_secondary_discount,'discounted_base',v_discounted_base,
    'short_stay_levy',v_short_stay_levy,'abst_total',v_abst,'levy_total',v_levy,
    'fees_total',v_fees,'quotation_total',v_total,'security_deposit',v_security,
    'deposit_due',round(v_total * v_policy.deposit_percentage,2),'balance_due',round(v_total * (1-v_policy.deposit_percentage),2),
    'balance_due_date',p_start_date - (v_policy.balance_due_weeks_before_arrival * 7),
    'currency','USD'
  );
end;
$$;

revoke all on function public.calculate_website_quote(uuid,date,date,integer,integer,text) from public;
grant execute on function public.calculate_website_quote(uuid,date,date,integer,integer,text) to service_role;

create or replace function public.create_website_quote(
  p_property_slug text,
  p_start_date date,
  p_end_date date,
  p_party_size integer,
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
  v_customer_id uuid;
  v_calc jsonb;
  v_quote_id uuid;
  v_token text;
begin
  if nullif(trim(p_contact_name),'') is null then raise exception 'Name is required'; end if;
  if p_contact_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  select id into v_property_id from public.properties where slug = p_property_slug;
  if not found then raise exception 'Property not found'; end if;
  if exists (select 1 from public.get_unavailable_ranges(p_start_date,p_end_date) r where r.start_date < p_end_date and r.end_date > p_start_date) then
    raise exception 'Coco Palms is not available for those dates';
  end if;
  v_calc := public.calculate_website_quote(v_property_id,p_start_date,p_end_date,p_party_size,p_under6_count,null);
  insert into public.customers(email,first_name,last_name)
  values(lower(trim(p_contact_email)),split_part(trim(p_contact_name),' ',1),nullif(regexp_replace(trim(p_contact_name),'^\\S+\\s*',''),''))
  on conflict(email) do update set first_name=excluded.first_name,last_name=excluded.last_name
  returning id into v_customer_id;
  v_token := encode(extensions.gen_random_bytes(24),'hex');
  insert into public.quotes(
    property_id,customer_id,start_date,end_date,nights,party_size,under6_count,base_total,discount_total,
    abst_total,levy_total,security_deposit,fees_total,grand_total,currency,breakdown,quote_token,public_token,
    expires_at,status,contact_email,contact_name,blended_rate,rate_breakdown,source,deposit_due,balance_due,balance_due_date,pricing_version
  ) values (
    v_property_id,v_customer_id,p_start_date,p_end_date,(v_calc->>'nights')::int,p_party_size,p_under6_count,
    (v_calc->>'base_total')::numeric,(v_calc->>'discount_total')::numeric,(v_calc->>'abst_total')::numeric,
    (v_calc->>'levy_total')::numeric,(v_calc->>'security_deposit')::numeric,(v_calc->>'fees_total')::numeric,
    (v_calc->>'quotation_total')::numeric,'USD',v_calc,encode(extensions.gen_random_bytes(16),'hex'),v_token,now()+interval '72 hours',
    'quotation',lower(trim(p_contact_email)),trim(p_contact_name),(v_calc->>'blended_rate')::numeric,v_calc->'rate_breakdown',
    'website',(v_calc->>'deposit_due')::numeric,(v_calc->>'balance_due')::numeric,(v_calc->>'balance_due_date')::date,'calculator-v15'
  ) returning id into v_quote_id;
  insert into public.quote_items(quote_id,item_type,label,total_amount,sort_order,metadata) values
    (v_quote_id,'accommodation','Accommodation',(v_calc->>'base_total')::numeric,10,jsonb_build_object('rate_breakdown',v_calc->'rate_breakdown')),
    (v_quote_id,'discount','Long-stay discount',(v_calc->>'long_stay_discount')::numeric,20,'{}'),
    (v_quote_id,'discount',coalesce('Discount - '||(v_calc->>'secondary_discount_type'),'Secondary discount'),(v_calc->>'secondary_discount')::numeric,30,'{}'),
    (v_quote_id,'adjustment','Four-night short-stay levy',(v_calc->>'short_stay_levy')::numeric,35,'{}'),
    (v_quote_id,'tax','ABST government sales tax',(v_calc->>'abst_total')::numeric,40,'{}'),
    (v_quote_id,'levy','Government levy',(v_calc->>'levy_total')::numeric,50,jsonb_build_object('under_6_excluded',true)),
    (v_quote_id,'fee','Banking and administration fees',(v_calc->>'fees_total')::numeric,60,jsonb_build_object('security_in_fee_base',true)),
    (v_quote_id,'security','Refundable security deposit',(v_calc->>'security_deposit')::numeric,70,jsonb_build_object('not_in_quotation_total',true));
  delete from public.quote_items where quote_id=v_quote_id and total_amount=0 and item_type in ('discount','adjustment');
  insert into public.quote_events(quote_id,event_type,event_payload) values(v_quote_id,'created',v_calc);
  return jsonb_build_object('quote_id',v_quote_id,'public_token',v_token,'calculation',v_calc);
end;
$$;

revoke all on function public.create_website_quote(text,date,date,integer,integer,text,text) from public;
grant execute on function public.create_website_quote(text,date,date,integer,integer,text,text) to service_role;

create or replace function public.get_public_quote(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'token',q.public_token,'name',q.contact_name,'arrival',q.start_date,'departure',q.end_date,
    'nights',q.nights,'party_size',q.party_size,'under6_count',q.under6_count,'calculation',q.breakdown,
    'created_at',q.created_at,'expires_at',q.expires_at,'status',q.status
  ) from public.quotes q where q.public_token=p_token limit 1;
$$;

revoke all on function public.get_public_quote(text) from public;
grant execute on function public.get_public_quote(text) to anon, authenticated, service_role;
