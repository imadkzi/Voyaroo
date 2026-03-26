-- Auth rate-limiting state (DB-backed so it works across instances)
create table if not exists auth_rate_limits (
  key text primary key,
  count int not null default 0,
  window_started_at timestamptz not null default now()
);

-- Ensure every trip has an owner before enforcing NOT NULL
do $$
declare
  fallback_user_id uuid;
begin
  if exists (select 1 from trips where owner_id is null) then
    select id into fallback_user_id
    from users
    where email = 'legacy@voyaroo.local'
    limit 1;

    if fallback_user_id is null then
      insert into users (email, name, password_hash)
      values (
        'legacy@voyaroo.local',
        'Legacy Import',
        '$2b$12$8p9z8gW4S8W7Q2wqSg4VQeBfY2U0c1FvK8Kj9lM8u1Y0f7W6e1HfK'
      )
      returning id into fallback_user_id;
    end if;

    update trips
    set owner_id = fallback_user_id
    where owner_id is null;
  end if;
end $$;

alter table trips
  alter column owner_id set not null;

