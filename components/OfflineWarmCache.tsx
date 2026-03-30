"use client";

import { useEffect } from "react";

type TripsIndexResponse = {
  trips?: Array<{ id: string }>;
};

const CACHE_SYNC_KEY = "voyaroo-offline-cache-sync-at";
const CACHE_SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

async function warmOfflineCache() {
  const now = Date.now();
  const last = Number(localStorage.getItem(CACHE_SYNC_KEY) ?? 0);
  if (Number.isFinite(last) && now - last < CACHE_SYNC_INTERVAL_MS) return;

  const tripsRes = await fetch("/api/trips", {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).catch(() => null);
  if (!tripsRes || !tripsRes.ok) return;

  const tripsJson = (await tripsRes.json().catch(() => null)) as TripsIndexResponse | null;
  const tripIds = (tripsJson?.trips ?? []).map((t) => t.id).filter(Boolean);

  const urls = new Set<string>(["/", "/settings"]);
  for (const id of tripIds) {
    urls.add(`/trips/${encodeURIComponent(id)}`);
    urls.add(`/trips/${encodeURIComponent(id)}?tab=overview`);
    urls.add(`/trips/${encodeURIComponent(id)}?tab=itinerary`);
    urls.add(`/trips/${encodeURIComponent(id)}?tab=checklist`);
    urls.add(`/trips/${encodeURIComponent(id)}?tab=outfits`);

    urls.add(`/api/trips/${encodeURIComponent(id)}/itinerary`);
    urls.add(`/api/trips/${encodeURIComponent(id)}/checklist`);
    urls.add(`/api/trips/${encodeURIComponent(id)}/outfits`);
  }

  await Promise.allSettled(
    Array.from(urls).map((url) =>
      fetch(url, {
        credentials: "include",
        cache: "reload",
      }),
    ),
  );

  localStorage.setItem(CACHE_SYNC_KEY, String(Date.now()));
}

export function OfflineWarmCache() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const run = () => {
      if (!navigator.onLine) return;
      void warmOfflineCache();
    };

    run();
    window.addEventListener("online", run);
    window.addEventListener("focus", run);
    return () => {
      window.removeEventListener("online", run);
      window.removeEventListener("focus", run);
    };
  }, []);

  return null;
}

