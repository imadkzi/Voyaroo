import { NextResponse } from "next/server";
import { auth } from "../../../../../../lib/auth";
import { query } from "../../../../../../lib/db/postgres";
import { getTripIdBySlugForOwner } from "../../../../../../lib/trip-owner";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { slug, itemId } = await params;
  const tripId = await getTripIdBySlugForOwner(slug, userId);
  if (!tripId) return NextResponse.json({ ok: false }, { status: 404 });

  const body = (await request.json().catch(() => null)) as
    | { dayNumber?: number; title?: string; items?: string[]; notes?: string }
    | null;

  const dayNumberRaw = body?.dayNumber;
  const dayNumber =
    typeof dayNumberRaw === "number" &&
    Number.isFinite(dayNumberRaw) &&
    dayNumberRaw >= 1
      ? dayNumberRaw
      : undefined;

  const title = typeof body?.title === "string" ? body.title.trim() : undefined;
  const items = Array.isArray(body?.items) ? body!.items.filter(Boolean) : undefined;
  const notes = typeof body?.notes === "string" ? body.notes.trim() : undefined;

  const rows = await query<{
    id: string;
    day_number: number;
    title: string;
    items: string[];
    notes: string;
  }>(
    `update outfit_items
     set day_number = coalesce($3, day_number),
         title = coalesce($4, title),
         items = coalesce($5, items),
         notes = coalesce($6, notes)
     where id = $1 and trip_id = $2
     returning id::text as id, day_number, title, items, notes`,
    [itemId, tripId, dayNumber ?? null, title ?? null, items ?? null, notes ?? null],
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { slug, itemId } = await params;
  const tripId = await getTripIdBySlugForOwner(slug, userId);
  if (!tripId) return NextResponse.json({ ok: false }, { status: 404 });

  await query(`delete from outfit_items where id = $1 and trip_id = $2`, [
    itemId,
    tripId,
  ]);
  return NextResponse.json({ ok: true });
}

