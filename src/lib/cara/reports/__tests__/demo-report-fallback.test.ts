import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getReportRoute } from "@/app/api/cara/reports/[id]/route";
import { GET as getActionsRoute } from "@/app/api/cara/reports/[id]/actions/route";
import { GET as getChallengeRoute } from "@/app/api/cara/reports/[id]/challenge/route";
import { isDemoReportId } from "@/lib/cara/reports/demo-report-id";

// GET /api/cara/reports/<any string at all> used to return a complete,
// confident report about a named child:
//
//   title            "Jayden Mitchell — Weekly Child Report"
//   overall_summary  "...There was one low-level incident which was managed
//                     well. Evidence is generally strong across key areas..."
//   risk_tier        "low"        overall_confidence_score  72
//
// None of it existed. Two separate demo fallbacks — getReport in
// report-generator and fetchReportData in challenge-mode — answered for
// whatever id they were handed, which also made the route's own 404 branch
// unreachable and gave /actions and /challenge the same invented basis.
//
// The fallback now answers only for ids the demo generator minted. Real report
// ids are UUIDs, so this also closes the env-drift case: a configured tenant
// that lost its Supabase credentials 404s rather than serving fiction.

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}
const req = () => new NextRequest("http://localhost/probe");

describe("demo report fallback answers only for demo ids", () => {
  it("classifies ids the way the demo generator mints them", () => {
    expect(isDemoReportId("demo-1786397812226-axbuvi")).toBe(true);
    expect(isDemoReportId("probe-nonexistent-id")).toBe(false);
    // a real Supabase row id
    expect(isDemoReportId("3f7c1a52-9b0e-4d6a-8c31-2b5f9e7a1d04")).toBe(false);
  });

  it("404s an unknown report instead of inventing one", async () => {
    const res = await getReportRoute(req(), ctx("probe-nonexistent-id"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(JSON.stringify(body)).not.toContain("Jayden");
  });

  it("returns no suggested actions for a report that does not exist", async () => {
    const res = await getActionsRoute(req(), ctx("probe-nonexistent-id"));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual([]);
  });

  it("says a nonexistent report could not be loaded, rather than challenging invented content", async () => {
    const res = await getChallengeRoute(req(), ctx("probe-nonexistent-id"));
    expect(res.status).toBe(200);
    const items = (await res.json()).data as Array<{ type: string; message: string }>;
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("missing_evidence");
    expect(items[0].message).toContain("could not be loaded");
  });

  it("still serves the demo report for an id the demo generator minted", async () => {
    const res = await getReportRoute(req(), ctx("demo-1786397812226-axbuvi"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.report.id).toBe("demo-1786397812226-axbuvi");
  });
});
