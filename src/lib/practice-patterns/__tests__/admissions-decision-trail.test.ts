import { describe, it, expect } from "vitest";
import {
  checkAdmissionDecisionTrail,
  hasBlanketExclusion,
  type AdmissionDecisionRecord,
} from "../admissions-decision-trail";

function complete(overrides: Partial<AdmissionDecisionRecord> = {}): AdmissionDecisionRecord {
  return {
    childRef: "YP-1",
    needsAssessed: true,
    risksAssessed: true,
    compatibilityWithGroupAssessed: true,
    staffingSkillsConfirmed: true,
    environmentConfirmed: true,
    rationaleRecorded: true,
    conditions: [{ description: "Medication plan in place", verifiedBy: "Deputy Manager" }],
    rationaleText: "Individual assessment completed; the home can meet the needs identified.",
    ...overrides,
  };
}

describe("hasBlanketExclusion — negation-aware", () => {
  it("flags a blanket exclusion by diagnosis/history", () => {
    expect(hasBlanketExclusion("We do not accept children with a diagnosis of FASD.")).toBe(true);
    expect(hasBlanketExclusion("There is a blanket ban on anyone with a forensic history.")).toBe(true);
    expect(hasBlanketExclusion("Policy not to accept young people who have been missing.")).toBe(true);
  });

  it("does NOT flag a disavowal of blanket exclusions (clause-negation)", () => {
    expect(hasBlanketExclusion("This home operates no blanket exclusions.")).toBe(false);
    expect(hasBlanketExclusion("This was an individual decision, not a blanket policy.")).toBe(false);
    expect(hasBlanketExclusion("We do not operate automatic exclusion by diagnosis.")).toBe(false);
  });

  it("ignores unrelated text", () => {
    expect(hasBlanketExclusion("The child enjoys football and art.")).toBe(false);
    expect(hasBlanketExclusion("")).toBe(false);
  });
});

describe("checkAdmissionDecisionTrail", () => {
  it("passes a complete, verifiable, non-blanket decision", () => {
    const r = checkAdmissionDecisionTrail(complete());
    expect(r.ok).toBe(true);
    expect(r.findings).toHaveLength(0);
  });

  it("flags a blanket exclusion (eval case)", () => {
    const r = checkAdmissionDecisionTrail(
      complete({ rationaleText: "We don't take children with a history of fire-setting." }),
    );
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.code === "blanket_exclusion")).toBe(true);
  });

  it("flags a condition with no named verifier (who-verifies gap)", () => {
    const r = checkAdmissionDecisionTrail(
      complete({ conditions: [{ description: "Risk assessment signed off", verifiedBy: "" }] }),
    );
    expect(r.findings.some((f) => f.code === "condition_without_verifier")).toBe(true);
  });

  it("flags missing core assessments as red", () => {
    const r = checkAdmissionDecisionTrail(
      complete({ needsAssessed: false, compatibilityWithGroupAssessed: false }),
    );
    const codes = r.findings.map((f) => f.code);
    expect(codes).toContain("needs_not_assessed");
    expect(codes).toContain("compatibility_not_assessed");
    expect(r.findings.filter((f) => f.severity === "red").length).toBeGreaterThanOrEqual(2);
  });
});
