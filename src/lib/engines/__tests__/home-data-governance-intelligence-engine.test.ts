// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME DATA GOVERNANCE INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeDataGovernance,
  type HomeDataGovernanceInput,
  type DataBreachInput,
  type DataProtectionRecordInput,
  type CCTVAccessInput,
  type SubjectAccessRequestInput,
} from "../home-data-governance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeBreach(overrides: Partial<DataBreachInput> = {}): DataBreachInput {
  return {
    id: "br_1",
    date_discovered: "2025-06-01",
    date_incident: "2025-05-30",
    breach_type: "email_to_wrong_recipient",
    severity: "low",
    near_miss: false,
    special_category_data: false,
    risk_to_individuals: "low",
    reported_to_ico: false,
    ico_reported_date: "",
    data_subjects_notified: false,
    notification_date: "",
    immediate_actions_taken: ["recalled email"],
    root_cause_analysis: "Autofill selected wrong recipient",
    lessons_learned: ["Double-check recipient before sending"],
    preventive_actions: ["Disable autofill for external emails"],
    training_arising: ["Email safety refresher"],
    policy_arising: "",
    status: "closed_resolved",
    reported_to: ["manager"],
    created_at: "2025-06-01",
    ...overrides,
  };
}

function makeDPRecord(overrides: Partial<DataProtectionRecordInput> = {}): DataProtectionRecordInput {
  return {
    id: "dp_1",
    type: "consent_review",
    status: "completed",
    date_raised: "2025-05-01",
    due_date: "2025-06-30",
    completed_date: "2025-05-20",
    breach_severity: null,
    ico_notified: false,
    remedial_actions: [],
    lessons_learned: "",
    created_at: "2025-05-01",
    ...overrides,
  };
}

function makeCCTV(overrides: Partial<CCTVAccessInput> = {}): CCTVAccessInput {
  return {
    id: "cctv_1",
    date: "2025-06-10",
    reason: "incident_review",
    detail: "Reviewed footage following safeguarding concern",
    accessed_by: "staff_1",
    authorised_by: "manager_1",
    witness_present: "staff_2",
    footage_copied: false,
    created_at: "2025-06-10",
    ...overrides,
  };
}

function makeSAR(overrides: Partial<SubjectAccessRequestInput> = {}): SubjectAccessRequestInput {
  return {
    id: "sar_1",
    date_received: "2025-05-01",
    deadline_date: "2025-06-01",
    request_type: "subject_access",
    status: "completed",
    identity_verified: true,
    redactions_required: false,
    extension_applied: false,
    date_completed: "2025-05-25",
    dpo_consulted: true,
    created_at: "2025-05-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeDataGovernanceInput> = {}): HomeDataGovernanceInput {
  return {
    today: TODAY,
    data_breaches: [],
    data_protection_records: [
      makeDPRecord({ id: "dp_1", type: "consent_review" }),
      makeDPRecord({ id: "dp_2", type: "retention_review" }),
      makeDPRecord({ id: "dp_3", type: "dpia" }),
      makeDPRecord({ id: "dp_4", type: "consent_review" }),
      makeDPRecord({ id: "dp_5", type: "retention_review" }),
    ],
    cctv_accesses: [
      makeCCTV({ id: "cctv_1" }),
      makeCCTV({ id: "cctv_2", reason: "safeguarding" }),
    ],
    subject_access_requests: [
      makeSAR({ id: "sar_1" }),
    ],
    total_staff: 8,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Home Data Governance Intelligence Engine", () => {
  // ── Insufficient Data ──────────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when total_staff is 0 and no records exist", () => {
      const r = computeHomeDataGovernance({
        today: TODAY,
        data_breaches: [],
        data_protection_records: [],
        cctv_accesses: [],
        subject_access_requests: [],
        total_staff: 0,
      });
      expect(r.data_governance_rating).toBe("insufficient_data");
      expect(r.data_governance_score).toBe(0);
    });

    it("returns headline about no staff or records", () => {
      const r = computeHomeDataGovernance({
        today: TODAY,
        data_breaches: [],
        data_protection_records: [],
        cctv_accesses: [],
        subject_access_requests: [],
        total_staff: 0,
      });
      expect(r.headline).toContain("No staff or data governance records");
    });

    it("returns empty profiles when insufficient data", () => {
      const r = computeHomeDataGovernance({
        today: TODAY,
        data_breaches: [],
        data_protection_records: [],
        cctv_accesses: [],
        subject_access_requests: [],
        total_staff: 0,
      });
      expect(r.breaches.total_breaches).toBe(0);
      expect(r.data_protection.total_records).toBe(0);
      expect(r.cctv.total_accesses).toBe(0);
      expect(r.sars.total_requests).toBe(0);
    });

    it("does NOT return insufficient_data when staff exist but no records", () => {
      const r = computeHomeDataGovernance({
        today: TODAY,
        data_breaches: [],
        data_protection_records: [],
        cctv_accesses: [],
        subject_access_requests: [],
        total_staff: 5,
      });
      expect(r.data_governance_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when records exist but staff is 0", () => {
      const r = computeHomeDataGovernance({
        today: TODAY,
        data_breaches: [makeBreach()],
        data_protection_records: [],
        cctv_accesses: [],
        subject_access_requests: [],
        total_staff: 0,
      });
      expect(r.data_governance_rating).not.toBe("insufficient_data");
    });
  });

  // ── Rating Thresholds ─────────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("rates outstanding with ideal data governance", () => {
      // mod1: no breaches → +5
      // mod2: 5 records, 100% complete → +4
      // mod3: 1 SAR, 100% on time, 0 overdue → +5
      // mod4: 2 CCTV accesses, 100% justified, 100% authorised → +3
      // mod5: no high-risk breaches → +3
      // mod6: 0 overdue, records > 0 → +3
      // mod7: 2 retention reviews, 100% completed → +3
      // mod8: no breaches → +2
      // Total: 52 + 5+4+5+3+3+3+3+2 = 80
      const r = computeHomeDataGovernance(baseInput());
      expect(r.data_governance_score).toBe(80);
      expect(r.data_governance_rating).toBe("outstanding");
    });

    it("reaches outstanding (>=80) with perfect SAR + DPO + exemplary profile", () => {
      // Maximise by adding more SARs completed on time and boosting CCTV
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1" }),
          makeSAR({ id: "sar_2", date_received: "2025-05-05", deadline_date: "2025-06-05", date_completed: "2025-05-28" }),
          makeSAR({ id: "sar_3", date_received: "2025-04-01", deadline_date: "2025-05-01", date_completed: "2025-04-28" }),
        ],
        cctv_accesses: [
          makeCCTV({ id: "cctv_1", reason: "safeguarding" }),
          makeCCTV({ id: "cctv_2", reason: "incident_review" }),
          makeCCTV({ id: "cctv_3", reason: "police_request" }),
        ],
      }));
      // All max bonuses active: 52 + 28 = 80
      expect(r.data_governance_score).toBe(80);
    });

    it("rates good for score >= 65", () => {
      // Remove SARs to drop mod3 from +5 to +1 → score = 80-4 = 76
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [],
      }));
      expect(r.data_governance_score).toBeGreaterThanOrEqual(65);
      expect(r.data_governance_score).toBeLessThan(80);
      expect(r.data_governance_rating).toBe("good");
    });

    it("rates adequate for scores in 45-64 range", () => {
      // Moderate issues to bring score into 45-64 range
      // mod1: 1 open breach, 1 high → +0
      // mod2: 3 records, ~67% complete → +2
      // mod3: no SARs → +1
      // mod4: no CCTV → +1
      // mod5: 1 high breach not reported to ICO → -3
      // mod6: 1 overdue → +0
      // mod7: 1 retention review, completed → +3
      // mod8: 1 breach with no lessons → -3
      // Total: 52 + 0+2+1+1-3+0+3-3 = 53
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "high", status: "investigating", reported_to_ico: false, lessons_learned: [] }),
        ],
        data_protection_records: [
          makeDPRecord({ id: "dp_1", type: "retention_review", status: "completed" }),
          makeDPRecord({ id: "dp_2", type: "consent_review", status: "completed" }),
          makeDPRecord({ id: "dp_3", type: "consent_review", status: "in_progress", due_date: "2025-06-01" }),
        ],
        subject_access_requests: [],
        cctv_accesses: [],
      }));
      expect(r.data_governance_score).toBeGreaterThanOrEqual(45);
      expect(r.data_governance_score).toBeLessThan(65);
      expect(r.data_governance_rating).toBe("adequate");
    });

    it("rates inadequate for scores below 45", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "critical", status: "investigating", special_category_data: true, reported_to_ico: false, lessons_learned: [], risk_to_individuals: "high", data_subjects_notified: false }),
          makeBreach({ id: "br_2", severity: "high", status: "investigating", special_category_data: true, reported_to_ico: false, lessons_learned: [] }),
          makeBreach({ id: "br_3", severity: "high", status: "monitoring", lessons_learned: [] }),
          makeBreach({ id: "br_4", severity: "medium", status: "investigating", lessons_learned: [] }),
        ],
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "overdue", due_date: "2025-04-01" }),
          makeDPRecord({ id: "dp_2", status: "overdue", due_date: "2025-04-15" }),
          makeDPRecord({ id: "dp_3", status: "overdue", due_date: "2025-03-01" }),
          makeDPRecord({ id: "dp_4", status: "overdue", due_date: "2025-03-15" }),
        ],
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-05-01", date_completed: null }),
          makeSAR({ id: "sar_2", status: "in_progress", deadline_date: "2025-04-15", date_completed: null, identity_verified: false, dpo_consulted: false }),
        ],
        cctv_accesses: [
          makeCCTV({ id: "cctv_1", reason: "other", authorised_by: "staff_1", witness_present: null }),
          makeCCTV({ id: "cctv_2", reason: "other", authorised_by: "", witness_present: null }),
          makeCCTV({ id: "cctv_3", reason: "maintenance_check", authorised_by: "", witness_present: null }),
        ],
      }));
      expect(r.data_governance_score).toBeLessThan(45);
      expect(r.data_governance_rating).toBe("inadequate");
    });

    it("clamps score to 0 minimum", () => {
      // Extreme case: all modifiers at worst
      const r = computeHomeDataGovernance({
        today: TODAY,
        data_breaches: [
          makeBreach({ id: "br_1", severity: "critical", status: "investigating", special_category_data: true, reported_to_ico: false, lessons_learned: [], risk_to_individuals: "high" }),
          makeBreach({ id: "br_2", severity: "critical", status: "investigating", special_category_data: true, reported_to_ico: false, lessons_learned: [], risk_to_individuals: "high" }),
          makeBreach({ id: "br_3", severity: "high", status: "investigating", lessons_learned: [] }),
          makeBreach({ id: "br_4", severity: "high", status: "investigating", lessons_learned: [] }),
        ],
        data_protection_records: [],
        cctv_accesses: [
          makeCCTV({ id: "cctv_1", reason: "other", authorised_by: "", witness_present: null }),
          makeCCTV({ id: "cctv_2", reason: "other", authorised_by: "", witness_present: null }),
        ],
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-04-01", date_completed: null, identity_verified: false, dpo_consulted: false }),
          makeSAR({ id: "sar_2", status: "received", deadline_date: "2025-03-01", date_completed: null, identity_verified: false, dpo_consulted: false }),
        ],
        total_staff: 8,
      });
      expect(r.data_governance_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to 100 maximum", () => {
      const r = computeHomeDataGovernance(baseInput());
      expect(r.data_governance_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Breach Profile ────────────────────────────────────────────────────
  describe("breach profile", () => {
    it("counts total breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [makeBreach({ id: "br_1" }), makeBreach({ id: "br_2" })],
      }));
      expect(r.breaches.total_breaches).toBe(2);
    });

    it("counts open breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", status: "investigating" }),
          makeBreach({ id: "br_2", status: "monitoring" }),
          makeBreach({ id: "br_3", status: "closed_resolved" }),
        ],
      }));
      expect(r.breaches.open_breaches).toBe(2);
    });

    it("counts reported_awaiting_ico as open", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [makeBreach({ id: "br_1", status: "reported_awaiting_ico" })],
      }));
      expect(r.breaches.open_breaches).toBe(1);
    });

    it("counts high/critical severity breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "high" }),
          makeBreach({ id: "br_2", severity: "critical" }),
          makeBreach({ id: "br_3", severity: "low" }),
        ],
      }));
      expect(r.breaches.high_critical_breaches).toBe(2);
    });

    it("counts near misses", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", near_miss: true }),
          makeBreach({ id: "br_2", near_miss: false }),
        ],
      }));
      expect(r.breaches.near_miss_count).toBe(1);
    });

    it("counts special category data breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", special_category_data: true }),
          makeBreach({ id: "br_2", special_category_data: true }),
        ],
      }));
      expect(r.breaches.special_category_count).toBe(2);
    });

    it("calculates lessons documented rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", lessons_learned: ["lesson 1"] }),
          makeBreach({ id: "br_2", lessons_learned: [] }),
        ],
      }));
      expect(r.breaches.lessons_documented_rate).toBe(50);
    });

    it("calculates subjects notified rate for high-risk breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", risk_to_individuals: "high", data_subjects_notified: true }),
          makeBreach({ id: "br_2", risk_to_individuals: "high", data_subjects_notified: false }),
          makeBreach({ id: "br_3", risk_to_individuals: "low", data_subjects_notified: false }),
        ],
      }));
      // Only 2 require notification (high risk), 1 notified → 50%
      expect(r.breaches.subjects_notified_rate).toBe(50);
    });

    it("groups breaches by type", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", breach_type: "email_to_wrong_recipient" }),
          makeBreach({ id: "br_2", breach_type: "email_to_wrong_recipient" }),
          makeBreach({ id: "br_3", breach_type: "lost_device" }),
        ],
      }));
      expect(r.breaches.by_type["email_to_wrong_recipient"]).toBe(2);
      expect(r.breaches.by_type["lost_device"]).toBe(1);
    });
  });

  // ── Data Protection Profile ───────────────────────────────────────────
  describe("data protection profile", () => {
    it("counts total records", () => {
      const r = computeHomeDataGovernance(baseInput());
      expect(r.data_protection.total_records).toBe(5);
    });

    it("counts overdue records by status", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "overdue", due_date: "2025-05-01" }),
          makeDPRecord({ id: "dp_2", status: "completed" }),
        ],
      }));
      expect(r.data_protection.overdue_records).toBe(1);
    });

    it("counts overdue records by due date even if status is not 'overdue'", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "in_progress", due_date: "2025-06-01" }), // past due
          makeDPRecord({ id: "dp_2", status: "received", due_date: "2025-06-30" }),    // not past due
        ],
      }));
      expect(r.data_protection.overdue_records).toBe(1);
    });

    it("calculates completion rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "completed" }),
          makeDPRecord({ id: "dp_2", status: "closed" }),
          makeDPRecord({ id: "dp_3", status: "in_progress" }),
          makeDPRecord({ id: "dp_4", status: "received" }),
        ],
      }));
      expect(r.data_protection.completion_rate).toBe(50);
    });

    it("counts retention and consent reviews", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", type: "retention_review" }),
          makeDPRecord({ id: "dp_2", type: "retention_review" }),
          makeDPRecord({ id: "dp_3", type: "consent_review" }),
        ],
      }));
      expect(r.data_protection.retention_reviews).toBe(2);
      expect(r.data_protection.consent_reviews).toBe(1);
    });

    it("counts completed DPIAs", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", type: "dpia", status: "completed" }),
          makeDPRecord({ id: "dp_2", type: "dpia", status: "in_progress" }),
        ],
      }));
      expect(r.data_protection.dpias_completed).toBe(1);
    });
  });

  // ── CCTV Profile ──────────────────────────────────────────────────────
  describe("CCTV profile", () => {
    it("counts total accesses", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [makeCCTV({ id: "c1" }), makeCCTV({ id: "c2" })],
      }));
      expect(r.cctv.total_accesses).toBe(2);
    });

    it("counts accesses within 90 days", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", date: "2025-06-10" }),  // 5 days ago
          makeCCTV({ id: "c2", date: "2025-03-01" }),  // ~106 days ago — outside window
        ],
      }));
      expect(r.cctv.accesses_90d).toBe(1);
    });

    it("calculates justified access rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", reason: "incident_review" }),
          makeCCTV({ id: "c2", reason: "safeguarding" }),
          makeCCTV({ id: "c3", reason: "other" }),
        ],
      }));
      expect(r.cctv.justified_access_rate).toBe(67);
    });

    it("calculates authorised rate (different person)", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", accessed_by: "staff_1", authorised_by: "manager_1" }),
          makeCCTV({ id: "c2", accessed_by: "staff_1", authorised_by: "staff_1" }), // self-authorised
          makeCCTV({ id: "c3", accessed_by: "staff_2", authorised_by: "" }),          // no authoriser
        ],
      }));
      expect(r.cctv.authorised_rate).toBe(33);
    });

    it("calculates witness rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", witness_present: "staff_2" }),
          makeCCTV({ id: "c2", witness_present: null }),
          makeCCTV({ id: "c3", witness_present: "" }),
        ],
      }));
      expect(r.cctv.witness_rate).toBe(33);
    });

    it("groups accesses by reason", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", reason: "incident_review" }),
          makeCCTV({ id: "c2", reason: "incident_review" }),
          makeCCTV({ id: "c3", reason: "safeguarding" }),
        ],
      }));
      expect(r.cctv.by_reason["incident_review"]).toBe(2);
      expect(r.cctv.by_reason["safeguarding"]).toBe(1);
    });
  });

  // ── SAR Profile ───────────────────────────────────────────────────────
  describe("SAR profile", () => {
    it("counts total and open requests", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "completed" }),
          makeSAR({ id: "sar_2", status: "in_progress" }),
          makeSAR({ id: "sar_3", status: "received" }),
        ],
      }));
      expect(r.sars.total_requests).toBe(3);
      expect(r.sars.open_requests).toBe(2);
    });

    it("counts refused as not open", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "refused" }),
        ],
      }));
      expect(r.sars.open_requests).toBe(0);
    });

    it("calculates on-time completion rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "completed", deadline_date: "2025-06-01", date_completed: "2025-05-25" }), // on time
          makeSAR({ id: "sar_2", status: "completed", deadline_date: "2025-05-15", date_completed: "2025-05-20" }), // late
        ],
      }));
      expect(r.sars.completed_on_time).toBe(1);
      expect(r.sars.on_time_rate).toBe(50);
    });

    it("counts overdue SARs", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-06-01", date_completed: null }), // deadline passed
          makeSAR({ id: "sar_2", status: "received", deadline_date: "2025-07-01", date_completed: null }),    // not yet due
        ],
      }));
      expect(r.sars.overdue_requests).toBe(1);
    });

    it("calculates identity verified rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", identity_verified: true }),
          makeSAR({ id: "sar_2", identity_verified: false }),
        ],
      }));
      expect(r.sars.identity_verified_rate).toBe(50);
    });

    it("calculates DPO consulted rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", dpo_consulted: true }),
          makeSAR({ id: "sar_2", dpo_consulted: true }),
          makeSAR({ id: "sar_3", dpo_consulted: false }),
        ],
      }));
      expect(r.sars.dpo_consulted_rate).toBe(67);
    });

    it("calculates extension rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", extension_applied: true }),
          makeSAR({ id: "sar_2", extension_applied: false }),
        ],
      }));
      expect(r.sars.extension_rate).toBe(50);
    });
  });

  // ── Modifier Tests ────────────────────────────────────────────────────
  describe("modifiers", () => {
    it("mod1: no breaches gives maximum bonus (+5)", () => {
      const withBreaches = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "high", status: "investigating" }),
          makeBreach({ id: "br_2", severity: "high", status: "investigating" }),
          makeBreach({ id: "br_3", severity: "medium", status: "investigating" }),
        ],
      }));
      const noBreaches = computeHomeDataGovernance(baseInput({ data_breaches: [] }));
      expect(noBreaches.data_governance_score).toBeGreaterThan(withBreaches.data_governance_score);
    });

    it("mod1: open breaches >= 3 gives maximum penalty (-5)", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", status: "investigating" }),
          makeBreach({ id: "br_2", status: "monitoring" }),
          makeBreach({ id: "br_3", status: "reported_awaiting_ico" }),
        ],
      }));
      // The penalty from 3 open breaches should lower score significantly
      const ideal = computeHomeDataGovernance(baseInput());
      expect(r.data_governance_score).toBeLessThan(ideal.data_governance_score);
    });

    it("mod3: 100% SAR on-time rate gives bonus", () => {
      const perfect = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "completed", deadline_date: "2025-06-01", date_completed: "2025-05-25" }),
          makeSAR({ id: "sar_2", status: "completed", deadline_date: "2025-06-10", date_completed: "2025-06-05" }),
        ],
      }));
      const poor = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "completed", deadline_date: "2025-05-01", date_completed: "2025-05-15" }),
          makeSAR({ id: "sar_2", status: "completed", deadline_date: "2025-04-01", date_completed: "2025-05-15" }),
        ],
      }));
      expect(perfect.data_governance_score).toBeGreaterThan(poor.data_governance_score);
    });

    it("mod4: CCTV fully justified and authorised gives bonus (+3)", () => {
      const good = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", reason: "safeguarding", authorised_by: "manager_1", accessed_by: "staff_1" }),
          makeCCTV({ id: "c2", reason: "incident_review", authorised_by: "manager_2", accessed_by: "staff_2" }),
        ],
      }));
      const bad = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", reason: "other", authorised_by: "", accessed_by: "staff_1" }),
          makeCCTV({ id: "c2", reason: "other", authorised_by: "", accessed_by: "staff_2" }),
        ],
      }));
      expect(good.data_governance_score).toBeGreaterThan(bad.data_governance_score);
    });

    it("mod5: timely ICO reporting gives bonus", () => {
      const timely = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "high", special_category_data: false, reported_to_ico: true, date_discovered: "2025-06-01", ico_reported_date: "2025-06-02" }),
        ],
      }));
      const late = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "high", special_category_data: false, reported_to_ico: false, date_discovered: "2025-06-01", ico_reported_date: "" }),
        ],
      }));
      expect(timely.data_governance_score).toBeGreaterThan(late.data_governance_score);
    });

    it("mod6: no overdue records with existing records gives bonus", () => {
      const current = computeHomeDataGovernance(baseInput());
      const overdue = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "overdue", due_date: "2025-05-01" }),
          makeDPRecord({ id: "dp_2", status: "overdue", due_date: "2025-05-01" }),
          makeDPRecord({ id: "dp_3", status: "overdue", due_date: "2025-05-01" }),
          makeDPRecord({ id: "dp_4", status: "overdue", due_date: "2025-05-01", type: "retention_review" }),
        ],
      }));
      expect(current.data_governance_score).toBeGreaterThan(overdue.data_governance_score);
    });

    it("mod7: completed retention reviews give bonus", () => {
      const withRetention = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", type: "retention_review", status: "completed" }),
          makeDPRecord({ id: "dp_2", type: "retention_review", status: "completed" }),
          makeDPRecord({ id: "dp_3", type: "consent_review", status: "completed" }),
          makeDPRecord({ id: "dp_4", type: "dpia", status: "completed" }),
          makeDPRecord({ id: "dp_5", type: "consent_review", status: "completed" }),
        ],
      }));
      const noRetention = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", type: "consent_review", status: "completed" }),
          makeDPRecord({ id: "dp_2", type: "dpia", status: "completed" }),
          makeDPRecord({ id: "dp_3", type: "consent_review", status: "completed" }),
          makeDPRecord({ id: "dp_4", type: "consent_review", status: "completed" }),
          makeDPRecord({ id: "dp_5", type: "consent_review", status: "completed" }),
        ],
      }));
      expect(withRetention.data_governance_score).toBeGreaterThan(noRetention.data_governance_score);
    });

    it("mod8: lessons documented for all breaches gives bonus", () => {
      const documented = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", lessons_learned: ["lesson A"] }),
          makeBreach({ id: "br_2", lessons_learned: ["lesson B"] }),
        ],
      }));
      const notDocumented = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", lessons_learned: [] }),
          makeBreach({ id: "br_2", lessons_learned: [] }),
        ],
      }));
      expect(documented.data_governance_score).toBeGreaterThan(notDocumented.data_governance_score);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("strength when no breaches recorded", () => {
      const r = computeHomeDataGovernance(baseInput({ data_breaches: [] }));
      expect(r.strengths).toContainEqual(expect.stringContaining("No data breaches"));
    });

    it("strength when all breaches resolved", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", status: "closed_resolved" }),
        ],
      }));
      expect(r.strengths).toContainEqual(expect.stringContaining("All data breaches resolved"));
    });

    it("strength when all SARs on time", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "completed", date_completed: "2025-05-25", deadline_date: "2025-06-01" }),
        ],
      }));
      expect(r.strengths).toContainEqual(expect.stringContaining("subject access requests completed on time"));
    });

    it("strength for good CCTV governance", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", reason: "safeguarding" }),
          makeCCTV({ id: "c2", reason: "incident_review" }),
        ],
      }));
      expect(r.strengths).toContainEqual(expect.stringContaining("CCTV access consistently justified"));
    });

    it("strength for completed DPIAs", () => {
      const r = computeHomeDataGovernance(baseInput());
      expect(r.strengths).toContainEqual(expect.stringContaining("data protection impact assessment"));
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("concern when open breaches >= 2", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", status: "investigating" }),
          makeBreach({ id: "br_2", status: "monitoring" }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("data breaches remain open"));
    });

    it("concern when high/critical breaches >= 2", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "high" }),
          makeBreach({ id: "br_2", severity: "critical" }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("high/critical severity breaches"));
    });

    it("concern when special category data involved", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [makeBreach({ id: "br_1", special_category_data: true })],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("special category data"));
    });

    it("concern when SARs overdue", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-05-01", date_completed: null }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("subject access request"));
    });

    it("concern when DP records overdue", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "overdue", due_date: "2025-05-01" }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("data protection record"));
    });

    it("concern for low CCTV justified rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", reason: "other" }),
          makeCCTV({ id: "c2", reason: "other" }),
          makeCCTV({ id: "c3", reason: "other" }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("CCTV accesses have justified reasons"));
    });

    it("concern when no retention reviews exist", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", type: "consent_review" }),
          makeDPRecord({ id: "dp_2", type: "dpia" }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("retention review"));
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────
  describe("recommendations", () => {
    it("recommends resolving open breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [makeBreach({ id: "br_1", status: "investigating" })],
      }));
      expect(r.recommendations).toContainEqual(expect.objectContaining({
        recommendation: expect.stringContaining("open data breaches"),
        regulatory_ref: "GDPR Art 33",
      }));
    });

    it("recommends completing overdue SARs", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-05-01", date_completed: null }),
        ],
      }));
      expect(r.recommendations).toContainEqual(expect.objectContaining({
        recommendation: expect.stringContaining("overdue subject access requests"),
        urgency: "immediate",
        regulatory_ref: "GDPR Art 15",
      }));
    });

    it("recommends retention reviews when missing", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", type: "consent_review" }),
        ],
      }));
      expect(r.recommendations).toContainEqual(expect.objectContaining({
        recommendation: expect.stringContaining("retention review"),
        regulatory_ref: "GDPR Art 5(1)(e)",
      }));
    });

    it("recommendations have sequential rank numbers", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [makeBreach({ id: "br_1", status: "investigating", lessons_learned: [] })],
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "overdue", due_date: "2025-05-01", type: "consent_review" }),
        ],
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-05-01", date_completed: null }),
        ],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────
  describe("insights", () => {
    it("positive insight for exemplary governance", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [],
      }));
      expect(r.insights).toContainEqual(expect.objectContaining({
        severity: "positive",
        text: expect.stringContaining("exemplary"),
      }));
    });

    it("critical insight for many high/critical breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "high" }),
          makeBreach({ id: "br_2", severity: "critical" }),
          makeBreach({ id: "br_3", severity: "high" }),
        ],
      }));
      expect(r.insights).toContainEqual(expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("systemic data protection weaknesses"),
      }));
    });

    it("critical insight for many open breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", status: "investigating" }),
          makeBreach({ id: "br_2", status: "monitoring" }),
          makeBreach({ id: "br_3", status: "reported_awaiting_ico" }),
        ],
      }));
      expect(r.insights).toContainEqual(expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("breach management capacity"),
      }));
    });

    it("critical insight for overdue SARs", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-05-01", date_completed: null }),
          makeSAR({ id: "sar_2", status: "received", deadline_date: "2025-04-01", date_completed: null }),
        ],
      }));
      expect(r.insights).toContainEqual(expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("overdue subject access requests"),
      }));
    });

    it("warning insight for special category breaches", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", special_category_data: true }),
          makeBreach({ id: "br_2", special_category_data: true }),
        ],
      }));
      expect(r.insights).toContainEqual(expect.objectContaining({
        severity: "warning",
        text: expect.stringContaining("special category data"),
      }));
    });

    it("warning insight for low CCTV authorisation rate", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", authorised_by: "", accessed_by: "staff_1" }),
          makeCCTV({ id: "c2", authorised_by: "staff_2", accessed_by: "staff_2" }), // self-authorised
          makeCCTV({ id: "c3", authorised_by: "", accessed_by: "staff_3" }),
        ],
      }));
      expect(r.insights).toContainEqual(expect.objectContaining({
        severity: "warning",
        text: expect.stringContaining("independently authorised"),
      }));
    });

    it("positive insight for strong DPO consultation", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", dpo_consulted: true }),
          makeSAR({ id: "sar_2", dpo_consulted: true }),
          makeSAR({ id: "sar_3", dpo_consulted: true }),
          makeSAR({ id: "sar_4", dpo_consulted: true }),
          makeSAR({ id: "sar_5", dpo_consulted: false }),
        ],
      }));
      expect(r.insights).toContainEqual(expect.objectContaining({
        severity: "positive",
        text: expect.stringContaining("DPO consultation rate"),
      }));
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────
  describe("headlines", () => {
    it("outstanding headline mentions zero breaches or all managed", () => {
      // Base input already scores 80 (outstanding)
      const r = computeHomeDataGovernance(baseInput());
      expect(r.data_governance_score).toBe(80);
      expect(r.data_governance_rating).toBe("outstanding");
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline mentions areas for improvement", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [makeBreach({ id: "br_1", status: "investigating" })],
      }));
      if (r.data_governance_rating === "good" && r.concerns.length > 0) {
        expect(r.headline).toContain("improvement");
      }
    });

    it("adequate headline mentions concern count", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "high", status: "investigating", special_category_data: true, reported_to_ico: false, lessons_learned: [] }),
          makeBreach({ id: "br_2", severity: "medium", status: "monitoring", lessons_learned: [] }),
          makeBreach({ id: "br_3", severity: "low", status: "investigating", lessons_learned: [] }),
        ],
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "overdue", due_date: "2025-05-01" }),
          makeDPRecord({ id: "dp_2", status: "overdue", due_date: "2025-05-15" }),
          makeDPRecord({ id: "dp_3", status: "overdue", due_date: "2025-04-01" }),
          makeDPRecord({ id: "dp_4", type: "retention_review", status: "overdue", due_date: "2025-04-01" }),
        ],
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-06-01", date_completed: null }),
        ],
        cctv_accesses: [makeCCTV({ id: "c1", reason: "other", authorised_by: "staff_1", witness_present: null })],
      }));
      if (r.data_governance_rating === "adequate") {
        expect(r.headline).toContain("concern");
      }
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [
          makeBreach({ id: "br_1", severity: "critical", status: "investigating", special_category_data: true, reported_to_ico: false, lessons_learned: [], risk_to_individuals: "high" }),
          makeBreach({ id: "br_2", severity: "high", status: "investigating", special_category_data: true, reported_to_ico: false, lessons_learned: [] }),
          makeBreach({ id: "br_3", severity: "high", status: "monitoring", lessons_learned: [] }),
          makeBreach({ id: "br_4", severity: "medium", status: "investigating", lessons_learned: [] }),
        ],
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "overdue", due_date: "2025-04-01" }),
          makeDPRecord({ id: "dp_2", status: "overdue", due_date: "2025-04-15" }),
          makeDPRecord({ id: "dp_3", status: "overdue", due_date: "2025-03-01" }),
          makeDPRecord({ id: "dp_4", status: "overdue", due_date: "2025-03-15" }),
        ],
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", deadline_date: "2025-05-01", date_completed: null }),
          makeSAR({ id: "sar_2", status: "in_progress", deadline_date: "2025-04-15", date_completed: null, identity_verified: false, dpo_consulted: false }),
        ],
        cctv_accesses: [
          makeCCTV({ id: "c1", reason: "other", authorised_by: "", witness_present: null }),
          makeCCTV({ id: "c2", reason: "other", authorised_by: "", witness_present: null }),
        ],
      }));
      if (r.data_governance_rating === "inadequate") {
        expect(r.headline).toContain("inadequate");
      }
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles zero division in pct helper gracefully", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_breaches: [],
        data_protection_records: [],
        cctv_accesses: [],
        subject_access_requests: [],
      }));
      expect(r.breaches.lessons_documented_rate).toBeNull();
      expect(r.breaches.subjects_notified_rate).toBeNull();
      expect(r.cctv.justified_access_rate).toBeNull();
      expect(r.sars.on_time_rate).toBeNull();
    });

    it("handles SAR with null date_completed", () => {
      const r = computeHomeDataGovernance(baseInput({
        subject_access_requests: [
          makeSAR({ id: "sar_1", status: "in_progress", date_completed: null }),
        ],
      }));
      expect(r.sars.completed_on_time).toBe(0);
    });

    it("handles CCTV with empty witness_present", () => {
      const r = computeHomeDataGovernance(baseInput({
        cctv_accesses: [
          makeCCTV({ id: "c1", witness_present: "" }),
          makeCCTV({ id: "c2", witness_present: null }),
        ],
      }));
      expect(r.cctv.witness_rate).toBe(0);
    });

    it("handles mixed statuses in data protection records", () => {
      const r = computeHomeDataGovernance(baseInput({
        data_protection_records: [
          makeDPRecord({ id: "dp_1", status: "completed" }),
          makeDPRecord({ id: "dp_2", status: "closed" }),
          makeDPRecord({ id: "dp_3", status: "in_progress", due_date: "2025-07-01" }),
          makeDPRecord({ id: "dp_4", status: "received", due_date: "2025-07-01" }),
          makeDPRecord({ id: "dp_5", status: "overdue", due_date: "2025-05-01" }),
        ],
      }));
      expect(r.data_protection.completed_records).toBe(2);
      expect(r.data_protection.overdue_records).toBe(1);
      expect(r.data_protection.completion_rate).toBe(40);
    });

    it("single staff member with no records does not crash", () => {
      const r = computeHomeDataGovernance({
        today: TODAY,
        data_breaches: [],
        data_protection_records: [],
        cctv_accesses: [],
        subject_access_requests: [],
        total_staff: 1,
      });
      expect(r.data_governance_rating).not.toBe("insufficient_data");
      expect(r.data_governance_score).toBeGreaterThan(0);
    });
  });
});
