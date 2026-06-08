import { describe, it, expect } from "vitest";
import { buildChildReviewPack, type ChildReviewPackInput } from "../child-review-pack-engine";

const TODAY = "2026-06-08";

function input(p: Partial<ChildReviewPackInput> = {}): ChildReviewPackInput {
  return {
    child_id: "yp_alex",
    child_name: "Alex W",
    date_of_birth: "2010-03-14",
    age_years: 16,
    legal_status: "Section 20",
    placement_start: "2025-09-01",
    days_in_placement: 280,
    key_worker: "Edward",
    social_worker: "Karen Holding",
    iro: "James Patterson",
    overall_wellbeing: "needs_attention",
    headline: "Settling but with active safeguarding risk.",
    domain_scores: [{ domain_label: "Safety", rag: "red", score: 40, trend: "improving", summary: "CCE risk" }],
    voice_captured: true,
    recent_themes: ["wants more family contact"],
    mood_trend: "improving",
    risk_level: "very_high",
    active_risk_flags: ["exploitation", "self-harm"],
    open_incidents: 2,
    missing_90d: 3,
    school_name: "Derby AP",
    attendance_rate_30d: 71,
    active_medications: 1,
    allergies: [],
    overdue_appointments: 1,
    contact_consistency: "inconsistent",
    yp_voice_on_contact: true,
    total_active_targets: 4,
    targets_on_track: 2,
    average_progress_pct: 55,
    strengths: ["Engages with key worker", "Vocational interest"],
    concerns: ["Exploitation risk"],
    priority_actions: [
      { action: "Convene strategy discussion", severity: "critical" },
      { action: "Book optician", severity: "low" },
      { action: "Review contact plan", severity: "high" },
    ],
    key_dates: [{ label: "Next LAC review", date: "2026-07-01" }],
    today: TODAY,
    ...p,
  };
}

describe("buildChildReviewPack", () => {
  it("builds demographics + title from the child", () => {
    const r = buildChildReviewPack(input());
    expect(r.title).toBe("LAC Review Pack — Alex W");
    expect(r.generated_for).toBe(TODAY);
    expect(r.demographics.find((d) => d.label === "Legal status")!.value).toBe("Section 20");
    expect(r.demographics.find((d) => d.label === "IRO")!.value).toBe("James Patterson");
  });

  it("captures wishes & feelings with themes when voice is recorded, prompts when not", () => {
    const yes = buildChildReviewPack(input({ voice_captured: true, recent_themes: ["wants a phone"] }));
    expect(yes.wishes_and_feelings.captured).toBe(true);
    expect(yes.wishes_and_feelings.narrative).toMatch(/wants a phone/);

    const no = buildChildReviewPack(input({ voice_captured: false, recent_themes: [] }));
    expect(no.wishes_and_feelings.captured).toBe(false);
    expect(no.wishes_and_feelings.narrative).toMatch(/priority/i);
  });

  it("rags the safety section red for very-high risk", () => {
    const r = buildChildReviewPack(input({ risk_level: "very_high" }));
    expect(r.sections.find((s) => s.key === "safety")!.rag).toBe("red");
  });

  it("rags education by attendance thresholds", () => {
    expect(buildChildReviewPack(input({ attendance_rate_30d: 95 })).sections.find((s) => s.key === "education")!.rag).toBe("green");
    expect(buildChildReviewPack(input({ attendance_rate_30d: 80 })).sections.find((s) => s.key === "education")!.rag).toBe("amber");
    expect(buildChildReviewPack(input({ attendance_rate_30d: 60 })).sections.find((s) => s.key === "education")!.rag).toBe("red");
    expect(buildChildReviewPack(input({ attendance_rate_30d: null })).sections.find((s) => s.key === "education")!.rag).toBe("no_data");
  });

  it("rags outcomes by average progress, no_data when no targets", () => {
    expect(buildChildReviewPack(input({ total_active_targets: 0 })).sections.find((s) => s.key === "outcomes")!.rag).toBe("no_data");
    expect(buildChildReviewPack(input({ total_active_targets: 3, average_progress_pct: 80 })).sections.find((s) => s.key === "outcomes")!.rag).toBe("green");
  });

  it("review summary names the child, wellbeing, and the areas to focus on", () => {
    const r = buildChildReviewPack(input());
    expect(r.review_summary).toMatch(/Alex W/);
    expect(r.review_summary).toMatch(/needs attention/i);
    expect(r.review_summary).toMatch(/focus on:/i);
  });

  it("recommendations come from priority actions, sorted by severity and capped", () => {
    const r = buildChildReviewPack(input());
    // critical first, then high, then low
    expect(r.recommendations[0]).toBe("Convene strategy discussion");
    expect(r.recommendations[1]).toBe("Review contact plan");
    expect(r.recommendations[2]).toBe("Book optician");
  });

  it("passes through domain scores, strengths (capped), and valid key dates", () => {
    const r = buildChildReviewPack(input());
    expect(r.domain_scores).toHaveLength(1);
    expect(r.strengths.length).toBeLessThanOrEqual(6);
    expect(r.key_dates).toEqual([{ label: "Next LAC review", date: "2026-07-01" }]);
  });
});
