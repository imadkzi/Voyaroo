import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // NOTE: This route can fail behind corporate TLS interception (e.g. Zscaler),
  // since it makes a server-side HTTPS request. The UI calls Nominatim directly
  // from the browser for reliability, but we keep this route for future use.

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim requires identifying User-Agent.
      "User-Agent": "voyaroo-local-dev",
      Accept: "application/json",
    },
    // Keep this dynamic; results vary per query.
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { results: [] },
      { status: 200, headers: { "x-places-error": String(res.status) } },
    );
  }

  const data = (await res.json()) as Array<{ display_name?: string }>;
  const results = (data ?? [])
    .map((r) => r.display_name)
    .filter((v): v is string => Boolean(v))
    .slice(0, 6);

  return NextResponse.json({ results });
}

