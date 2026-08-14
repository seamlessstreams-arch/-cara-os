// ══════════════════════════════════════════════════════════════════════════════
// form-draft — user-scoped, expiring localStorage drafts
//
// The suite runs in node (house convention: no jsdom), so localStorage is a
// Map-backed stub and the demo identity is mocked to make user-switching
// testable — in node the real currentUserId() always returns the default.
// ══════════════════════════════════════════════════════════════════════════════
import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveDraft, loadDraft, clearDraft, DRAFT_TTL_HOURS } from "@/lib/form-draft";

let mockUserId = "staff_darren";
vi.mock("@/lib/auth/current-user", () => ({
  DEMO_DEFAULT_USER_ID: "staff_darren",
  currentUserId: () => mockUserId,
}));

const store = new Map<string, string>();
const storageStub = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
} as Storage;

const PREFIX = "cs_incident_draft_";
const CHILD = "yp_alex";

beforeEach(() => {
  store.clear();
  mockUserId = "staff_darren";
  vi.stubGlobal("localStorage", storageStub);
});

describe("form-draft", () => {
  it("round-trips a draft for the current user", () => {
    saveDraft(PREFIX, CHILD, { description: "half-written narrative" });
    expect(loadDraft<{ description: string }>(PREFIX, CHILD)).toEqual({
      description: "half-written narrative",
    });
  });

  it("never hands one user's draft to another user, and keeps it for the author", () => {
    saveDraft(PREFIX, CHILD, { description: "staff_darren's narrative" });

    mockUserId = "staff_anna";
    expect(loadDraft(PREFIX, CHILD)).toBeNull();

    mockUserId = "staff_darren";
    expect(loadDraft<{ description: string }>(PREFIX, CHILD)).toEqual({
      description: "staff_darren's narrative",
    });
  });

  it("expires drafts past the TTL and removes them from storage", () => {
    const staleSavedAt = new Date(Date.now() - (DRAFT_TTL_HOURS + 1) * 3_600_000).toISOString();
    const key = `${PREFIX}staff_darren:${CHILD}`;
    store.set(key, JSON.stringify({ v: 1, savedAt: staleSavedAt, data: { description: "abandoned" } }));

    expect(loadDraft(PREFIX, CHILD)).toBeNull();
    expect(store.has(key)).toBe(false);
  });

  it("loads a draft saved within the TTL", () => {
    const freshSavedAt = new Date(Date.now() - 3_600_000).toISOString();
    store.set(
      `${PREFIX}staff_darren:${CHILD}`,
      JSON.stringify({ v: 1, savedAt: freshSavedAt, data: { description: "an hour old" } }),
    );
    expect(loadDraft<{ description: string }>(PREFIX, CHILD)).toEqual({ description: "an hour old" });
  });

  it("deletes legacy ownerless drafts on sight and never adopts them", () => {
    const legacy = `${PREFIX}${CHILD}`;
    store.set(legacy, JSON.stringify({ description: "pre-scoping draft, owner unknown" }));

    expect(loadDraft(PREFIX, CHILD)).toBeNull();
    expect(store.has(legacy)).toBe(false);
  });

  it("returns null on a corrupt or wrong-shape envelope instead of throwing", () => {
    const key = `${PREFIX}staff_darren:${CHILD}`;
    store.set(key, "not json at all {{{");
    expect(loadDraft(PREFIX, CHILD)).toBeNull();

    store.set(key, JSON.stringify({ someOldShape: true }));
    expect(loadDraft(PREFIX, CHILD)).toBeNull();
    expect(store.has(key)).toBe(false);
  });

  it("clearDraft removes only the current user's draft", () => {
    saveDraft(PREFIX, CHILD, { description: "darren's" });
    mockUserId = "staff_anna";
    saveDraft(PREFIX, CHILD, { description: "anna's" });

    clearDraft(PREFIX, CHILD);
    expect(loadDraft(PREFIX, CHILD)).toBeNull();

    mockUserId = "staff_darren";
    expect(loadDraft<{ description: string }>(PREFIX, CHILD)).toEqual({ description: "darren's" });
  });
});
