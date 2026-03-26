import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "../../../components/AppShell";
import { DateTimeField } from "../../../components/DateTimeField";
import { LocationSearchInput } from "../../../components/LocationSearchInput";
import styles from "../../../styles/pages/NewTrip.module.scss";
import { query } from "../../../lib/db/postgres";
import { requireSessionUser } from "../../../lib/session";

function slugify(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function createUniqueSlug(title: string) {
  const base = slugify(title) || "trip";
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base}-${suffix}`;
}

export default async function NewTripPage() {
  await requireSessionUser();

  async function createTrip(formData: FormData) {
    "use server";
    const user = await requireSessionUser();

    const title = String(formData.get("title") ?? "").trim();
    const subtitle = String(formData.get("subtitle") ?? "").trim();
    const locationLabel = String(formData.get("locationLabel") ?? "").trim();
    const heroImageSrcRaw = String(formData.get("heroImageSrc") ?? "").trim();
    const departureAtRaw = String(formData.get("departureAt") ?? "").trim();

    if (!title) {
      return;
    }

    const slug = await createUniqueSlug(title);
    const departureAt = departureAtRaw
      ? new Date(departureAtRaw).toISOString()
      : null;
    const heroImageSrc =
      heroImageSrcRaw ||
      (locationLabel
        ? `https://picsum.photos/seed/${encodeURIComponent(
            locationLabel,
          )}/1600/900`
        : "");

    await query(
      `insert into trips (slug, owner_id, title, subtitle, location_label, hero_image_src, departure_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        slug,
        user.id,
        title,
        subtitle,
        locationLabel,
        heroImageSrc,
        departureAt ? new Date(departureAt) : null,
      ],
    );

    redirect(`/trips/${slug}`);
  }

  return (
    <AppShell title="New trip">
      <div className={styles.newTrip}>
        <p className={styles.newTrip__title}>Create a trip</p>
        <p className={styles.newTrip__subtitle}>Add a new trip to your list</p>

        <form action={createTrip}>
          <div className={styles.newTrip__form}>
            <input
              name="title"
              required
              placeholder="Trip title (e.g. Barcelona)"
              className={styles.newTrip__input}
            />
            <input
              name="subtitle"
              placeholder="Subtitle (e.g. Apr 12–18 · 2 travellers · City & coast)"
              className={styles.newTrip__input}
            />
            <LocationSearchInput />
            <DateTimeField
              name="departureAt"
              label="Departure (optional)"
              placeholder="Select date & time"
            />

            <div className={styles.newTrip__actions}>
              <Link
                href="/"
                className={`${styles.btn} ${styles["btn--secondary"]}`}
              >
                Back
              </Link>
              <button
                type="submit"
                className={`${styles.btn} ${styles["btn--primary"]}`}
              >
                Create
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

