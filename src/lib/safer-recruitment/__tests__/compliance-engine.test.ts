// ══════════════════════════════════════════════════════════════════════════════
// Cara Safer Recruitment — Compliance Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateCompliance,
  checkStartReadiness,
  calculatePipelineMetrics,
  checkDBSRenewals,
  formatCheckName,
  getRequiredChecks,
} from "../compliance-engine";
import type {
  CandidateChecklist,
  RecruitmentCheck,
  CheckType,
  CheckStatus,
} from "../compliance-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeCheck(type: CheckType, status: CheckStatus, extras: Partial<RecruitmentCheck> = {}): RecruitmentCheck {
  return { type, status, ...extras };
}

function makeChecklist(overrides: Partial<CandidateChecklist> = {}): CandidateChecklist {
  return {
    candidateId: "cand-1",
    candidateName: "Alex Smith",
    role: "RSW",
    stage: "pre_start_checks",
    checks: [],
    gapsExplained: true,
    homeId: "home-oak",
    ...overrides,
  };
}

function makeFullChecklist(): CandidateChecklist {
  return makeChecklist({
    stage: "final_clearance",
    checks: [
      makeCheck("enhanced_dbs", "satisfactory"),
      makeCheck("barred_list", "satisfactory"),
      makeCheck("reference_1", "satisfactory"),
      makeCheck("reference_2", "satisfactory"),
      makeCheck("employment_history", "satisfactory"),
      makeCheck("identity_proof", "satisfactory"),
      makeCheck("right_to_work", "satisfactory"),
      makeCheck("health_declaration", "satisfactory"),
      makeCheck("interview_assessment", "satisfactory"),
    ],
    gapsExplained: true,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCompliance", () => {
  describe("fully compliant candidate", () => {
    it("returns compliant for all checks satisfactory", () => {
      const checklist = makeFullChecklist();
      const result = evaluateCompliance(checklist);
      expect(result.isCompliant).toBe(true);
      expect(result.canProgress).toBe(true);
      expect(result.canStart).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.reg34Compliant).toBe(true);
      expect(result.schedule2Complete).toBe(true);
    });

    it("shows 100% completion", () => {
      const checklist = makeFullChecklist();
      const result = evaluateCompliance(checklist);
      expect(result.completionPercentage).toBe(100);
      expect(result.completedChecks).toBe(9);
      expect(result.totalRequired).toBe(9);
    });
  });

  describe("missing checks at advanced stage", () => {
    it("blocks when DBS not started at pre_start_checks", () => {
      const checklist = makeChecklist({
        stage: "pre_start_checks",
        checks: [
          makeCheck("barred_list", "satisfactory"),
          makeCheck("reference_1", "satisfactory"),
          makeCheck("reference_2", "satisfactory"),
          makeCheck("employment_history", "satisfactory"),
          makeCheck("identity_proof", "satisfactory"),
          makeCheck("right_to_work", "satisfactory"),
          makeCheck("health_declaration", "satisfactory"),
          makeCheck("interview_assessment", "satisfactory"),
        ],
      });
      const result = evaluateCompliance(checklist);
      expect(result.canProgress).toBe(false);
      expect(result.issues.some(i => i.code === "ENHANCED_DBS_MISSING" && i.severity === "blocker")).toBe(true);
    });

    it("blocks when references missing at conditional_offer", () => {
      const checklist = makeChecklist({
        stage: "conditional_offer",
        checks: [
          makeCheck("enhanced_dbs", "satisfactory"),
          makeCheck("barred_list", "satisfactory"),
          makeCheck("employment_history", "satisfactory"),
          makeCheck("identity_proof", "satisfactory"),
          makeCheck("right_to_work", "satisfactory"),
          makeCheck("health_declaration", "satisfactory"),
          makeCheck("interview_assessment", "satisfactory"),
        ],
      });
      const result = evaluateCompliance(checklist);
      expect(result.issues.some(i => i.code === "REFERENCE_1_MISSING")).toBe(true);
      expect(result.issues.some(i => i.code === "REFERENCE_2_MISSING")).toBe(true);
    });
  });

  describe("early stage warnings", () => {
    it("warns (not blocks) at shortlisted stage", () => {
      const checklist = makeChecklist({
        stage: "shortlisted",
        checks: [],
      });
      const result = evaluateCompliance(checklist);
      // At shortlisted, missing checks should be warnings not blockers
      expect(result.issues.every(i => i.severity === "warning")).toBe(true);
      expect(result.canProgress).toBe(true);
    });
  });

  describe("unsatisfactory checks", () => {
    it("blocks on unsatisfactory DBS", () => {
      const checklist = makeChecklist({
        stage: "pre_start_checks",
        checks: [
          makeCheck("enhanced_dbs", "unsatisfactory"),
          makeCheck("barred_list", "satisfactory"),
          makeCheck("reference_1", "satisfactory"),
          makeCheck("reference_2", "satisfactory"),
          makeCheck("employment_history", "satisfactory"),
          makeCheck("identity_proof", "satisfactory"),
          makeCheck("right_to_work", "satisfactory"),
          makeCheck("health_declaration", "satisfactory"),
          makeCheck("interview_assessment", "satisfactory"),
        ],
      });
      const result = evaluateCompliance(checklist);
      expect(result.canProgress).toBe(false);
      expect(result.issues.some(i =>
        i.code === "ENHANCED_DBS_UNSATISFACTORY" && i.severity === "blocker"
      )).toBe(true);
    });

    it("warns on concerns noted and recommends risk assessment", () => {
      const checklist = makeChecklist({
        stage: "pre_start_checks",
        checks: [
          makeCheck("enhanced_dbs", "satisfactory"),
          makeCheck("barred_list", "satisfactory"),
          makeCheck("reference_1", "concerns_noted"),
          makeCheck("reference_2", "satisfactory"),
          makeCheck("employment_history", "satisfactory"),
          makeCheck("identity_proof", "satisfactory"),
          makeCheck("right_to_work", "satisfactory"),
          makeCheck("health_declaration", "satisfactory"),
          makeCheck("interview_assessment", "satisfactory"),
        ],
      });
      const result = evaluateCompliance(checklist);
      expect(result.issues.some(i => i.code === "REFERENCE_1_CONCERNS")).toBe(true);
      expect(result.nextActions.some(a => a.includes("risk assessment"))).toBe(true);
    });
  });

  describe("expired checks", () => {
    it("blocks on expired DBS", () => {
      const checklist = makeChecklist({
        stage: "final_clearance",
        checks: [
          makeCheck("enhanced_dbs", "expired"),
          makeCheck("barred_list", "satisfactory"),
          makeCheck("reference_1", "satisfactory"),
          makeCheck("reference_2", "satisfactory"),
          makeCheck("employment_history", "satisfactory"),
          makeCheck("identity_proof", "satisfactory"),
          makeCheck("right_to_work", "satisfactory"),
          makeCheck("health_declaration", "satisfactory"),
          makeCheck("interview_assessment", "satisfactory"),
        ],
      });
      const result = evaluateCompliance(checklist);
      expect(result.canProgress).toBe(false);
      expect(result.issues.some(i => i.code === "ENHANCED_DBS_EXPIRED")).toBe(true);
    });
  });

  describe("employment gaps", () => {
    it("blocks at advanced stage when gaps unexplained", () => {
      const checklist = makeFullChecklist();
      checklist.gapsExplained = false;
      const result = evaluateCompliance(checklist);
      expect(result.canProgress).toBe(false);
      expect(result.issues.some(i => i.code === "GAPS_UNEXPLAINED")).toBe(true);
      expect(result.reg34Compliant).toBe(false);
    });

    it("warns at early stage when gaps unexplained", () => {
      const checklist = makeChecklist({
        stage: "shortlisted",
        gapsExplained: false,
        checks: [],
      });
      const result = evaluateCompliance(checklist);
      expect(result.issues.some(i =>
        i.code === "GAPS_UNEXPLAINED" && i.severity === "warning"
      )).toBe(true);
    });
  });

  describe("conditional checks", () => {
    it("includes overseas police check when lived abroad", () => {
      const checklist = makeFullChecklist();
      const result = evaluateCompliance(checklist, ["lived_overseas_12_months"]);
      // Should have an issue about missing overseas check
      expect(result.totalRequired).toBe(10);
      expect(result.issues.some(i => i.code === "OVERSEAS_POLICE_CHECK_MISSING")).toBe(true);
    });

    it("includes prohibition check for teaching roles", () => {
      const checklist = makeFullChecklist();
      const result = evaluateCompliance(checklist, ["teaching_role"]);
      expect(result.totalRequired).toBe(10);
    });

    it("does not include overseas check when not lived abroad", () => {
      const checklist = makeFullChecklist();
      const result = evaluateCompliance(checklist, []);
      expect(result.totalRequired).toBe(9);
      expect(result.isCompliant).toBe(true);
    });
  });

  describe("completion percentage", () => {
    it("calculates partial completion", () => {
      const checklist = makeChecklist({
        stage: "pre_start_checks",
        checks: [
          makeCheck("enhanced_dbs", "satisfactory"),
          makeCheck("barred_list", "satisfactory"),
          makeCheck("reference_1", "satisfactory"),
        ],
      });
      const result = evaluateCompliance(checklist);
      // 3 of 9 = 33%
      expect(result.completionPercentage).toBe(33);
    });
  });

  describe("regulation references", () => {
    it("includes CHR 2015 references in issues", () => {
      const checklist = makeChecklist({ stage: "pre_start_checks", checks: [] });
      const result = evaluateCompliance(checklist);
      expect(result.issues.every(i => i.regulationRef.includes("CHR 2015"))).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// checkStartReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("checkStartReadiness", () => {
  it("ready when all pre-start checks complete", () => {
    const checklist = makeFullChecklist();
    const result = checkStartReadiness(checklist);
    expect(result.ready).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("not ready when DBS missing", () => {
    const checklist = makeChecklist({
      checks: [
        makeCheck("barred_list", "satisfactory"),
        makeCheck("reference_1", "satisfactory"),
        makeCheck("reference_2", "satisfactory"),
        makeCheck("identity_proof", "satisfactory"),
        makeCheck("right_to_work", "satisfactory"),
        makeCheck("health_declaration", "satisfactory"),
      ],
    });
    const result = checkStartReadiness(checklist);
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => b.includes("DBS"))).toBe(true);
  });

  it("not ready when gaps unexplained", () => {
    const checklist = makeFullChecklist();
    checklist.gapsExplained = false;
    const result = checkStartReadiness(checklist);
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => b.includes("gaps"))).toBe(true);
  });

  it("blocks when overseas check needed and not complete", () => {
    const checklist = makeFullChecklist();
    const result = checkStartReadiness(checklist, ["lived_overseas_12_months"]);
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => b.includes("Overseas"))).toBe(true);
  });

  it("warns about pending qualification check", () => {
    const checklist = makeFullChecklist();
    const result = checkStartReadiness(checklist, ["qualifications_required"]);
    expect(result.ready).toBe(true); // non-blocking
    expect(result.warnings.some(w => w.includes("Qualification"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculatePipelineMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculatePipelineMetrics", () => {
  it("counts candidates by stage", () => {
    const candidates = [
      makeChecklist({ candidateId: "c1", stage: "shortlisted" }),
      makeChecklist({ candidateId: "c2", stage: "shortlisted" }),
      makeChecklist({ candidateId: "c3", stage: "pre_start_checks" }),
      makeChecklist({ candidateId: "c4", stage: "appointed" }),
    ];
    const metrics = calculatePipelineMetrics(candidates);
    expect(metrics.byStage.shortlisted).toBe(2);
    expect(metrics.byStage.pre_start_checks).toBe(1);
    expect(metrics.byStage.appointed).toBe(1);
    expect(metrics.totalCandidates).toBe(4);
  });

  it("calculates overdue checks (requested > 14 days ago)", () => {
    const candidates = [
      makeChecklist({
        candidateId: "c1",
        stage: "pre_start_checks",
        checks: [
          makeCheck("enhanced_dbs", "requested", { requestedAt: "2026-04-01T00:00:00Z" }),
        ],
      }),
    ];
    const metrics = calculatePipelineMetrics(candidates, "2026-05-16T12:00:00Z");
    expect(metrics.overdueChecks).toBe(1);
  });

  it("counts expiring checks (within 30 days)", () => {
    const candidates = [
      makeChecklist({
        candidateId: "c1",
        stage: "appointed",
        checks: [
          makeCheck("enhanced_dbs", "satisfactory", { expiresAt: "2026-06-01T00:00:00Z" }),
        ],
      }),
    ];
    const metrics = calculatePipelineMetrics(candidates, "2026-05-16T12:00:00Z");
    expect(metrics.expiringChecks).toBe(1);
  });

  it("reports no average time to hire when no appointed candidates", () => {
    const candidates = [
      makeChecklist({ candidateId: "c1", stage: "shortlisted" }),
    ];
    const metrics = calculatePipelineMetrics(candidates);
    expect(metrics.averageTimeToHire).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// checkDBSRenewals
// ══════════════════════════════════════════════════════════════════════════════

describe("checkDBSRenewals", () => {
  it("identifies expired DBS", () => {
    const staff = [
      {
        id: "s1",
        name: "Jane",
        homeId: "home-1",
        dbs: makeCheck("enhanced_dbs", "satisfactory", {
          expiresAt: "2026-04-01T00:00:00Z",
          documentRef: "DBS-123",
        }),
      },
    ];
    const result = checkDBSRenewals(staff, "2026-05-16T12:00:00Z");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("expired");
    expect(result[0].daysUntilExpiry).toBeLessThan(0);
  });

  it("identifies expiring soon (within 60 days)", () => {
    const staff = [
      {
        id: "s1",
        name: "Mike",
        homeId: "home-1",
        dbs: makeCheck("enhanced_dbs", "satisfactory", {
          expiresAt: "2026-06-15T00:00:00Z",
          documentRef: "DBS-456",
        }),
      },
    ];
    const result = checkDBSRenewals(staff, "2026-05-16T12:00:00Z");
    expect(result[0].status).toBe("expiring_soon");
  });

  it("identifies valid DBS", () => {
    const staff = [
      {
        id: "s1",
        name: "Sarah",
        homeId: "home-1",
        dbs: makeCheck("enhanced_dbs", "satisfactory", {
          expiresAt: "2027-05-16T00:00:00Z",
          documentRef: "DBS-789",
        }),
      },
    ];
    const result = checkDBSRenewals(staff, "2026-05-16T12:00:00Z");
    expect(result[0].status).toBe("valid");
  });

  it("sorts by days until expiry (most urgent first)", () => {
    const staff = [
      {
        id: "s1", name: "A", homeId: "h1",
        dbs: makeCheck("enhanced_dbs", "satisfactory", { expiresAt: "2027-01-01T00:00:00Z" }),
      },
      {
        id: "s2", name: "B", homeId: "h1",
        dbs: makeCheck("enhanced_dbs", "satisfactory", { expiresAt: "2026-06-01T00:00:00Z" }),
      },
      {
        id: "s3", name: "C", homeId: "h1",
        dbs: makeCheck("enhanced_dbs", "satisfactory", { expiresAt: "2026-04-01T00:00:00Z" }),
      },
    ];
    const result = checkDBSRenewals(staff, "2026-05-16T12:00:00Z");
    expect(result[0].staffId).toBe("s3"); // expired — most urgent
    expect(result[1].staffId).toBe("s2"); // expiring soon
    expect(result[2].staffId).toBe("s1"); // valid
  });

  it("detects update service membership", () => {
    const staff = [
      {
        id: "s1", name: "Jane", homeId: "h1",
        dbs: makeCheck("enhanced_dbs", "satisfactory", {
          expiresAt: "2027-01-01T00:00:00Z",
          notes: "On update_service — renewal via online check",
        }),
      },
    ];
    const result = checkDBSRenewals(staff, "2026-05-16T12:00:00Z");
    expect(result[0].onUpdateService).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("formatCheckName", () => {
  it("formats check types to human-readable names", () => {
    expect(formatCheckName("enhanced_dbs")).toBe("Enhanced DBS Check");
    expect(formatCheckName("reference_1")).toBe("Reference 1");
    expect(formatCheckName("right_to_work")).toBe("Right to Work");
    expect(formatCheckName("overseas_police_check")).toBe("Overseas Police Check");
  });
});

describe("getRequiredChecks", () => {
  it("returns 9 base checks with no conditions", () => {
    const checks = getRequiredChecks([]);
    expect(checks).toHaveLength(9);
  });

  it("adds overseas check when lived abroad", () => {
    const checks = getRequiredChecks(["lived_overseas_12_months"]);
    expect(checks).toHaveLength(10);
    expect(checks).toContain("overseas_police_check");
  });

  it("adds multiple conditional checks", () => {
    const checks = getRequiredChecks(["lived_overseas_12_months", "driving_required"]);
    expect(checks).toHaveLength(11);
    expect(checks).toContain("overseas_police_check");
    expect(checks).toContain("driving_licence");
  });
});
