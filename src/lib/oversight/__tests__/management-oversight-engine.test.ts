import { describe, it, expect } from "vitest";
import {
  generateManagementOversight,
  generateTaskOversight,
  generateWorkflowSignOff,
} from "../management-oversight-engine";
import { scanForBannedPhrases, BANNED_CHILD_PHRASES } from "../templates/child-addressed-templates";
import type { OversightInput, WorkflowSignOffInput, OversightResult } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────
function base(over: Partial<OversightInput> = {}): OversightInput {
  return {
    oversightMode: "professional",
    recordType: "daily_log",
    childName: "Alex",
    childAge: 14,
    reviewedByRole: "registered_manager",
    chronologyClear: true,
    staffActionsRecorded: true,
    childVoiceCaptured: true,
    childPresentationRecorded: true,
    responsiblePersonRecorded: true,
    timescaleRecorded: true,
    ...over,
  };
}

// ── professional / child-addressed basics ───────────────────────────────────
describe("generateManagementOversight — modes", () => {
  it("1. low-risk daily log → professional oversight, no API recommendation", () => {
    const r = generateManagementOversight(base());
    expect(r.professionalOversight).toBeTruthy();
    expect(r.apiCallRecommended).toBe(false);
    expect(r.oversightOutcome).toBe("satisfactory");
    expect(r.childAddressedOversight).toBeUndefined();
  });

  it("2. low-risk daily log → child-addressed oversight in warm plain English", () => {
    const r = generateManagementOversight(base({ oversightMode: "child_addressed", childAddressedTone: "older_child" }));
    expect(r.childAddressedOversight).toBeTruthy();
    expect(r.childAddressedOversight!.toLowerCase()).toContain("safe");
    expect(r.childAddressedSuppressed).toBe(false);
  });

  it("4. both-mode returns professional AND child-addressed", () => {
    const r = generateManagementOversight(base({ oversightMode: "both" }));
    expect(r.professionalOversight).toBeTruthy();
    expect(r.childAddressedOversight).toBeTruthy();
  });

  it("17 + child safety. child-addressed output contains no banned phrases", () => {
    const r = generateManagementOversight(
      base({
        oversightMode: "child_addressed",
        recordType: "physical_intervention",
        restraintUsed: true,
        therapeuticModel: "PACE",
        injuriesRecordedOrRuledOut: true,
        workflowCompletionContext: { childDebrief: { required: true, status: "required_not_completed" } },
      }),
    );
    // physical_intervention with restraint is not auto-suppressed (no allegation/disclosure/critical)
    expect(r.childAddressedOversight).toBeTruthy();
    expect(scanForBannedPhrases(r.childAddressedOversight!)).toEqual([]);
  });
});

// ── evidence quality ─────────────────────────────────────────────────────────
describe("evidence quality", () => {
  it("3. incident missing antecedents → requires clarification + missing evidence listed", () => {
    const r = generateManagementOversight(base({ recordType: "incident", antecedentsIncluded: false }));
    expect(r.missingEvidence.join(" ")).toMatch(/antecedents/i);
    expect(["requires_clarification", "requires_action"]).toContain(r.oversightOutcome);
  });

  it("16. high-risk record with missing evidence → escalation + API recommendation", () => {
    const r = generateManagementOversight(
      base({
        recordType: "incident",
        existingRiskLevel: "high",
        antecedentsIncluded: false,
        chronologyClear: false,
        staffActionsRecorded: false,
        childVoiceCaptured: false,
        childPresentationRecorded: false,
        responsiblePersonRecorded: false,
        timescaleRecorded: false,
      }),
    );
    expect(r.riskLevel === "high" || r.riskLevel === "critical").toBe(true);
    expect(r.apiCallRecommended).toBe(true);
  });
});

// ── Cara Intelligence ────────────────────────────────────────────────────────
describe("Cara Intelligence", () => {
  it("5. includes lived experience when childContext provided", () => {
    const r = generateManagementOversight(
      base({ recordType: "incident", childContext: { livedExperienceSummary: "early trauma; settles with routine", knownTriggers: ["loud noise"] } }),
    );
    expect(r.livedExperienceConsiderations.join(" ")).toMatch(/lived experience|triggers/i);
  });

  it("6. includes pattern analysis when repeatedThemes provided", () => {
    const r = generateManagementOversight(
      base({ recordType: "incident", patternContext: { repeatedThemes: ["after family contact"], patternConfidence: "medium" } }),
    );
    expect(r.patternFindings.join(" ")).toMatch(/repeated themes/i);
  });

  it("7 + 8. PACE adds PACE-informed professional wording and safe child wording", () => {
    const pro = generateManagementOversight(base({ recordType: "incident", therapeuticModel: "PACE" }));
    expect(pro.professionalCuriosityFindings.join(" ")).toMatch(/PACE/);
    expect(pro.therapeuticTags).toContain("PACE");
    const child = generateManagementOversight(base({ oversightMode: "child_addressed", recordType: "incident", therapeuticModel: "PACE" }));
    expect(child.childAddressedOversight!.toLowerCase()).toContain("underneath");
    expect(scanForBannedPhrases(child.childAddressedOversight!)).toEqual([]);
  });
});

// ── physical intervention ────────────────────────────────────────────────────
describe("physical intervention", () => {
  it("9 + 45 + 46. no debrief → required actions for child and staff debrief", () => {
    const r = generateManagementOversight(
      base({
        recordType: "physical_intervention",
        restraintUsed: true,
        injuriesRecordedOrRuledOut: true,
        workflowCompletionContext: {
          staffDebrief: { required: true, status: "required_not_completed" },
          childDebrief: { required: true, status: "required_not_completed" },
        },
      }),
    );
    expect(r.requiredActions.some((a) => /staff debrief/i.test(a.action))).toBe(true);
    expect(r.requiredActions.some((a) => /debrief/i.test(a.action))).toBe(true);
    expect(r.escalationRequired).toBe(true);
  });
});

// ── missing episode ──────────────────────────────────────────────────────────
describe("missing episode", () => {
  it("11 + 33. police involved + missing notification → escalation", () => {
    const r = generateManagementOversight(
      base({
        recordType: "missing_episode",
        missingFromCare: true,
        policeInvolved: true,
        referralContext: {
          referralsAndNotifications: [{ type: "police", required: true, completed: false }],
          referralsRequiredButNotCompleted: [{ type: "police", required: true, completed: false }],
        },
      }),
    );
    expect(r.escalationRequired).toBe(true);
    expect(r.riskLevel === "high" || r.riskLevel === "critical").toBe(true);
  });

  it("12. child-addressed missing episode avoids the word 'absconded'", () => {
    const r = generateManagementOversight(base({ oversightMode: "child_addressed", recordType: "missing_episode", missingFromCare: true }));
    if (r.childAddressedOversight) {
      expect(r.childAddressedOversight.toLowerCase()).not.toContain("absconded");
      expect(scanForBannedPhrases(r.childAddressedOversight)).toEqual([]);
    }
  });
});

// ── safeguarding / allegation ────────────────────────────────────────────────
describe("safeguarding & allegation", () => {
  it("13 + 14. allegation suppresses child-addressed and recommends API/senior review", () => {
    const r = generateManagementOversight(base({ oversightMode: "both", recordType: "allegation", allegation: true }));
    expect(r.childAddressedSuppressed).toBe(true);
    expect(r.childAddressedOversight).toBeUndefined();
    expect(r.childAddressedSuppressionReason).toBeTruthy();
    expect(r.apiCallRecommended).toBe(true);
    expect(r.oversightOutcome).toBe("senior_review_required");
  });

  it("41. sensitive safeguarding record suppresses child-addressed by default", () => {
    const r = generateManagementOversight(base({ oversightMode: "child_addressed", recordType: "safeguarding" }));
    expect(r.childAddressedSuppressed).toBe(true);
  });
});

// ── medication ───────────────────────────────────────────────────────────────
describe("medication", () => {
  it("15 + 49. medication error with no follow-up paperwork → action + escalation", () => {
    const r = generateManagementOversight(
      base({
        recordType: "medication",
        medicationError: true,
        workflowCompletionContext: {
          associatedPaperwork: [{ paperworkType: "medication_error_form", required: true, status: "outstanding" }],
        },
      }),
    );
    expect(r.requiredActions.length).toBeGreaterThan(0);
    expect(r.escalationRequired).toBe(true);
  });
});

// ── professional output structure ────────────────────────────────────────────
describe("professional output structure", () => {
  it("18 + 62. includes judgement, actions, responsible role, timescale and workflow sections", () => {
    const r = generateManagementOversight(
      base({
        recordType: "incident",
        antecedentsIncluded: false,
        workflowCompletionContext: {
          staffDebrief: { required: true, status: "required_completed", practiceLearning: ["early signs of distress"] },
          childDebrief: { required: true, status: "required_not_completed" },
        },
      }),
    );
    const text = r.professionalOversight!;
    expect(text).toMatch(/Management oversight judgement/i);
    expect(text).toMatch(/Required actions/i);
    expect(text).toMatch(/responsible:/i);
    expect(text).toMatch(/by:/i);
    expect(text).toMatch(/Staff debrief/i);
    expect(text).toMatch(/Child debrief/i);
  });
});

// ── API recommendation triggers ──────────────────────────────────────────────
describe("API recommendation", () => {
  it("20. unknown record type recommends API call", () => {
    expect(generateManagementOversight(base({ recordType: "other" })).apiCallRecommended).toBe(true);
  });
  it("21. contradictory information recommends API call", () => {
    expect(generateManagementOversight(base({ contradictoryInformation: true })).apiCallRecommended).toBe(true);
  });
  it("22. manager-requested enhanced drafting recommends API call", () => {
    expect(generateManagementOversight(base({ managerRequestedEnhancedDrafting: true })).apiCallRecommended).toBe(true);
  });
});

// ── plan adherence & policy ──────────────────────────────────────────────────
describe("plan adherence & policy", () => {
  it("23. staff actions recorded and plan followed → positive practice finding", () => {
    const r = generateManagementOversight(
      base({
        recordType: "incident",
        therapeuticModel: "PACE",
        practiceResponseContext: { plannedStrategiesUsed: ["used the calm box"], staffReflectionCompleted: true },
        planAdherenceContext: { guidingDocumentChecks: [{ documentType: "behaviour_support_plan", wasFollowed: "followed" }] },
      }),
    );
    expect(r.positivePracticeFindings.length).toBeGreaterThan(0);
  });

  it("25 + 26. child safety / keeping-me-safe plan not followed → high risk + escalation", () => {
    const r = generateManagementOversight(
      base({
        recordType: "incident",
        planAdherenceContext: {
          guidingDocumentChecks: [{ documentType: "keeping_me_safe_plan", wasFollowed: "not_followed" }],
          unjustifiedDeviationsFromPlan: ["did not follow the agreed safety steps"],
        },
      }),
    );
    expect(r.riskLevel === "high" || r.riskLevel === "critical").toBe(true);
    expect(r.escalationRequired).toBe(true);
  });

  it("30. planned strategy not used WITH a rationale does not auto-create a failure finding", () => {
    const r = generateManagementOversight(
      base({
        recordType: "incident",
        practiceResponseContext: { plannedStrategiesNotUsed: ["the calm box"], reasonStrategiesNotUsed: "the child asked for space instead" },
      }),
    );
    expect(r.practiceResponseFindings.join(" ")).toMatch(/reasonable/i);
    expect(r.staffPracticeActions.some((a) => /rationale/i.test(a.action))).toBe(false);
  });

  it("36. possible policy failure in high-risk event recommends API call", () => {
    const r = generateManagementOversight(
      base({ recordType: "incident", existingRiskLevel: "high", policyComplianceContext: { possiblePolicyFailures: ["missing-from-care protocol not evidenced"] } }),
    );
    expect(r.apiCallRecommended).toBe(true);
    expect(r.policyFailurePossible).toBe(true);
  });
});

// ── referrals ────────────────────────────────────────────────────────────────
describe("referrals", () => {
  it("31. referral required and completed → satisfactory referral finding", () => {
    const r = generateManagementOversight(
      base({ recordType: "safeguarding", referralContext: { referralsAndNotifications: [{ type: "social_worker", required: true, completed: true }] } }),
    );
    expect(r.referralFindings.join(" ")).toMatch(/completed/i);
    expect(r.referralsOutstanding.length).toBe(0);
  });
});

// ── workflow completion ──────────────────────────────────────────────────────
describe("workflow completion", () => {
  it("42. complete workflow → positive workflow / high workflow score", () => {
    const r = generateManagementOversight(
      base({
        recordType: "incident",
        workflowCompletionContext: {
          workflowStatus: "complete",
          workflowSteps: [{ stepName: "incident record", required: true, completed: true }],
          staffDebrief: { required: true, status: "required_completed" },
          childDebrief: { required: true, status: "required_completed" },
          actionTrackerUpdated: true,
          allActionsAssigned: true,
          allActionsHaveTimescales: true,
        },
      }),
    );
    expect(r.workflowScore).toBeGreaterThanOrEqual(80);
    expect(r.workflowCompletionStatus).toBe("complete");
  });

  it("44 + 64. incomplete workflow after high-risk event → escalation", () => {
    const r = generateManagementOversight(
      base({
        recordType: "incident",
        existingRiskLevel: "high",
        workflowCompletionContext: {
          workflowStatus: "incomplete",
          workflowSteps: [{ stepName: "manager review", required: true, completed: false }],
        },
      }),
    );
    expect(r.escalationRequired).toBe(true);
    expect(r.outstandingWorkflowActions.length).toBeGreaterThan(0);
  });

  it("50. outstanding associated paperwork is listed in the result", () => {
    const r = generateManagementOversight(
      base({ recordType: "incident", workflowCompletionContext: { associatedPaperwork: [{ paperworkType: "body_map", required: true, status: "outstanding" }] } }),
    );
    expect(r.outstandingPaperwork.length).toBe(1);
  });
});

// ── debriefs & key work ──────────────────────────────────────────────────────
describe("debriefs & key work", () => {
  it("53. staff debrief learning themes appear in professional oversight", () => {
    const r = generateManagementOversight(
      base({ recordType: "incident", workflowCompletionContext: { staffDebrief: { required: true, status: "required_completed", practiceLearning: ["early signs of distress"] } } }),
    );
    expect(r.professionalOversight!).toMatch(/early signs of distress/);
  });

  it("57. child declined debrief is respected and a follow-up recommendation generated", () => {
    const r = generateManagementOversight(
      base({ recordType: "incident", workflowCompletionContext: { childDebrief: { required: true, status: "offered_declined", childDeclined: true, declineRespectedAndRecorded: true } } }),
    );
    expect(r.childDebriefFindings.join(" ")).toMatch(/declined.*respected|respected/i);
    expect(r.supportRecommendations.some((a) => /further opportunity/i.test(a.action))).toBe(true);
  });

  it("58. key-work required but not completed → action", () => {
    const r = generateManagementOversight(
      base({ recordType: "incident", workflowCompletionContext: { keyWorkFollowUp: { keyWorkRequired: true, keyWorkCompleted: false } } }),
    );
    expect(r.requiredActions.some((a) => /key-work/i.test(a.action))).toBe(true);
  });
});

// ── QA routing ───────────────────────────────────────────────────────────────
describe("quality assurance routing", () => {
  it("74. routing is generated from findings (repeated pattern → Reg 45 / team meeting / child review)", () => {
    const r = generateManagementOversight(base({ recordType: "incident", repeatedPattern: true }));
    expect(r.qualityAssuranceRoutes).toEqual(expect.arrayContaining(["Reg 45 review", "Team meeting"]));
  });
});

// ── banned phrase list sanity ────────────────────────────────────────────────
describe("banned phrase scanner", () => {
  it("detects banned phrases and is clean on safe text", () => {
    expect(scanForBannedPhrases("the staff debrief identified a policy breach")).toEqual(expect.arrayContaining(["staff debrief", "policy breach"]));
    expect(scanForBannedPhrases("You matter and adults want you to feel safe.")).toEqual([]);
    expect(BANNED_CHILD_PHRASES.length).toBeGreaterThan(10);
  });
});

// ── task-level oversight ─────────────────────────────────────────────────────
describe("generateTaskOversight", () => {
  it("67. required-but-incomplete high-risk task → requires action / escalated", () => {
    const t = generateTaskOversight({ taskName: "Child debrief", required: true, completed: false, riskRelevance: "high", affectsChildSafetyOrDignity: true });
    expect(["requires_action", "escalated"]).toContain(t.oversightStatus);
    expect(t.requiredAction).toBeTruthy();
    expect(t.includeInSignOff).toBe(true);
  });
  it("completed task → reviewed satisfactory", () => {
    const t = generateTaskOversight({ taskName: "Staff debrief", required: true, completed: true, completedByRole: "shift_lead" });
    expect(t.oversightStatus).toBe("reviewed_satisfactory");
  });
  it("not-required task → not applicable", () => {
    const t = generateTaskOversight({ taskName: "Return interview", required: false, completed: false });
    expect(t.oversightStatus).toBe("not_applicable");
  });
});

// ── sign-off ─────────────────────────────────────────────────────────────────
describe("generateWorkflowSignOff", () => {
  function cleanResult(over: Partial<OversightResult> = {}): OversightResult {
    return { ...generateManagementOversight(base()), ...over };
  }
  function signInput(over: Partial<WorkflowSignOffInput>): WorkflowSignOffInput {
    return {
      oversightResult: cleanResult(),
      signOffRole: "registered_manager",
      finalProfessionalOversight: "Reviewed and assured.",
      confirmActionsAssigned: true,
      confirmTimescalesRecorded: true,
      confirmRisksEscalated: true,
      confirmChildFacingSafeOrSuppressed: true,
      ...over,
    };
  }

  it("68. blocks sign-off where mandatory blockers exist (blank oversight)", () => {
    const r = generateWorkflowSignOff(signInput({ finalProfessionalOversight: "" }));
    expect(r.signed).toBe(false);
    expect(r.blockers.some((b) => b.code === "no_oversight")).toBe(true);
  });

  it("73. role permissions prevent unauthorised sign-off of a high-risk workflow", () => {
    const high = cleanResult({ riskLevel: "high" });
    const r = generateWorkflowSignOff(signInput({ oversightResult: high, signOffRole: "support_worker" }));
    expect(r.signed).toBe(false);
    expect(r.roleAuthorised).toBe(false);
  });

  it("69 + 70. authorised RM override with reason signs off and produces an audit entry", () => {
    const withBlocker = cleanResult({ referralsOutstanding: [{ type: "social_worker", required: true, completed: false }] });
    const r = generateWorkflowSignOff(signInput({ oversightResult: withBlocker, overrideReason: "SW on leave; cover SW emailed, awaiting confirmation" }));
    expect(r.signed).toBe(true);
    expect(r.overrideUsed).toBe(true);
    expect(r.auditEntry).toBeTruthy();
    expect(r.auditEntry!.overrideReason).toMatch(/SW on leave/);
  });

  it("75. clean workflow signs off with the full statement", () => {
    const r = generateWorkflowSignOff(signInput({}));
    expect(r.signed).toBe(true);
    expect(r.signOffStatement).toMatch(/reviewed the workflow/i);
    expect(r.auditEntry).toBeTruthy();
  });
});

// ── recording gaps ───────────────────────────────────────────────────────────
describe("recording gaps", () => {
  it("flags missing antecedents, child voice and presentation on a high-risk behaviour incident", () => {
    const r = generateManagementOversight(
      base({
        recordType: "incident",
        existingRiskLevel: "high",
        antecedentsIncluded: false,
        childVoiceCaptured: false,
        childPresentationRecorded: false,
      }),
    );
    const areas = r.recordingGaps.map((g) => g.area);
    expect(areas).toEqual(expect.arrayContaining(["Antecedents", "Child's voice", "Child's presentation"]));
    expect(r.recordingGaps.find((g) => g.area === "Antecedents")?.severity).toBe("significant");
    expect(r.recordingGaps[0].severity).toBe("significant"); // sorted significant-first
  });

  it("returns no recording gaps for a fully-evidenced low-risk daily log", () => {
    expect(generateManagementOversight(base()).recordingGaps).toEqual([]);
  });

  it("flags a missing injury check where restraint was used", () => {
    const r = generateManagementOversight(
      base({ recordType: "physical_intervention", restraintUsed: true, injuriesRecordedOrRuledOut: false }),
    );
    expect(r.recordingGaps.some((g) => g.area === "Injury check" && g.severity === "significant")).toBe(true);
  });

  it("flags missing notifications for a safeguarding event", () => {
    const r = generateManagementOversight(base({ recordType: "safeguarding", notificationsCompleted: false }));
    expect(r.recordingGaps.some((g) => g.area === "Notifications" && g.severity === "significant")).toBe(true);
  });

  it("flags a closed record with no outcome and a missing manager oversight note", () => {
    const r = generateManagementOversight(base({ outcomeRecorded: false, managementActionRecorded: false }));
    const areas = r.recordingGaps.map((g) => g.area);
    expect(areas).toEqual(expect.arrayContaining(["Outcome", "Manager oversight"]));
  });

  it("includes recording gaps in the professional oversight narrative", () => {
    const r = generateManagementOversight(base({ recordType: "incident", existingRiskLevel: "high", childVoiceCaptured: false }));
    expect(r.professionalOversight).toMatch(/Recording gaps/i);
    expect(r.professionalOversight).toMatch(/Child's voice/i);
  });
});

// ── determinism ──────────────────────────────────────────────────────────────
describe("determinism", () => {
  it("same input → same output (excluding timestamp)", () => {
    const a = generateManagementOversight(base({ recordType: "incident", existingRiskLevel: "high" }));
    const b = generateManagementOversight(base({ recordType: "incident", existingRiskLevel: "high" }));
    expect({ ...a, generatedAt: "" }).toEqual({ ...b, generatedAt: "" });
  });
});
