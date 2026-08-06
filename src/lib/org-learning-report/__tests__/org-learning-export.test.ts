import { describe, expect, it } from "vitest";
import {
  buildOrgLearningExportModel,
  renderOrgLearningHtml,
  renderOrgLearningJson,
  WEIGHT_LABELS,
} from "../org-learning-export";
import type { OrgLearningReport } from "../types";

// Synthetic, self-contained report — never touches the store or seeds.
function buildReport(overrides: Partial<OrgLearningReport> = {}): OrgLearningReport {
  return {
    homeId: "home_test",
    period: "quarter",
    periodLabel: "Quarter to 30 Jun 2026",
    asOf: "2026-06-30",
    windowDays: 90,
    headline: "Two priority themes need leadership attention this quarter.",
    sections: [
      {
        key: "emerging_risk",
        label: "Emerging risks",
        insufficientData: false,
        themes: [
          { id: "t1", kind: "emerging_risk", weight: "notable", title: "Late-evening escalations", detail: "Cluster after 21:00.", evidenceCount: 4, sources: [] },
          { id: "t2", kind: "emerging_risk", weight: "priority", title: "Missing-episode pattern", detail: "Three episodes, same peer group.", evidenceCount: 6, sources: [] },
        ],
      },
      {
        key: "child_voice_theme",
        label: "Child voice themes",
        insufficientData: true,
        themes: [],
      },
      {
        key: "practice_strength",
        label: "Practice strengths",
        insufficientData: false,
        themes: [],
      },
    ],
    totalEvidence: 10,
    regulatoryLinks: ["CHR 2015 Reg 45", "Quality Standards — leadership & management"],
    disclaimer: "Synthesised from the home's records; leadership judgement remains human.",
    engineVersion: "2.1.0",
    ...overrides,
  };
}

describe("buildOrgLearningExportModel", () => {
  it("sorts themes priority-first within a section", () => {
    const model = buildOrgLearningExportModel(buildReport(), { homeName: "Test House", generatedAt: "2026-07-01T09:00:00.000Z" });
    const risks = model.sections.find((s) => s.key === "emerging_risk")!;
    expect(risks.themes.map((t) => t.weight)).toEqual(["priority", "notable"]);
    expect(risks.themes[0].weightLabel).toBe(WEIGHT_LABELS.priority);
  });

  it("carries insufficient-data honesty as an explicit statement, never a silent empty", () => {
    const model = buildOrgLearningExportModel(buildReport(), { homeName: "Test House" });
    const voice = model.sections.find((s) => s.key === "child_voice_theme")!;
    expect(voice.insufficientData).toBe(true);
    expect(voice.insufficientDataStatement).toContain("not as an all-clear");
    const strengths = model.sections.find((s) => s.key === "practice_strength")!;
    expect(strengths.insufficientData).toBe(false);
    expect(strengths.insufficientDataStatement).toBeNull();
  });

  it("distinguishes looked-and-found-nothing from could-not-look in the HTML", () => {
    const html = renderOrgLearningHtml(buildOrgLearningExportModel(buildReport(), { homeName: "Test House" }));
    expect(html).toContain("Looked, and found nothing this period."); // practice_strength: enough data, zero themes
    expect(html).toContain("not as an all-clear"); // child_voice_theme: insufficient data
  });

  it("carries the engine disclaimer and regulatory links verbatim", () => {
    const model = buildOrgLearningExportModel(buildReport(), { homeName: "Test House" });
    expect(model.disclaimer).toContain("leadership judgement remains human");
    expect(model.regulatoryLinks).toHaveLength(2);
    expect(JSON.parse(renderOrgLearningJson(model)).disclaimer).toBe(model.disclaimer);
  });

  it("escapes HTML in report content", () => {
    const html = renderOrgLearningHtml(
      buildOrgLearningExportModel(buildReport({ headline: `<img src=x onerror=alert(1)>` }), { homeName: "Test House" }),
    );
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});
