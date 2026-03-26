import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { query } from "../../../../lib/db/postgres";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await query(`delete from trips where slug = $1 and owner_id = $2`, [slug, userId]);

  return NextResponse.json({ ok: true });
}

