// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFER RECRUITMENT INTELLIGENCE ENGINE — TESTS
// 40+ tests covering helpers, overview, candidate profiles, check analysis,
// alerts, Cara insights, and full Chamberlain House integration scenario.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSaferRecruitmentIntelligence,
  daysBetween,
  daysUntil,
  average,
  type VacancyInput,
  type CandidateInput,
  type CheckInput,
  type ReferenceInput,
  type ConditionalOfferInput,
  type SaferRecruitmentIntelligenceInput,
  type CandidateStage,
  type CheckType,
  type CheckStatus,
  type ReferenceStatus,
} from "../safer-recruitment-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factory helpers ─────────────────────────────────────────────────────────

function makeVacancy(overrides: Partial<VacancyInput> = {}): VacancyInput {
  return {
    id: "vac_001",
    title: "Residential Care Worker",
    status: "open",
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<CandidateInput> = {}): CandidateInput {
  return {
    id: "cand_001",
    name: "Test Candidate",
    vacancy_id: "vac_001",
    current_stage: "interview_scheduled",
    compliance_status: "in_progress",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    created_at: "2026-03-20",
    ...overrides,
  };
}

function makeCheck(overrides: Partial<CheckInput> = {}): CheckInput {
  return {
    id: "chk_001",
    candidate_id: "cand_001",
    check_type: "enhanced_dbs",
    status: "not_started",
    required: true,
    due_date: "2026-06-30",
    requested_at: null,
    received_at: null,
    verified_at: null,
    concern_flag: false,
    override_used: false,
    ...overrides,
  };
}

function makeReference(overrides: Partial<ReferenceInput> = {}): ReferenceInput {
  return {
    id: "ref_001",
    candidate_id: "cand_001",
    is_most_recent_employer: true,
    status: "requested",
    requested_at: "2026-04-01",
    received_at: null,
    chased_at: null,
    verbal_verification_completed: false,
    discrepancy_flag: false,
    reliability_rating: null,
    ...overrides,
  };
}

function makeOffer(overrides: Partial<ConditionalOfferInput> = {}): ConditionalOfferInput {
  return {
    id: "offer_001",
    candidate_id: "cand_001",
    status: "conditional_sent",
    proposed_start_date: "2026-06-01",
    exceptional_start: false,
    conditions: ["Clear DBS"],
    final_clearance_completed_at: null,
    ...overrides,
  };
}

function run(overrides: Partial<SaferRecruitmentIntelligenceInput> = {}) {
  return computeSaferRecruitmentIntelligence({
    vacancies: [],
    candidates: [],
    checks: [],
    references: [],
    offers: [],
    today: TODAY,
    ...overrides,
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

describe("helpers", () => {
  it("daysBetween computes absolute days", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysBetween("2026-01-31", "2026-01-01")).toBe(30);
  });

  it("daysUntil computes signed days", () => {
    expect(daysUntil("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysUntil("2026-01-31", "2026-01-01")).toBe(-30);
  });

  it("average handles empty array", () => {
    expect(average([])).toBe(0);
  });

  it("average computes correct mean", () => {
    expect(average([10, 20, 30])).toBe(20);
  });
});

// ── Empty state ─────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns safe defaults with no data", () => {
    const result = run();
    expect(result.overview.total_vacancies).toBe(0);
    expect(result.overview.active_candidates).toBe(0);
    expect(result.overview.compliance_rate).toBeNull();
    expect(result.overview.dbs_completion_rate).toBeNull();
    expect(result.overview.schedule2_completion_rate).toBeNull();
    expect(result.candidate_profiles).toHaveLength(0);
    expect(result.check_analysis).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights).toHaveLength(0);
  });
});

// ── Overview ────────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts vacancies correctly", () => {
    const result = run({
      vacancies: [
        makeVacancy({ id: "v1", status: "open" }),
        makeVacancy({ id: "v2", status: "closed" }),
        makeVacancy({ id: "v3", status: "open" }),
      ],
    });
    expect(result.overview.total_vacancies).toBe(3);
    expect(result.overview.open_vacancies).toBe(2);
  });

  it("excludes terminal-stage candidates from active count", () => {
    const result = run({
      candidates: [
        makeCandidate({ id: "c1", current_stage: "interview_scheduled" }),
        makeCandidate({ id: "c2", current_stage: "appointed" }),
        makeCandidate({ id: "c3", current_stage: "withdrawn" }),
        makeCandidate({ id: "c4", current_stage: "pre_start_checks" }),
      ],
    });
    expect(result.overview.total_candidates).toBe(4);
    expect(result.overview.active_candidates).toBe(2);
  });

  it("computes candidates_by_stage for active only", () => {
    const result = run({
      candidates: [
        makeCandidate({ id: "c1", current_stage: "interview_scheduled" }),
        makeCandidate({ id: "c2", current_stage: "interview_scheduled" }),
        makeCandidate({ id: "c3", current_stage: "pre_start_checks" }),
        makeCandidate({ id: "c4", current_stage: "appointed" }),
      ],
    });
    expect(result.overview.candidates_by_stage["interview_scheduled"]).toBe(2);
    expect(result.overview.candidates_by_stage["pre_start_checks"]).toBe(1);
    expect(result.overview.candidates_by_stage["appointed"]).toBeUndefined();
  });

  it("computes avg days in pipeline", () => {
    // c1: created 2026-03-25, today 2026-05-25 = 61 days
    // c2: created 2026-04-25, today 2026-05-25 = 30 days
    // avg = (61 + 30) / 2 = 45.5 → rounded to 46
    const result = run({
      candidates: [
        makeCandidate({ id: "c1", created_at: "2026-03-25" }),
        makeCandidate({ id: "c2", created_at: "2026-04-25" }),
      ],
    });
    expect(result.overview.avg_days_in_pipeline).toBe(46);
  });

  it("counts overdue checks for active candidates only", () => {
    const result = run({
      candidates: [
        makeCandidate({ id: "c1", current_stage: "interview_scheduled" }),
        makeCandidate({ id: "c2", current_stage: "appointed" }),
      ],
      checks: [
        // Active candidate, overdue
        makeCheck({ id: "chk1", candidate_id: "c1", due_date: "2026-04-01", status: "not_started" }),
        // Appointed candidate, overdue — should NOT count
        makeCheck({ id: "chk2", candidate_id: "c2", due_date: "2026-04-01", status: "not_started" }),
        // Active candidate, not overdue
        makeCheck({ id: "chk3", candidate_id: "c1", due_date: "2026-07-01", status: "not_started" }),
      ],
    });
    expect(result.overview.overdue_checks).toBe(1);
  });

  it("counts outstanding references", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "requested" }),
        makeReference({ id: "r2", candidate_id: "c1", status: "satisfactory" }),
        makeReference({ id: "r3", candidate_id: "c1", status: "chased" }),
      ],
    });
    expect(result.overview.outstanding_references).toBe(2);
  });

  it("computes compliance rate", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [
        makeCandidate({ id: "c1" }),
        makeCandidate({ id: "c2" }),
      ],
      checks: [
        // c1: all verified
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
        makeCheck({ id: "chk2", candidate_id: "c1", check_type: "right_to_work", status: "verified" }),
        // c2: not all verified
        makeCheck({ id: "chk3", candidate_id: "c2", check_type: "enhanced_dbs", status: "not_started" }),
        makeCheck({ id: "chk4", candidate_id: "c2", check_type: "right_to_work", status: "verified" }),
      ],
    });
    expect(result.overview.compliance_rate).toBe(50); // 1 of 2
  });

  it("computes DBS completion rate", () => {
    const result = run({
      candidates: [
        makeCandidate({ id: "c1" }),
        makeCandidate({ id: "c2" }),
        makeCandidate({ id: "c3" }),
      ],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
        makeCheck({ id: "chk2", candidate_id: "c2", check_type: "enhanced_dbs", status: "in_progress" }),
        // c3 has no DBS check at all
      ],
    });
    expect(result.overview.dbs_completion_rate).toBe(33); // 1 of 3
  });

  it("computes Schedule 2 completion rate", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" }), makeCandidate({ id: "c2" })],
      checks: [
        // c1: all 4 Schedule 2 checks verified
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
        makeCheck({ id: "chk2", candidate_id: "c1", check_type: "right_to_work", status: "verified" }),
        makeCheck({ id: "chk3", candidate_id: "c1", check_type: "identity", status: "verified" }),
        makeCheck({ id: "chk4", candidate_id: "c1", check_type: "references", status: "verified" }),
        // c2: missing identity
        makeCheck({ id: "chk5", candidate_id: "c2", check_type: "enhanced_dbs", status: "verified" }),
        makeCheck({ id: "chk6", candidate_id: "c2", check_type: "right_to_work", status: "verified" }),
        makeCheck({ id: "chk7", candidate_id: "c2", check_type: "references", status: "verified" }),
      ],
    });
    expect(result.overview.schedule2_completion_rate).toBe(50); // 1 of 2
  });
});

// ── Candidate Profiles ──────────────────────────────────────────────────────

describe("candidate profiles", () => {
  it("calculates check completion percentage", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", status: "verified" }),
        makeCheck({ id: "chk2", candidate_id: "c1", status: "received", check_type: "right_to_work" }),
        makeCheck({ id: "chk3", candidate_id: "c1", status: "not_started", check_type: "identity" }),
        makeCheck({ id: "chk4", candidate_id: "c1", status: "in_progress", check_type: "references" }),
      ],
    });
    const p = result.candidate_profiles[0];
    expect(p.total_checks).toBe(4);
    expect(p.completed_checks).toBe(2); // verified + received
    expect(p.check_completion_pct).toBe(50);
  });

  it("tracks DBS status correctly", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "in_progress" }),
      ],
    });
    expect(result.candidate_profiles[0].dbs_status).toBe("in_progress");
  });

  it("reports none when no DBS check exists", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "right_to_work", status: "verified" }),
      ],
    });
    expect(result.candidate_profiles[0].dbs_status).toBe("none");
  });

  it("counts references received", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "satisfactory" }),
        makeReference({ id: "r2", candidate_id: "c1", status: "requested", is_most_recent_employer: false }),
      ],
    });
    const p = result.candidate_profiles[0];
    expect(p.references_received).toBe(1);
    expect(p.references_total).toBe(2);
    expect(p.has_recent_employer_ref).toBe(true);
  });

  it("tracks verbal verifications", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "satisfactory", verbal_verification_completed: true }),
        makeReference({ id: "r2", candidate_id: "c1", status: "satisfactory", verbal_verification_completed: false, is_most_recent_employer: false }),
      ],
    });
    const p = result.candidate_profiles[0];
    expect(p.verbal_verifications_done).toBe(1);
    expect(p.verbal_verifications_total).toBe(2);
  });

  it("identifies risk flags — DBS not started", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "not_started" }),
      ],
    });
    expect(result.candidate_profiles[0].risk_flags).toContain("DBS not started");
  });

  it("identifies risk flags — DBS concern", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "concern_flagged" }),
      ],
    });
    expect(result.candidate_profiles[0].risk_flags).toContain("DBS concern flagged");
  });

  it("identifies risk flags — overdue checks", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", due_date: "2026-04-01", status: "not_started" }),
      ],
    });
    expect(result.candidate_profiles[0].risk_flags).toContain("1 overdue check(s)");
  });

  it("identifies risk flags — reference discrepancy", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", discrepancy_flag: true }),
      ],
    });
    expect(result.candidate_profiles[0].risk_flags).toContain("Reference discrepancy flagged");
  });

  it("identifies risk flags — override used", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", override_used: true, status: "verified" }),
      ],
    });
    expect(result.candidate_profiles[0].risk_flags).toContain("Override used on check");
  });

  it("detects conditional offer and exceptional start", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      offers: [makeOffer({ candidate_id: "c1", exceptional_start: true })],
    });
    const p = result.candidate_profiles[0];
    expect(p.has_conditional_offer).toBe(true);
    expect(p.exceptional_start).toBe(true);
  });

  it("can_start requires all checks verified + 2 satisfactory refs + DBS verified", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
        makeCheck({ id: "chk2", candidate_id: "c1", check_type: "right_to_work", status: "verified" }),
        makeCheck({ id: "chk3", candidate_id: "c1", check_type: "identity", status: "verified" }),
        makeCheck({ id: "chk4", candidate_id: "c1", check_type: "references", status: "verified" }),
      ],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "satisfactory" }),
        makeReference({ id: "r2", candidate_id: "c1", status: "satisfactory", is_most_recent_employer: false }),
      ],
    });
    expect(result.candidate_profiles[0].can_start).toBe(true);
  });

  it("can_start is false when DBS not verified", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "in_progress" }),
        makeCheck({ id: "chk2", candidate_id: "c1", check_type: "right_to_work", status: "verified" }),
      ],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "satisfactory" }),
        makeReference({ id: "r2", candidate_id: "c1", status: "satisfactory", is_most_recent_employer: false }),
      ],
    });
    expect(result.candidate_profiles[0].can_start).toBe(false);
  });

  it("can_start is false with fewer than 2 satisfactory references", () => {
    const result = run({
      vacancies: [makeVacancy()],
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
      ],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "satisfactory" }),
        makeReference({ id: "r2", candidate_id: "c1", status: "requested", is_most_recent_employer: false }),
      ],
    });
    expect(result.candidate_profiles[0].can_start).toBe(false);
  });
});

// ── Check Type Analysis ─────────────────────────────────────────────────────

describe("check type analysis", () => {
  it("groups checks by type with counts", () => {
    const result = run({
      candidates: [
        makeCandidate({ id: "c1" }),
        makeCandidate({ id: "c2" }),
      ],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
        makeCheck({ id: "chk2", candidate_id: "c2", check_type: "enhanced_dbs", status: "not_started" }),
        makeCheck({ id: "chk3", candidate_id: "c1", check_type: "right_to_work", status: "verified" }),
        makeCheck({ id: "chk4", candidate_id: "c2", check_type: "right_to_work", status: "verified" }),
      ],
    });
    const dbs = result.check_analysis.find((a) => a.check_type === "enhanced_dbs");
    expect(dbs).toBeDefined();
    expect(dbs!.total).toBe(2);
    expect(dbs!.verified).toBe(1);
    expect(dbs!.not_started).toBe(1);
    expect(dbs!.completion_rate).toBe(50);

    const rtw = result.check_analysis.find((a) => a.check_type === "right_to_work");
    expect(rtw!.completion_rate).toBe(100);
  });

  it("sorts by worst completion rate first", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "not_started" }),
        makeCheck({ id: "chk2", candidate_id: "c1", check_type: "right_to_work", status: "verified" }),
      ],
    });
    expect(result.check_analysis[0].check_type).toBe("enhanced_dbs");
    expect(result.check_analysis[1].check_type).toBe("right_to_work");
  });

  it("counts overdue and concern-flagged checks", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "not_started", due_date: "2026-04-01", concern_flag: true }),
      ],
    });
    const dbs = result.check_analysis[0];
    expect(dbs.overdue).toBe(1);
    expect(dbs.concern_flagged).toBe(1);
  });
});

// ── Alerts ──────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("generates critical alert for candidate at pre-start without DBS", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1", current_stage: "pre_start_checks" })],
    });
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(1);
    expect(critical[0].message).toContain("Pre Start Checks");
    expect(critical[0].message).toContain("DBS");
  });

  it("generates critical alert for DBS concern flagged", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "concern_flagged" }),
      ],
    });
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.some((a) => a.message.includes("DBS concern flagged"))).toBe(true);
  });

  it("generates high alert for overdue checks", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", due_date: "2026-04-01", status: "not_started" }),
        makeCheck({ id: "chk2", candidate_id: "c1", due_date: "2026-03-15", status: "in_progress", check_type: "right_to_work" }),
      ],
    });
    const high = result.alerts.filter((a) => a.severity === "high");
    expect(high.some((a) => a.message.includes("overdue"))).toBe(true);
  });

  it("generates high alert for exceptional start", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      offers: [makeOffer({ candidate_id: "c1", exceptional_start: true })],
    });
    const high = result.alerts.filter((a) => a.severity === "high");
    expect(high.some((a) => a.message.includes("exceptional start"))).toBe(true);
  });

  it("generates medium alert for no refs post-interview", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1", current_stage: "references_requested" })],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "requested" }),
      ],
    });
    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("no references received"))).toBe(true);
  });

  it("generates medium alert for reference discrepancy", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1", current_stage: "interview_scheduled" })],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", discrepancy_flag: true, status: "received" }),
      ],
    });
    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("discrepancy"))).toBe(true);
  });

  it("generates low alert for long pipeline candidates", () => {
    // created_at 2026-03-01 → 85 days in pipeline (> 60)
    const result = run({
      candidates: [makeCandidate({ id: "c1", created_at: "2026-03-01" })],
    });
    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low.some((a) => a.message.includes("over 60 days"))).toBe(true);
  });
});

// ── Cara Insights ───────────────────────────────────────────────────────────

describe("Cara insights", () => {
  it("generates critical insight for advanced stage without full checks", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1", current_stage: "pre_start_checks" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", status: "not_started" }),
      ],
    });
    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical.some((i) => i.text.includes("advanced stages"))).toBe(true);
  });

  it("generates warning for low DBS completion rate", () => {
    const result = run({
      candidates: [
        makeCandidate({ id: "c1" }),
        makeCandidate({ id: "c2" }),
        makeCandidate({ id: "c3" }),
      ],
      checks: [
        // none have verified DBS → 0%
      ],
    });
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((i) => i.text.includes("0%") && i.text.includes("verified DBS"))).toBe(true);
  });

  it("generates warning for outstanding references >= 50%", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "requested" }),
        makeReference({ id: "r2", candidate_id: "c1", status: "requested", is_most_recent_employer: false }),
      ],
    });
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((i) => i.text.includes("outstanding"))).toBe(true);
  });

  it("generates warning for overdue checks", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", due_date: "2026-04-01", status: "not_started" }),
      ],
    });
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((i) => i.text.includes("overdue"))).toBe(true);
  });

  it("generates positive insight for 100% DBS completion", () => {
    const result = run({
      candidates: [
        makeCandidate({ id: "c1" }),
        makeCandidate({ id: "c2" }),
      ],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
        makeCheck({ id: "chk2", candidate_id: "c2", check_type: "enhanced_dbs", status: "verified" }),
      ],
    });
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((i) => i.text.includes("verified DBS"))).toBe(true);
  });

  it("generates positive insight for 100% Schedule 2 compliance", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
        makeCheck({ id: "chk2", candidate_id: "c1", check_type: "right_to_work", status: "verified" }),
        makeCheck({ id: "chk3", candidate_id: "c1", check_type: "identity", status: "verified" }),
        makeCheck({ id: "chk4", candidate_id: "c1", check_type: "references", status: "verified" }),
      ],
    });
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((i) => i.text.includes("Schedule 2"))).toBe(true);
  });

  it("generates positive insight for verbal verification of all received refs", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", check_type: "enhanced_dbs", status: "verified" }),
      ],
      references: [
        makeReference({ id: "r1", candidate_id: "c1", status: "satisfactory", verbal_verification_completed: true }),
        makeReference({ id: "r2", candidate_id: "c1", status: "satisfactory", verbal_verification_completed: true, is_most_recent_employer: false }),
      ],
    });
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((i) => i.text.includes("verbally verified"))).toBe(true);
  });

  it("generates positive insight for no overdue checks", () => {
    const result = run({
      candidates: [makeCandidate({ id: "c1" })],
      checks: [
        makeCheck({ id: "chk1", candidate_id: "c1", due_date: "2026-07-01", status: "not_started" }),
      ],
    });
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((i) => i.text.includes("No overdue"))).toBe(true);
  });
});

// ── Chamberlain House Integration ───────────────────────────────────────────────────

describe("Chamberlain House integration", () => {
  it("processes real Chamberlain House safer recruitment data", () => {
    const vacancies: VacancyInput[] = [
      makeVacancy({ id: "vac_001", title: "Residential Care Worker", status: "open", created_at: "2026-03-08" }),
      makeVacancy({ id: "vac_002", title: "Team Leader", status: "open", created_at: "2026-03-14" }),
    ];

    const candidates: CandidateInput[] = [
      // Amara — interview_scheduled, checks all not_started
      makeCandidate({
        id: "cand_001", name: "Amara Osei", vacancy_id: "vac_001",
        current_stage: "interview_scheduled", created_at: "2026-03-20",
      }),
      // Daniel — references_received, DBS not started, some checks verified
      makeCandidate({
        id: "cand_002", name: "Daniel Wright", vacancy_id: "vac_001",
        current_stage: "references_received", created_at: "2026-03-22",
      }),
      // Priscilla — pre_start_checks, DBS in progress, most checks verified, conditional offer
      makeCandidate({
        id: "cand_003", name: "Priscilla Mensah", vacancy_id: "vac_002",
        current_stage: "pre_start_checks", created_at: "2026-03-18",
      }),
    ];

    const checks: CheckInput[] = [
      // Amara's checks — all not_started, due 2026-04-30 (overdue as of 2026-05-25)
      makeCheck({ id: "chk_001", candidate_id: "cand_001", check_type: "enhanced_dbs", status: "not_started", due_date: "2026-04-30" }),
      makeCheck({ id: "chk_002", candidate_id: "cand_001", check_type: "right_to_work", status: "not_started", due_date: "2026-04-30" }),
      makeCheck({ id: "chk_003", candidate_id: "cand_001", check_type: "identity", status: "not_started", due_date: "2026-04-30" }),
      makeCheck({ id: "chk_004", candidate_id: "cand_001", check_type: "references", status: "not_started", due_date: "2026-04-30" }),
      // Daniel's checks — DBS not started (overdue), RTW + identity verified, refs in progress
      makeCheck({ id: "chk_005", candidate_id: "cand_002", check_type: "enhanced_dbs", status: "not_started", due_date: "2026-04-28" }),
      makeCheck({ id: "chk_006", candidate_id: "cand_002", check_type: "right_to_work", status: "verified", due_date: "2026-04-28" }),
      makeCheck({ id: "chk_007", candidate_id: "cand_002", check_type: "identity", status: "verified", due_date: "2026-04-28" }),
      makeCheck({ id: "chk_008", candidate_id: "cand_002", check_type: "references", status: "in_progress", due_date: "2026-04-28" }),
      // Priscilla's checks — DBS in progress (overdue), RTW + identity + refs verified
      makeCheck({ id: "chk_009", candidate_id: "cand_003", check_type: "enhanced_dbs", status: "in_progress", due_date: "2026-05-01" }),
      makeCheck({ id: "chk_010", candidate_id: "cand_003", check_type: "right_to_work", status: "verified", due_date: "2026-05-01" }),
      makeCheck({ id: "chk_011", candidate_id: "cand_003", check_type: "identity", status: "verified", due_date: "2026-05-01" }),
      makeCheck({ id: "chk_012", candidate_id: "cand_003", check_type: "references", status: "verified", due_date: "2026-05-01" }),
    ];

    const references: ReferenceInput[] = [
      // Amara — 2 requested, none received
      makeReference({ id: "ref_001", candidate_id: "cand_001", status: "requested", is_most_recent_employer: true }),
      makeReference({ id: "ref_002", candidate_id: "cand_001", status: "requested", is_most_recent_employer: false }),
      // Daniel — 1 satisfactory (verbally verified), 1 chased
      makeReference({ id: "ref_003", candidate_id: "cand_002", status: "satisfactory", verbal_verification_completed: true, reliability_rating: "high", is_most_recent_employer: true }),
      makeReference({ id: "ref_004", candidate_id: "cand_002", status: "chased", is_most_recent_employer: false }),
      // Priscilla — 2 satisfactory (both verbally verified)
      makeReference({ id: "ref_005", candidate_id: "cand_003", status: "satisfactory", verbal_verification_completed: true, reliability_rating: "high", is_most_recent_employer: true }),
      makeReference({ id: "ref_006", candidate_id: "cand_003", status: "satisfactory", verbal_verification_completed: true, reliability_rating: "high", is_most_recent_employer: false }),
    ];

    const offers: ConditionalOfferInput[] = [
      makeOffer({ id: "offer_001", candidate_id: "cand_003", proposed_start_date: "2026-05-12" }),
    ];

    const result = run({ vacancies, candidates, checks, references, offers });

    // Overview
    expect(result.overview.total_vacancies).toBe(2);
    expect(result.overview.open_vacancies).toBe(2);
    expect(result.overview.total_candidates).toBe(3);
    expect(result.overview.active_candidates).toBe(3);

    // Overdue checks: Amara has 4 overdue (due 2026-04-30, all not_started)
    // Daniel has 2 overdue (DBS not_started due 2026-04-28, refs in_progress due 2026-04-28)
    // Priscilla has 1 overdue (DBS in_progress due 2026-05-01)
    expect(result.overview.overdue_checks).toBe(7);

    // Outstanding references: Amara 2 requested, Daniel 1 chased = 3
    expect(result.overview.outstanding_references).toBe(3);

    // DBS completion: 0 of 3 have verified DBS
    expect(result.overview.dbs_completion_rate).toBe(0);

    // Schedule 2: 0 of 3 (Priscilla missing DBS verified)
    expect(result.overview.schedule2_completion_rate).toBe(0);

    // Compliance: 0 of 3 (no one has all checks verified)
    expect(result.overview.compliance_rate).toBe(0);

    // Candidate profiles
    const amara = result.candidate_profiles.find((p) => p.candidate_id === "cand_001")!;
    expect(amara.overdue_checks).toBe(4);
    expect(amara.dbs_status).toBe("not_started");
    expect(amara.references_received).toBe(0);
    expect(amara.can_start).toBe(false);

    const daniel = result.candidate_profiles.find((p) => p.candidate_id === "cand_002")!;
    expect(daniel.dbs_status).toBe("not_started");
    expect(daniel.references_received).toBe(1);
    expect(daniel.has_recent_employer_ref).toBe(true);
    expect(daniel.can_start).toBe(false);

    const priscilla = result.candidate_profiles.find((p) => p.candidate_id === "cand_003")!;
    expect(priscilla.dbs_status).toBe("in_progress");
    expect(priscilla.references_received).toBe(2);
    expect(priscilla.has_conditional_offer).toBe(true);
    expect(priscilla.can_start).toBe(false); // DBS not verified

    // Check analysis — DBS should be worst
    expect(result.check_analysis[0].check_type).toBe("enhanced_dbs");
    expect(result.check_analysis[0].verified).toBe(0);

    // Alerts should include critical for Priscilla at pre_start without DBS
    // (DBS is "in_progress" not "none"/"not_started", so no critical for that)
    // But overdue checks alert should fire
    const highAlerts = result.alerts.filter((a) => a.severity === "high");
    expect(highAlerts.some((a) => a.message.includes("overdue"))).toBe(true);

    // Critical insight for advanced stage without full checks
    const criticalInsights = result.insights.filter((i) => i.severity === "critical");
    expect(criticalInsights.some((i) => i.text.includes("advanced stages"))).toBe(true);

    // Warning for low DBS rate
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((i) => i.text.includes("0%") && i.text.includes("DBS"))).toBe(true);

    // Warning for overdue checks
    expect(warnings.some((i) => i.text.includes("overdue"))).toBe(true);
  });
});
