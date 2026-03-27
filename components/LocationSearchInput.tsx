"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/components/LocationSearchInput.module.scss";

type PlaceResult = {
  label: string;
};

type HeroSource = "pexels" | "fallback" | "none";

function normalizeLocationLabel(raw: string) {
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return raw.trim();
  if (parts.length === 1) return parts[0];
  return `${parts[0]}, ${parts[parts.length - 1]}`;
}

function toSeededFallbackHero(query: string) {
  const q = query.trim();
  if (!q) return "";
  // Always-available deterministic fallback image by location seed.
  return `https://picsum.photos/seed/${encodeURIComponent(q)}/1600/900`;
}

async function fetchLocationHero(query: string) {
  const q = query.trim();
  if (!q) return { imageUrl: "", source: "none" as HeroSource };

  try {
    const res = await fetch(`/api/location-image?q=${encodeURIComponent(q)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { imageUrl: toSeededFallbackHero(q), source: "fallback" as HeroSource };
    }

    const json = (await res.json()) as { imageUrl?: string; source?: HeroSource };
    if (json.imageUrl) {
      return {
        imageUrl: json.imageUrl,
        source: json.source ?? "fallback",
      };
    }
  } catch {
    // Ignore and use fallback.
  }

  return { imageUrl: toSeededFallbackHero(q), source: "fallback" as HeroSource };
}

export function LocationSearchInput({
  locationName = "locationLabel",
  heroName = "heroImageSrc",
}: {
  locationName?: string;
  heroName?: string;
}) {
  const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? "";
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [hero, setHero] = useState<string>("");
  const [heroSource, setHeroSource] = useState<HeroSource>("none");
  const [suggestionUnavailable, setSuggestionUnavailable] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const heroPreview = useMemo(
    () => hero || toSeededFallbackHero(selected),
    [hero, selected],
  );

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      return;
    }

    const id = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        if (!geoapifyKey) {
          setSuggestionUnavailable(true);
          setResults([]);
          return;
        }

        const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
        url.searchParams.set("apiKey", geoapifyKey);
        url.searchParams.set("type", "city");
        url.searchParams.set("limit", "6");
        url.searchParams.set("lang", "en");
        url.searchParams.set("text", query);

        const res = await fetch(url.toString(), {
          signal: ac.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          setSuggestionUnavailable(true);
          setResults([]);
          return;
        }

        const json = (await res.json()) as {
          features?: Array<{ properties?: { city?: string; country?: string; formatted?: string } }>;
        };

        const labels = (json.features ?? [])
          .map((r) => {
            const p = r.properties;
            if (!p) return "";
            if (p.city && p.country) return `${p.city}, ${p.country}`;
            return p.formatted ?? "";
          })
          .filter((v): v is string => Boolean(v))
          .map((v) => normalizeLocationLabel(v))
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .slice(0, 6);

        setResults(labels.map((label) => ({ label })));
        setSuggestionUnavailable(false);
      } catch {
        setSuggestionUnavailable(true);
        setResults([]);
      }
    }, 250);

    return () => window.clearTimeout(id);
  }, [q, geoapifyKey]);

  const visibleResults = q.trim().length >= 2 ? results : [];

  async function pick(label: string) {
    const normalized = normalizeLocationLabel(label);
    setSelected(normalized);
    setQ(normalized);
    setOpen(false);
    const nextHero = await fetchLocationHero(normalized);
    setHero(nextHero.imageUrl);
    setHeroSource(nextHero.source);
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.label}>
        <span className={styles.label__text}>Location</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search a city / place (e.g. Barcelona, Spain)"
          className={styles.input}
          autoComplete="off"
        />
      </label>

      {/* values submitted with the server action */}
      <input type="hidden" name={locationName} value={selected || q} />
      <input type="hidden" name={heroName} value={hero} />

      {open && visibleResults.length ? (
        <div className={styles.dropdown} role="listbox" aria-label="Locations">
          {visibleResults.map((r, idx) => (
            <button
              key={`${r.label}-${idx}`}
              type="button"
              className={styles.item}
              onClick={() => pick(r.label)}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.heroRow}>
        <div className={styles.heroMeta}>
          <p className={styles.heroMeta__label}>Hero image</p>
          <p className={styles.heroMeta__hint}>
            {suggestionUnavailable
              ? "Location suggestions are temporarily unavailable."
              : "Type to get city suggestions."}
          </p>
          <p className={styles.heroMeta__hint}>
            {heroSource === "fallback"
              ? "Image provider unavailable - using fallback image."
              : "Auto-picked from Pexels by location."}
          </p>
        </div>
        {heroPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.heroPreview} src={heroPreview} alt="" />
        ) : (
          <div className={styles.heroPreview} aria-hidden />
        )}
      </div>
    </div>
  );
}

