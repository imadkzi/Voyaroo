import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("./db/postgres", () => ({
  query: queryMock,
}));

import { getTripIdBySlugForOwner } from "./trip-owner";

describe("getTripIdBySlugForOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns trip id when query finds a trip", async () => {
    queryMock.mockResolvedValueOnce([{ id: "trip-uuid-1" }]);

    await expect(getTripIdBySlugForOwner("paris-trip", "user-1")).resolves.toBe(
      "trip-uuid-1",
    );
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("from trips"), [
      "paris-trip",
      "user-1",
    ]);
  });

  it("returns null when query returns no rows", async () => {
    queryMock.mockResolvedValueOnce([]);
    await expect(getTripIdBySlugForOwner("missing-trip", "user-1")).resolves.toBeNull();
  });
});
