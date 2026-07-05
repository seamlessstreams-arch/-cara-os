// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EXPORT TESTS (§23)
//
// Pins: whole vs per-area scope; priorities filter to scope; the no-grade
// statement is always present and NO Ofsted grade vocabulary is emitted; HTML
// escapes; JSON round-trips.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  buildInspectionExportModel,
  renderInspectionHtml,
  renderInspectionJson,
  NO_GRADE_STATEMENT,
} from "../inspection-export";
import type { InspectionReadiness } from "../inspection-intelligence-engine";

const READINESS: InspectionReadiness = {
  generatedAt: "2026-07-05T00:00:00.000Z",
  headline: "Two areas strong, one developing.",
  areasStrong: 2,
  areasDeveloping: 1,
  areasLimited: 0,
  priorities: [
    { area: "How well children and young people are helped and protected", label: "Missing return interviews", detail: "2 episodes without an interview.", childRefs: [{ id: "yp_alex", name: "Alex" }] },
    { area: "The overall experiences and progress of children and young people", label: "Key-work frequency", detail: "One child under target.", childRefs: [] },
  ],
  areas: [
    { key: "experiences_progress", label: "The overall experiences and progress of children and young people", strength: "strong", summary: "Good progress evidenced.", evidence: [{ label: "Key-work sessions", count: 12, detail: "Across 4 children" }], gaps: [] },
    { key: "protection", label: "How well children and young people are helped and protected", strength: "developing", summary: "Some gaps in return interviews.", evidence: [{ label: "Debriefs", count: 3, detail: "After restraints" }], gaps: [{ label: "Missing return interviews", severity: "high", detail: "2 not yet completed", childRefs: [{ id: "yp_alex", name: "Alex" }] }] },
    { key: "leadership", label: "The effectiveness of leaders and managers", strength: "strong", summary: "Oversight consistent.", evidence: [{ label: "Supervisions", count: 6, detail: "This quarter" }], gaps: [] },
  ],
};

// Grade-VERDICT phrases only — banning bare adjectives ("outstanding", "inadequate")
// would false-positive on ordinary record prose ("2 outstanding actions"). The real
// invariant is that the pack never renders a predicted grade.
const GRADE_VERDICT_PHRASES = ["overall grade", "likely grade", "predicted grade", "would be rated", "rated as", "judgement is outstanding", "judgement is good", "judgement: "];

describe("scope", () => {
  it("whole pack includes all three areas and both priorities", () => {
    const m = buildInspectionExportModel(READINESS, { homeName: "Oak House", scope: "all" });
    expect(m.areas).toHaveLength(3);
    expect(m.priorities).toHaveLength(2);
    expect(m.header.scope).toBe("all");
  });

  it("per-area pack includes only that area and its priorities", () => {
    const m = buildInspectionExportModel(READINESS, { scope: "protection" });
    expect(m.areas).toHaveLength(1);
    expect(m.areas[0].key).toBe("protection");
    // Only the protection priority survives the scope filter.
    expect(m.priorities).toHaveLength(1);
    expect(m.priorities[0].label).toBe("Missing return interviews");
  });

  it("carries the no-grade statement on every model", () => {
    expect(buildInspectionExportModel(READINESS).noGradeStatement).toBe(NO_GRADE_STATEMENT);
  });
});

describe("HTML render", () => {
  const html = renderInspectionHtml(buildInspectionExportModel(READINESS, { homeName: "Oak House", scope: "all" }));

  it("shows the no-grade statement and the area labels", () => {
    expect(html).toContain("does NOT predict");
    expect(html).toContain("helped and protected");
    expect(html).toContain("Key-work sessions");
  });

  it("emits NO predicted-grade verdict", () => {
    const lower = html.toLowerCase();
    for (const phrase of GRADE_VERDICT_PHRASES) expect(lower).not.toContain(phrase);
    // Uses the strength vocabulary (strong/developing/limited), not Ofsted's scale.
    expect(html).toContain("Strong evidence available");
    expect(html).toContain("does NOT predict");
  });

  it("escapes HTML special characters", () => {
    const withHtml = { ...READINESS, headline: "Progress <b>strong</b> & steady" };
    const out = renderInspectionHtml(buildInspectionExportModel(withHtml));
    expect(out).toContain("&lt;b&gt;");
    expect(out).toContain("&amp;");
  });
});

describe("JSON render", () => {
  it("round-trips to an equivalent object", () => {
    const m = buildInspectionExportModel(READINESS, { scope: "leadership" });
    const parsed = JSON.parse(renderInspectionJson(m));
    expect(parsed.areas[0].key).toBe("leadership");
    expect(parsed.version).toBe(m.version);
  });
});
