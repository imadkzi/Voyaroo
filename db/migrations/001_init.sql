create extension if not exists pgcrypto;

create table if not exists trips (
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

create index if not exists trips_created_at_idx on trips (created_at desc);

create table if not exists itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_number int not null default 1,
  title text not null,
  notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists itinerary_items_trip_day_sort_idx
  on itinerary_items (trip_id, day_number, sort_order, created_at);

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checklist_items_trip_sort_idx
  on checklist_items (trip_id, done, sort_order, created_at);

create table if not exists outfit_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_number int not null default 1,
  title text not null,
  items text[] not null default '{}'::text[],
  notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outfit_items_trip_day_sort_idx
  on outfit_items (trip_id, day_number, sort_order, created_at);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on trips;
create trigger trips_set_updated_at
before update on trips
for each row execute function set_updated_at();

drop trigger if exists itinerary_items_set_updated_at on itinerary_items;
create trigger itinerary_items_set_updated_at
before update on itinerary_items
for each row execute function set_updated_at();

drop trigger if exists checklist_items_set_updated_at on checklist_items;
create trigger checklist_items_set_updated_at
before update on checklist_items
for each row execute function set_updated_at();

drop trigger if exists outfit_items_set_updated_at on outfit_items;
create trigger outfit_items_set_updated_at
before update on outfit_items
for each row execute function set_updated_at();

