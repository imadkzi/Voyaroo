import { NextResponse } from "next/server";
import { auth } from "../../../../../lib/auth";
import { query } from "../../../../../lib/db/postgres";
import { getTripIdBySlugForOwner } from "../../../../../lib/trip-owner";

function logMissingTripContext(request: Request, slug: string, userId: string) {
  console.error("trip_lookup_failed_checklist", {
    slug,
    userId,
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedFor: request.headers.get("x-forwarded-for"),
    requestId: request.headers.get("x-request-id"),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ items: [] }, { status: 401 });

  const { slug } = await params;
  const tripId = await getTripIdBySlugForOwner(slug, userId);
  if (!tripId) {
    logMissingTripContext(request, slug, userId);
    return NextResponse.json({ ok: false, items: [] }, { status: 404 });
  }

  const rows = await query<{ id: string; label: string; done: boolean }>(
    `select id::text as id, label, done
     from checklist_items
     where trip_id = $1
     order by done asc, sort_order asc, created_at asc`,
    [tripId],
  );
  return NextResponse.json({ items: rows });
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
  if (!tripId) {
    logMissingTripContext(request, slug, userId);
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { label?: string } | null;
  const label = String(body?.label ?? "").trim();
  if (!label) return NextResponse.json({ ok: false }, { status: 400 });

  const rows = await query<{ id: string; label: string; done: boolean }>(
    `insert into checklist_items (trip_id, label)
     values ($1, $2)
     returning id::text as id, label, done`,
    [tripId, label],
  );

  return NextResponse.json({ ok: true, item: rows[0] ?? null });
}

