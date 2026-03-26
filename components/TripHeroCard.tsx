import Link from "next/link";
import type { TripListItem } from "../lib/trips";
import { TripHeroPanel } from "./TripHeroPanel";
import styles from "../styles/components/TripHeroCard.module.scss";
import { ChevronRight } from "lucide-react";

export function TripHeroCard({
  trip,
  imagePriority = false,
}: {
  trip: TripListItem;
  imagePriority?: boolean;
}) {
  return (
    <Link href={`/trips/${trip.id}`} className={styles.tripCard}>
      <TripHeroPanel trip={trip} imagePriority={imagePriority} headingTag="h2" />
      <div className={styles.tripCard__footer}>
        <p className={styles.tripCard__subtitle}>{trip.subtitle}</p>
        <ChevronRight className={styles.tripCard__chevron} aria-hidden />
      </div>
    </Link>
  );
}
