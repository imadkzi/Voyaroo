import { NextResponse } from "next/server";

const ALLOWED_IMAGE_HOSTS = new Set(["images.pexels.com", "picsum.photos"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("url") ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
  }

  const res = await fetch(target.toString(), {
    // Keep caching safe and consistent: the browser caches our URL,
    // and we allow upstream caching where possible.
    cache: "force-cache",
    headers: {
      Accept: "image/*",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const body = res.body;

  if (!body) {
    return NextResponse.json({ error: "empty_body" }, { status: 502 });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Cache for a day; allow serving stale while revalidating.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

