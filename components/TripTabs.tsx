"use client";

import Link from "next/link";
import styles from "../styles/components/TripTabs.module.scss";
import type { TripTabId } from "../lib/trip-tabs";
import { tripTabHref } from "../lib/trip-tabs";

const tabs: { id: TripTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "itinerary", label: "Itinerary" },
  { id: "checklist", label: "Checklist" },
  { id: "outfits", label: "Outfits" },
];

export function TripTabs({
  tripId,
  activeTab,
}: {
  tripId: string;
  activeTab: TripTabId;
}) {
  return (
    <div className={styles.tripTabs}>
      <div className={styles.tripTabs__row}>
        {tabs.map((t) => {
          const href = tripTabHref(tripId, t.id);
          const active = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={href}
              scroll={false}
              className={[
                styles.tripTabs__tab,
                active ? styles["tripTabs__tab--active"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.tripTabs__label}>
                {t.label}
                {active ? (
                  <span className={styles.tripTabs__indicator} />
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
