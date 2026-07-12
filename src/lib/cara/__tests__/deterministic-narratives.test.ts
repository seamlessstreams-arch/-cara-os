import { describe, it, expect, beforeEach } from "vitest";
import { renderChronologyNarrative, renderInspectionNarrative } from "../deterministic-narratives";
import type { ChronologyIntelligenceResult } from "@/lib/engines/chronology-intelligence-engine";
import type { InspectionReadiness } from "@/lib/inspection-intelligence/inspection-intelligence-engine";

const GENERIC_NOTE = "ran without AI for this feature";

const chronology = {
  overview: {
    total_events: 12, events_30d: 4, events_90d: 9, critical_events_total: 2,
    significant_events_total: 3, children_with_chronology: 2, avg_events_per_child: 6,
    category_coverage: 5, recording_frequency_30d: 2,
  },
  child_profiles: [
    { child_id: "yp_alex", child_name: "Alex", total_events: 7, events_30d: 3, critical_count: 2, significant_count: 1, categories_covered: ["safeguarding", "education"], days_since_last_entry: 20, placement_duration_days: 200, recording_rate: 1.1, has_gap: true },
    { child_id: "yp_jordan", child_name: "Jordan", total_events: 5, events_30d: 1, critical_count: 0, significant_count: 2, categories_covered: ["health"], days_since_last_entry: 3, placement_duration_days: 120, recording_rate: 1.3, has_gap: false },
  ],
  category_breakdown: [], timeline: [],
  alerts: [{ severity: "critical", message: "Alex has a 20-day recording gap" }, { severity: "low", message: "minor" }],
  insights: [],
} as unknown as ChronologyIntelligenceResult;

const inspection = {
  generatedAt: "2026-07-12T00:00:00Z",
  headline: "Strong evidence in 2 of 3 areas; 1 safeguarding gap to close.",
  areasStrong: 2, areasDeveloping: 1, areasLimited: 0,
  priorities: [{ area: "protection", label: "Return interviews", detail: "3 missing episodes without a return interview." }],
  areas: [
    { key: "experiences_progress", label: "Overall experiences and progress", strength: "strong", summary: "Consistent key-work and achievements recorded.", evidence: [{ label: "Key-work sessions", count: 24, detail: "logged this quarter" }], gaps: [] },
    { key: "protection", label: "How well children are helped and protected", strength: "developing", summary: "Most incidents debriefed.", evidence: [{ label: "Debriefs", count: 8, detail: "after incidents" }], gaps: [{ label: "Return interviews", severity: "high", detail: "3 missing episodes without a return interview" }] },
  ],
} as unknown as InspectionReadiness;

describe("renderChronologyNarrative", () => {
  it("home overview when no child is selected — real content, not the generic note", () => {
    const out = renderChronologyNarrative(chronology, { childCount: 2, eventCount: 12 });
    expect(out).toContain("Chronology summary");
    expect(out).toContain("Home overview");
    expect(out).toContain("Alex");
    expect(out).toContain("Jordan");
    expect(out).not.toContain(GENERIC_NOTE);
  });

  it("focuses on the selected child and flags their recording gap", () => {
    const out = renderChronologyNarrative(chronology, { childId: "yp_alex", childCount: 2, eventCount: 12 });
    expect(out).toContain("## Alex");
    expect(out).toContain("recording gap");
    expect(out).not.toContain("## Jordan"); // single-child focus
  });

  it("surfaces critical/high alerts but not low ones", () => {
    const out = renderChronologyNarrative(chronology, { childCount: 2, eventCount: 12 });
    expect(out).toContain("20-day recording gap");
    expect(out).not.toContain("minor");
  });
});

describe("renderInspectionNarrative", () => {
  it("renders evidence + gaps per SCCIF area, never an Ofsted grade", () => {
    const out = renderInspectionNarrative(inspection);
    expect(out).toContain("Inspection readiness narrative");
    expect(out).toContain("Overall experiences and progress");
    expect(out).toContain("Evidence you can show");
    expect(out).toContain("Gaps an inspector may probe");
    expect(out).toContain("Priorities to close");
    expect(out.toLowerCase()).toContain("never predict"); // the no-grade disclaimer
    // No Ofsted grade word used as a verdict.
    for (const grade of ["Outstanding", "Requires improvement", "Inadequate"]) {
      expect(out).not.toContain(grade);
    }
    expect(out).not.toContain(GENERIC_NOTE);
  });
});

describe("POST /api/v1/cara — chronology_summary works without an API", () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY; // force the deterministic path
  });

  it("returns a real chronology narrative, not the generic 'ran without AI' note", async () => {
    const { POST } = await import("@/app/api/v1/cara/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/v1/cara", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "chronology_summary",
        stream: false,
        user_role: "registered_manager",
        question: "Generate a chronology summary",
        source_content: "context",
        period_days: 90,
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    const text = body?.data?.response ?? "";
    expect(body?.data?.model).toBe("deterministic");
    expect(text).toContain("Chronology summary");
    expect(text).not.toContain(GENERIC_NOTE);
  });
});
