create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

alter table trips
  add column if not exists owner_id uuid references users(id) on delete cascade;

create index if not exists trips_owner_created_at_idx
  on trips (owner_id, created_at desc);

