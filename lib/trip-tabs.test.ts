import { describe, expect, it } from "vitest";
import { parseTripTab, tripTabHref } from "./trip-tabs";

describe("parseTripTab", () => {
  it("returns overview by default for undefined", () => {
    expect(parseTripTab(undefined)).toBe("overview");
  });

  it("returns known tab values", () => {
    expect(parseTripTab("checklist")).toBe("checklist");
    expect(parseTripTab("outfits")).toBe("outfits");
    expect(parseTripTab("itinerary")).toBe("itinerary");
  });

  it("falls back to overview for unknown values", () => {
    expect(parseTripTab("unknown")).toBe("overview");
    expect(parseTripTab("CHECKLIST")).toBe("overview");
  });
});

describe("tripTabHref", () => {
  it("builds base trip route for overview tab", () => {
    expect(tripTabHref("my-trip", "overview")).toBe("/trips/my-trip");
  });

  it("builds query-param route for non-overview tabs", () => {
    expect(tripTabHref("my-trip", "checklist")).toBe(
      "/trips/my-trip?tab=checklist",
    );
    expect(tripTabHref("my-trip", "outfits")).toBe("/trips/my-trip?tab=outfits");
  });
});
