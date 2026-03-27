import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("./db/postgres", () => ({
  query: queryMock,
}));

import {
  getTripById,
  listChecklistItems,
  listItineraryItems,
  listOutfitItems,
  listTrips,
} from "./trips";

describe("trip data mappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listTrips maps db rows to trip list item shape", async () => {
    queryMock.mockResolvedValueOnce([
      {
        id: "uuid-1",
        slug: "rome-2026",
        title: "Rome",
        subtitle: "Summer trip",
        departure_at: "2026-07-10T08:00:00.000Z",
        location_label: "Rome, Italy",
        hero_image_src: "https://example.com/hero.jpg",
      },
    ]);

    await expect(listTrips("user-1")).resolves.toEqual([
      {
        id: "rome-2026",
        tripUuid: "uuid-1",
        title: "Rome",
        subtitle: "Summer trip",
        departureAt: "2026-07-10T08:00:00.000Z",
        locationLabel: "Rome, Italy",
        heroImageSrc: "https://example.com/hero.jpg",
      },
    ]);
  });

  it("getTripById returns null when no trip is found", async () => {
    queryMock.mockResolvedValueOnce([]);
    await expect(getTripById("missing-trip", "user-1")).resolves.toBeNull();
  });

  it("getTripById maps row to TripListItem when found", async () => {
    queryMock.mockResolvedValueOnce([
      {
        id: "uuid-2",
        slug: "tokyo-2026",
        title: "Tokyo",
        subtitle: "City break",
        departure_at: null,
        location_label: "Tokyo, Japan",
        hero_image_src: "https://example.com/tokyo.jpg",
      },
    ]);

    await expect(getTripById("tokyo-2026", "user-1")).resolves.toEqual({
      id: "tokyo-2026",
      tripUuid: "uuid-2",
      title: "Tokyo",
      subtitle: "City break",
      departureAt: null,
      locationLabel: "Tokyo, Japan",
      heroImageSrc: "https://example.com/tokyo.jpg",
    });
  });

  it("listItineraryItems maps day_number to dayNumber", async () => {
    queryMock.mockResolvedValueOnce([
      { id: "i1", day_number: 2, title: "Colosseum", notes: "Morning visit" },
    ]);

    await expect(listItineraryItems("trip-1")).resolves.toEqual([
      { id: "i1", dayNumber: 2, title: "Colosseum", notes: "Morning visit" },
    ]);
  });

  it("listChecklistItems maps rows unchanged by shape", async () => {
    queryMock.mockResolvedValueOnce([{ id: "c1", label: "Passport", done: false }]);

    await expect(listChecklistItems("trip-1")).resolves.toEqual([
      { id: "c1", label: "Passport", done: false },
    ]);
  });

  it("listOutfitItems defaults missing items array to empty array", async () => {
    queryMock.mockResolvedValueOnce([
      { id: "o1", day_number: 1, title: "Airport look", items: null, notes: "" },
    ]);

    await expect(listOutfitItems("trip-1")).resolves.toEqual([
      { id: "o1", dayNumber: 1, title: "Airport look", items: [], notes: "" },
    ]);
  });
});
