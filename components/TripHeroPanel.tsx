import Image from "next/image";
import type { TripListItem } from "../lib/trips";
import { TripCountdown } from "./TripCountdown";
import styles from "../styles/components/TripHeroPanel.module.scss";
import { toProxiedImageUrl } from "../lib/image-proxy";

type HeadingTag = "h1" | "h2";

export function TripHeroPanel({
  trip,
  imagePriority = false,
  headingTag = "h2",
  rounded = false,
}: {
  trip: TripListItem;
  imagePriority?: boolean;
  headingTag?: HeadingTag;
  /** Use full rounded hero on trip hub (no footer strip below) */
  rounded?: boolean;
}) {
  const hasHero = Boolean(trip.heroImageSrc && trip.heroImageSrc.trim());
  const imageSrc = hasHero ? toProxiedImageUrl(trip.heroImageSrc) : "";
  const remoteHero = hasHero && /^https?:\/\//i.test(imageSrc);
  const TitleTag = headingTag;

  return (
    <div
      className={`${styles.media} ${rounded ? styles["media--rounded"] : ""}`}
    >
      {hasHero ? (
        <Image
          src={imageSrc}
          alt={`${trip.title} — ${trip.locationLabel}`}
          fill
          className={styles.img}
          sizes="(max-width: 448px) 100vw, 448px"
          priority={imagePriority}
          unoptimized={remoteHero}
        />
      ) : (
        <div className={styles.img} aria-hidden />
      )}
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.inner}>
        <TitleTag className={styles.title}>{trip.title}</TitleTag>
        <TripCountdown departureAt={trip.departureAt} />
      </div>
    </div>
  );
}
