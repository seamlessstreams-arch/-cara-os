import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/v1/[...slug]/route";

// Regression guard for the `/api/v1/home-:engine` rewrite collision.
//
// The consolidation rewrite (`/api/v1/home-:engine` → `/api/v1/home/:engine`)
// also catches home-* DATA collections (home-emergency-contacts, home-policies),
// forcing them through the intelligence dispatcher → "Unknown intelligence engine"
// → HTTP 404 on those (UI-consumed) views. The catch-all now falls back to the
// data-collection accessor when there's no matching engine.
const ctx = (slug: string[]) => ({ params: Promise.resolve({ slug }) }) as any;
const req = (path: string) => new NextRequest(`http://localhost${path}`);

describe("catch-all /api/v1 — home-* data routes caught by the rewrite", () => {
  it("home-emergency-contacts resolves as a data collection (was 404)", async () => {
    const res = await GET(req("/api/v1/home/emergency-contacts"), ctx(["home", "emergency-contacts"]));
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty("data");
  });

  it("home-policies resolves as a data collection (was 404)", async () => {
    const res = await GET(req("/api/v1/home/policies"), ctx(["home", "policies"]));
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty("data");
  });

  it("a real intelligence engine still routes to the dispatcher", async () => {
    const res = await GET(req("/api/v1/home/wellbeing-intelligence"), ctx(["home", "wellbeing-intelligence"]));
    expect(res.status).toBe(200);
  });

  it("a genuinely unknown home-* slug still 404s (no over-broadening)", async () => {
    const res = await GET(req("/api/v1/home/totally-unknown-xyz"), ctx(["home", "totally-unknown-xyz"]));
    expect(res.status).toBe(404);
  });
});
