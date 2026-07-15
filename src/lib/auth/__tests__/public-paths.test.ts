import { describe, it, expect } from "vitest";
import { isPublicPath, safeNextPath } from "@/lib/auth/public-paths";

// The gate consults these before redirecting to /auth/login. A wrong answer
// either locks visitors out of the marketing site or opens a platform page.
describe("isPublicPath", () => {
  it("keeps the marketing site public", () => {
    for (const p of ["/", "/about", "/contact", "/pricing", "/privacy", "/security", "/terms",
      "/product/tour", "/product/intelligence", "/product/safeguarding"]) {
      expect(isPublicPath(p), p).toBe(true);
    }
  });

  it("keeps the auth flow public (no redirect loop)", () => {
    expect(isPublicPath("/auth/login")).toBe(true);
    expect(isPublicPath("/auth/signout")).toBe(true);
  });

  it("gates the platform", () => {
    for (const p of ["/dashboard", "/children", "/incidents", "/ask-cara", "/safe-staffing",
      "/dashboard/manager-control-centre", "/securityx", "/pricing2", "/productivity"]) {
      expect(isPublicPath(p), p).toBe(false);
    }
  });
});

describe("safeNextPath", () => {
  it("passes through same-origin relative paths", () => {
    expect(safeNextPath("/children/yp_alex")).toBe("/children/yp_alex");
    expect(safeNextPath("/dashboard?tab=today")).toBe("/dashboard?tab=today");
  });

  it("defaults to the dashboard", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("refuses open redirects and auth loops", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil", "javascript:alert(1)", "/auth/login"]) {
      expect(safeNextPath(bad), bad).toBe("/dashboard");
    }
  });
});
