"use client";

import { useMemo, useSyncExternalStore } from "react";
import styles from "../styles/components/TripCountdown.module.scss";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function subscribeNow(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(id);
}

function getNowSnapshot() {
  return Date.now();
}

function getNowServerSnapshot() {
  return 0;
}

export function TripCountdown({ departureAt }: { departureAt: string | null }) {
  const target = useMemo(
    () => (departureAt ? new Date(departureAt).getTime() : Number.NaN),
    [departureAt],
  );
  const now = useSyncExternalStore(
    subscribeNow,
    getNowSnapshot,
    getNowServerSnapshot,
  );

  if (!now) {
    return (
      <div className={styles.countdown} aria-hidden="true">
        <div className={styles.countdown__grid}>
          {(["00", "00", "00", "00"] as const).map((v, i) => (
            <div key={i} className={styles.countdown__unit}>
              <span className={styles.countdown__value}>{v}</span>
              <span className={styles.countdown__label}>
                {["days", "hrs", "min", "sec"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const diff = target - now;

  if (Number.isNaN(target)) {
    return <p className={styles.countdown__fallback}>Date TBC</p>;
  }

  if (diff <= 0) {
    return <p className={styles.countdown__live}>You’re on your way ✈️</p>;
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  const parts = [
    { value: String(days), label: "days" },
    { value: pad(hours), label: "hrs" },
    { value: pad(minutes), label: "min" },
    { value: pad(seconds), label: "sec" },
  ] as const;

  return (
    <div className={styles.countdown}>
      <p className={styles.countdown__kicker}>Departure in</p>
      <div className={styles.countdown__grid}>
        {parts.map((p) => (
          <div key={p.label} className={styles.countdown__unit}>
            <span className={styles.countdown__value}>{p.value}</span>
            <span className={styles.countdown__label}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
