"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { TripListItem } from "../lib/trips";
import { TripHeroPanel } from "./TripHeroPanel";
import cardStyles from "../styles/components/TripHeroCard.module.scss";
import styles from "../styles/components/TripsList.module.scss";

type TripWithUi = TripListItem & { _optimisticDeleting?: boolean };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function TripsList({ initialTrips }: { initialTrips: TripListItem[] }) {
  const [trips, setTrips] = useState<TripWithUi[]>(() => initialTrips);
  const [deleting, setDeleting] = useState<string | null>(null);

  const ordered = useMemo(() => trips, [trips]);

  async function deleteTrip(slug: string) {
    if (deleting) return;
    setDeleting(slug);
    setTrips((prev) =>
      prev.map((t) => (t.id === slug ? { ...t, _optimisticDeleting: true } : t)),
    );

    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Delete failed");
      }
      setTrips((prev) => prev.filter((t) => t.id !== slug));
    } catch {
      setTrips((prev) =>
        prev.map((t) =>
          t.id === slug ? { ...t, _optimisticDeleting: false } : t,
        ),
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className={styles.list}>
      {ordered.map((trip, index) => (
        <SwipeToDeleteCard
          key={trip.id}
          trip={trip}
          imagePriority={index === 0}
          onDelete={() => deleteTrip(trip.id)}
          disabled={Boolean(deleting)}
        />
      ))}
    </div>
  );
}

function SwipeToDeleteCard({
  trip,
  imagePriority,
  onDelete,
  disabled,
}: {
  trip: TripWithUi;
  imagePriority: boolean;
  onDelete: () => void;
  disabled: boolean;
}) {
  const maxSwipe = 96;
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number; startX: number } | null>(
    null,
  );

  const isLockedOpen = x <= -64;

  function onPointerDown(e: React.PointerEvent) {
    if (disabled) return;
    if ((e.target as HTMLElement).closest("button")) return;
    startRef.current = { x: e.clientX, y: e.clientY, startX: x };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    // Only engage when the gesture is primarily horizontal.
    if (Math.abs(dx) < 4 && Math.abs(dy) > 6) {
      return;
    }

    const next = clamp(startRef.current.startX + dx, -maxSwipe, 0);
    setX(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging) return;
    setDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    // Snap closed or open.
    if (x < -48) {
      setX(-maxSwipe);
    } else {
      setX(0);
    }
  }

  function close() {
    setX(0);
  }

  return (
    <div className={styles.row}>
      <div className={styles.behind} aria-hidden>
        <button
          type="button"
          className={styles.delete}
          onClick={onDelete}
          disabled={disabled}
        >
          Delete
        </button>
      </div>

      <div
        className={[
          styles.front,
          dragging ? styles["front--dragging"] : "",
          trip._optimisticDeleting ? styles["front--deleting"] : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Link
          href={`/trips/${trip.id}`}
          className={cardStyles.tripCard}
          onClick={(e) => {
            if (isLockedOpen || dragging || x !== 0) {
              e.preventDefault();
              close();
            }
          }}
        >
          <TripHeroPanel
            trip={trip}
            imagePriority={imagePriority}
            headingTag="h2"
          />
          <div className={cardStyles.tripCard__footer}>
            <p className={cardStyles.tripCard__subtitle}>{trip.subtitle}</p>
            <ChevronRight className={cardStyles.tripCard__chevron} aria-hidden />
          </div>
        </Link>
      </div>
    </div>
  );
}

