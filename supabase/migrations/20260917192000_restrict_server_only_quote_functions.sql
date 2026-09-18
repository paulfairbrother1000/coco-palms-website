revoke all on function public.create_website_quote_v2(text,date,date,integer,integer,integer,text,text) from anon, authenticated;
revoke all on function public.sync_google_calendar_blocks(text,jsonb) from anon, authenticated;

grant execute on function public.create_website_quote_v2(text,date,date,integer,integer,integer,text,text) to service_role;
grant execute on function public.sync_google_calendar_blocks(text,jsonb) to service_role;
