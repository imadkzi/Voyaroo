const ALLOWED_IMAGE_HOSTS = new Set([
  "images.pexels.com",
  "picsum.photos",
]);

function base64UrlEncode(input: string) {
  // Implement base64url ourselves for deterministic output across runtimes.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof Buffer !== "undefined") {
    const b64 = Buffer.from(input, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  // Browser fallback.
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function toProxiedImageUrl(src: string) {
  const raw = (src ?? "").trim();
  if (!raw) return raw;
  if (raw.startsWith("/")) return raw;

  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return raw;
    if (!ALLOWED_IMAGE_HOSTS.has(u.hostname)) return raw;
    return `/api/image-proxy/${base64UrlEncode(u.toString())}`;
  } catch {
    return raw;
  }
}

