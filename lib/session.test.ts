import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("./auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { getSessionUser, requireSessionUser } from "./session";

describe("session helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSessionUser returns user when session has a user", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "u1", email: "test@example.com" },
    });

    await expect(getSessionUser()).resolves.toEqual({
      id: "u1",
      email: "test@example.com",
    });
  });

  it("getSessionUser returns null when session is missing", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("requireSessionUser returns user when user id exists", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u2", name: "Alice" } });
    await expect(requireSessionUser()).resolves.toEqual({ id: "u2", name: "Alice" });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("requireSessionUser redirects to login when user is missing", async () => {
    authMock.mockResolvedValueOnce(null);
    redirectMock.mockImplementationOnce(() => {
      throw new Error("redirected");
    });

    await expect(requireSessionUser()).rejects.toThrow("redirected");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
