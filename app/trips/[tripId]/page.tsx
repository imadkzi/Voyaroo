import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/AppShell";
import { TripExperience } from "../../../components/TripExperience";
import { getTripById } from "../../../lib/trips";
import { parseTripTab } from "../../../lib/trip-tabs";
import { requireSessionUser } from "../../../lib/session";
import styles from "../../../styles/pages/TripLoading.module.scss";

function TripFallback() {
  return (
    <div className={styles.fallback} aria-hidden>
      <div className={styles.fallback__pulse} />
      <p className={styles.fallback__text}>Loading trip…</p>
    </div>
  );
}

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { tripId } = await params;
  const user = await requireSessionUser();
  const trip = await getTripById(tripId, user.id);
  if (!trip) {
    const h = await headers();
    console.error("trip_page_not_found", {
      tripId,
      userId: user.id,
      host: h.get("host"),
      forwardedHost: h.get("x-forwarded-host"),
      forwardedFor: h.get("x-forwarded-for"),
      requestId: h.get("x-request-id"),
    });
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const tab = parseTripTab(sp.tab);

  return (
    <AppShell
      title={trip.title}
      brandKicker="Trip"
      backHref="/"
      backLabel="All trips"
    >
      <Suspense fallback={<TripFallback />}>
        <TripExperience trip={trip} tab={tab} />
      </Suspense>
    </AppShell>
  );
}
