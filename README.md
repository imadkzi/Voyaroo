# Voyaroo

Mobile-first trip planning app (Next.js 16 + Postgres + Auth.js credentials).

## Features

- Account signup/login with per-user trip data isolation
- Trips with itinerary, checklist, and outfits
- Location autocomplete + hero image auto-pick (Geoapify + Pexels fallback)
- PWA manifest + branded icons

## Local setup

1) Install dependencies

```bash
npm install
```

2) Create env file

```bash
cp .env.example .env.local
```

3) Start Postgres

```bash
npm run db:up
```

4) Run DB migrations

```bash
npm run db:migrate
```

5) Start app

```bash
npm run dev
```

## Required environment variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`

Optional:
- `PEXELS_API_KEY`
- `NEXT_PUBLIC_GEOAPIFY_API_KEY`
- `NODE_EXTRA_CA_CERTS` (for corporate TLS interception environments)

## Testing on a real device

- Run your dev server on your machine.
- Access via your machine LAN IP, e.g. `http://192.168.1.20:3000`.
- Set `NEXTAUTH_URL` in `.env.local` to that same LAN URL.
- Restart `npm run dev` after env changes.

## Production deploy checklist

1) Provision managed Postgres (Neon/Railway/RDS)
2) Set production env vars:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (https domain)
   - provider keys if used
3) Run migrations:

```bash
npm run db:migrate
```

4) Build and smoke test:

```bash
npm run build
```

5) Verify auth + data isolation:
- User A cannot view User B trips
- Login/register throttling is working
