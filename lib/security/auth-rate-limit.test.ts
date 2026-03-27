import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../db/postgres", () => ({
  query: queryMock,
}));

import { hitAuthRateLimit } from "./auth-rate-limit";

describe("hitAuthRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when count is not above limit", async () => {
    queryMock.mockResolvedValueOnce([{ count: 3 }]);

    await expect(
      hitAuthRateLimit({ key: "login:1.2.3.4:a@b.com", limit: 10, windowMs: 60000 }),
    ).resolves.toBe(false);
  });

  it("returns true when count is above limit", async () => {
    queryMock.mockResolvedValueOnce([{ count: 11 }]);

    await expect(
      hitAuthRateLimit({ key: "login:1.2.3.4:a@b.com", limit: 10, windowMs: 60000 }),
    ).resolves.toBe(true);
  });

  it("defaults to false-safe behavior when query returns no rows", async () => {
    queryMock.mockResolvedValueOnce([]);

    await expect(
      hitAuthRateLimit({ key: "register:1.2.3.4:test", limit: 6, windowMs: 60000 }),
    ).resolves.toBe(false);
  });

  it("passes key and windowMs to query", async () => {
    queryMock.mockResolvedValueOnce([{ count: 1 }]);
    await hitAuthRateLimit({ key: "k1", limit: 5, windowMs: 120000 });

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("insert into auth_rate_limits"),
      ["k1", 120000],
    );
  });
});
