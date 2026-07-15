import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { currentUserId, userIdHeaders, DEMO_DEFAULT_USER_ID } from "@/lib/auth/current-user";

// The bug this guards: on a FRESH session localStorage is empty (AuthProvider
// keeps its default in React state and only persists on an explicit switch).
// Callers that omitted `x-user-id` when storage was empty got 400/403 — the
// feature looked broken to a first-time visitor and fine to everyone else.

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
};

beforeEach(() => {
  localStorageMock.clear();
  vi.stubGlobal("window", {} as unknown as Window);
  vi.stubGlobal("localStorage", localStorageMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("currentUserId", () => {
  it("returns the demo default on a fresh session (empty storage)", () => {
    expect(currentUserId()).toBe(DEMO_DEFAULT_USER_ID);
    expect(currentUserId()).not.toBe("");
  });

  it("returns the switched user once one is persisted", () => {
    localStorage.setItem("cs_user_id", "staff_olivia");
    expect(currentUserId()).toBe("staff_olivia");
  });

  it("falls back when storage is unavailable (private mode / blocked)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("SecurityError"); },
    });
    expect(currentUserId()).toBe(DEMO_DEFAULT_USER_ID);
  });

  it("returns the default during SSR (no window)", () => {
    vi.stubGlobal("window", undefined);
    expect(currentUserId()).toBe(DEMO_DEFAULT_USER_ID);
  });
});

describe("userIdHeaders", () => {
  it("ALWAYS carries x-user-id — never an empty object", () => {
    // The routes answer 400 "x-user-id required" when this header is missing.
    expect(userIdHeaders()).toEqual({ "x-user-id": DEMO_DEFAULT_USER_ID });
    expect(Object.keys(userIdHeaders())).toContain("x-user-id");
  });

  it("carries the switched user", () => {
    localStorage.setItem("cs_user_id", "staff_ryan");
    expect(userIdHeaders()["x-user-id"]).toBe("staff_ryan");
  });
});
