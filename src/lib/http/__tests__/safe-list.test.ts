import { describe, it, expect } from "vitest";
import { createSafeReader, incompleteNote } from "../safe-list";

// The point of the helper is the half the old `safeList` threw away: which
// source failed. Without it a route reports a clean result — no doses without a
// witness, no incidents — that it has no basis for.

describe("createSafeReader", () => {
  it("yields the list when the read succeeds and stays complete", async () => {
    const r = createSafeReader();
    expect(await r.list("incidents", Promise.resolve([1, 2]))).toEqual([1, 2]);
    expect(r.incomplete()).toBe(false);
    expect(r.failures()).toEqual([]);
  });

  it("yields [] on failure but records which source it was", async () => {
    const r = createSafeReader();
    expect(await r.list("medication administrations", Promise.reject(new Error("no table")))).toEqual([]);
    expect(r.incomplete()).toBe(true);
    expect(r.failures()).toEqual(["medication administrations"]);
  });

  it("keeps going after one source fails — that is the resilience worth keeping", async () => {
    const r = createSafeReader();
    await r.list("a", Promise.reject(new Error("x")));
    expect(await r.list("b", Promise.resolve([7]))).toEqual([7]);
    expect(r.failures()).toEqual(["a"]);
  });

  it("treats a non-array as empty without calling it a failure", async () => {
    const r = createSafeReader();
    expect(await r.list("odd", Promise.resolve(null as unknown as unknown[]))).toEqual([]);
    expect(r.incomplete()).toBe(false);
  });

  it("names the sources in the note rather than saying 'some data'", () => {
    expect(incompleteNote(["incidents"])).toContain("incidents could not be read");
    expect(incompleteNote(["incidents", "medications"])).toContain("incidents and medications");
    expect(incompleteNote(["a", "b", "c"])).toContain("a, b and c");
  });
});
