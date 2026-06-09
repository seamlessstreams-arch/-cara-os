// ══════════════════════════════════════════════════════════════════════════════
// HR INTELLIGENCE — COMPREHENSIVE TEST SUITE
//
// Pure function tests across the HR engine: permissions, safer recruitment
// gate, suspension decision tool, and letter templates. No mocks. No `any`.
// Data fixtures are grounded in children's residential care practice.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  can,
  checkHrAccess,
  HR_PERMISSIONS,
  type HrRole,
  type HrAction,
  type HrPermissionContext,
  type HrAccessRequest,
} from "@/lib/hr/permissions";

import {
  evaluateSaferRecruitmentGate,
  countCompletedChecks,
  type SaferRecruitmentRecord,
} from "@/lib/hr/saferRecruitmentGate";

import {
  analyseSuspensionDecision,
  emptyRiskFactors,
  ENGINE_VERSION,
  type SuspensionDecisionInput,
  type SuspensionRiskFactor,
  type SuspensionRiskRating,
} from "@/lib/hr/suspensionDecision";

import { renderLetterTemplate, type LetterContext } from "@/lib/hr/letterTemplates";
import type { HrLetterType } from "@/lib/hr/types";

// ─── Fixtures ───────────────────────────────────────────────────────────────

function completeRecruitmentRecord(
  overrides: Partial<SaferRecruitmentRecord> = {},
): SaferRecruitmentRecord {
  return {
    id: "sr-001",
    staffId: "staff-jw-001",
    homeId: "home-oakhouse-01",
    applicationFormComplete: true,
    employmentHistoryFull: true,
    gapsExplored: true,
    gapsExplanation: "Two-month gap in 2019 explained as parental leave.",
    identityCheckStatus: "complete",
    rightToWorkStatus: "complete",
    enhancedDbsStatus: "clear",
    enhancedDbsNumber: "DBS-00123456",
    enhancedDbsIssued: "2024-06-01",
    enhancedDbsRenewalDue: "2027-06-01",
    barredListCheckStatus: "complete",
    referencesReceivedCount: 2,
    referencesVerifiedCount: 2,
    interviewNotesPresent: true,
    valuesBasedInterviewDone: true,
    qualificationCheckDone: true,
    healthDeclarationComplete: true,
    recruitmentRiskAssessment: "No concerns identified at recruitment stage.",
    inductionPlanPresent: true,
    managerSignOff: true,
    managerSignedOffBy: "user-rm-001",
    managerSignedOffAt: "2024-07-01T10:00:00Z",
    seniorRiskAcceptance: false,
    status: "complete",
    ...overrides,
  };
}

function baseSuspensionInput(
  overrides: Partial<SuspensionDecisionInput> = {},
): SuspensionDecisionInput {
  return {
    caseId: "case-disc-001",
    staffId: "staff-jw-001",
    homeId: "home-oakhouse-01",
    concernSummary:
      "Staff member used an unapproved physical intervention technique during a significant incident on the evening shift.",
    riskFactors: {
      risk_to_children: { rating: "high", rationale: "Child was distressed and complained of arm pain." },
      risk_to_witnesses: { rating: "low", rationale: "Two staff witnesses present; no intimidation concerns." },
      risk_to_evidence: { rating: "medium", rationale: "CCTV available but body-worn not activated." },
      risk_to_staff_member: { rating: "medium", rationale: "Staff member is upset and may struggle to attend work." },
      risk_of_repeat_incident: { rating: "high", rationale: "Similar concern noted informally six months ago." },
    },
    alternativesConsidered: ["adjusted_duties", "increased_supervision"],
    alternativeRejectionRationale:
      "Adjusted duties would not remove the staff member from direct contact with the child who made the complaint. Increased supervision alone is insufficient given the physical nature of the concern.",
    hrAdviceSought: true,
    hrAdviceSummary: "HR advised suspension is proportionate given the physical intervention concern.",
    riAdviceSought: true,
    riAdviceSummary: "RI agreed suspension is proportionate pending LADO outcome.",
    ladoAdviceSought: true,
    ladoAdviceSummary: "LADO confirmed threshold met for managing allegations process.",
    ladoAdviceDate: "2024-08-15",
    policeOrSocialWorkerInvolved: false,
    welfareSinglePointOfContact: "Deputy Manager Sarah Collins",
    welfareSupportOffered: ["Occupational health referral", "Employee Assistance Programme", "Trade union contact provided"],
    welfareReviewIntervalDays: 14,
    firstReviewDate: "2024-08-29",
    proposedDecision: "suspend",
    effectiveFromDate: "2024-08-16",
    decisionMakerUserId: "user-rm-001",
    decisionMakerRole: "Registered Manager",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("permissions.ts", () => {
  // ── can() ──────────────────────────────────────────────────────────────

  describe("can()", () => {
    it("ri has all actions except case.delete", () => {
      const allActions: HrAction[] = [
        "case.create", "case.read", "case.read_safeguarding", "case.update",
        "case.close", "case.export",
        "guardian.run", "guardian.approve", "guardian.reject", "guardian.read",
        "letter.draft", "letter.approve", "letter.send",
        "safer_recruitment.read", "safer_recruitment.update", "safer_recruitment.sign_off",
        "safer_recruitment.senior_risk_acceptance",
        "probation.read", "probation.update", "probation.decide_outcome",
        "sickness.read", "sickness.update",
        "supervision_themes.read",
        "agency.read", "agency.update", "agency.block",
        "exit_interview.read", "exit_interview.update",
        "audit.read", "audit.export",
        "ri_oversight.write",
        "tasks.read", "tasks.write",
      ];
      for (const action of allActions) {
        expect(can("ri", action)).toBe(true);
      }
    });

    it("ri cannot delete cases", () => {
      expect(can("ri", "case.delete")).toBe(false);
    });

    it("rm has broad access including case creation, letters, and agency blocking", () => {
      expect(can("rm", "case.create")).toBe(true);
      expect(can("rm", "case.read")).toBe(true);
      expect(can("rm", "case.read_safeguarding")).toBe(true);
      expect(can("rm", "letter.draft")).toBe(true);
      expect(can("rm", "letter.approve")).toBe(true);
      expect(can("rm", "letter.send")).toBe(true);
      expect(can("rm", "agency.block")).toBe(true);
      expect(can("rm", "tasks.write")).toBe(true);
    });

    it("rm cannot delete cases or export audits", () => {
      expect(can("rm", "case.delete")).toBe(false);
      expect(can("rm", "audit.export")).toBe(false);
    });

    it("rm cannot perform senior risk acceptance", () => {
      expect(can("rm", "safer_recruitment.senior_risk_acceptance")).toBe(false);
    });

    it("deputy has limited access: can read/update cases but not create or close them", () => {
      expect(can("deputy", "case.read")).toBe(true);
      expect(can("deputy", "case.update")).toBe(true);
      expect(can("deputy", "case.create")).toBe(false);
      expect(can("deputy", "case.close")).toBe(false);
      expect(can("deputy", "case.export")).toBe(false);
    });

    it("deputy can draft letters but cannot approve or send them", () => {
      expect(can("deputy", "letter.draft")).toBe(true);
      expect(can("deputy", "letter.approve")).toBe(false);
      expect(can("deputy", "letter.send")).toBe(false);
    });

    it("deputy can run the guardian but cannot approve or reject", () => {
      expect(can("deputy", "guardian.run")).toBe(true);
      expect(can("deputy", "guardian.read")).toBe(true);
      expect(can("deputy", "guardian.approve")).toBe(false);
      expect(can("deputy", "guardian.reject")).toBe(false);
    });

    it("hr_caseworker has narrow case-level access", () => {
      expect(can("hr_caseworker", "case.read")).toBe(true);
      expect(can("hr_caseworker", "case.update")).toBe(true);
      expect(can("hr_caseworker", "case.create")).toBe(false);
      expect(can("hr_caseworker", "case.close")).toBe(false);
      expect(can("hr_caseworker", "letter.draft")).toBe(true);
      expect(can("hr_caseworker", "letter.approve")).toBe(false);
    });

    it("hr_caseworker cannot read safeguarding cases directly", () => {
      expect(can("hr_caseworker", "case.read_safeguarding")).toBe(false);
    });

    it("hr_admin has broad access including case creation and audit export", () => {
      expect(can("hr_admin", "case.create")).toBe(true);
      expect(can("hr_admin", "case.read_safeguarding")).toBe(true);
      expect(can("hr_admin", "audit.export")).toBe(true);
      expect(can("hr_admin", "safer_recruitment.sign_off")).toBe(true);
    });

    it("hr_admin cannot approve or send letters", () => {
      expect(can("hr_admin", "letter.approve")).toBe(false);
      expect(can("hr_admin", "letter.send")).toBe(false);
    });

    it("safeguarding role can read safeguarding cases", () => {
      expect(can("safeguarding", "case.read")).toBe(true);
      expect(can("safeguarding", "case.read_safeguarding")).toBe(true);
      expect(can("safeguarding", "case.update")).toBe(true);
    });

    it("safeguarding role cannot create or close cases", () => {
      expect(can("safeguarding", "case.create")).toBe(false);
      expect(can("safeguarding", "case.close")).toBe(false);
    });

    it("auditor is strictly read-only plus export", () => {
      expect(can("auditor", "case.read")).toBe(true);
      expect(can("auditor", "case.read_safeguarding")).toBe(true);
      expect(can("auditor", "audit.read")).toBe(true);
      expect(can("auditor", "audit.export")).toBe(true);
      expect(can("auditor", "tasks.read")).toBe(true);
    });

    it("auditor has zero write permissions", () => {
      const writeActions: HrAction[] = [
        "case.create", "case.update", "case.close", "case.delete",
        "guardian.run", "guardian.approve", "guardian.reject",
        "letter.draft", "letter.approve", "letter.send",
        "safer_recruitment.update", "safer_recruitment.sign_off",
        "safer_recruitment.senior_risk_acceptance",
        "probation.update", "probation.decide_outcome",
        "sickness.update",
        "agency.update", "agency.block",
        "exit_interview.update",
        "ri_oversight.write",
        "tasks.write",
      ];
      for (const action of writeActions) {
        expect(can("auditor", action)).toBe(false);
      }
    });

    it("staff_self has minimal read access only", () => {
      expect(can("staff_self", "case.read")).toBe(true);
      expect(can("staff_self", "probation.read")).toBe(true);
      expect(can("staff_self", "sickness.read")).toBe(true);
      expect(can("staff_self", "tasks.read")).toBe(true);
    });

    it("staff_self cannot update, create, or access safeguarding cases", () => {
      expect(can("staff_self", "case.create")).toBe(false);
      expect(can("staff_self", "case.update")).toBe(false);
      expect(can("staff_self", "case.read_safeguarding")).toBe(false);
      expect(can("staff_self", "letter.draft")).toBe(false);
    });

    it("none role has zero permissions", () => {
      const sampleActions: HrAction[] = [
        "case.create", "case.read", "case.read_safeguarding",
        "guardian.run", "letter.draft", "tasks.read",
      ];
      for (const action of sampleActions) {
        expect(can("none", action)).toBe(false);
      }
    });

    it("HR_PERMISSIONS none set is empty", () => {
      expect(HR_PERMISSIONS.none.size).toBe(0);
    });
  });

  // ── checkHrAccess() ────────────────────────────────────────────────────

  describe("checkHrAccess()", () => {
    it("rm can create cases (basic grant)", () => {
      const ctx: HrPermissionContext = { role: "rm", userId: "user-rm-001" };
      const req: HrAccessRequest = { action: "case.create" };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });

    it("none role denied for any action", () => {
      const ctx: HrPermissionContext = { role: "none", userId: "user-unknown" };
      const req: HrAccessRequest = { action: "case.read" };
      const result = checkHrAccess(ctx, req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("none");
    });

    it("staff_self can read own records (staffId matches staffSelfId)", () => {
      const ctx: HrPermissionContext = {
        role: "staff_self",
        userId: "user-staff-001",
        staffSelfId: "staff-jw-001",
      };
      const req: HrAccessRequest = { action: "case.read", staffId: "staff-jw-001" };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });

    it("staff_self denied when accessing a different staff members records", () => {
      const ctx: HrPermissionContext = {
        role: "staff_self",
        userId: "user-staff-001",
        staffSelfId: "staff-jw-001",
      };
      const req: HrAccessRequest = { action: "case.read", staffId: "staff-other-002" };
      const result = checkHrAccess(ctx, req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("own records");
    });

    it("staff_self denied for safeguarding-status cases", () => {
      const ctx: HrPermissionContext = {
        role: "staff_self",
        userId: "user-staff-001",
        staffSelfId: "staff-jw-001",
      };
      const req: HrAccessRequest = {
        action: "case.read",
        staffId: "staff-jw-001",
        caseSafeguardingStatus: "lado_consulted",
      };
      const result = checkHrAccess(ctx, req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Safeguarding-status");
    });

    it("staff_self with no staffSelfId is denied", () => {
      const ctx: HrPermissionContext = {
        role: "staff_self",
        userId: "user-staff-001",
      };
      const req: HrAccessRequest = { action: "case.read" };
      const result = checkHrAccess(ctx, req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("no resolved subject id");
    });

    it("staff_self allowed when caseSafeguardingStatus is not_safeguarding", () => {
      const ctx: HrPermissionContext = {
        role: "staff_self",
        userId: "user-staff-001",
        staffSelfId: "staff-jw-001",
      };
      const req: HrAccessRequest = {
        action: "case.read",
        staffId: "staff-jw-001",
        caseSafeguardingStatus: "not_safeguarding",
      };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });

    it("hr_caseworker needs caseOwner matching userId for case actions", () => {
      const ctx: HrPermissionContext = { role: "hr_caseworker", userId: "user-cw-001" };
      const req: HrAccessRequest = { action: "case.read", caseOwner: "user-cw-001" };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });

    it("hr_caseworker without caseOwner denied on case actions", () => {
      const ctx: HrPermissionContext = { role: "hr_caseworker", userId: "user-cw-001" };
      const req: HrAccessRequest = { action: "case.read" };
      const result = checkHrAccess(ctx, req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("case_owner");
    });

    it("hr_caseworker with mismatched caseOwner denied", () => {
      const ctx: HrPermissionContext = { role: "hr_caseworker", userId: "user-cw-001" };
      const req: HrAccessRequest = { action: "case.update", caseOwner: "user-cw-other" };
      const result = checkHrAccess(ctx, req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("cases they own");
    });

    it("hr_caseworker case ownership check does not apply to non-case actions", () => {
      const ctx: HrPermissionContext = { role: "hr_caseworker", userId: "user-cw-001" };
      const req: HrAccessRequest = { action: "tasks.read" };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });

    it("safeguarding gate: deputy with case.read but not case.read_safeguarding denied for safeguarding cases", () => {
      const ctx: HrPermissionContext = { role: "deputy", userId: "user-dep-001" };
      const req: HrAccessRequest = {
        action: "case.read",
        caseSafeguardingStatus: "safeguarding_open",
      };
      const result = checkHrAccess(ctx, req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("case.read_safeguarding");
    });

    it("rm with case.read_safeguarding can read safeguarding cases", () => {
      const ctx: HrPermissionContext = { role: "rm", userId: "user-rm-001" };
      const req: HrAccessRequest = {
        action: "case.read",
        caseSafeguardingStatus: "lado_consulted",
      };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });

    it("home scoping: deputy denied when homeId mismatch", () => {
      const ctx: HrPermissionContext = {
        role: "deputy",
        userId: "user-dep-001",
        homeId: "home-oakhouse-01",
      };
      const req: HrAccessRequest = {
        action: "case.read",
        homeId: "home-willow-02",
      };
      const result = checkHrAccess(ctx, req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("home does not match");
    });

    it("home scoping: ri is allowed despite homeId mismatch", () => {
      const ctx: HrPermissionContext = {
        role: "ri",
        userId: "user-ri-001",
        homeId: "home-oakhouse-01",
      };
      const req: HrAccessRequest = {
        action: "case.read",
        homeId: "home-willow-02",
      };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });

    it("home scoping: hr_admin is allowed despite homeId mismatch", () => {
      const ctx: HrPermissionContext = {
        role: "hr_admin",
        userId: "user-hra-001",
        homeId: "home-oakhouse-01",
      };
      const req: HrAccessRequest = {
        action: "case.read",
        homeId: "home-willow-02",
      };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });

    it("home scoping: no check when context homeId is undefined", () => {
      const ctx: HrPermissionContext = {
        role: "deputy",
        userId: "user-dep-001",
      };
      const req: HrAccessRequest = {
        action: "case.read",
        homeId: "home-willow-02",
      };
      expect(checkHrAccess(ctx, req)).toEqual({ allowed: true });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. SAFER RECRUITMENT GATE
// ═══════════════════════════════════════════════════════════════════════════

describe("saferRecruitmentGate.ts", () => {
  describe("evaluateSaferRecruitmentGate()", () => {
    it("fully complete record results in approved_all_checks_complete", () => {
      const result = evaluateSaferRecruitmentGate(completeRecruitmentRecord());
      expect(result.outcome).toBe("approved_all_checks_complete");
      expect(result.approvedForUnsupervised).toBe(true);
      expect(result.unmetChecks).toHaveLength(0);
      expect(result.blockingReasons).toHaveLength(0);
    });

    it("fully complete record returns 14 rows", () => {
      const result = evaluateSaferRecruitmentGate(completeRecruitmentRecord());
      expect(result.rows).toHaveLength(14);
    });

    it("ariaLabel is always set", () => {
      const result = evaluateSaferRecruitmentGate(completeRecruitmentRecord());
      expect(result.ariaLabel).toBe("Aria suggested draft");
    });

    it("regulatoryLinks are populated", () => {
      const result = evaluateSaferRecruitmentGate(completeRecruitmentRecord());
      expect(result.regulatoryLinks.length).toBeGreaterThan(0);
      expect(result.regulatoryLinks.some((l) => l.includes("Reg 32"))).toBe(true);
    });

    it("missing health declaration results in blocked_missing_checks", () => {
      const record = completeRecruitmentRecord({ healthDeclarationComplete: false });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
      expect(result.approvedForUnsupervised).toBe(false);
      expect(result.unmetChecks.length).toBeGreaterThan(0);
      expect(result.unmetChecks.some((c) => c.key === "health_declaration")).toBe(true);
    });

    it("missing application form results in blocked_missing_checks", () => {
      const record = completeRecruitmentRecord({ applicationFormComplete: false });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
      expect(result.unmetChecks.some((c) => c.key === "application_form_complete")).toBe(true);
    });

    it("failed identity check results in blocked_check_failed", () => {
      const record = completeRecruitmentRecord({ identityCheckStatus: "failed" });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_check_failed");
      expect(result.approvedForUnsupervised).toBe(false);
      expect(result.failedChecks.length).toBeGreaterThan(0);
      expect(result.blockingReasons.length).toBeGreaterThan(0);
    });

    it("flagged DBS results in blocked_check_failed", () => {
      const record = completeRecruitmentRecord({ enhancedDbsStatus: "flagged" });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_check_failed");
      expect(result.approvedForUnsupervised).toBe(false);
      expect(result.blockingReasons.some((r) => r.includes("flagged"))).toBe(true);
    });

    it("failed right to work check results in blocked_check_failed", () => {
      const record = completeRecruitmentRecord({ rightToWorkStatus: "failed" });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_check_failed");
    });

    it("failed barred list check results in blocked_check_failed", () => {
      const record = completeRecruitmentRecord({ barredListCheckStatus: "failed" });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_check_failed");
    });

    it("senior risk acceptance with sufficient text overrides missing checks", () => {
      const record = completeRecruitmentRecord({
        healthDeclarationComplete: false,
        seniorRiskAcceptance: true,
        seniorRiskAcceptanceText:
          "RI has reviewed the file and accepts the risk of proceeding while the health declaration is outstanding. The worker will not work unsupervised until it is received.",
        seniorRiskAcceptanceBy: "user-ri-001",
        seniorRiskAcceptanceAt: "2024-07-15T09:00:00Z",
      });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("approved_with_senior_risk_acceptance");
      expect(result.approvedForUnsupervised).toBe(true);
    });

    it("senior risk acceptance with short text (<30 chars) still blocks", () => {
      const record = completeRecruitmentRecord({
        healthDeclarationComplete: false,
        seniorRiskAcceptance: true,
        seniorRiskAcceptanceText: "Accepted by RI.",
      });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
      expect(result.approvedForUnsupervised).toBe(false);
    });

    it("senior risk acceptance with empty text still blocks", () => {
      const record = completeRecruitmentRecord({
        healthDeclarationComplete: false,
        seniorRiskAcceptance: true,
        seniorRiskAcceptanceText: "",
      });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
    });

    it("senior risk acceptance false with missing text still blocks", () => {
      const record = completeRecruitmentRecord({
        healthDeclarationComplete: false,
        seniorRiskAcceptance: false,
      });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
    });

    it("references: 1 received and 0 verified is unmet", () => {
      const record = completeRecruitmentRecord({
        referencesReceivedCount: 1,
        referencesVerifiedCount: 0,
      });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
      expect(result.unmetChecks.some((c) => c.key === "references")).toBe(true);
      const refRow = result.rows.find((r) => r.key === "references");
      expect(refRow?.satisfied).toBe(false);
      expect(refRow?.reason).toContain("1");
    });

    it("references: 2 received and 1 verified is unmet", () => {
      const record = completeRecruitmentRecord({
        referencesReceivedCount: 2,
        referencesVerifiedCount: 1,
      });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.unmetChecks.some((c) => c.key === "references")).toBe(true);
      const refRow = result.rows.find((r) => r.key === "references");
      expect(refRow?.satisfied).toBe(false);
      expect(refRow?.reason).toContain("verified");
    });

    it("references: 3 received and 3 verified is satisfied", () => {
      const record = completeRecruitmentRecord({
        referencesReceivedCount: 3,
        referencesVerifiedCount: 3,
      });
      const result = evaluateSaferRecruitmentGate(record);
      const refRow = result.rows.find((r) => r.key === "references");
      expect(refRow?.satisfied).toBe(true);
    });

    it("expired DBS renewal date makes enhanced_dbs not satisfied", () => {
      const record = completeRecruitmentRecord({
        enhancedDbsRenewalDue: "2020-01-01",
      });
      const result = evaluateSaferRecruitmentGate(record);
      const dbsRow = result.rows.find((r) => r.key === "enhanced_dbs");
      expect(dbsRow?.satisfied).toBe(false);
    });

    it("barred list not_required counts as satisfied", () => {
      const record = completeRecruitmentRecord({
        barredListCheckStatus: "not_required",
      });
      const result = evaluateSaferRecruitmentGate(record);
      const barredRow = result.rows.find((r) => r.key === "barred_list");
      expect(barredRow?.satisfied).toBe(true);
      expect(result.outcome).toBe("approved_all_checks_complete");
    });

    it("pending identity check is not satisfied", () => {
      const record = completeRecruitmentRecord({ identityCheckStatus: "pending" });
      const result = evaluateSaferRecruitmentGate(record);
      const idRow = result.rows.find((r) => r.key === "identity_check");
      expect(idRow?.satisfied).toBe(false);
      expect(idRow?.reason).toContain("pending");
    });

    it("not_required identity check is not satisfied (strict gate)", () => {
      const record = completeRecruitmentRecord({ identityCheckStatus: "not_required" });
      const result = evaluateSaferRecruitmentGate(record);
      const idRow = result.rows.find((r) => r.key === "identity_check");
      expect(idRow?.satisfied).toBe(false);
    });

    it("expired right to work shows appropriate reason", () => {
      const record = completeRecruitmentRecord({ rightToWorkStatus: "expired" });
      const result = evaluateSaferRecruitmentGate(record);
      const rtwRow = result.rows.find((r) => r.key === "right_to_work");
      expect(rtwRow?.satisfied).toBe(false);
      expect(rtwRow?.reason).toContain("expired");
    });

    it("DBS submitted but not returned is not satisfied", () => {
      const record = completeRecruitmentRecord({ enhancedDbsStatus: "submitted" });
      const result = evaluateSaferRecruitmentGate(record);
      const dbsRow = result.rows.find((r) => r.key === "enhanced_dbs");
      expect(dbsRow?.satisfied).toBe(false);
      expect(dbsRow?.reason).toContain("submitted");
    });

    it("missing manager sign-off blocks", () => {
      const record = completeRecruitmentRecord({ managerSignOff: false });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
      expect(result.unmetChecks.some((c) => c.key === "manager_sign_off")).toBe(true);
    });

    it("missing induction plan blocks", () => {
      const record = completeRecruitmentRecord({ inductionPlanPresent: false });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
      expect(result.unmetChecks.some((c) => c.key === "induction_plan")).toBe(true);
    });

    it("multiple missing checks accumulate in blockingReasons", () => {
      const record = completeRecruitmentRecord({
        healthDeclarationComplete: false,
        inductionPlanPresent: false,
        managerSignOff: false,
      });
      const result = evaluateSaferRecruitmentGate(record);
      expect(result.outcome).toBe("blocked_missing_checks");
      expect(result.unmetChecks.length).toBe(3);
      expect(result.blockingReasons.length).toBe(3);
    });

    it("rationaleSummary is present in all outcomes", () => {
      const outcomes = [
        completeRecruitmentRecord(),
        completeRecruitmentRecord({ healthDeclarationComplete: false }),
        completeRecruitmentRecord({ identityCheckStatus: "failed" }),
        completeRecruitmentRecord({
          healthDeclarationComplete: false,
          seniorRiskAcceptance: true,
          seniorRiskAcceptanceText: "RI accepts risk: worker limited to admin only pending the health declaration being returned and reviewed.",
        }),
      ];
      for (const rec of outcomes) {
        const result = evaluateSaferRecruitmentGate(rec);
        expect(result.rationaleSummary.length).toBeGreaterThan(10);
      }
    });

    it("each row has evidenceRequiredIfMissing", () => {
      const result = evaluateSaferRecruitmentGate(completeRecruitmentRecord());
      for (const row of result.rows) {
        expect(row.evidenceRequiredIfMissing.length).toBeGreaterThan(0);
      }
    });
  });

  describe("countCompletedChecks()", () => {
    it("fully complete record has 14 of 14 completed", () => {
      const { completed, total } = countCompletedChecks(completeRecruitmentRecord());
      expect(total).toBe(14);
      expect(completed).toBe(14);
    });

    it("record with one missing check has 13 of 14 completed", () => {
      const record = completeRecruitmentRecord({ healthDeclarationComplete: false });
      const { completed, total } = countCompletedChecks(record);
      expect(total).toBe(14);
      expect(completed).toBe(13);
    });

    it("record with multiple missing checks matches evaluateSaferRecruitmentGate unmet count", () => {
      const record = completeRecruitmentRecord({
        healthDeclarationComplete: false,
        inductionPlanPresent: false,
        qualificationCheckDone: false,
      });
      const { completed, total } = countCompletedChecks(record);
      const gate = evaluateSaferRecruitmentGate(record);
      expect(total).toBe(14);
      expect(completed).toBe(11);
      expect(gate.unmetChecks.length).toBe(total - completed);
    });

    it("record with zero completed checks", () => {
      const record = completeRecruitmentRecord({
        applicationFormComplete: false,
        employmentHistoryFull: false,
        gapsExplored: false,
        identityCheckStatus: "pending",
        rightToWorkStatus: "pending",
        enhancedDbsStatus: "pending",
        barredListCheckStatus: "pending",
        referencesReceivedCount: 0,
        referencesVerifiedCount: 0,
        interviewNotesPresent: false,
        valuesBasedInterviewDone: false,
        qualificationCheckDone: false,
        healthDeclarationComplete: false,
        inductionPlanPresent: false,
        managerSignOff: false,
      });
      const { completed, total } = countCompletedChecks(record);
      expect(total).toBe(14);
      expect(completed).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. SUSPENSION DECISION
// ═══════════════════════════════════════════════════════════════════════════

describe("suspensionDecision.ts", () => {
  describe("analyseSuspensionDecision()", () => {
    it("returns a complete analysis with all fields populated", () => {
      const result = analyseSuspensionDecision(baseSuspensionInput());
      expect(result.status).toBe("draft");
      expect(result.ariaLabel).toBe("Aria suggested draft");
      expect(result.engineVersion).toBe(ENGINE_VERSION);
      expect(result.generatedAt).toBeTruthy();
      expect(result.overallRiskGrade).toBeTruthy();
      expect(result.highestRiskFactor).toBeTruthy();
      expect(result.rationaleSummary.length).toBeGreaterThan(0);
      expect(result.proportionalityRating).toBeTruthy();
      expect(result.proportionalityRationale.length).toBeGreaterThan(0);
      expect(result.writtenReasonsDraft.length).toBeGreaterThan(0);
      expect(result.regulatoryLinks.length).toBeGreaterThan(0);
      expect(typeof result.ariaConfidence).toBe("number");
    });

    it("throws when staffId is empty", () => {
      expect(() =>
        analyseSuspensionDecision(baseSuspensionInput({ staffId: "" })),
      ).toThrow("staffId is required");
    });

    it("throws when staffId is only whitespace", () => {
      expect(() =>
        analyseSuspensionDecision(baseSuspensionInput({ staffId: "   " })),
      ).toThrow("staffId is required");
    });

    it("throws when concernSummary is too short", () => {
      expect(() =>
        analyseSuspensionDecision(baseSuspensionInput({ concernSummary: "Short" })),
      ).toThrow("concernSummary must be at least 10 characters");
    });

    it("throws when concernSummary is empty", () => {
      expect(() =>
        analyseSuspensionDecision(baseSuspensionInput({ concernSummary: "" })),
      ).toThrow("concernSummary must be at least 10 characters");
    });

    it("concernSummary exactly 10 chars does not throw", () => {
      expect(() =>
        analyseSuspensionDecision(baseSuspensionInput({ concernSummary: "1234567890" })),
      ).not.toThrow();
    });
  });

  describe("emptyRiskFactors()", () => {
    it("returns 5 factors all rated low", () => {
      const factors = emptyRiskFactors();
      const keys = Object.keys(factors) as SuspensionRiskFactor[];
      expect(keys).toHaveLength(5);
      for (const key of keys) {
        expect(factors[key].rating).toBe("low");
        expect(factors[key].rationale).toBe("");
      }
    });

    it("contains all expected risk factor keys", () => {
      const factors = emptyRiskFactors();
      const expectedKeys: SuspensionRiskFactor[] = [
        "risk_to_children",
        "risk_to_witnesses",
        "risk_to_evidence",
        "risk_to_staff_member",
        "risk_of_repeat_incident",
      ];
      for (const key of expectedKeys) {
        expect(factors[key]).toBeDefined();
      }
    });
  });

  describe("risk aggregation", () => {
    it("highest risk factor drives the overall grade", () => {
      const input = baseSuspensionInput({
        riskFactors: {
          risk_to_children: { rating: "very_high", rationale: "Direct risk to the child." },
          risk_to_witnesses: { rating: "low", rationale: "No concern." },
          risk_to_evidence: { rating: "low", rationale: "CCTV captured." },
          risk_to_staff_member: { rating: "low", rationale: "No concern." },
          risk_of_repeat_incident: { rating: "medium", rationale: "One prior similar concern." },
        },
      });
      const result = analyseSuspensionDecision(input);
      expect(result.overallRiskGrade).toBe("very_high");
      expect(result.highestRiskFactor).toBe("risk_to_children");
    });

    it("all low risk factors yield low overall", () => {
      const input = baseSuspensionInput({
        riskFactors: {
          risk_to_children: { rating: "low", rationale: "No direct contact during incident." },
          risk_to_witnesses: { rating: "low", rationale: "No concern." },
          risk_to_evidence: { rating: "low", rationale: "Evidence preserved." },
          risk_to_staff_member: { rating: "low", rationale: "No concern." },
          risk_of_repeat_incident: { rating: "low", rationale: "First occurrence." },
        },
      });
      const result = analyseSuspensionDecision(input);
      expect(result.overallRiskGrade).toBe("low");
    });
  });

  describe("proportionality", () => {
    it("suspend with low risk and no_change_required alternative is disproportionate", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        riskFactors: {
          risk_to_children: { rating: "low", rationale: "Low risk." },
          risk_to_witnesses: { rating: "low", rationale: "Low risk." },
          risk_to_evidence: { rating: "low", rationale: "Low risk." },
          risk_to_staff_member: { rating: "low", rationale: "Low risk." },
          risk_of_repeat_incident: { rating: "low", rationale: "Low risk." },
        },
        alternativesConsidered: ["no_change_required"],
      });
      const result = analyseSuspensionDecision(input);
      expect(result.proportionalityRating).toBe("disproportionate");
    });

    it("suspend with low risk (no no_change_required) is borderline", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        riskFactors: {
          risk_to_children: { rating: "low", rationale: "Minimal." },
          risk_to_witnesses: { rating: "low", rationale: "No concern." },
          risk_to_evidence: { rating: "low", rationale: "Preserved." },
          risk_to_staff_member: { rating: "low", rationale: "No concern." },
          risk_of_repeat_incident: { rating: "low", rationale: "First time." },
        },
        alternativesConsidered: ["adjusted_duties"],
      });
      const result = analyseSuspensionDecision(input);
      expect(result.proportionalityRating).toBe("borderline");
    });

    it("suspend with medium risk is proportionate", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        riskFactors: {
          risk_to_children: { rating: "medium", rationale: "Moderate concern." },
          risk_to_witnesses: { rating: "low", rationale: "No concern." },
          risk_to_evidence: { rating: "low", rationale: "Preserved." },
          risk_to_staff_member: { rating: "low", rationale: "No concern." },
          risk_of_repeat_incident: { rating: "low", rationale: "First time." },
        },
      });
      const result = analyseSuspensionDecision(input);
      expect(result.proportionalityRating).toBe("proportionate");
    });

    it("suspend with high risk is proportionate", () => {
      const result = analyseSuspensionDecision(baseSuspensionInput());
      expect(result.proportionalityRating).toBe("proportionate");
    });

    it("do_not_suspend with very_high risk is borderline", () => {
      const input = baseSuspensionInput({
        proposedDecision: "do_not_suspend",
        riskFactors: {
          risk_to_children: { rating: "very_high", rationale: "Serious harm concern." },
          risk_to_witnesses: { rating: "low", rationale: "No concern." },
          risk_to_evidence: { rating: "low", rationale: "Preserved." },
          risk_to_staff_member: { rating: "low", rationale: "No concern." },
          risk_of_repeat_incident: { rating: "low", rationale: "First time." },
        },
      });
      const result = analyseSuspensionDecision(input);
      expect(result.proportionalityRating).toBe("borderline");
    });

    it("do_not_suspend with low risk is proportionate", () => {
      const input = baseSuspensionInput({
        proposedDecision: "do_not_suspend",
        riskFactors: {
          risk_to_children: { rating: "low", rationale: "Low concern." },
          risk_to_witnesses: { rating: "low", rationale: "No concern." },
          risk_to_evidence: { rating: "low", rationale: "Preserved." },
          risk_to_staff_member: { rating: "low", rationale: "No concern." },
          risk_of_repeat_incident: { rating: "low", rationale: "First time." },
        },
      });
      const result = analyseSuspensionDecision(input);
      expect(result.proportionalityRating).toBe("proportionate");
    });

    it("alternative_arrangement is proportionate regardless of risk", () => {
      const input = baseSuspensionInput({
        proposedDecision: "alternative_arrangement",
        alternativeArrangementDescription:
          "Staff member redeployed to admin-only duties with no direct child contact, supervised by the deputy manager.",
      });
      const result = analyseSuspensionDecision(input);
      expect(result.proportionalityRating).toBe("proportionate");
    });
  });

  describe("flags", () => {
    it("no HR advice raises a warning flag", () => {
      const input = baseSuspensionInput({ hrAdviceSought: false });
      const result = analyseSuspensionDecision(input);
      const hrFlag = result.flags.find(
        (f) => f.category === "advice" && f.message.includes("HR advice"),
      );
      expect(hrFlag).toBeDefined();
      expect(hrFlag?.severity).toBe("warning");
    });

    it("suspend without RI advice raises an advisory flag", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        riAdviceSought: false,
      });
      const result = analyseSuspensionDecision(input);
      const riFlag = result.flags.find(
        (f) => f.category === "advice" && f.message.includes("RI advice"),
      );
      expect(riFlag).toBeDefined();
      expect(riFlag?.severity).toBe("advisory");
    });

    it("safeguarding-related concern without LADO advice raises block flag", () => {
      const input = baseSuspensionInput({
        concernSummary: "Allegation of harm to a child during a restraint on the evening of 12 August.",
        ladoAdviceSought: false,
      });
      const result = analyseSuspensionDecision(input);
      const ladoFlag = result.flags.find(
        (f) => f.category === "safeguarding" && f.severity === "block",
      );
      expect(ladoFlag).toBeDefined();
      expect(ladoFlag?.message).toContain("LADO");
    });

    it("safeguarding concern with LADO sought but no summary raises warning", () => {
      const input = baseSuspensionInput({
        concernSummary: "Allegation of harm during a physical intervention on the evening shift.",
        ladoAdviceSought: true,
        ladoAdviceSummary: undefined,
        ladoAdviceDate: undefined,
      });
      const result = analyseSuspensionDecision(input);
      const ladoWarning = result.flags.find(
        (f) => f.category === "safeguarding" && f.severity === "warning",
      );
      expect(ladoWarning).toBeDefined();
      expect(ladoWarning?.message).toContain("summary or date is missing");
    });

    it("suspend with no alternatives raises block flag", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        alternativesConsidered: [],
      });
      const result = analyseSuspensionDecision(input);
      const altFlag = result.flags.find(
        (f) => f.category === "alternatives" && f.severity === "block",
      );
      expect(altFlag).toBeDefined();
    });

    it("short alternative rejection rationale raises warning", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        alternativeRejectionRationale: "Not possible.",
      });
      const result = analyseSuspensionDecision(input);
      const ratFlag = result.flags.find(
        (f) => f.category === "alternatives" && f.severity === "warning",
      );
      expect(ratFlag).toBeDefined();
      expect(ratFlag?.message).toContain("short or missing");
    });

    it("no welfare contact on suspension raises block flag", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        welfareSinglePointOfContact: "",
      });
      const result = analyseSuspensionDecision(input);
      const welfareFlag = result.flags.find(
        (f) => f.category === "welfare" && f.severity === "block",
      );
      expect(welfareFlag).toBeDefined();
      expect(welfareFlag?.message).toContain("single point of contact");
    });

    it("review interval > 28 days raises warning", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        welfareReviewIntervalDays: 35,
      });
      const result = analyseSuspensionDecision(input);
      const intervalFlag = result.flags.find(
        (f) => f.category === "welfare" && f.message.includes("28 days"),
      );
      expect(intervalFlag).toBeDefined();
      expect(intervalFlag?.severity).toBe("warning");
    });

    it("review interval of exactly 28 does not raise warning", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        welfareReviewIntervalDays: 28,
      });
      const result = analyseSuspensionDecision(input);
      const intervalFlag = result.flags.find(
        (f) => f.category === "welfare" && f.message.includes("28 days"),
      );
      expect(intervalFlag).toBeUndefined();
    });

    it("no welfare support offered raises advisory flag", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        welfareSupportOffered: [],
      });
      const result = analyseSuspensionDecision(input);
      const supportFlag = result.flags.find(
        (f) => f.category === "welfare" && f.severity === "advisory",
      );
      expect(supportFlag).toBeDefined();
    });

    it("welfare flags are not raised for do_not_suspend decisions", () => {
      const input = baseSuspensionInput({
        proposedDecision: "do_not_suspend",
        welfareSinglePointOfContact: "",
        welfareSupportOffered: [],
        welfareReviewIntervalDays: 60,
      });
      const result = analyseSuspensionDecision(input);
      const welfareFlags = result.flags.filter((f) => f.category === "welfare");
      expect(welfareFlags).toHaveLength(0);
    });

    it("suspend without effectiveFromDate raises process warning", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        effectiveFromDate: undefined,
      });
      const result = analyseSuspensionDecision(input);
      const dateFlag = result.flags.find(
        (f) => f.category === "process" && f.message.includes("start date"),
      );
      expect(dateFlag).toBeDefined();
      expect(dateFlag?.severity).toBe("warning");
    });
  });

  describe("review schedule", () => {
    it("generates 4 reviews at the configured interval", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        firstReviewDate: "2024-08-29",
        welfareReviewIntervalDays: 14,
      });
      const result = analyseSuspensionDecision(input);
      expect(result.reviewSchedule).toHaveLength(4);
      expect(result.reviewSchedule[0].reviewNumber).toBe(1);
      expect(result.reviewSchedule[0].expectedDate).toBe("2024-08-29");
      expect(result.reviewSchedule[1].expectedDate).toBe("2024-09-12");
      expect(result.reviewSchedule[2].expectedDate).toBe("2024-09-26");
      expect(result.reviewSchedule[3].expectedDate).toBe("2024-10-10");
    });

    it("returns empty schedule for do_not_suspend", () => {
      const input = baseSuspensionInput({ proposedDecision: "do_not_suspend" });
      const result = analyseSuspensionDecision(input);
      expect(result.reviewSchedule).toHaveLength(0);
    });

    it("returns empty schedule when firstReviewDate is missing", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        firstReviewDate: "",
      });
      const result = analyseSuspensionDecision(input);
      expect(result.reviewSchedule).toHaveLength(0);
    });
  });

  describe("suggested actions", () => {
    it("blocking issues generate an urgent resolve action", () => {
      const input = baseSuspensionInput({
        proposedDecision: "suspend",
        alternativesConsidered: [],
      });
      const result = analyseSuspensionDecision(input);
      const urgent = result.suggestedActions.find(
        (a) => a.priority === "urgent" && a.title.includes("blocking"),
      );
      expect(urgent).toBeDefined();
    });

    it("suspend always includes letter guardian action", () => {
      const result = analyseSuspensionDecision(baseSuspensionInput());
      const guardianAction = result.suggestedActions.find(
        (a) => a.title.includes("Process Guardian"),
      );
      expect(guardianAction).toBeDefined();
      expect(guardianAction?.priority).toBe("urgent");
    });

    it("always includes child impact reflection", () => {
      const result = analyseSuspensionDecision(baseSuspensionInput());
      const childImpact = result.suggestedActions.find(
        (a) => a.title.includes("child impact"),
      );
      expect(childImpact).toBeDefined();
    });

    it("safeguarding flags trigger confirm safeguarding pathway action", () => {
      const input = baseSuspensionInput({
        concernSummary: "Allegation of harm to a young person during a restraint incident.",
        ladoAdviceSought: false,
      });
      const result = analyseSuspensionDecision(input);
      const sgAction = result.suggestedActions.find(
        (a) => a.title.includes("safeguarding pathway"),
      );
      expect(sgAction).toBeDefined();
      expect(sgAction?.priority).toBe("urgent");
    });
  });

  describe("ariaConfidence", () => {
    it("higher when no blocks or warnings", () => {
      const cleanInput = baseSuspensionInput({
        proposedDecision: "do_not_suspend",
        riskFactors: {
          risk_to_children: { rating: "low", rationale: "No direct risk." },
          risk_to_witnesses: { rating: "low", rationale: "No concern." },
          risk_to_evidence: { rating: "low", rationale: "Preserved." },
          risk_to_staff_member: { rating: "low", rationale: "No concern." },
          risk_of_repeat_incident: { rating: "low", rationale: "First time." },
        },
      });
      const cleanResult = analyseSuspensionDecision(cleanInput);

      const dirtyInput = baseSuspensionInput({
        proposedDecision: "suspend",
        alternativesConsidered: [],
        hrAdviceSought: false,
        welfareSinglePointOfContact: "",
      });
      const dirtyResult = analyseSuspensionDecision(dirtyInput);

      expect(cleanResult.ariaConfidence).toBeGreaterThan(dirtyResult.ariaConfidence);
    });

    it("ariaConfidence is between 0.2 and 0.9", () => {
      const result = analyseSuspensionDecision(baseSuspensionInput());
      expect(result.ariaConfidence).toBeGreaterThanOrEqual(0.2);
      expect(result.ariaConfidence).toBeLessThanOrEqual(0.9);
    });
  });

  describe("written reasons draft", () => {
    it("suspension draft references the concern and effective date", () => {
      const result = analyseSuspensionDecision(baseSuspensionInput());
      expect(result.writtenReasonsDraft).toContain("Aria suggested draft");
      expect(result.writtenReasonsDraft).toContain("staff-jw-001");
      expect(result.writtenReasonsDraft).toContain("2024-08-16");
    });

    it("do_not_suspend draft includes rationale for not suspending", () => {
      const input = baseSuspensionInput({ proposedDecision: "do_not_suspend" });
      const result = analyseSuspensionDecision(input);
      expect(result.writtenReasonsDraft).toContain("not to suspend");
    });

    it("alternative_arrangement draft describes the arrangement", () => {
      const input = baseSuspensionInput({
        proposedDecision: "alternative_arrangement",
        alternativeArrangementDescription: "Admin-only duties with no unsupervised child contact.",
      });
      const result = analyseSuspensionDecision(input);
      expect(result.writtenReasonsDraft).toContain("alternative arrangement");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. LETTER TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

describe("letterTemplates.ts", () => {
  const baseCtx: LetterContext = {
    recipientName: "James Walker",
    homeName: "Chamberlain House Children's Home",
    caseRefDisplay: "HR-2024-0042",
    meetingDate: "22 August 2024",
    meetingTime: "10:00",
    meetingLocation: "Meeting Room 2, Chamberlain House",
    managerName: "Sarah Collins",
    managerRole: "Registered Manager",
    contactName: "Deputy Manager Lisa Brooks",
    contactDetails: "lisa.brooks@oakhouse.example.com / 07700 900123",
    effectiveFromDate: "16 August 2024",
    reviewDate: "29 August 2024",
    appealDeadlineDays: 5,
    concernNarrative: "An allegation of using an unapproved physical intervention technique on 12 August 2024.",
    outcomeNarrative: "The investigation is ongoing and no findings have been reached.",
    basisNarrative: "The investigation found that the standard expected was not met.",
    improvementsExpected: "The staff member must complete refresher training within 14 days.",
    supportProvided: "Supervision fortnightly, mentoring from a senior RSW.",
  };

  it("renders investigation_invite with recipient, meeting details, and representation line", () => {
    const output = renderLetterTemplate("investigation_invite", baseCtx);
    expect(output).toContain("Dear James Walker");
    expect(output).toContain("HR-2024-0042");
    expect(output).toContain("investigation meeting");
    expect(output).toContain("trade union representative");
  });

  it("renders suspension letter with neutral act framing and welfare contact", () => {
    const output = renderLetterTemplate("suspension", baseCtx);
    expect(output).toContain("neutral act");
    expect(output).toContain("16 August 2024");
    expect(output).toContain("Deputy Manager Lisa Brooks");
    expect(output).toContain("29 August 2024");
  });

  it("renders written_warning with appeal line", () => {
    const output = renderLetterTemplate("written_warning", baseCtx);
    expect(output).toContain("written warning");
    expect(output).toContain("right to appeal");
    expect(output).toContain("5 working days");
  });

  it("renders dismissal letter with effective date and appeal rights", () => {
    const output = renderLetterTemplate("dismissal", baseCtx);
    expect(output).toContain("employment will end");
    expect(output).toContain("16 August 2024");
    expect(output).toContain("right to appeal");
  });

  it("renders probation_confirmation as a positive letter", () => {
    const output = renderLetterTemplate("probation_confirmation", baseCtx);
    expect(output).toContain("successfully completed");
    expect(output).toContain("James Walker");
  });

  it("renders whistleblowing_acknowledgement with assurance of no detriment", () => {
    const output = renderLetterTemplate("whistleblowing_acknowledgement", baseCtx);
    expect(output).toContain("not be treated less favourably");
  });

  it("renders safeguarding_allegation_holding with LADO reference and welfare info", () => {
    const output = renderLetterTemplate("safeguarding_allegation_holding", baseCtx);
    expect(output).toContain("LADO");
    expect(output).toContain("neutral process");
    expect(output).toContain("Deputy Manager Lisa Brooks");
  });

  it("all letter types render without throwing", () => {
    const allTypes: HrLetterType[] = [
      "investigation_invite", "witness_invite", "disciplinary_invite",
      "grievance_invite", "suspension", "suspension_review",
      "no_further_action", "informal_concern", "written_warning",
      "final_written_warning", "dismissal", "appeal_invite",
      "appeal_outcome", "probation_review", "probation_extension",
      "probation_confirmation", "failed_probation", "sickness_meeting",
      "welfare_meeting", "occupational_health_referral",
      "return_to_work_outcome", "capability_meeting",
      "performance_improvement_plan", "mediation_invite",
      "whistleblowing_acknowledgement", "safeguarding_allegation_holding",
    ];
    for (const type of allTypes) {
      expect(() => renderLetterTemplate(type, baseCtx)).not.toThrow();
      const output = renderLetterTemplate(type, baseCtx);
      expect(output.length).toBeGreaterThan(50);
      expect(output).toContain("James Walker");
    }
  });

  it("uses placeholder values when context fields are missing", () => {
    const minimalCtx: LetterContext = { recipientName: "Test Worker" };
    const output = renderLetterTemplate("investigation_invite", minimalCtx);
    expect(output).toContain("Dear Test Worker");
    expect(output).toContain("[date]");
    expect(output).toContain("[time]");
    expect(output).toContain("[location]");
    expect(output).toContain("[name]");
  });

  it("applies Aria postprocessor (em dashes are replaced)", () => {
    const ctxWithDash: LetterContext = {
      recipientName: "Test Worker",
      concernNarrative: "The concern — a serious one — relates to medication errors",
    };
    const output = renderLetterTemplate("investigation_invite", ctxWithDash);
    expect(output).not.toContain("—");
  });

  it("sign-off includes manager name, role, and home name", () => {
    const output = renderLetterTemplate("no_further_action", baseCtx);
    expect(output).toContain("Sarah Collins");
    expect(output).toContain("Registered Manager");
    expect(output).toContain("Chamberlain House");
  });
});
