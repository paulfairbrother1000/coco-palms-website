alter table public.contacts add column if not exists message text;

create or replace function public.create_contact_enquiry(p_name text,p_email text,p_message text,p_wants_promos boolean default false)
returns uuid
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare v_id uuid;
begin
  if nullif(trim(p_name),'') is null or p_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' or length(trim(p_message))<5 then raise exception 'Invalid contact enquiry'; end if;
  insert into public.contacts(name,email,wants_promos,source,message) values(trim(p_name),lower(trim(p_email)),p_wants_promos,'website',left(trim(p_message),4000)) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.create_contact_enquiry(text,text,text,boolean) from public;
grant execute on function public.create_contact_enquiry(text,text,text,boolean) to anon,authenticated,service_role;
