import { describe, it, expect, vi } from "vitest";

// Risk consolidation's projection proof: likelihood×impact capture rows come
// back as honest domain-keyed RiskAssessments — trend DERIVED from real
// same-child+category history, residual level preferred over inherent,
// capture-only categories and home-level rows excluded, nothing invented.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  const home = "33333333-3333-4333-8333-333333333333";
  return makeFakeSupabaseModule({
    cs_risk_assessments: [
      // A real thread: two self-harm assessments of the same child, risk rose.
      {
        id: "ra-1", home_id: home, child_id: "yp-1", category: "self_harm",
        title: "Self-harm risk on admission", description: "Baseline assessment",
        likelihood: 2, impact: 3, inherent_risk_score: 6,
        current_risk_level: "medium", residual_risk_level: null,
        mitigations: ["Evening check-ins"], triggers: ["Family contact endings"],
        protective_factors: ["Trusts keyworker"], status: "mitigated",
        assessor_id: "st-1", reviewer_id: null,
        review_date: null, next_review_date: "2026-09-01",
        created_at: "2026-08-01T09:00:00Z", updated_at: "2026-08-01T09:00:00Z",
      },
      {
        id: "ra-2", home_id: home, child_id: "yp-1", category: "self_harm",
        title: "Self-harm risk — re-assessment", description: "Escalation after contact cancellation",
        likelihood: 4, impact: 4, inherent_risk_score: 16,
        current_risk_level: "high", residual_risk_level: null,
        mitigations: ["1:1 evening support", "Room sweep agreed"], triggers: ["Cancelled contact"],
        protective_factors: [], status: "escalated",
        assessor_id: "st-1", reviewer_id: "st-2",
        review_date: null, next_review_date: "2026-09-20",
        created_at: "2026-09-05T09:00:00Z", updated_at: "2026-09-05T09:00:00Z",
      },
      // First assessment, residual recorded: with-mitigations level wins;
      // very_low joins low; vocabulary renames hold.
      {
        id: "ra-3", home_id: home, child_id: "yp-2", category: "substance_misuse",
        title: "Substance misuse", description: "Historic cannabis use",
        likelihood: 2, impact: 2, inherent_risk_score: 4,
        current_risk_level: "medium", residual_risk_level: "very_low",
        mitigations: [], triggers: [],
        protective_factors: ["Engaged with drugs worker"], status: "active",
        assessor_id: "st-2", reviewer_id: null,
        review_date: "2026-09-01", next_review_date: "2026-10-01",
        created_at: "2026-09-01T09:00:00Z", updated_at: "2026-09-01T09:00:00Z",
      },
      // Radicalisation is exploitation-shaped harm (Prevent/EFH) — projected.
      {
        id: "ra-4", home_id: home, child_id: "yp-2", category: "radicalisation",
        title: "Prevent concern", description: "Online contact flagged",
        likelihood: 3, impact: 4, inherent_risk_score: 12,
        current_risk_level: "high", residual_risk_level: null,
        mitigations: ["Prevent referral discussed"], triggers: [],
        protective_factors: [], status: "under_review",
        assessor_id: "st-1", reviewer_id: null,
        review_date: null, next_review_date: "2026-09-15",
        created_at: "2026-09-02T09:00:00Z", updated_at: "2026-09-02T09:00:00Z",
      },
      // Capture-only: a premises risk cannot wear a child-harm domain.
      {
        id: "ra-5", home_id: home, child_id: null, category: "environmental",
        title: "Garden fence damage", description: "Rear fence panel loose",
        likelihood: 3, impact: 2, inherent_risk_score: 6,
        current_risk_level: "medium", residual_risk_level: null,
        mitigations: [], triggers: [], protective_factors: [], status: "active",
        assessor_id: "st-1", reviewer_id: null,
        review_date: null, next_review_date: "2026-09-10",
        created_at: "2026-09-03T09:00:00Z", updated_at: "2026-09-03T09:00:00Z",
      },
      // Capture-only: bullying is direction-ambiguous — no honest domain.
      {
        id: "ra-6", home_id: home, child_id: "yp-1", category: "bullying",
        title: "Peer conflict", description: "Name-calling both ways",
        likelihood: 2, impact: 2, inherent_risk_score: 4,
        current_risk_level: "low", residual_risk_level: null,
        mitigations: [], triggers: [], protective_factors: [], status: "active",
        assessor_id: "st-2", reviewer_id: null,
        review_date: null, next_review_date: "2026-09-25",
        created_at: "2026-09-04T09:00:00Z", updated_at: "2026-09-04T09:00:00Z",
      },
    ],
  });
});

import { dal } from "@/lib/db";

describe("dal.riskAssessments (live leg — the consolidation projection)", () => {
  it("projects the capture honestly, deriving trend from real history", async () => {
    const all = await dal.riskAssessments.findAll();
    expect(all.map((a) => a.id).sort()).toEqual(["ra-1", "ra-2", "ra-3", "ra-4"]); // ra-5/ra-6 capture-only

    const re = all.find((a) => a.id === "ra-2")!;
    expect(re.domain).toBe("self_harm");
    expect(re.current_level).toBe("high");
    expect(re.previous_level).toBe("medium");     // the REAL earlier assessment
    expect(re.trend).toBe("increasing");          // derived, not invented
    expect(re.status).toBe("current");            // escalated stays live — never under-alarm
    expect(re.review_date).toBe("2026-09-20");    // what overdue arithmetic runs on
    expect(re.mitigations).toEqual([
      { strategy: "1:1 evening support", responsible: "", effectiveness: "not_yet_assessed" },
      { strategy: "Room sweep agreed", responsible: "", effectiveness: "not_yet_assessed" },
    ]);
    expect(re.indicators).toEqual([]);            // nothing recorded, nothing invented
    expect(re.child_views).toBe("");

    const first = all.find((a) => a.id === "ra-1")!;
    expect(first.previous_level).toBe("medium");  // first reading spans itself
    expect(first.trend).toBe("stable");
    expect(first.status).toBe("superseded");      // mitigated → superseded

    const sub = all.find((a) => a.id === "ra-3")!;
    expect(sub.domain).toBe("substance_use");     // vocabulary rename
    expect(sub.current_level).toBe("low");        // residual very_low wins, joins low

    const prevent = all.find((a) => a.id === "ra-4")!;
    expect(prevent.domain).toBe("exploitation");  // radicalisation under Prevent/EFH
    expect(prevent.status).toBe("under_review");
  });

  it("findByChild and findById see the same thread-derived history", async () => {
    // The fake's .eq is a documented no-op (real filtering is PostgREST's;
    // the DDL is proven in PGlite) — what this asserts is that findByChild
    // feeds the same projection, thread derivation intact.
    const yp1 = await dal.riskAssessments.findByChild("yp-1");
    expect(yp1.find((a) => a.id === "ra-2")!.trend).toBe("increasing");
    expect(yp1.some((a) => a.id === "ra-5" || a.id === "ra-6")).toBe(false);

    const one = await dal.riskAssessments.findById("ra-2");
    expect(one?.previous_level).toBe("medium");
    expect(one?.trend).toBe("increasing");

    const captureOnly = await dal.riskAssessments.findById("ra-5");
    expect(captureOnly).toBeNull();               // premises risk lives in capture surfaces
  });
});
