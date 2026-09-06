import { describe, expect, it, vi } from "vitest";
import { type AdminContext, assertAdmin } from "@/utils/require-admin";

/**
 * Minimal stand-in for the caller-scoped Supabase client, recording the filters
 * the guard applies so the test can assert it queries for *this* user's admin
 * row rather than any row at all.
 */
function fakeContext(result: { data: unknown }) {
  const calls: Array<[string, unknown]> = [];
  const maybeSingle = vi.fn(async () => result);
  const builder = {
    select: () => builder,
    eq: (col: string, val: unknown) => {
      calls.push([col, val]);
      return builder;
    },
    maybeSingle,
  };
  const from = vi.fn(() => builder);
  return {
    calls,
    from,
    maybeSingle,
    context: { supabase: { from }, userId: "user-1" } as unknown as AdminContext,
  };
}

describe("assertAdmin", () => {
  it("resolves when the caller has an admin role row", async () => {
    const f = fakeContext({ data: { role: "admin" } });
    await expect(assertAdmin(f.context)).resolves.toBeUndefined();
    expect(f.from).toHaveBeenCalledWith("user_roles");
    expect(f.calls).toEqual([
      ["user_id", "user-1"],
      ["role", "admin"],
    ]);
  });

  it("rejects a signed-in caller with no admin role", async () => {
    const f = fakeContext({ data: null });
    await expect(assertAdmin(f.context)).rejects.toThrow("Forbidden");
  });

  it("fails closed when the role lookup returns nothing usable", async () => {
    // A query error leaves `data` null/undefined; deny rather than fall through.
    for (const data of [undefined, ""]) {
      const f = fakeContext({ data });
      await expect(assertAdmin(f.context)).rejects.toThrow("Forbidden");
    }
  });
});
