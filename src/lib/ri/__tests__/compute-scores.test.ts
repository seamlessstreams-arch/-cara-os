// ══════════════════════════════════════════════════════════════════════════════
// CARA — RI Governance Scoring Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeRiScores } from "@/lib/ri/compute-scores";
import type { RiScoreInputs } from "@/lib/ri/compute-scores";
import type { TrainingNeed, RiAlert, Audit, RiReg45Evidence, RiChallengeLog } from "@/types/extended";
import type { TrainingRecord, DailyLogEntry, CareForm, Incident } from "@/types/index";

// ── Fixture Helpers ─────────────────────────────────────────────────────────

function makeTrainingNeed(overrides: Partial<TrainingNeed> = {}): TrainingNeed {
  return {
    id: "tn-1",
    home_id: "home-1",
    identified_by: "manual",
    need_type: "mandatory",
    title: "Safeguarding Refresher",
    description: "Needs safeguarding refresher training",
    priority: "medium",
    status: "identified",
    created_by: "sys",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeTrainingRecord(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    id: "tr-1",
    staff_id: "staff-1",
    course_name: "Safeguarding L2",
    category: "safeguarding",
    provider: "External",
    completed_date: "2026-01-01",
    expiry_date: "2027-01-01",
    certificate_url: null,
    status: "compliant",
    is_mandatory: true,
    notes: null,
    home_id: "home-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: "sys",
    updated_by: "sys",
    ...overrides,
  };
}

function makeAlert(overrides: Partial<RiAlert> = {}): RiAlert {
  return {
    id: "alert-1",
    home_id: "home-1",
    alert_type: "safeguarding_risk",
    severity: "medium",
    title: "Alert",
    description: "Test alert",
    is_resolved: false,
    auto_generated: true,
    created_by: "sys",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: "inc-1",
    reference: "INC-001",
    type: "behaviour_incident",
    severity: "medium",
    child_id: "child-1",
    date: "2026-05-01",
    time: "14:00",
    location: "Living room",
    description: "Test incident",
    immediate_action: "Verbal de-escalation",
    reported_by: "staff-1",
    witnesses: [],
    body_map_required: false,
    body_map_completed: false,
    body_map_url: null,
    notifications: [],
    requires_oversight: false,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "closed",
    outcome: null,
    lessons_learned: null,
    linked_task_ids: [],
    linked_document_ids: [],
    home_id: "home-1",
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    created_by: "sys",
    updated_by: "sys",
    ...overrides,
  };
}

function makeAudit(overrides: Partial<Audit> = {}): Audit {
  return {
    id: "aud-1",
    title: "Medication Audit",
    category: "medication",
    date: "2026-05-01",
    completed_by: "staff-1",
    score: 85,
    max_score: 100,
    status: "completed",
    findings: 2,
    actions: 1,
    home_id: "home-1",
    created_at: "2026-05-01T00:00:00Z",
    created_by: "sys",
    updated_at: "2026-05-01T00:00:00Z",
    updated_by: "sys",
    ...overrides,
  };
}

function makeReg45(overrides: Partial<RiReg45Evidence> = {}): RiReg45Evidence {
  return {
    id: "reg45-1",
    home_id: "home-1",
    report_period: "Q1 2026",
    period_start: "2026-01-01",
    period_end: "2026-03-31",
    evidence_items: [],
    status: "draft",
    submitted_to_ofsted: false,
    created_by: "sys",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeChallenge(overrides: Partial<RiChallengeLog> = {}): RiChallengeLog {
  return {
    id: "chal-1",
    home_id: "home-1",
    title: "Challenge",
    challenge_area: "oversight",
    evidence_summary: "Evidence",
    challenge_text: "Challenge text",
    escalation_level: "standard",
    status: "resolved",
    cara_generated: false,
    created_by: "sys",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeCareForm(overrides: Partial<CareForm> = {}): CareForm {
  return {
    id: "cf-1",
    title: "Health Record",
    form_type: "health_record",
    status: "approved",
    linked_child_id: "child-1",
    linked_staff_id: null,
    linked_incident_id: null,
    linked_shift_id: null,
    linked_task_id: null,
    description: null,
    body: {},
    submitted_at: null,
    submitted_by: null,
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    approved_at: "2026-05-01T00:00:00Z",
    approved_by: "staff-1",
    due_date: null,
    priority: "medium",
    tags: [],
    home_id: "home-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: "sys",
    updated_by: "sys",
    ...overrides,
  };
}

function makeDailyLog(overrides: Partial<DailyLogEntry> = {}): DailyLogEntry {
  return {
    id: "dl-1",
    child_id: "child-1",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    entry_type: "general",
    content: "Routine log entry",
    mood_score: 7,
    staff_id: "staff-1",
    linked_incident_id: null,
    is_significant: false,
    home_id: "home-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: "sys",
    updated_by: "sys",
    ...overrides,
  };
}

function emptyInputs(): RiScoreInputs {
  return {
    trainingNeeds: [],
    trainingRecords: [],
    alerts: [],
    incidents: [],
    audits: [],
    medicationAudits: [],
    reg45Items: [],
    challenges: [],
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("computeRiScores", () => {
  // ── Empty / minimal inputs ──────────────────────────────────────────────

  describe("empty/minimal inputs", () => {
    it("returns all default scores when inputs are empty", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores).toBeDefined();
      expect(typeof scores.overall_governance_score).toBe("number");
      expect(scores.overall_governance_score).toBeGreaterThanOrEqual(0);
      expect(scores.overall_governance_score).toBeLessThanOrEqual(100);
    });

    it("returns an object with all 16 score fields", () => {
      const scores = computeRiScores(emptyInputs());
      const keys: (keyof typeof scores)[] = [
        "overall_governance_score",
        "safeguarding_oversight_score",
        "incident_management_score",
        "missing_episodes_score",
        "reg45_compliance_score",
        "staff_supervision_score",
        "training_compliance_score",
        "medication_governance_score",
        "care_planning_score",
        "child_voice_score",
        "complaint_management_score",
        "building_safety_score",
        "recruitment_compliance_score",
        "oversight_quality_score",
        "outcome_evidence_score",
        "challenge_log_score",
      ];
      for (const key of keys) {
        expect(scores).toHaveProperty(key);
        const v = scores[key];
        expect(v === null || typeof v === "number").toBe(true);
      }
    });

    it("leaves medication governance unmeasured with no audits", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.medication_governance_score).toBeNull();
    });

    it("leaves building safety unmeasured with no safety audits", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.building_safety_score).toBeNull();
    });

    it("leaves care planning unmeasured with no forms", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.care_planning_score).toBeNull();
    });

    it("leaves child voice unmeasured with no logs", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.child_voice_score).toBeNull();
    });

    it("leaves recruitment compliance unmeasured with no candidates", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.recruitment_compliance_score).toBeNull();
    });

    it("leaves outcome evidence unmeasured with no logs and no ypCount", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.outcome_evidence_score).toBeNull();
    });

    it("leaves reg45 unmeasured with no reg45 items", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.reg45_compliance_score).toBeNull();
    });

    it("produces challenge log score of 40 minimum when there are no challenges", () => {
      // With 0 challenges, score = clamp(90 - 0*12, 40, 92) = 90
      const scores = computeRiScores(emptyInputs());
      expect(scores.challenge_log_score).toBe(90);
    });
  });

  // ── Training compliance ──────────────────────────────────────────────────

  describe("training compliance", () => {
    it("scores high when all mandatory training is compliant and no urgent needs", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ id: "tr-1", is_mandatory: true, status: "compliant" }),
        makeTrainingRecord({ id: "tr-2", is_mandatory: true, status: "compliant" }),
        makeTrainingRecord({ id: "tr-3", is_mandatory: true, status: "compliant" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.training_compliance_score).toBe(95);
    });

    it("drops score when urgent training needs are unaddressed", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ is_mandatory: true, status: "compliant" }),
      ];
      inputs.trainingNeeds = [
        makeTrainingNeed({ id: "tn-1", priority: "urgent", status: "identified" }),
        makeTrainingNeed({ id: "tn-2", priority: "urgent", status: "assigned" }),
      ];
      const scores = computeRiScores(inputs);
      // 95 - 2*8 = 79
      expect(scores.training_compliance_score).toBe(79);
    });

    it("drops score less for high-priority needs than urgent", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ is_mandatory: true, status: "compliant" }),
      ];
      inputs.trainingNeeds = [
        makeTrainingNeed({ id: "tn-1", priority: "high", status: "identified" }),
        makeTrainingNeed({ id: "tn-2", priority: "high", status: "in_progress" }),
      ];
      const scores = computeRiScores(inputs);
      // 95 - 2*3 = 89
      expect(scores.training_compliance_score).toBe(89);
    });

    it("does not penalize completed or no_action training needs", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ is_mandatory: true, status: "compliant" }),
      ];
      inputs.trainingNeeds = [
        makeTrainingNeed({ id: "tn-1", priority: "urgent", status: "completed" }),
        makeTrainingNeed({ id: "tn-2", priority: "urgent", status: "no_action" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.training_compliance_score).toBe(95);
    });

    it("accounts for expiring_soon records at 60% weight", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ id: "tr-1", is_mandatory: true, status: "compliant" }),
        makeTrainingRecord({ id: "tr-2", is_mandatory: true, status: "expiring_soon" }),
      ];
      const scores = computeRiScores(inputs);
      // (1 + 1*0.6) / 2 * 95 = 0.8 * 95 = 76
      expect(scores.training_compliance_score).toBe(76);
    });

    it("clamps training score to minimum 30", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ is_mandatory: true, status: "expired" }),
      ];
      inputs.trainingNeeds = [
        makeTrainingNeed({ id: "tn-1", priority: "urgent", status: "identified" }),
        makeTrainingNeed({ id: "tn-2", priority: "urgent", status: "identified" }),
        makeTrainingNeed({ id: "tn-3", priority: "urgent", status: "identified" }),
        makeTrainingNeed({ id: "tn-4", priority: "urgent", status: "identified" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.training_compliance_score).toBe(30);
    });

    it("clamps training score to maximum 95", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ is_mandatory: true, status: "compliant" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.training_compliance_score).toBeLessThanOrEqual(95);
    });

    it("ignores non-mandatory records in compliance calculation", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ id: "tr-1", is_mandatory: true, status: "compliant" }),
        makeTrainingRecord({ id: "tr-2", is_mandatory: false, status: "expired" }),
        makeTrainingRecord({ id: "tr-3", is_mandatory: false, status: "not_started" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.training_compliance_score).toBe(95);
    });
  });

  // ── Safeguarding oversight ────────────────────────────────────────────────

  describe("safeguarding oversight", () => {
    it("scores 95 with no alerts", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.safeguarding_oversight_score).toBe(95);
    });

    it("drops 15 per unresolved critical alert", () => {
      const inputs = emptyInputs();
      inputs.alerts = [
        makeAlert({ id: "a-1", severity: "critical", is_resolved: false }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.safeguarding_oversight_score).toBe(80);
    });

    it("drops 8 per unresolved high alert", () => {
      const inputs = emptyInputs();
      inputs.alerts = [
        makeAlert({ id: "a-1", severity: "high", is_resolved: false }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.safeguarding_oversight_score).toBe(87);
    });

    it("does not penalize resolved alerts", () => {
      const inputs = emptyInputs();
      inputs.alerts = [
        makeAlert({ id: "a-1", severity: "critical", is_resolved: true }),
        makeAlert({ id: "a-2", severity: "high", is_resolved: true }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.safeguarding_oversight_score).toBe(95);
    });

    it("combines critical and high penalties", () => {
      const inputs = emptyInputs();
      inputs.alerts = [
        makeAlert({ id: "a-1", severity: "critical", is_resolved: false }),
        makeAlert({ id: "a-2", severity: "high", is_resolved: false }),
      ];
      const scores = computeRiScores(inputs);
      // 95 - 15 - 8 = 72
      expect(scores.safeguarding_oversight_score).toBe(72);
    });

    it("clamps to minimum 45", () => {
      const inputs = emptyInputs();
      inputs.alerts = [
        makeAlert({ id: "a-1", severity: "critical", is_resolved: false }),
        makeAlert({ id: "a-2", severity: "critical", is_resolved: false }),
        makeAlert({ id: "a-3", severity: "critical", is_resolved: false }),
        makeAlert({ id: "a-4", severity: "critical", is_resolved: false }),
      ];
      const scores = computeRiScores(inputs);
      // 95 - 60 = 35 → clamped to 45
      expect(scores.safeguarding_oversight_score).toBe(45);
    });
  });

  // ── Incident management ───────────────────────────────────────────────────

  describe("incident management", () => {
    it("scores 90 with no incidents", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.incident_management_score).toBe(90);
    });

    it("drops 10 per unactioned incident (requires_oversight but no note)", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", requires_oversight: true, oversight_note: null }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.incident_management_score).toBe(80);
    });

    it("drops 5 per open high/critical incident", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", status: "open", severity: "high" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.incident_management_score).toBe(85);
    });

    it("combines unactioned and open high/critical penalties", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", status: "open", severity: "critical", requires_oversight: true, oversight_note: null }),
      ];
      const scores = computeRiScores(inputs);
      // 90 - 10 - 5 = 75
      expect(scores.incident_management_score).toBe(75);
    });

    it("does not penalize actioned incidents", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", requires_oversight: true, oversight_note: "Reviewed" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.incident_management_score).toBe(90);
    });

    it("does not penalize closed incidents even if high severity", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", status: "closed", severity: "high" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.incident_management_score).toBe(90);
    });

    it("clamps to minimum 40", () => {
      const inputs = emptyInputs();
      inputs.incidents = Array.from({ length: 6 }, (_, i) =>
        makeIncident({ id: `i-${i}`, requires_oversight: true, oversight_note: null, status: "open", severity: "critical" }),
      );
      const scores = computeRiScores(inputs);
      expect(scores.incident_management_score).toBe(40);
    });
  });

  // ── Supervision ───────────────────────────────────────────────────────────

  describe("staff supervision", () => {
    it("scores 85 with no overdue supervisions", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.staff_supervision_score).toBe(85);
    });

    it("drops 10 per overdue supervision", () => {
      const inputs = emptyInputs();
      inputs.supervisionsMeta = { overdue: 2 };
      const scores = computeRiScores(inputs);
      // 85 - 20 = 65
      expect(scores.staff_supervision_score).toBe(65);
    });

    it("clamps to minimum 40", () => {
      const inputs = emptyInputs();
      inputs.supervisionsMeta = { overdue: 10 };
      const scores = computeRiScores(inputs);
      expect(scores.staff_supervision_score).toBe(40);
    });

    it("clamps to maximum 90", () => {
      const inputs = emptyInputs();
      inputs.supervisionsMeta = { overdue: 0 };
      const scores = computeRiScores(inputs);
      expect(scores.staff_supervision_score).toBeLessThanOrEqual(90);
    });

    it("defaults overdue to 0 when supervisionsMeta is undefined", () => {
      const inputs = emptyInputs();
      // supervisionsMeta is undefined by default
      const scores = computeRiScores(inputs);
      expect(scores.staff_supervision_score).toBe(85);
    });
  });

  // ── Challenge log ─────────────────────────────────────────────────────────

  describe("challenge log", () => {
    it("scores 90 with no challenges", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.challenge_log_score).toBe(90);
    });

    it("drops 12 per open challenge", () => {
      const inputs = emptyInputs();
      inputs.challenges = [
        makeChallenge({ id: "c-1", status: "open" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.challenge_log_score).toBe(78);
    });

    it("drops 12 per action_pending challenge", () => {
      const inputs = emptyInputs();
      inputs.challenges = [
        makeChallenge({ id: "c-1", status: "action_pending" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.challenge_log_score).toBe(78);
    });

    it("does not penalize resolved challenges", () => {
      const inputs = emptyInputs();
      inputs.challenges = [
        makeChallenge({ id: "c-1", status: "resolved" }),
        makeChallenge({ id: "c-2", status: "responded" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.challenge_log_score).toBe(90);
    });

    it("clamps to minimum 40", () => {
      const inputs = emptyInputs();
      inputs.challenges = Array.from({ length: 5 }, (_, i) =>
        makeChallenge({ id: `c-${i}`, status: "open" }),
      );
      const scores = computeRiScores(inputs);
      // 90 - 60 = 30 → clamped to 40
      expect(scores.challenge_log_score).toBe(40);
    });

    it("clamps to maximum 92", () => {
      const inputs = emptyInputs();
      // No challenges → 90, which is within max 92
      const scores = computeRiScores(inputs);
      expect(scores.challenge_log_score).toBeLessThanOrEqual(92);
    });
  });

  // ── Reg 45 compliance ─────────────────────────────────────────────────────

  describe("reg 45 compliance", () => {
    it("scores 100 for submitted status", () => {
      const inputs = emptyInputs();
      inputs.reg45Items = [makeReg45({ status: "submitted" })];
      const scores = computeRiScores(inputs);
      expect(scores.reg45_compliance_score).toBe(100);
    });

    it("scores 88 for approved status", () => {
      const inputs = emptyInputs();
      inputs.reg45Items = [makeReg45({ status: "approved" })];
      const scores = computeRiScores(inputs);
      expect(scores.reg45_compliance_score).toBe(88);
    });

    it("scores 72 for reviewed status", () => {
      const inputs = emptyInputs();
      inputs.reg45Items = [makeReg45({ status: "reviewed" })];
      const scores = computeRiScores(inputs);
      expect(scores.reg45_compliance_score).toBe(72);
    });

    it("scores 58 for in_progress status", () => {
      const inputs = emptyInputs();
      inputs.reg45Items = [makeReg45({ status: "in_progress" })];
      const scores = computeRiScores(inputs);
      expect(scores.reg45_compliance_score).toBe(58);
    });

    it("scores 45 for draft status", () => {
      const inputs = emptyInputs();
      inputs.reg45Items = [makeReg45({ status: "draft" })];
      const scores = computeRiScores(inputs);
      expect(scores.reg45_compliance_score).toBe(45);
    });

    it("is unmeasured for no reg45 items", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.reg45_compliance_score).toBeNull();
    });

    it("uses only the first reg45 item", () => {
      const inputs = emptyInputs();
      inputs.reg45Items = [
        makeReg45({ id: "r45-1", status: "submitted" }),
        makeReg45({ id: "r45-2", status: "draft" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.reg45_compliance_score).toBe(100);
    });
  });

  // ── Oversight quality ─────────────────────────────────────────────────────

  describe("oversight quality", () => {
    it("scores 88 with no overdue audits and no unresolved alerts", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.oversight_quality_score).toBe(88);
    });

    it("drops 8 per overdue audit", () => {
      const inputs = emptyInputs();
      inputs.auditsMeta = { overdue: 2 };
      const scores = computeRiScores(inputs);
      // 88 - 16 = 72
      expect(scores.oversight_quality_score).toBe(72);
    });

    it("drops 4 per unresolved alert (any severity)", () => {
      const inputs = emptyInputs();
      inputs.alerts = [
        makeAlert({ id: "a-1", severity: "medium", is_resolved: false }),
        makeAlert({ id: "a-2", severity: "low", is_resolved: false }),
      ];
      const scores = computeRiScores(inputs);
      // 88 - 8 = 80
      expect(scores.oversight_quality_score).toBe(80);
    });

    it("combines audit and alert penalties", () => {
      const inputs = emptyInputs();
      inputs.auditsMeta = { overdue: 1 };
      inputs.alerts = [
        makeAlert({ id: "a-1", severity: "critical", is_resolved: false }),
      ];
      const scores = computeRiScores(inputs);
      // 88 - 8 - 4 = 76
      expect(scores.oversight_quality_score).toBe(76);
    });

    it("clamps to minimum 45", () => {
      const inputs = emptyInputs();
      inputs.auditsMeta = { overdue: 5 };
      inputs.alerts = Array.from({ length: 5 }, (_, i) =>
        makeAlert({ id: `a-${i}`, is_resolved: false }),
      );
      const scores = computeRiScores(inputs);
      // 88 - 40 - 20 = 28 → clamped to 45
      expect(scores.oversight_quality_score).toBe(45);
    });
  });

  // ── Medication governance ─────────────────────────────────────────────────

  describe("medication governance", () => {
    it("is unmeasured with no medication audits", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.medication_governance_score).toBeNull();
    });

    it("computes from medication audit scores", () => {
      const inputs = emptyInputs();
      inputs.medicationAudits = [
        makeAudit({ id: "ma-1", score: 90, max_score: 100 }),
        makeAudit({ id: "ma-2", score: 80, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      // avg = (90 + 80) / 2 = 85
      expect(scores.medication_governance_score).toBe(85);
    });

    it("handles perfect medication audit scores", () => {
      const inputs = emptyInputs();
      inputs.medicationAudits = [
        makeAudit({ id: "ma-1", score: 100, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      // Clamped to max 98
      expect(scores.medication_governance_score).toBe(98);
    });

    it("clamps to minimum 40", () => {
      const inputs = emptyInputs();
      inputs.medicationAudits = [
        makeAudit({ id: "ma-1", score: 10, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.medication_governance_score).toBe(40);
    });

    it("handles max_score of 0 gracefully", () => {
      const inputs = emptyInputs();
      inputs.medicationAudits = [
        makeAudit({ id: "ma-1", score: 0, max_score: 0 }),
      ];
      const scores = computeRiScores(inputs);
      // score / max(0, 1) = 0, so result is 0 → clamped to 40
      expect(scores.medication_governance_score).toBe(40);
    });
  });

  // ── Building safety ───────────────────────────────────────────────────────

  describe("building safety", () => {
    it("is unmeasured with no safety audits", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.building_safety_score).toBeNull();
    });

    it("computes from building_safety category audits", () => {
      const inputs = emptyInputs();
      inputs.audits = [
        makeAudit({ id: "bs-1", category: "building_safety", score: 90, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.building_safety_score).toBe(90);
    });

    it("computes from fire_safety category audits", () => {
      const inputs = emptyInputs();
      inputs.audits = [
        makeAudit({ id: "bs-1", category: "fire_safety", score: 88, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.building_safety_score).toBe(88);
    });

    it("computes from health_and_safety category audits", () => {
      const inputs = emptyInputs();
      inputs.audits = [
        makeAudit({ id: "bs-1", category: "health_and_safety", score: 82, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.building_safety_score).toBe(82);
    });

    it("computes from health_safety category audits", () => {
      const inputs = emptyInputs();
      inputs.audits = [
        makeAudit({ id: "bs-1", category: "health_safety", score: 75, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.building_safety_score).toBe(75);
    });

    it("averages multiple safety audits", () => {
      const inputs = emptyInputs();
      inputs.audits = [
        makeAudit({ id: "bs-1", category: "building_safety", score: 90, max_score: 100 }),
        makeAudit({ id: "bs-2", category: "fire_safety", score: 80, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.building_safety_score).toBe(85);
    });

    it("ignores non-safety category audits", () => {
      const inputs = emptyInputs();
      inputs.audits = [
        makeAudit({ id: "bs-1", category: "medication", score: 40, max_score: 100 }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.building_safety_score).toBeNull(); // nothing safety-related audited
    });
  });

  // ── Missing episodes ──────────────────────────────────────────────────────

  describe("missing episodes", () => {
    it("scores 75 with no open high/critical incidents", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.missing_episodes_score).toBe(75);
    });

    it("drops 3 per open high/critical incident", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", status: "open", severity: "high" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.missing_episodes_score).toBe(72);
    });

    it("clamps to minimum 40", () => {
      const inputs = emptyInputs();
      inputs.incidents = Array.from({ length: 15 }, (_, i) =>
        makeIncident({ id: `i-${i}`, status: "open", severity: "critical" }),
      );
      const scores = computeRiScores(inputs);
      expect(scores.missing_episodes_score).toBe(40);
    });
  });

  // ── Care planning ─────────────────────────────────────────────────────────

  describe("care planning", () => {
    it("is unmeasured with no care forms", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.care_planning_score).toBeNull();
    });

    it("scores high when all forms are approved", () => {
      const inputs = emptyInputs();
      inputs.careForms = [
        makeCareForm({ id: "cf-1", status: "approved" }),
        makeCareForm({ id: "cf-2", status: "approved" }),
      ];
      const scores = computeRiScores(inputs);
      // (2 + 0*0.7) / 2 * 95 = 95
      expect(scores.care_planning_score).toBe(95);
    });

    it("counts submitted forms at 70% weight", () => {
      const inputs = emptyInputs();
      inputs.careForms = [
        makeCareForm({ id: "cf-1", status: "approved" }),
        makeCareForm({ id: "cf-2", status: "submitted" }),
      ];
      const scores = computeRiScores(inputs);
      // (1 + 1*0.7) / 2 * 95 = 0.85 * 95 = 80.75 → 81
      expect(scores.care_planning_score).toBe(81);
    });

    it("penalizes overdue draft forms by 5 each", () => {
      const inputs = emptyInputs();
      const pastDate = "2025-01-01";
      inputs.careForms = [
        makeCareForm({ id: "cf-1", status: "approved" }),
        makeCareForm({ id: "cf-2", status: "draft", due_date: pastDate }),
      ];
      const scores = computeRiScores(inputs);
      // (1 + 0) / 2 * 95 - 5 = 47.5 - 5 = 42.5 → 43
      expect(scores.care_planning_score).toBe(43);
    });

    it("penalizes overdue pending_review forms by 5 each", () => {
      const inputs = emptyInputs();
      const pastDate = "2025-01-01";
      inputs.careForms = [
        makeCareForm({ id: "cf-1", status: "approved" }),
        makeCareForm({ id: "cf-2", status: "pending_review", due_date: pastDate }),
      ];
      const scores = computeRiScores(inputs);
      // (1 + 0) / 2 * 95 - 5 = 42.5 → 43
      expect(scores.care_planning_score).toBe(43);
    });

    it("does not penalize draft forms without due_date", () => {
      const inputs = emptyInputs();
      inputs.careForms = [
        makeCareForm({ id: "cf-1", status: "approved" }),
        makeCareForm({ id: "cf-2", status: "draft", due_date: null }),
      ];
      const scores = computeRiScores(inputs);
      // (1 + 0) / 2 * 95 = 47.5 → 48
      expect(scores.care_planning_score).toBe(48);
    });

    it("does not penalize draft forms with future due_date", () => {
      const inputs = emptyInputs();
      const futureDate = "2099-12-31";
      inputs.careForms = [
        makeCareForm({ id: "cf-1", status: "approved" }),
        makeCareForm({ id: "cf-2", status: "draft", due_date: futureDate }),
      ];
      const scores = computeRiScores(inputs);
      // (1 + 0) / 2 * 95 = 47.5 → 48
      expect(scores.care_planning_score).toBe(48);
    });

    it("clamps to minimum 35", () => {
      const inputs = emptyInputs();
      const pastDate = "2025-01-01";
      inputs.careForms = Array.from({ length: 10 }, (_, i) =>
        makeCareForm({ id: `cf-${i}`, status: "draft", due_date: pastDate }),
      );
      const scores = computeRiScores(inputs);
      expect(scores.care_planning_score).toBe(35);
    });
  });

  // ── Child voice ───────────────────────────────────────────────────────────

  describe("child voice", () => {
    it("is unmeasured with no daily logs", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.child_voice_score).toBeNull();
    });

    it("is unmeasured with empty daily logs array", () => {
      const inputs = emptyInputs();
      inputs.dailyLogs = [];
      const scores = computeRiScores(inputs);
      expect(scores.child_voice_score).toBeNull();
    });

    it("is unmeasured when there is no resident count to measure coverage against", () => {
      const inputs = emptyInputs();
      inputs.dailyLogs = [makeDailyLog()];
      const scores = computeRiScores(inputs);
      expect(scores.child_voice_score).toBeNull();
    });

    it("computes from recent logs, coverage, and mood scores", () => {
      const inputs = emptyInputs();
      const now = new Date();
      inputs.ypCount = 2;
      inputs.dailyLogs = [
        makeDailyLog({ id: "dl-1", child_id: "child-1", mood_score: 8, created_at: now.toISOString() }),
        makeDailyLog({ id: "dl-2", child_id: "child-2", mood_score: 7, created_at: now.toISOString() }),
      ];
      const scores = computeRiScores(inputs);
      // coverage = 2/2 = 1
      // avgMood = (8+7)/2 = 7.5
      // score = 1 * 60 + 7.5 * 4 = 60 + 30 = 90
      expect(scores.child_voice_score).toBe(90);
    });

    it("reduces score for partial YP coverage", () => {
      const inputs = emptyInputs();
      const now = new Date();
      inputs.ypCount = 4;
      inputs.dailyLogs = [
        makeDailyLog({ id: "dl-1", child_id: "child-1", mood_score: 7, created_at: now.toISOString() }),
      ];
      const scores = computeRiScores(inputs);
      // coverage = 1/4 = 0.25
      // avgMood = 7
      // score = 0.25 * 60 + 7 * 4 = 15 + 28 = 43
      expect(scores.child_voice_score).toBe(43);
    });

    it("excludes logs older than 7 days", () => {
      const inputs = emptyInputs();
      const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      inputs.ypCount = 1;
      inputs.dailyLogs = [
        makeDailyLog({ id: "dl-1", child_id: "child-1", mood_score: 8, created_at: old }),
      ];
      const scores = computeRiScores(inputs);
      // No recent logs → coverage = 0/1 = 0, no mood entries → avgMood = 5
      // score = 0 * 60 + 5 * 4 = 20 → clamped to 30
      expect(scores.child_voice_score).toBe(30);
    });

    it("uses default mood of 5 when no mood scores present", () => {
      const inputs = emptyInputs();
      const now = new Date();
      inputs.ypCount = 1;
      inputs.dailyLogs = [
        makeDailyLog({ id: "dl-1", child_id: "child-1", mood_score: null, created_at: now.toISOString() }),
      ];
      const scores = computeRiScores(inputs);
      // coverage = 1/1 = 1, avgMood = 5
      // score = 60 + 20 = 80
      expect(scores.child_voice_score).toBe(80);
    });
  });

  // ── Complaint management ──────────────────────────────────────────────────

  describe("complaint management", () => {
    it("scores 92 with no incidents", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.complaint_management_score).toBe(92);
    });

    it("does not penalize non-complaint incidents", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", type: "behaviour_incident", status: "open" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.complaint_management_score).toBe(92);
    });

    it("drops 8 per open complaint", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", type: "complaint", status: "open" }),
      ];
      const scores = computeRiScores(inputs);
      // 92 - 8 = 84
      expect(scores.complaint_management_score).toBe(84);
    });

    it("drops 8 per under_review complaint", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", type: "complaint", status: "under_review" }),
      ];
      const scores = computeRiScores(inputs);
      expect(scores.complaint_management_score).toBe(84);
    });

    it("drops 12 per unactioned complaint (requires_oversight, no note)", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", type: "complaint", requires_oversight: true, oversight_note: null, status: "closed" }),
      ];
      const scores = computeRiScores(inputs);
      // 92 - 12 = 80
      expect(scores.complaint_management_score).toBe(80);
    });

    it("combines open and unactioned penalties", () => {
      const inputs = emptyInputs();
      inputs.incidents = [
        makeIncident({ id: "i-1", type: "complaint", status: "open", requires_oversight: true, oversight_note: null }),
      ];
      const scores = computeRiScores(inputs);
      // 92 - 8 - 12 = 72
      expect(scores.complaint_management_score).toBe(72);
    });

    it("clamps to minimum 40", () => {
      const inputs = emptyInputs();
      inputs.incidents = Array.from({ length: 8 }, (_, i) =>
        makeIncident({ id: `i-${i}`, type: "complaint", status: "open", requires_oversight: true, oversight_note: null }),
      );
      const scores = computeRiScores(inputs);
      expect(scores.complaint_management_score).toBe(40);
    });
  });

  // ── Recruitment compliance ────────────────────────────────────────────────

  describe("recruitment compliance", () => {
    it("is unmeasured with no active candidates", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.recruitment_compliance_score).toBeNull();
    });

    it("computes average compliance score from candidates", () => {
      const inputs = emptyInputs();
      inputs.activeCandidates = [
        { compliance_score: 90 },
        { compliance_score: 80 },
      ];
      const scores = computeRiScores(inputs);
      expect(scores.recruitment_compliance_score).toBe(85);
    });

    it("clamps to minimum 30", () => {
      const inputs = emptyInputs();
      inputs.activeCandidates = [
        { compliance_score: 10 },
      ];
      const scores = computeRiScores(inputs);
      expect(scores.recruitment_compliance_score).toBe(30);
    });

    it("clamps to maximum 100", () => {
      const inputs = emptyInputs();
      inputs.activeCandidates = [
        { compliance_score: 100 },
      ];
      const scores = computeRiScores(inputs);
      expect(scores.recruitment_compliance_score).toBe(100);
    });
  });

  // ── Outcome evidence ──────────────────────────────────────────────────────

  describe("outcome evidence", () => {
    it("is unmeasured with no logs", () => {
      const scores = computeRiScores(emptyInputs());
      expect(scores.outcome_evidence_score).toBeNull();
    });

    it("is unmeasured when ypCount is 0", () => {
      const inputs = emptyInputs();
      inputs.dailyLogs = [makeDailyLog()];
      inputs.ypCount = 0;
      const scores = computeRiScores(inputs);
      expect(scores.outcome_evidence_score).toBeNull();
    });

    it("computes from log volume and significant entries", () => {
      const inputs = emptyInputs();
      const now = new Date().toISOString().slice(0, 10);
      inputs.ypCount = 2;
      inputs.dailyLogs = Array.from({ length: 8 }, (_, i) =>
        makeDailyLog({
          id: `dl-${i}`,
          created_at: now,
          is_significant: i < 3,
        }),
      );
      const scores = computeRiScores(inputs);
      // avgPerYP = 8/2 = 4
      // Math.min(4/2, 1) = 1
      // significantEntries = 3
      // score = 1 * 60 + 3 * 2 = 66
      expect(scores.outcome_evidence_score).toBe(66);
    });

    it("excludes logs older than 30 days", () => {
      const inputs = emptyInputs();
      const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      inputs.ypCount = 1;
      inputs.dailyLogs = [
        makeDailyLog({ id: "dl-1", created_at: old }),
      ];
      const scores = computeRiScores(inputs);
      // No recent logs → avgPerYP = 0, significantEntries = 0
      // score = 0 + 0 = 0 → clamped to 30
      expect(scores.outcome_evidence_score).toBe(30);
    });

    it("clamps to maximum 92", () => {
      const inputs = emptyInputs();
      const now = new Date().toISOString().slice(0, 10);
      inputs.ypCount = 1;
      inputs.dailyLogs = Array.from({ length: 30 }, (_, i) =>
        makeDailyLog({ id: `dl-${i}`, created_at: now, is_significant: true }),
      );
      const scores = computeRiScores(inputs);
      expect(scores.outcome_evidence_score).toBeLessThanOrEqual(92);
    });
  });

  // ── Overall governance score ──────────────────────────────────────────────

  describe("overall governance score", () => {
    it("is a weighted composite of all 15 sub-scores", () => {
      const scores = computeRiScores(emptyInputs());
      // Verify it's a reasonable number
      expect(scores.overall_governance_score).toBeGreaterThanOrEqual(0);
      expect(scores.overall_governance_score).toBeLessThanOrEqual(100);
    });

    it("is between 0 and 100", () => {
      const inputs = emptyInputs();
      // All penalties maxed out
      inputs.alerts = Array.from({ length: 5 }, (_, i) =>
        makeAlert({ id: `a-${i}`, severity: "critical", is_resolved: false }),
      );
      inputs.incidents = Array.from({ length: 10 }, (_, i) =>
        makeIncident({ id: `i-${i}`, status: "open", severity: "critical", requires_oversight: true, oversight_note: null, type: "complaint" }),
      );
      inputs.challenges = Array.from({ length: 5 }, (_, i) =>
        makeChallenge({ id: `c-${i}`, status: "open" }),
      );
      inputs.supervisionsMeta = { overdue: 10 };
      inputs.auditsMeta = { overdue: 10 };
      const scores = computeRiScores(inputs);
      expect(scores.overall_governance_score).toBeGreaterThanOrEqual(0);
      expect(scores.overall_governance_score).toBeLessThanOrEqual(100);
    });

    it("is higher when all scores are strong", () => {
      const goodInputs = emptyInputs();
      goodInputs.trainingRecords = Array.from({ length: 5 }, (_, i) =>
        makeTrainingRecord({ id: `tr-${i}`, is_mandatory: true, status: "compliant" }),
      );
      goodInputs.reg45Items = [makeReg45({ status: "submitted" })];
      goodInputs.medicationAudits = [makeAudit({ score: 95, max_score: 100 })];
      goodInputs.audits = [makeAudit({ category: "building_safety", score: 95, max_score: 100 })];
      goodInputs.activeCandidates = [{ compliance_score: 95 }];

      const badInputs = emptyInputs();
      badInputs.alerts = Array.from({ length: 3 }, (_, i) =>
        makeAlert({ id: `a-${i}`, severity: "critical", is_resolved: false }),
      );
      badInputs.incidents = Array.from({ length: 3 }, (_, i) =>
        makeIncident({ id: `i-${i}`, status: "open", severity: "critical", requires_oversight: true, oversight_note: null }),
      );
      badInputs.supervisionsMeta = { overdue: 5 };
      badInputs.challenges = Array.from({ length: 3 }, (_, i) =>
        makeChallenge({ id: `c-${i}`, status: "open" }),
      );

      const goodScores = computeRiScores(goodInputs);
      const badScores = computeRiScores(badInputs);

      expect(goodScores.overall_governance_score ?? 0).toBeGreaterThan(badScores.overall_governance_score ?? 0);
    });

    it("gives safeguarding the highest weight (2.0)", () => {
      // When safeguarding drops by 15 (one critical), overall should drop more
      // than when a weight-1.0 score drops by 15
      const baseline = computeRiScores(emptyInputs());

      const safeguardingHit = emptyInputs();
      safeguardingHit.alerts = [makeAlert({ severity: "critical", is_resolved: false })];
      const safeguardingScores = computeRiScores(safeguardingHit);

      // Safeguarding has weight 2.0, total weights = 18.5
      // Drop in safeguarding = 15, contribution to overall = 15 * 2.0 / 18.5 ≈ 1.62
      const overallDrop = (baseline.overall_governance_score ?? 0) - (safeguardingScores.overall_governance_score ?? 0);
      expect(overallDrop).toBeGreaterThan(1);
    });
  });

  // ── Score clamping ────────────────────────────────────────────────────────

  describe("score clamping", () => {
    it("all scores are integers (rounded)", () => {
      const inputs = emptyInputs();
      inputs.trainingRecords = [
        makeTrainingRecord({ is_mandatory: true, status: "compliant" }),
        makeTrainingRecord({ id: "tr-2", is_mandatory: true, status: "expiring_soon" }),
        makeTrainingRecord({ id: "tr-3", is_mandatory: true, status: "expiring_soon" }),
      ];
      const scores = computeRiScores(inputs);
      for (const [, value] of Object.entries(scores)) {
        expect(value === null || Number.isInteger(value)).toBe(true);
      }
    });

    it("no score exceeds 100", () => {
      const inputs = emptyInputs();
      inputs.reg45Items = [makeReg45({ status: "submitted" })]; // 100
      inputs.activeCandidates = [{ compliance_score: 100 }]; // 100
      const scores = computeRiScores(inputs);
      for (const [, value] of Object.entries(scores)) {
        if (value === null) continue;
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    it("no score goes below its documented minimum", () => {
      const inputs = emptyInputs();
      inputs.alerts = Array.from({ length: 10 }, (_, i) =>
        makeAlert({ id: `a-${i}`, severity: "critical", is_resolved: false }),
      );
      inputs.incidents = Array.from({ length: 10 }, (_, i) =>
        makeIncident({ id: `i-${i}`, status: "open", severity: "critical", requires_oversight: true, oversight_note: null, type: "complaint" }),
      );
      inputs.trainingNeeds = Array.from({ length: 10 }, (_, i) =>
        makeTrainingNeed({ id: `tn-${i}`, priority: "urgent", status: "identified" }),
      );
      inputs.supervisionsMeta = { overdue: 10 };
      inputs.auditsMeta = { overdue: 10 };
      inputs.challenges = Array.from({ length: 10 }, (_, i) =>
        makeChallenge({ id: `c-${i}`, status: "open" }),
      );
      const scores = computeRiScores(inputs);

      expect(scores.safeguarding_oversight_score).toBeGreaterThanOrEqual(45);
      expect(scores.incident_management_score).toBeGreaterThanOrEqual(40);
      expect(scores.staff_supervision_score).toBeGreaterThanOrEqual(40);
      expect(scores.training_compliance_score).toBeNull(); // no mandatory records to measure
      expect(scores.challenge_log_score).toBeGreaterThanOrEqual(40);
      expect(scores.oversight_quality_score).toBeGreaterThanOrEqual(45);
      expect(scores.missing_episodes_score).toBeGreaterThanOrEqual(40);
      expect(scores.complaint_management_score).toBeGreaterThanOrEqual(40);
      expect(scores.overall_governance_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Rich input scenario ───────────────────────────────────────────────────

  describe("rich input with all data provided", () => {
    it("computes all scores from comprehensive data", () => {
      const now = new Date();
      const inputs: RiScoreInputs = {
        trainingNeeds: [
          makeTrainingNeed({ id: "tn-1", priority: "urgent", status: "identified" }),
          makeTrainingNeed({ id: "tn-2", priority: "high", status: "completed" }),
          makeTrainingNeed({ id: "tn-3", priority: "medium", status: "in_progress" }),
        ],
        trainingRecords: [
          makeTrainingRecord({ id: "tr-1", is_mandatory: true, status: "compliant" }),
          makeTrainingRecord({ id: "tr-2", is_mandatory: true, status: "compliant" }),
          makeTrainingRecord({ id: "tr-3", is_mandatory: true, status: "expiring_soon" }),
          makeTrainingRecord({ id: "tr-4", is_mandatory: false, status: "compliant" }),
        ],
        alerts: [
          makeAlert({ id: "a-1", severity: "critical", is_resolved: false }),
          makeAlert({ id: "a-2", severity: "high", is_resolved: true }),
          makeAlert({ id: "a-3", severity: "medium", is_resolved: false }),
        ],
        incidents: [
          makeIncident({ id: "i-1", status: "open", severity: "high", requires_oversight: true, oversight_note: null }),
          makeIncident({ id: "i-2", status: "closed", severity: "critical" }),
          makeIncident({ id: "i-3", type: "complaint", status: "open" }),
        ],
        supervisionsMeta: { overdue: 1 },
        auditsMeta: { overdue: 0 },
        audits: [
          makeAudit({ id: "a-1", category: "building_safety", score: 92, max_score: 100 }),
          makeAudit({ id: "a-2", category: "fire_safety", score: 88, max_score: 100 }),
        ],
        medicationAudits: [
          makeAudit({ id: "ma-1", score: 90, max_score: 100 }),
        ],
        reg45Items: [
          makeReg45({ status: "reviewed" }),
        ],
        challenges: [
          makeChallenge({ id: "c-1", status: "open" }),
          makeChallenge({ id: "c-2", status: "resolved" }),
        ],
        careForms: [
          makeCareForm({ id: "cf-1", status: "approved" }),
          makeCareForm({ id: "cf-2", status: "submitted" }),
          makeCareForm({ id: "cf-3", status: "draft", due_date: "2025-01-01" }),
        ],
        dailyLogs: Array.from({ length: 6 }, (_, i) =>
          makeDailyLog({
            id: `dl-${i}`,
            child_id: `child-${(i % 3) + 1}`,
            mood_score: 6 + (i % 3),
            created_at: now.toISOString(),
            is_significant: i < 2,
          }),
        ),
        activeCandidates: [
          { compliance_score: 88 },
          { compliance_score: 92 },
        ],
        ypCount: 3,
      };

      const scores = computeRiScores(inputs);

      // Verify all scores exist and are in valid ranges
      expect(scores.overall_governance_score).toBeGreaterThanOrEqual(0);
      expect(scores.overall_governance_score).toBeLessThanOrEqual(100);

      // Training: (2 + 1*0.6)/3 * 95 - 1*8 = 82.33 - 8 = 74
      expect(scores.training_compliance_score).toBe(74);

      // Safeguarding: 95 - 1*15 = 80
      expect(scores.safeguarding_oversight_score).toBe(80);

      // Incident: 90 - 1*10 - 1*5 = 75
      expect(scores.incident_management_score).toBe(75);

      // Supervision: 85 - 1*10 = 75
      expect(scores.staff_supervision_score).toBe(75);

      // Challenge: 90 - 1*12 = 78
      expect(scores.challenge_log_score).toBe(78);

      // Reg 45: reviewed → 72
      expect(scores.reg45_compliance_score).toBe(72);

      // Building safety: avg(92, 88) = 90
      expect(scores.building_safety_score).toBe(90);

      // Medication: 90
      expect(scores.medication_governance_score).toBe(90);

      // Recruitment: avg(88, 92) = 90
      expect(scores.recruitment_compliance_score).toBe(90);

      // Missing episodes: 75 - 1*3 = 72
      expect(scores.missing_episodes_score).toBe(72);

      // Complaint: 92 - 1*8 = 84
      expect(scores.complaint_management_score).toBe(84);

      // Oversight quality: 88 - 0*8 - 2*4 = 80
      // (2 unresolved alerts: critical + medium)
      expect(scores.oversight_quality_score).toBe(80);
    });
  });
});
