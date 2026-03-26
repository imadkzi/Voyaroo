import { NextResponse } from "next/server";

function toSeededFallbackHero(query: string) {
  const q = query.trim();
  if (!q) return "";
  return `https://picsum.photos/seed/${encodeURIComponent(q)}/1600/900`;
}

type PexelsPhoto = {
  width?: number;
  height?: number;
  src?: {
    landscape?: string;
    large2x?: string;
    large?: string;
    original?: string;
  };
};

function scorePhoto(photo: PexelsPhoto) {
  const w = photo.width ?? 0;
  const h = photo.height ?? 1;
  const ratio = w / h;
  const landscapeBias = ratio >= 1.3 ? 1 : ratio >= 1.1 ? 0.6 : 0.2;
  const area = w * h;
  return landscapeBias + Math.min(area / 3_000_000, 2);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ imageUrl: "", source: "none" });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      imageUrl: toSeededFallbackHero(q),
      source: "fallback",
    });
  }

  try {
    const primary = q.split(",")[0]?.trim() || q;
    const country = q.split(",").at(-1)?.trim() || "";

    const url = new URL("https://api.pexels.com/v1/search");
    // Make queries more destination-identifiable and less generic.
    // (Coastal towns otherwise skew to random boats/beaches.)
    url.searchParams.set(
      "query",
      `${primary} ${country} travel landscape city`
    );
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("per_page", "12");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        imageUrl: toSeededFallbackHero(q),
        source: "fallback",
      });
    }

    const json = (await res.json()) as { photos?: PexelsPhoto[] };
    const photos = json.photos ?? [];

    const picked = [...photos]
      .sort((a, b) => scorePhoto(b) - scorePhoto(a))
      .find((p) => p.src?.landscape || p.src?.large2x || p.src?.large || p.src?.original);

    const imageUrl =
      picked?.src?.landscape ??
      picked?.src?.large2x ??
      picked?.src?.large ??
      picked?.src?.original ??
      toSeededFallbackHero(q);

    return NextResponse.json({ imageUrl, source: "pexels" });
  } catch {
    return NextResponse.json({
      imageUrl: toSeededFallbackHero(q),
      source: "fallback",
    });
  }
}

