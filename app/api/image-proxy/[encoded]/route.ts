import { NextResponse } from "next/server";
import https from "node:https";
import { Readable } from "node:stream";

const ALLOWED_IMAGE_HOSTS = new Set(["images.pexels.com", "picsum.photos"]);

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function fetchHttps(
  url: URL,
  { insecure }: { insecure: boolean },
): Promise<{ status: number; headers: Record<string, string | string[]>; body: Readable | null }> {
  const agent = new https.Agent({ keepAlive: true, rejectUnauthorized: !insecure });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "GET",
        headers: { Accept: "image/*" },
        agent,
      },
      (res) => {
        resolve({
          status: res.statusCode ?? 502,
          headers: res.headers as Record<string, string | string[]>,
          body: res,
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ encoded: string }> },
) {
  const { encoded } = await params;
  if (!encoded) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  let target: URL;
  try {
    const raw = base64UrlDecode(encoded);
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
  }

  const insecure = process.env.NODE_ENV === "development";
  const res = await fetchHttps(target, { insecure });

  if (res.status >= 300 && res.status < 400 && res.headers.location) {
    const next = new URL(Array.isArray(res.headers.location) ? res.headers.location[0] : res.headers.location, target);
    if (next.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(next.hostname)) {
      const redirected = await fetchHttps(next, { insecure });
      if (redirected.status >= 200 && redirected.status < 300 && redirected.body) {
        return new NextResponse(Readable.toWeb(redirected.body) as unknown as ReadableStream, {
          status: 200,
          headers: {
            "Content-Type":
              (Array.isArray(redirected.headers["content-type"])
                ? redirected.headers["content-type"][0]
                : redirected.headers["content-type"]) ?? "application/octet-stream",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
      return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
    }
  }

  if (res.status < 200 || res.status >= 300 || !res.body) {
    return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
  }

  return new NextResponse(Readable.toWeb(res.body) as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type":
        (Array.isArray(res.headers["content-type"])
          ? res.headers["content-type"][0]
          : res.headers["content-type"]) ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

