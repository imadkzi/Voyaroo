import { NextResponse } from "next/server";
import { auth } from "../../../../../lib/auth";
import { query } from "../../../../../lib/db/postgres";
import { getTripIdBySlugForOwner } from "../../../../../lib/trip-owner";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ items: [] }, { status: 401 });

  const { slug } = await params;
  const tripId = await getTripIdBySlugForOwner(slug, userId);
  if (!tripId) return NextResponse.json({ items: [] }, { status: 200 });

  const rows = await query<{
    id: string;
    day_number: number;
    title: string;
    items: string[];
    notes: string;
  }>(
    `select id::text as id, day_number, title, items, notes
     from outfit_items
     where trip_id = $1
     order by day_number asc, sort_order asc, created_at asc`,
    [tripId],
  );

  const items = rows.map((r) => ({
    id: r.id,
    dayNumber: r.day_number,
    title: r.title,
    items: r.items ?? [],
    notes: r.notes,
  }));

  return NextResponse.json({ items });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { slug } = await params;
  const tripId = await getTripIdBySlugForOwner(slug, userId);
  if (!tripId) return NextResponse.json({ ok: false }, { status: 404 });

  const body = (await request.json().catch(() => null)) as
    | { dayNumber?: number; title?: string; items?: string[]; notes?: string }
    | null;

  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ ok: false }, { status: 400 });

  const dayNumberRaw = Number(body?.dayNumber ?? 1);
  const dayNumber =
    Number.isFinite(dayNumberRaw) && dayNumberRaw >= 1 ? dayNumberRaw : 1;
  const items = Array.isArray(body?.items) ? body!.items.filter(Boolean) : [];
  const notes = String(body?.notes ?? "").trim();

  const rows = await query<{
    id: string;
    day_number: number;
    title: string;
    items: string[];
    notes: string;
  }>(
    `insert into outfit_items (trip_id, day_number, title, items, notes)
     values ($1, $2, $3, $4, $5)
     returning id::text as id, day_number, title, items, notes`,
    [tripId, dayNumber, title, items, notes],
  );

  const r = rows[0];
  return NextResponse.json({
    ok: true,
    item: r
      ? {
          id: r.id,
          dayNumber: r.day_number,
          title: r.title,
          items: r.items ?? [],
          notes: r.notes,
        }
      : null,
  });
}

