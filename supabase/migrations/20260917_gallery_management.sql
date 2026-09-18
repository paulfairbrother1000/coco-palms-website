create table if not exists public.gallery_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order integer not null default 100,
  capacity integer not null default 12 check (capacity between 1 and 12)
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.gallery_sections(id) on delete cascade,
  storage_path text not null unique,
  label text not null,
  alt_text text not null,
  position integer not null check (position between 1 and 12),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(section_id,position)
);

alter table public.gallery_sections enable row level security;
alter table public.gallery_images enable row level security;

create policy "public_read_gallery_sections" on public.gallery_sections for select to anon,authenticated using(true);
create policy "admin_manage_gallery_sections" on public.gallery_sections for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy "public_read_published_gallery_images" on public.gallery_images for select to anon,authenticated using(published);
create policy "admin_manage_gallery_images" on public.gallery_images for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

insert into public.gallery_sections(slug,title,description,sort_order,capacity) values
  ('exterior','Exterior','Waterfront terraces, private pool and outdoor living.',10,12),
  ('interior','Interior','Contemporary rooms and spaces for gathering.',20,12),
  ('local-area','Local Area','Antigua beaches, harbours and island life.',30,12)
on conflict(slug) do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order,capacity=12;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('coco-palms-gallery','coco-palms-gallery',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

create policy "public_read_coco_palms_gallery" on storage.objects for select to anon,authenticated using(bucket_id='coco-palms-gallery');
create policy "admins_insert_coco_palms_gallery" on storage.objects for insert to authenticated with check(bucket_id='coco-palms-gallery' and (select public.is_admin()));
create policy "admins_update_coco_palms_gallery" on storage.objects for update to authenticated using(bucket_id='coco-palms-gallery' and (select public.is_admin())) with check(bucket_id='coco-palms-gallery' and (select public.is_admin()));
create policy "admins_delete_coco_palms_gallery" on storage.objects for delete to authenticated using(bucket_id='coco-palms-gallery' and (select public.is_admin()));

grant select on public.gallery_sections,public.gallery_images to anon;
grant select,insert,update,delete on public.gallery_sections,public.gallery_images to authenticated;
