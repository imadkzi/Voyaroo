import { AppShell } from "../components/AppShell";
import { TripsList } from "../components/TripsList";
import { listTrips } from "../lib/trips";
import { requireSessionUser } from "../lib/session";
import styles from "../styles/pages/TripsHome.module.scss";

export default async function Home() {
  const user = await requireSessionUser();
  const trips = await listTrips(user.id);
  return (
    <AppShell title="Trips" actionHref="/trips/new" actionLabel="New trip">
      <div className={styles.tripsHome}>
        <p className={styles.tripsHome__kicker}>Upcoming</p>
        <h2 className={styles.tripsHome__heading}>Your trips</h2>
        <p className={styles.tripsHome__lede}>
          Tap a trip for countdown, itinerary, checklist, and outfits.
        </p>

        <section className={styles.list}>
          {trips.length ? (
            <TripsList initialTrips={trips} />
          ) : (
            <p className={styles.tripsHome__lede}>
              No trips yet. Tap “New trip” to create your first one.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
