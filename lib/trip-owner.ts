import { query } from "./db/postgres";

export async function getTripIdBySlugForOwner(slug: string, ownerId: string) {
  const rows = await query<{ id: string }>(
    `select id::text as id
     from trips
     where slug = $1 and owner_id = $2
     limit 1`,
    [slug, ownerId],
  );
  return rows[0]?.id ?? null;
}

