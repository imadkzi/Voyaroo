import { query } from "./db/postgres";

export type TripListItem = {
  /** Slug used in routes: `/trips/:tripId` */
  id: string;
  title: string;
  subtitle: string;
  /** ISO 8601 — countdown runs until this instant */
  departureAt: string | null;
  /** Location label for image alt text */
  locationLabel: string;
  heroImageSrc: string;
  /** Internal DB id (uuid) for related tables. */
  tripUuid: string;
};

export type ItineraryItem = {
  id: string;
  dayNumber: number;
  title: string;
  notes: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type OutfitItem = {
  id: string;
  dayNumber: number;
  title: string;
  items: string[];
  notes: string;
};

export async function listTrips(userId: string): Promise<TripListItem[]> {
  type Row = {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    departure_at: string | null;
    location_label: string;
    hero_image_src: string;
  };

  const rows = await query<Row>(
    `select id::text as id,
            slug,
            title,
            subtitle,
            departure_at::text as departure_at,
            location_label,
            hero_image_src
     from trips
     where owner_id = $1
     order by created_at desc`,
    [userId],
  );

  return rows.map(
    (t): TripListItem => ({
      id: t.slug,
      tripUuid: t.id,
      title: t.title,
      subtitle: t.subtitle,
      departureAt: t.departure_at,
      locationLabel: t.location_label,
      heroImageSrc: t.hero_image_src,
    }),
  );
}

export async function getTripById(
  tripSlug: string,
  userId: string,
): Promise<TripListItem | null> {
  type Row = {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    departure_at: string | null;
    location_label: string;
    hero_image_src: string;
  };

  const rows = await query<Row>(
    `select id::text as id,
            slug,
            title,
            subtitle,
            departure_at::text as departure_at,
            location_label,
            hero_image_src
     from trips
     where slug = $1 and owner_id = $2
     limit 1`,
    [tripSlug, userId],
  );

  const data = rows[0];
  if (!data) return null;

  return {
    id: data.slug,
    tripUuid: data.id,
    title: data.title,
    subtitle: data.subtitle,
    departureAt: data.departure_at,
    locationLabel: data.location_label,
    heroImageSrc: data.hero_image_src,
  };
}

export async function listItineraryItems(tripUuid: string) {
  type Row = { id: string; day_number: number; title: string; notes: string };
  const rows = await query<Row>(
    `select id::text as id, day_number, title, notes
     from itinerary_items
     where trip_id = $1
     order by day_number asc, sort_order asc, created_at asc`,
    [tripUuid],
  );
  return rows.map(
    (r): ItineraryItem => ({
      id: r.id,
      dayNumber: r.day_number,
      title: r.title,
      notes: r.notes,
    }),
  );
}

export async function listChecklistItems(tripUuid: string) {
  type Row = { id: string; label: string; done: boolean };
  const rows = await query<Row>(
    `select id::text as id, label, done
     from checklist_items
     where trip_id = $1
     order by done asc, sort_order asc, created_at asc`,
    [tripUuid],
  );
  return rows.map(
    (r): ChecklistItem => ({
      id: r.id,
      label: r.label,
      done: r.done,
    }),
  );
}

export async function listOutfitItems(tripUuid: string) {
  type Row = {
    id: string;
    day_number: number;
    title: string;
    items: string[];
    notes: string;
  };
  const rows = await query<Row>(
    `select id::text as id, day_number, title, items, notes
     from outfit_items
     where trip_id = $1
     order by day_number asc, sort_order asc, created_at asc`,
    [tripUuid],
  );
  return rows.map(
    (r): OutfitItem => ({
      id: r.id,
      dayNumber: r.day_number,
      title: r.title,
      items: r.items ?? [],
      notes: r.notes,
    }),
  );
}
