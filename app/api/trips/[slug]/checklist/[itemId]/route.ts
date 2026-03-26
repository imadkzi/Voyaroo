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
    | { label?: string; done?: boolean }
    | null;

  const label =
    body && "label" in body && typeof body.label === "string"
      ? body.label.trim()
      : undefined;
  const done = body && typeof body.done === "boolean" ? body.done : undefined;

  const rows = await query<{ id: string; label: string; done: boolean }>(
    `update checklist_items
     set label = coalesce($3, label),
         done = coalesce($4, done)
     where id = $1 and trip_id = $2
     returning id::text as id, label, done`,
    [itemId, tripId, label ?? null, done ?? null],
  );

  return NextResponse.json({ ok: true, item: rows[0] ?? null });
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

  await query(`delete from checklist_items where id = $1 and trip_id = $2`, [
    itemId,
    tripId,
  ]);
  return NextResponse.json({ ok: true });
}

