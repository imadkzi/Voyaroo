import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { listTrips } from "../../../lib/trips";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ trips: [] }, { status: 401 });

  const trips = await listTrips(userId);
  return NextResponse.json({
    trips: trips.map((t) => ({
      id: t.id,
      title: t.title,
      departureAt: t.departureAt,
      locationLabel: t.locationLabel,
    })),
  });
}

