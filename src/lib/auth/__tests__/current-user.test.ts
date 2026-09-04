import { beforeEach, describe, expect, it, vi } from "vitest";

const getRequest = vi.fn();
const getUser = vi.fn();

vi.mock("@tanstack/react-start/server", () => ({ getRequest: () => getRequest() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { auth: { getUser: (jwt?: string) => getUser(jwt) } },
}));

const { getOptionalUserId } = await import("@/lib/auth/current-user.server");

/** A token only has to be three dot-separated parts to be worth verifying. */
const JWT = "header.payload.signature";

function withHeader(authorization: string | null) {
  getRequest.mockReturnValue({
    headers: { get: (name: string) => (name === "authorization" ? authorization : null) },
  });
}

beforeEach(() => {
  getRequest.mockReset();
  getUser.mockReset();
});

describe("getOptionalUserId", () => {
  it("returns the id behind a valid token", async () => {
    withHeader(`Bearer ${JWT}`);
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    await expect(getOptionalUserId()).resolves.toBe("user-1");
    expect(getUser).toHaveBeenCalledWith(JWT);
  });

  it("returns null for an anonymous caller, without calling the auth server", async () => {
    withHeader(null);
    await expect(getOptionalUserId()).resolves.toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("ignores headers that are not a bearer token", async () => {
    for (const header of ["Basic abc", "bearer", JWT, ""]) {
      withHeader(header);
      await expect(getOptionalUserId(), header).resolves.toBeNull();
    }
    expect(getUser).not.toHaveBeenCalled();
  });

  it("skips the round trip for a token that is not JWT-shaped", async () => {
    for (const token of ["not-a-jwt", "two.parts", "four.parts.here.now", " "]) {
      withHeader(`Bearer ${token}`);
      await expect(getOptionalUserId(), token).resolves.toBeNull();
    }
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns null when the token fails verification", async () => {
    withHeader(`Bearer ${JWT}`);
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid JWT" } });
    await expect(getOptionalUserId()).resolves.toBeNull();
  });

  it("returns null when verification succeeds but carries no user", async () => {
    withHeader(`Bearer ${JWT}`);
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getOptionalUserId()).resolves.toBeNull();
  });

  it("stays anonymous rather than throwing when the auth server is unreachable", async () => {
    withHeader(`Bearer ${JWT}`);
    getUser.mockRejectedValue(new Error("network down"));
    await expect(getOptionalUserId()).resolves.toBeNull();
  });

  it("stays anonymous when there is no request in scope", async () => {
    getRequest.mockReturnValue(undefined);
    await expect(getOptionalUserId()).resolves.toBeNull();
  });
});
