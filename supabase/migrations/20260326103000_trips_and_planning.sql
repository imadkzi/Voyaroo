-- Voyaroo: trips + itinerary + checklist + outfits
-- Designed for hosted Supabase (apply via `supabase db push` or SQL editor).

create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  departure_at timestamptz,
  location_label text not null default '',
  hero_image_src text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_created_at_idx on public.trips (created_at desc);

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number int not null default 1,
  title text not null,
  notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists itinerary_items_trip_day_sort_idx
  on public.itinerary_items (trip_id, day_number, sort_order, created_at);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checklist_items_trip_sort_idx
  on public.checklist_items (trip_id, done, sort_order, created_at);

create table if not exists public.outfit_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number int not null default 1,
  title text not null,
  items text[] not null default '{}'::text[],
  notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outfit_items_trip_day_sort_idx
  on public.outfit_items (trip_id, day_number, sort_order, created_at);

-- Timestamp helper (optional)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists itinerary_items_set_updated_at on public.itinerary_items;
create trigger itinerary_items_set_updated_at
before update on public.itinerary_items
for each row execute function public.set_updated_at();

drop trigger if exists checklist_items_set_updated_at on public.checklist_items;
create trigger checklist_items_set_updated_at
before update on public.checklist_items
for each row execute function public.set_updated_at();

drop trigger if exists outfit_items_set_updated_at on public.outfit_items;
create trigger outfit_items_set_updated_at
before update on public.outfit_items
for each row execute function public.set_updated_at();

-- IMPORTANT:
-- RLS is intentionally NOT enabled yet so you can start building CRUD immediately.
-- Once auth is wired, we can add `owner_id` columns + RLS policies per user.

