export const TRIP_TAB_IDS = [
  "overview",
  "itinerary",
  "checklist",
  "outfits",
] as const;

export type TripTabId = (typeof TRIP_TAB_IDS)[number];

export function parseTripTab(raw: string | undefined): TripTabId {
  if (raw && TRIP_TAB_IDS.includes(raw as TripTabId)) {
    return raw as TripTabId;
  }
  return "overview";
}

export function tripTabHref(tripId: string, tab: TripTabId): string {
  const base = `/trips/${tripId}`;
  if (tab === "overview") {
    return base;
  }
  return `${base}?tab=${tab}`;
}
