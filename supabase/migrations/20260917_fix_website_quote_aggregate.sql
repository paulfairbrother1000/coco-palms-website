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
  select count(*) into v_festive_nights from generate_series(p_start_date,p_end_date-1,interval '1 day') d where public.month_day_in_period(d::date,v_property.festive_start,v_property.festive_end);
  if v_festive_nights>0 and v_nights<v_property.festive_min_nights then raise exception 'A minimum stay of 10 nights applies over the festive period';
  elsif v_festive_nights=0 and v_nights<4 then raise exception 'The minimum stay is 5 nights; 4 nights are available with a short-stay levy'; end if;
  if v_nights=4 then v_short_stay_levy:=v_property.short_stay_levy; end if;
  with priced as (
    select d::date stay_date,r.name,r.per_night from generate_series(p_start_date,p_end_date-1,interval '1 day') d
    join lateral (select rp.name,rp.per_night from public.rate_periods rp where rp.property_id=p_property_id and rp.is_active and ((rp.is_annual_recurring and public.month_day_in_period(d::date,rp.start_date,rp.end_date)) or (not rp.is_annual_recurring and d::date>=rp.start_date and d::date<rp.end_date)) order by rp.sort_order limit 1) r on true
  ), grouped as (select name,per_night,count(*) nights,sum(per_night) total from priced group by name,per_night)
  select sum(total),jsonb_agg(jsonb_build_object('period',name,'nights',nights,'rate',per_night,'total',total) order by per_night) into v_base,v_rate_breakdown from grouped;
  if v_base is null or v_base<=0 then raise exception 'No published rate for one or more dates'; end if;
  v_blended:=round(v_base/v_nights,2);
  if v_nights>v_policy.long_stay_min_nights then v_long_discount:=round(-1*(v_nights-v_policy.long_stay_min_nights)*v_blended*v_policy.long_stay_discount,2); end if;
  if p_party_size<3 then v_secondary_type:='single-occupancy';v_secondary_rate:=v_policy.single_occupancy_discount;
  elsif lower(coalesce(p_optional_discount,''))='two-week' then v_secondary_type:='two-week';v_secondary_rate:=v_policy.notice_2_weeks_discount;
  elsif lower(coalesce(p_optional_discount,''))='four-week' then v_secondary_type:='four-week';v_secondary_rate:=v_policy.notice_4_weeks_discount;
  elsif lower(coalesce(p_optional_discount,''))='early-bird' then v_secondary_type:='early-bird';v_secondary_rate:=v_policy.early_bird_discount; end if;
  if v_secondary_rate>0 then v_secondary_discount:=round(-1*(v_base+v_long_discount)*v_secondary_rate,2); end if;
  v_discounted_base:=v_base+v_long_discount+v_secondary_discount;v_taxable_subtotal:=v_discounted_base+v_short_stay_levy;
  v_abst:=round(v_taxable_subtotal*v_policy.abst_rate,2);v_levy_guests:=p_party_size-p_under6_count;
  v_levy:=round(v_levy_guests*v_nights*v_policy.govt_levy_per_person_per_night,2);v_security:=v_policy.security_deposit;
  v_fees:=round((v_taxable_subtotal+v_abst+v_levy+v_security)*v_policy.fee_rate,2);v_total:=round(v_taxable_subtotal+v_abst+v_levy+v_fees,2);
  return jsonb_build_object('nights',v_nights,'party_size',p_party_size,'under6_count',p_under6_count,'levy_guests',v_levy_guests,'base_total',v_base,'blended_rate',v_blended,'rate_breakdown',coalesce(v_rate_breakdown,'[]'::jsonb),'long_stay_discount',v_long_discount,'secondary_discount_type',v_secondary_type,'secondary_discount',v_secondary_discount,'discount_total',v_long_discount+v_secondary_discount,'discounted_base',v_discounted_base,'short_stay_levy',v_short_stay_levy,'abst_total',v_abst,'levy_total',v_levy,'fees_total',v_fees,'quotation_total',v_total,'security_deposit',v_security,'deposit_due',round(v_total*v_policy.deposit_percentage,2),'balance_due',round(v_total*(1-v_policy.deposit_percentage),2),'balance_due_date',p_start_date-(v_policy.balance_due_weeks_before_arrival*7),'currency','USD');
end;
$$;

revoke all on function public.calculate_website_quote(uuid,date,date,integer,integer,text) from public;
grant execute on function public.calculate_website_quote(uuid,date,date,integer,integer,text) to service_role;
