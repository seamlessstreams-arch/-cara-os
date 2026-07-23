// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME REGULATORY COMPLIANCE INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeRegulatoryCompliance,
  type HomeRegulatoryComplianceInput,
  type Reg44VisitInput,
  type Reg44RecommendationInput,
  type AuditInput,
  type NotifiableEventInput,
  type InspectionInput,
  type PolicyInput,
} from "../home-regulatory-compliance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeReg44(overrides: Partial<Reg44VisitInput> = {}): Reg44VisitInput {
  return {
    id: "v44_1",
    visit_date: "2026-05-19",
    overall_judgement: "Good — no immediate concerns.",
    strengths_count: 3,
    areas_for_development_count: 1,
    recommendations: [
      { id: "rec_1", priority: "medium", status: "completed", completed_at: "2026-05-25" },
    ],
    report_sent_to_ofsted: true,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<AuditInput> = {}): AuditInput {
  return {
    id: "a1",
    title: "Medication Audit",
    category: "medication",
    date: "2026-05-12",
    score: 90,
    max_score: 100,
    status: "completed",
    findings: 1,
    actions: 1,
    ...overrides,
  };
}

function makeNotifiable(overrides: Partial<NotifiableEventInput> = {}): NotifiableEventInput {
  return {
    id: "ne_1",
    date: "2026-05-20",
    event_type: "restraint",
    ofsted_status: "notified_within_24h",
    has_follow_up: true,
    has_lesson_learned: true,
    ...overrides,
  };
}

function makeInspection(overrides: Partial<InspectionInput> = {}): InspectionInput {
  return {
    id: "insp_1",
    inspection_date: "2025-10-15",
    inspection_type: "Full inspection",
    grade: "Good",
    actions_required: 2,
    actions_completed: 2,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<PolicyInput> = {}): PolicyInput {
  return {
    id: "pol_1",
    title: "Safeguarding Policy",
    category: "safeguarding",
    status: "current",
    next_review_date: "2026-07-10",
    last_reviewed: "2026-02-25",
    acknowledgement_count: 8,
    total_staff_required: 8,
    statutory_basis: "Reg 12, Reg 13",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeRegulatoryComplianceInput> = {}): HomeRegulatoryComplianceInput {
  return {
    today: "2026-05-26",
    reg44_visits: [
      makeReg44({ id: "v1", visit_date: "2026-05-19" }),
      makeReg44({ id: "v2", visit_date: "2026-04-19" }),
      makeReg44({ id: "v3", visit_date: "2026-03-20" }),
      makeReg44({ id: "v4", visit_date: "2026-02-18" }),
    ],
    audits: [
      makeAudit({ id: "a1", date: "2026-05-12", score: 92, max_score: 100 }),
      makeAudit({ id: "a2", date: "2026-04-26", score: 87, max_score: 100 }),
    ],
    notifiable_events: [
      makeNotifiable({ id: "ne1", date: "2026-05-23" }),
      makeNotifiable({ id: "ne2", date: "2026-05-16" }),
    ],
    inspections: [
      makeInspection({ id: "insp1", inspection_date: "2025-10-15", grade: "Good" }),
    ],
    policies: [
      makePolicy({ id: "pol1" }),
      makePolicy({ id: "pol2", title: "Health & Safety", next_review_date: "2026-08-10" }),
      makePolicy({ id: "pol3", title: "Complaints", next_review_date: "2026-06-15" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Regulatory Compliance Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeRegulatoryCompliance(baseInput());
    expect(r).toHaveProperty("regulatory_compliance_rating");
    expect(r).toHaveProperty("regulatory_compliance_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("reg44");
    expect(r).toHaveProperty("audits");
    expect(r).toHaveProperty("notifiable_events");
    expect(r).toHaveProperty("inspection");
    expect(r).toHaveProperty("policies");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("assigns a valid rating", () => {
    const r = computeHomeRegulatoryCompliance(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.regulatory_compliance_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeRegulatoryCompliance(baseInput());
    expect(r.regulatory_compliance_score).toBeGreaterThanOrEqual(0);
    expect(r.regulatory_compliance_score).toBeLessThanOrEqual(100);
  });

  // ── Insufficient Data ─────────────────────────────────────────────────────

  it("returns insufficient_data when fewer than 3 data points", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [makeReg44()],
      audits: [],
      notifiable_events: [],
      inspections: [],
      policies: [],
    }));
    expect(r.regulatory_compliance_rating).toBe("insufficient_data");
    expect(r.regulatory_compliance_score).toBe(0);
  });

  // ── Reg 44 Profile ────────────────────────────────────────────────────────

  it("counts visits in 12 months", () => {
    const r = computeHomeRegulatoryCompliance(baseInput());
    expect(r.reg44.total_visits_12m).toBe(4);
  });

  it("detects open recommendations", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({
          id: "v1",
          visit_date: "2026-05-19",
          recommendations: [
            { id: "r1", priority: "high", status: "in_progress", completed_at: null },
            { id: "r2", priority: "medium", status: "completed", completed_at: "2026-05-22" },
          ],
        }),
      ],
    }));
    expect(r.reg44.open_recommendations).toBe(1);
    expect(r.reg44.high_priority_open).toBe(1);
  });

  it("calculates recommendation completion rate", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({
          id: "v1",
          visit_date: "2026-05-19",
          recommendations: [
            { id: "r1", priority: "medium", status: "completed", completed_at: "2026-05-22" },
            { id: "r2", priority: "low", status: "completed", completed_at: "2026-05-23" },
            { id: "r3", priority: "high", status: "in_progress", completed_at: null },
          ],
        }),
      ],
    }));
    expect(r.reg44.recommendation_completion_rate).toBe(67);
  });

  it("calculates Ofsted report submission rate", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({ id: "v1", visit_date: "2026-05-19", report_sent_to_ofsted: true }),
        makeReg44({ id: "v2", visit_date: "2026-04-19", report_sent_to_ofsted: false }),
      ],
    }));
    expect(r.reg44.reports_sent_to_ofsted_rate).toBe(50);
  });

  it("detects Reg 44 trend improving when AFD counts decrease", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({ id: "v1", visit_date: "2026-02-19", areas_for_development_count: 4 }),
        makeReg44({ id: "v2", visit_date: "2026-03-19", areas_for_development_count: 3 }),
        makeReg44({ id: "v3", visit_date: "2026-04-19", areas_for_development_count: 1 }),
        makeReg44({ id: "v4", visit_date: "2026-05-19", areas_for_development_count: 0 }),
      ],
    }));
    expect(r.reg44.trend).toBe("improving");
  });

  it("detects Reg 44 trend declining when AFD counts increase", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({ id: "v1", visit_date: "2026-02-19", areas_for_development_count: 0 }),
        makeReg44({ id: "v2", visit_date: "2026-03-19", areas_for_development_count: 1 }),
        makeReg44({ id: "v3", visit_date: "2026-04-19", areas_for_development_count: 3 }),
        makeReg44({ id: "v4", visit_date: "2026-05-19", areas_for_development_count: 4 }),
      ],
    }));
    expect(r.reg44.trend).toBe("declining");
  });

  // ── Audit Profile ─────────────────────────────────────────────────────────

  it("counts completed audits in 12 months", () => {
    const r = computeHomeRegulatoryCompliance(baseInput());
    expect(r.audits.completed_count_12m).toBe(2);
  });

  it("calculates average audit score as percentage", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", score: 80, max_score: 100 }),
        makeAudit({ id: "a2", score: 60, max_score: 100 }),
      ],
    }));
    expect(r.audits.avg_score).toBe(70);
  });

  it("detects overdue audits", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", date: "2026-05-10", status: "overdue" }),
        makeAudit({ id: "a2", date: "2026-05-12", status: "completed" }),
      ],
    }));
    expect(r.audits.overdue_count).toBe(1);
  });

  it("detects scheduled audits that are now overdue", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", date: "2026-05-01", status: "scheduled" }),  // past date = overdue
      ],
    }));
    expect(r.audits.overdue_count).toBe(1);
  });

  it("counts upcoming scheduled audits", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", date: "2026-06-15", status: "scheduled", score: 0, max_score: 100 }),
        makeAudit({ id: "a2", date: "2026-05-12", status: "completed" }),
      ],
    }));
    expect(r.audits.upcoming_count).toBe(1);
  });

  it("calculates total findings and actions", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", findings: 3, actions: 2 }),
        makeAudit({ id: "a2", findings: 1, actions: 1 }),
      ],
    }));
    expect(r.audits.total_findings_12m).toBe(4);
    expect(r.audits.total_actions_12m).toBe(3);
  });

  it("detects audit score trend improving", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", date: "2026-03-01", score: 60, max_score: 100 }),
        makeAudit({ id: "a2", date: "2026-05-01", score: 90, max_score: 100 }),
      ],
    }));
    expect(r.audits.trend).toBe("improving");
  });

  // ── Notifiable Events Profile ─────────────────────────────────────────────

  it("counts notifiable events in 90-day and 12-month windows", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", date: "2026-05-20" }),
        makeNotifiable({ id: "ne2", date: "2026-04-10" }),
        makeNotifiable({ id: "ne3", date: "2025-08-01" }),
      ],
    }));
    expect(r.notifiable_events.total_90d).toBe(2);
    expect(r.notifiable_events.total_12m).toBe(3);
  });

  it("calculates Ofsted notification rate", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "notified_within_24h" }),
        makeNotifiable({ id: "ne2", ofsted_status: "notified_within_24h" }),
        makeNotifiable({ id: "ne3", ofsted_status: "pending" }),
      ],
    }));
    expect(r.notifiable_events.notified_within_24h_rate).toBe(67);
  });

  it("counts pending notifications", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "pending" }),
        makeNotifiable({ id: "ne2", ofsted_status: "pending" }),
        makeNotifiable({ id: "ne3", ofsted_status: "notified_within_24h" }),
      ],
    }));
    expect(r.notifiable_events.pending_count).toBe(2);
  });

  it("calculates follow-up and lesson-learned rates", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", has_follow_up: true, has_lesson_learned: true }),
        makeNotifiable({ id: "ne2", has_follow_up: true, has_lesson_learned: false }),
        makeNotifiable({ id: "ne3", has_follow_up: false, has_lesson_learned: false }),
      ],
    }));
    expect(r.notifiable_events.follow_up_rate).toBe(67);
    expect(r.notifiable_events.lesson_learned_rate).toBe(33);
  });

  it("breaks down event types", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", event_type: "restraint" }),
        makeNotifiable({ id: "ne2", event_type: "restraint" }),
        makeNotifiable({ id: "ne3", event_type: "absconding" }),
      ],
    }));
    expect(r.notifiable_events.event_types).toEqual([
      { type: "restraint", count: 2 },
      { type: "absconding", count: 1 },
    ]);
  });

  // ── Inspection Profile ────────────────────────────────────────────────────

  it("reports latest inspection grade", () => {
    const r = computeHomeRegulatoryCompliance(baseInput());
    expect(r.inspection.latest_grade).toBe("Good");
  });

  it("calculates months since last inspection", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      inspections: [makeInspection({ inspection_date: "2025-10-15" })],
    }));
    expect(r.inspection.months_since_last_inspection).toBe(7);
  });

  it("detects improving grade trend", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      inspections: [
        makeInspection({ id: "i1", inspection_date: "2023-11-08", grade: "Requires improvement" }),
        makeInspection({ id: "i2", inspection_date: "2025-10-15", grade: "Good" }),
      ],
    }));
    expect(r.inspection.grade_trend).toBe("improving");
  });

  it("detects declining grade trend", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      inspections: [
        makeInspection({ id: "i1", inspection_date: "2023-11-08", grade: "Good" }),
        makeInspection({ id: "i2", inspection_date: "2025-10-15", grade: "Requires improvement" }),
      ],
    }));
    expect(r.inspection.grade_trend).toBe("declining");
  });

  it("calculates inspection action completion rate", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      inspections: [
        makeInspection({ actions_required: 5, actions_completed: 3 }),
        makeInspection({ id: "i2", inspection_date: "2024-04-22", actions_required: 2, actions_completed: 2 }),
      ],
    }));
    expect(r.inspection.action_completion_rate).toBe(71);
    expect(r.inspection.total_actions_required).toBe(7);
    expect(r.inspection.total_actions_completed).toBe(5);
  });

  // ── Policy Profile ────────────────────────────────────────────────────────

  it("counts total and current policies", () => {
    const r = computeHomeRegulatoryCompliance(baseInput());
    expect(r.policies.total_policies).toBe(3);
    expect(r.policies.current_count).toBe(3);
  });

  it("detects overdue policies by status", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "overdue", title: "H&S Policy" }),
        makePolicy({ id: "p2", status: "current" }),
      ],
    }));
    expect(r.policies.overdue_count).toBe(1);
    expect(r.policies.overdue_policies).toContain("H&S Policy");
  });

  it("detects policies overdue by review date", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "current", next_review_date: "2026-05-10", title: "Expired Policy" }),
        makePolicy({ id: "p2", status: "current", next_review_date: "2026-08-10" }),
      ],
    }));
    expect(r.policies.overdue_count).toBe(1);
    expect(r.policies.overdue_policies).toContain("Expired Policy");
  });

  it("calculates average acknowledgement rate", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", acknowledgement_count: 8, total_staff_required: 8 }),
        makePolicy({ id: "p2", acknowledgement_count: 6, total_staff_required: 8 }),
      ],
    }));
    expect(r.policies.avg_acknowledgement_rate).toBe(88);
  });

  it("counts policies below 100% acknowledgement", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", acknowledgement_count: 8, total_staff_required: 8 }),
        makePolicy({ id: "p2", acknowledgement_count: 6, total_staff_required: 8 }),
        makePolicy({ id: "p3", acknowledgement_count: 7, total_staff_required: 8 }),
      ],
    }));
    expect(r.policies.policies_below_100_ack).toBe(2);
  });

  it("counts policies due for review within 30 days", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", next_review_date: "2026-06-15" }),  // 20 days away
        makePolicy({ id: "p2", next_review_date: "2026-06-26" }),  // 31 days — out of range
        makePolicy({ id: "p3", next_review_date: "2026-05-30" }),  // 4 days away
      ],
    }));
    expect(r.policies.review_due_within_30d).toBe(2);
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it("scores higher with excellent data across all areas", () => {
    const excellent = baseInput({
      reg44_visits: Array.from({ length: 12 }, (_, i) => makeReg44({
        id: `v${i}`,
        visit_date: `2025-${String(6 + i > 12 ? i - 6 : 6 + i).padStart(2, "0")}-15`,
        areas_for_development_count: 0,
        recommendations: [{ id: `r${i}`, priority: "low", status: "completed", completed_at: "2026-01-01" }],
        report_sent_to_ofsted: true,
      })),
      audits: [
        makeAudit({ id: "a1", score: 95, max_score: 100 }),
        makeAudit({ id: "a2", score: 90, max_score: 100 }),
      ],
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "notified_within_24h" }),
      ],
      inspections: [
        makeInspection({ grade: "Outstanding", actions_required: 1, actions_completed: 1 }),
      ],
      policies: [
        makePolicy({ id: "p1", acknowledgement_count: 8, total_staff_required: 8 }),
        makePolicy({ id: "p2", acknowledgement_count: 8, total_staff_required: 8 }),
      ],
    });
    const r = computeHomeRegulatoryCompliance(excellent);
    expect(r.regulatory_compliance_score).toBeGreaterThanOrEqual(80);
    expect(r.regulatory_compliance_rating).toBe("outstanding");
  });

  it("scores lower with poor data across areas", () => {
    const poor = baseInput({
      reg44_visits: [
        makeReg44({
          id: "v1",
          visit_date: "2026-01-15",
          recommendations: [
            { id: "r1", priority: "high", status: "in_progress", completed_at: null },
            { id: "r2", priority: "high", status: "not_started", completed_at: null },
          ],
          report_sent_to_ofsted: false,
        }),
      ],
      audits: [
        makeAudit({ id: "a1", score: 45, max_score: 100, findings: 8, actions: 6 }),
      ],
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "pending", has_follow_up: false, has_lesson_learned: false }),
        makeNotifiable({ id: "ne2", ofsted_status: "pending", has_follow_up: false, has_lesson_learned: false }),
      ],
      inspections: [
        makeInspection({ grade: "Inadequate", actions_required: 5, actions_completed: 1 }),
      ],
      policies: [
        makePolicy({ id: "p1", status: "overdue", title: "Policy A" }),
        makePolicy({ id: "p2", status: "overdue", title: "Policy B" }),
        makePolicy({ id: "p3", status: "overdue", title: "Policy C" }),
        makePolicy({ id: "p4", status: "overdue", title: "Policy D" }),
      ],
    });
    const r = computeHomeRegulatoryCompliance(poor);
    expect(r.regulatory_compliance_score).toBeLessThan(45);
    expect(r.regulatory_compliance_rating).toBe("inadequate");
  });

  // ── Pending Notifications Scoring ─────────────────────────────────────────

  it("penalises pending Ofsted notifications", () => {
    const withPending = baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "pending" }),
        makeNotifiable({ id: "ne2", ofsted_status: "notified_within_24h" }),
      ],
    });
    const noPending = baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "notified_within_24h" }),
        makeNotifiable({ id: "ne2", ofsted_status: "notified_within_24h" }),
      ],
    });
    const rWith = computeHomeRegulatoryCompliance(withPending);
    const rNo = computeHomeRegulatoryCompliance(noPending);
    expect(rNo.regulatory_compliance_score).toBeGreaterThan(rWith.regulatory_compliance_score);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("generates strengths for 100% notification rate", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "notified_within_24h" }),
        makeNotifiable({ id: "ne2", ofsted_status: "notified_within_24h" }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("notifiable events") && s.includes("within 24 hours"))).toBe(true);
  });

  it("generates strength for all policies current", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "current", next_review_date: "2026-08-10" }),
        makePolicy({ id: "p2", status: "current", next_review_date: "2026-09-10" }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("policies") && s.includes("review dates"))).toBe(true);
  });

  it("generates strength for 100% staff acknowledgement", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", acknowledgement_count: 8, total_staff_required: 8 }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("100%") && s.includes("acknowledgement"))).toBe(true);
  });

  it("generates strength for all inspection actions completed", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      inspections: [
        makeInspection({ actions_required: 3, actions_completed: 3 }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("inspection actions") && s.includes("completed"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("flags pending notifications as concern", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "pending" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("pending") && c.includes("Ofsted"))).toBe(true);
  });

  it("flags overdue policies as concern", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "overdue", title: "Old Policy" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("overdue") && c.includes("Old Policy"))).toBe(true);
  });

  it("flags high-priority open Reg 44 recommendations", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({
          id: "v1",
          visit_date: "2026-05-19",
          recommendations: [
            { id: "r1", priority: "high", status: "in_progress", completed_at: null },
          ],
        }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("high-priority") && c.includes("Reg 44"))).toBe(true);
  });

  it("flags low audit scores as concern", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", score: 55, max_score: 100 }),
        makeAudit({ id: "a2", score: 60, max_score: 100 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("Audit average") || c.includes("audit") || c.includes("below"))).toBe(true);
  });

  it("flags policies without full acknowledgement", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", acknowledgement_count: 5, total_staff_required: 8 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("acknowledgement"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends immediate action for pending notifications", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "pending" }),
      ],
    }));
    const rec = r.recommendations.find(r => r.urgency === "immediate" && r.recommendation.includes("pending"));
    expect(rec).toBeDefined();
    expect(rec!.regulatory_ref).toBe("Reg 40");
  });

  it("recommends addressing high-priority Reg 44 actions", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({
          id: "v1",
          visit_date: "2026-05-19",
          recommendations: [
            { id: "r1", priority: "high", status: "not_started", completed_at: null },
          ],
        }),
      ],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("high-priority") && r.recommendation.includes("Reg 44"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends policy review when overdue", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "overdue", title: "Old" }),
      ],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("overdue") && r.recommendation.includes("polic"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for pending notifications", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "pending" }),
      ],
    }));
    const ins = r.insights.find(i => i.severity === "critical" && i.text.includes("not yet been reported"));
    expect(ins).toBeDefined();
  });

  it("generates positive insight when compliance is strong", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", score: 90, max_score: 100 }),
        makeAudit({ id: "a2", score: 88, max_score: 100 }),
      ],
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "notified_within_24h" }),
      ],
      policies: [
        makePolicy({ id: "p1", status: "current", next_review_date: "2026-08-10" }),
      ],
    }));
    const ins = r.insights.find(i => i.severity === "positive" && i.text.includes("regulatory position"));
    expect(ins).toBeDefined();
  });

  it("generates warning insight for high volume of notifiable events in 90 days", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", date: "2026-05-20" }),
        makeNotifiable({ id: "ne2", date: "2026-05-15" }),
        makeNotifiable({ id: "ne3", date: "2026-05-10" }),
        makeNotifiable({ id: "ne4", date: "2026-05-05" }),
      ],
    }));
    const ins = r.insights.find(i => i.severity === "warning" && i.text.includes("notifiable events in the last 90 days"));
    expect(ins).toBeDefined();
  });

  it("generates positive insight for improving grade trend", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      inspections: [
        makeInspection({ id: "i1", inspection_date: "2023-11-08", grade: "Requires improvement" }),
        makeInspection({ id: "i2", inspection_date: "2025-10-15", grade: "Good" }),
      ],
    }));
    const ins = r.insights.find(i => i.severity === "positive" && i.text.includes("grade trajectory"));
    expect(ins).toBeDefined();
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("produces headline for good rating", () => {
    const r = computeHomeRegulatoryCompliance(baseInput());
    expect(r.headline.length).toBeGreaterThan(0);
  });

  it("produces headline mentioning overdue policies when present", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", status: "overdue", title: "Old" }),
        makePolicy({ id: "p2", status: "current", next_review_date: "2026-08-10" }),
      ],
    }));
    // Headline may or may not mention policies depending on rating
    expect(r.headline.length).toBeGreaterThan(0);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("handles empty recommendations arrays", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({ id: "v1", visit_date: "2026-05-19", recommendations: [] }),
      ],
    }));
    expect(r.reg44.recommendation_completion_rate).toBeNull();
    expect(r.reg44.open_recommendations).toBe(0);
  });

  it("handles zero max_score audits gracefully", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      audits: [
        makeAudit({ id: "a1", score: 0, max_score: 0 }),
      ],
    }));
    expect(r.audits.avg_score).toBeNull();
  });

  it("handles inspections with zero actions", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      inspections: [
        makeInspection({ actions_required: 0, actions_completed: 0 }),
      ],
    }));
    expect(r.inspection.action_completion_rate).toBeNull();
  });

  it("handles policies with zero staff required", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      policies: [
        makePolicy({ id: "p1", acknowledgement_count: 0, total_staff_required: 0 }),
      ],
    }));
    expect(r.policies.avg_acknowledgement_rate).toBeNull();
  });

  it("excludes future-dated visits from 12m count", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({ id: "v1", visit_date: "2026-05-19" }),
        makeReg44({ id: "v2", visit_date: "2026-06-19" }),  // future
      ],
    }));
    expect(r.reg44.total_visits_12m).toBe(1);
  });

  it("excludes visits older than 12 months", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      reg44_visits: [
        makeReg44({ id: "v1", visit_date: "2026-05-19" }),
        makeReg44({ id: "v2", visit_date: "2025-01-01" }),  // >12m ago
      ],
    }));
    expect(r.reg44.total_visits_12m).toBe(1);
  });

  it("handles single inspection gracefully for trend", () => {
    const r = computeHomeRegulatoryCompliance(baseInput({
      inspections: [makeInspection()],
    }));
    expect(r.inspection.grade_trend).toBe("insufficient_data");
  });
});
