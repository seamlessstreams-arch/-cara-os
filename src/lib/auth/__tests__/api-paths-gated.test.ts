import { describe, it, expect } from "vitest";
import { isPublicPath, isApiPath } from "@/lib/auth/public-paths";

// Regression cover for the live auth gap found on the first real tenant:
// `GET /api/v1/staff` returned 200 with real staff records to an
// unauthenticated caller. The proxy excluded /api/* from its matcher on the
// stated assumption that every route enforced its own guard — 376 of 513 did
// not. The gate is now structural, and these assertions are what keep it that
// way: the dangerous direction is a future edit that quietly re-opens /api.
describe("API paths are gated by default", () => {
  it("treats every /api/ path as an API path", () => {
    for (const p of ["/api/v1/staff", "/api/cron", "/api/intelligence/voice", "/api/x"]) {
      expect(isApiPath(p)).toBe(true);
    }
    expect(isApiPath("/dashboard")).toBe(false);
    expect(isApiPath("/auth/login")).toBe(false);
  });

  it("gates record-bearing API routes — the exact bug that leaked staff data", () => {
    expect(isPublicPath("/api/v1/staff")).toBe(false);
    expect(isPublicPath("/api/v1/young-people")).toBe(false);
    expect(isPublicPath("/api/v1/incidents")).toBe(false);
    expect(isPublicPath("/api/intelligence/voice")).toBe(false);
  });

  it("keeps exactly the two justified public endpoints open", () => {
    expect(isPublicPath("/api/v1/health-check")).toBe(true);
    expect(isPublicPath("/api/cron")).toBe(true);
  });

  it("does not let the public-endpoint allowance leak to neighbours", () => {
    // Exact match only — a prefix rule here would open everything beneath it.
    expect(isPublicPath("/api/v1/health-check/secrets")).toBe(false);
    expect(isPublicPath("/api/cron/run-everything")).toBe(false);
    expect(isPublicPath("/api/v1/health-checkX")).toBe(false);
  });

  it("does not let the /auth/ page prefix open API routes under it", () => {
    // "/auth/" is a public PREFIX for pages; an /api path starting with it must
    // still be gated, which is why isApiPath is checked before the prefixes.
    expect(isPublicPath("/api/auth/anything")).toBe(false);
  });

  it("still lets the marketing site and auth flow through", () => {
    for (const p of ["/", "/about", "/pricing", "/product/safeguarding", "/auth/login", "/auth/reset-password"]) {
      expect(isPublicPath(p)).toBe(true);
    }
  });

  it("keeps platform pages gated", () => {
    for (const p of ["/dashboard", "/young-people", "/incidents", "/staff"]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
});
