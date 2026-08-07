import { describe, expect, it } from "vitest";
import {
  buildStaffSkillsExportModel,
  NO_DATA_STATEMENT,
  renderStaffSkillsHtml,
  renderStaffSkillsJson,
  TONE_NOTE,
} from "../staff-skills-export";
import type { StaffPracticeSkillsProfile } from "../types";

// Synthetic, self-contained profile — never touches the store or seeds.
function buildProfile(overrides: Partial<StaffPracticeSkillsProfile> = {}): StaffPracticeSkillsProfile {
  return {
    staffId: "staff_test",
    staffName: "Test Worker",
    asOf: "2026-08-01",
    windowDays: 180,
    hasData: true,
    lenses: [
      { key: "competency", label: "Competency", signal: "strong", detail: "Consistently assessed 4+.", sources: [{ recordType: "competency", recordId: "c1" }] },
      { key: "observed_practice", label: "Observed practice", signal: "no_data", detail: "No observations in window.", sources: [] },
    ],
    strengths: ["Warm, consistent boundaries."],
    developmentAreas: ["Recording detail in incident follow-ups."],
    supervisionPrompts: [
      { id: "p1", kind: "development", prompt: "What would help incident follow-ups feel less rushed?" },
      { id: "p2", kind: "wellbeing", prompt: "How is the night rota sitting with you?" },
    ],
    overallPicture: "developing_well",
    disclaimer: "A developmental view for supervision — never a rank or a grade.",
    engineVersion: "1.2.0",
    ...overrides,
  };
}

describe("buildStaffSkillsExportModel", () => {
  it("labels the overall picture and signals — words, never numbers or ranks", () => {
    const model = buildStaffSkillsExportModel(buildProfile(), "2026-08-02T09:00:00.000Z");
    expect(model.overallLabel).toBe("Developing well");
    expect(model.lenses[0].signalLabel).toBe("Strong");
    expect(model.lenses[1].signalLabel).toBe("No data in window");
  });

  it("carries the no-data honesty as a recording gap, not a judgement", () => {
    const withData = buildStaffSkillsExportModel(buildProfile());
    expect(withData.noDataStatement).toBeNull();
    const noData = buildStaffSkillsExportModel(buildProfile({ hasData: false, overallPicture: "insufficient_data" }));
    expect(noData.noDataStatement).toBe(NO_DATA_STATEMENT);
    expect(noData.noDataStatement).toContain("not a judgement of the person");
    expect(noData.overallLabel).toBe("Insufficient data to read honestly");
  });

  it("groups supervision prompts by kind, dropping empty groups", () => {
    const model = buildStaffSkillsExportModel(buildProfile());
    expect(model.promptGroups.map((g) => g.kind)).toEqual(["development", "wellbeing"]); // no "strength" group
    expect(model.promptGroups[0].prompts[0]).toContain("incident follow-ups");
  });

  it("carries the tone note and the engine disclaimer on every surface", () => {
    const model = buildStaffSkillsExportModel(buildProfile());
    expect(model.toneNote).toBe(TONE_NOTE);
    const html = renderStaffSkillsHtml(model);
    expect(html).toContain("never a rank, a grade or a performance score");
    expect(html).toContain("never a rank or a grade");
    expect(JSON.parse(renderStaffSkillsJson(model)).disclaimer).toBe(model.disclaimer);
  });

  it("escapes HTML in profile content", () => {
    const html = renderStaffSkillsHtml(
      buildStaffSkillsExportModel(buildProfile({ strengths: [`<script>alert("x")</script>`] })),
    );
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
