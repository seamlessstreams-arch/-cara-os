import { describe, it, expect } from "vitest";
import { computeStaffRecordingPractice, suggestionTheme } from "../staff-recording-practice-engine";
import type { ScoredRecord } from "@/lib/recording-quality/recording-quality-engine";

function scored(o: {
  id: string; staff_id: string; overall: number; band: ScoredRecord["band"];
  dims?: Partial<ScoredRecord["score"]>; suggestions?: string[];
}): ScoredRecord {
  const base = { completeness: 90, clarity: 90, professionalLanguage: 90, factuality: 90, childCentredness: 90, riskRelevance: 90 };
  return {
    id: o.id, type: "daily_log", staff_id: o.staff_id, overall: o.overall, band: o.band,
    score: { ...base, ...o.dims, missingFields: [], ariaSuggestions: o.suggestions ?? [] },
  };
}

// ══════════════════════════════════════════════════════════════════════════════
describe("suggestionTheme", () => {
  it("maps full suggestions to short coaching themes", () => {
    expect(suggestionTheme("Include the child's voice — what they said")).toBe("capture the child's voice");
    expect(suggestionTheme("Add detail — record what happened")).toBe("add more detail");
    expect(suggestionTheme("Complete the missing field: outcome")).toBe("complete all fields");
    expect(suggestionTheme("Reword informal or labelling language")).toBe("professional language");
  });
});

describe("empty input", () => {
  it("returns an empty result", () => {
    const r = computeStaffRecordingPractice({ records: [] });
    expect(r.staff_profiles).toHaveLength(0);
    expect(r.overview.staff_analysed).toBe(0);
    expect(r.alerts).toHaveLength(0);
  });
});

describe("per-staff aggregation", () => {
  const r = computeStaffRecordingPractice({
    staff: [{ id: "anna", name: "Anna" }, { id: "diane", name: "Diane" }],
    records: [
      scored({ id: "1", staff_id: "anna", overall: 92, band: "strong" }),
      scored({ id: "2", staff_id: "anna", overall: 88, band: "strong" }),
      scored({ id: "3", staff_id: "diane", overall: 62, band: "needs_improvement", dims: { childCentredness: 45, clarity: 65 }, suggestions: ["Include the child's voice — what they said", "Add detail — record what happened"] }),
      scored({ id: "4", staff_id: "diane", overall: 58, band: "needs_improvement", dims: { childCentredness: 48 }, suggestions: ["Include the child's voice — what they wanted"] }),
    ],
  });

  it("computes each member's average, band and record count", () => {
    const anna = r.staff_profiles.find((p) => p.staff_id === "anna")!;
    const diane = r.staff_profiles.find((p) => p.staff_id === "diane")!;
    expect(anna.records_authored).toBe(2);
    expect(anna.avg_overall).toBe(90);
    expect(anna.band).toBe("strong");
    expect(diane.avg_overall).toBe(60);
    expect(diane.band).toBe("needs_improvement");
  });
  it("identifies each member's weakest dimension and top coaching theme", () => {
    const diane = r.staff_profiles.find((p) => p.staff_id === "diane")!;
    expect(diane.weakest_dimension).toBe("childCentredness");
    expect(diane.top_suggestion).toBe("capture the child's voice");
  });
  it("orders weakest practice first and names strongest/weakest in the overview", () => {
    expect(r.staff_profiles[0].staff_id).toBe("diane");
    expect(r.overview.strongest_staff).toBe("Anna");
    expect(r.overview.weakest_staff).toBe("Diane");
    expect(r.overview.needing_support).toBe(1);
    expect(r.overview.home_avg_overall).toBe(75);
  });
  it("raises a supervision alert for the member who needs support", () => {
    expect(r.alerts.some((a) => a.staff_id === "diane" && /needs improvement/i.test(a.message))).toBe(true);
  });
  it("emits a warning insight about staff needing recording support", () => {
    expect(r.insights.some((i) => i.severity === "warning" || i.severity === "critical")).toBe(true);
  });
});

describe("poor practice + team-wide voice gap", () => {
  it("flags poor practice with a high alert", () => {
    const r = computeStaffRecordingPractice({
      staff: [{ id: "x", name: "Sam" }],
      records: [scored({ id: "1", staff_id: "x", overall: 40, band: "poor", dims: { childCentredness: 30 }, suggestions: ["Include the child's voice"] })],
    });
    expect(r.alerts.some((a) => a.severity === "high" && /poor/i.test(a.message))).toBe(true);
  });
  it("detects a team-wide child's-voice coaching theme", () => {
    const r = computeStaffRecordingPractice({
      staff: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
      records: [
        scored({ id: "1", staff_id: "a", overall: 70, band: "good", dims: { childCentredness: 40 } }),
        scored({ id: "2", staff_id: "b", overall: 72, band: "good", dims: { childCentredness: 42 } }),
      ],
    });
    expect(r.insights.some((i) => /team-wide coaching theme/i.test(i.text))).toBe(true);
  });
});

describe("all-strong team", () => {
  it("emits a positive peer-modelling insight", () => {
    const r = computeStaffRecordingPractice({
      staff: [{ id: "a", name: "Anna" }, { id: "b", name: "Bo" }],
      records: [
        scored({ id: "1", staff_id: "a", overall: 90, band: "strong" }),
        scored({ id: "2", staff_id: "b", overall: 88, band: "strong" }),
      ],
    });
    expect(r.overview.needing_support).toBe(0);
    expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = { staff: [{ id: "a", name: "Anna" }], records: [scored({ id: "1", staff_id: "a", overall: 80, band: "good" })] };
    expect(JSON.stringify(computeStaffRecordingPractice(input))).toBe(JSON.stringify(computeStaffRecordingPractice(input)));
  });
});
