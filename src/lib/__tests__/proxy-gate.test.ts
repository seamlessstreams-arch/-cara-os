import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// The proxy is the security boundary on live: 376 of 513 API routes carry no
// per-route guard, so this file's behaviour — not theirs — is what stands
// between an unauthenticated caller and real records. The pure classifiers
// (public-paths) are tested elsewhere; this exercises the EXECUTABLE gate:
// the matcher config (where the historical /api exclusion bug actually
// lived), the demo-mode no-op, the 401-vs-redirect split, the ?next=
// round-trip, and the three justified public endpoints (whose csp-report
// entry was once missing — every browser violation report silently died).

const getClaimsMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims: getClaimsMock } }),
}));

function req(path: string) {
  return new NextRequest("https://cara.example" + path);
}

const ACTIVATED = {
  NEXT_PUBLIC_SUPABASE_URL: "https://real-tenant.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "sk-real-key",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk-real-key",
};

describe("proxy gate", () => {
  beforeEach(() => {
    vi.resetModules();
    getClaimsMock.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("matcher covers /api — the exact regression that once leaked staff records", async () => {
    const { config } = await import("@/proxy");
    const rx = new RegExp("^" + config.matcher[0] + "$");
    // Must gate:
    expect(rx.test("/api/v1/staff")).toBe(true);
    expect(rx.test("/api/cron")).toBe(true);
    expect(rx.test("/dashboard")).toBe(true);
    // Must stay fast and ungated:
    expect(rx.test("/_next/static/chunks/app.js")).toBe(false);
    expect(rx.test("/favicon.ico")).toBe(false);
    expect(rx.test("/logo.png")).toBe(false);
    expect(rx.test("/fonts/x.woff2")).toBe(false);
  });

  it("demo mode (Supabase unconfigured) passes every request through untouched", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { proxy } = await import("@/proxy");
    for (const p of ["/api/v1/staff", "/dashboard", "/"]) {
      const res = await proxy(req(p));
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("placeholder credentials still count as demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-key");
    const { proxy } = await import("@/proxy");
    const res = await proxy(req("/api/v1/staff"));
    expect(res.status).toBe(200);
  });

  describe("activated mode, no session", () => {
    beforeEach(() => {
      for (const [k, v] of Object.entries(ACTIVATED)) vi.stubEnv(k, v);
      getClaimsMock.mockResolvedValue({ data: { claims: null } });
    });

    it("answers API requests with readable 401 JSON, never a redirect", async () => {
      const { proxy } = await import("@/proxy");
      const res = await proxy(req("/api/v1/staff"));
      expect(res.status).toBe(401);
      expect(res.headers.get("location")).toBeNull();
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("keeps the three justified endpoints reachable — csp-report included", async () => {
      const { proxy } = await import("@/proxy");
      for (const p of ["/api/v1/health-check", "/api/cron", "/api/v1/security/csp-report"]) {
        const res = await proxy(req(p));
        expect(res.status, p).toBe(200);
      }
    });

    it("redirects a platform page to login, remembering the destination", async () => {
      const { proxy } = await import("@/proxy");
      const res = await proxy(req("/dashboard?tab=tasks"));
      expect([302, 307]).toContain(res.status);
      const loc = new URL(res.headers.get("location")!);
      expect(loc.pathname).toBe("/auth/login");
      expect(loc.searchParams.get("next")).toBe("/dashboard?tab=tasks");
    });

    it("leaves the marketing site public", async () => {
      const { proxy } = await import("@/proxy");
      for (const p of ["/", "/pricing", "/product/overview"]) {
        const res = await proxy(req(p));
        expect(res.status, p).toBe(200);
        expect(res.headers.get("location")).toBeNull();
      }
    });
  });

  it("activated mode with a session passes platform requests through", async () => {
    for (const [k, v] of Object.entries(ACTIVATED)) vi.stubEnv(k, v);
    getClaimsMock.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    const { proxy } = await import("@/proxy");
    for (const p of ["/api/v1/staff", "/dashboard"]) {
      const res = await proxy(req(p));
      expect(res.status, p).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    }
  });
});
