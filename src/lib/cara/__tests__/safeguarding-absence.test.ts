// ══════════════════════════════════════════════════════════════════════════════
// Tests — absence is never assurance
//
// A safeguarding provision that nobody recorded must not be reported as a
// provision that is in place. Before this was fixed, the read path defaulted
// all fourteen provisions to `true`, so a child with no safeguarding_config row
// scored 100/100 for compliance and was reported as "CHR 2015 Reg 12 — met".
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { analyseSafeguarding, type SafeguardingInput } from "../safeguarding-intelligence";

const FIXED_NOW = "2026-05-16T12:00:00Z";
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
afterEach(() => { vi.useRealTimers(); });

/** Nothing recorded — the state of a child with no safeguarding_config row. */
function unrecorded(overrides: Partial<SafeguardingInput> = {}): SafeguardingInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    missingEpisodes: [],
    missingTrend: "stable",
    restraintIncidents: [],
    restraintTrend: "stable",
    bullyingIncidents: [],
    safeguardingReferrals: [],
    cseRiskLevel: "none",
    cceRiskLevel: "none",
    radicalisationRiskLevel: "none",
    onlineSafetyRiskLevel: "none",
    riskAssessmentCurrent: null,
    safeguardingPlanInPlace: null,
    locationRiskAssessmentDone: null,
    childAwareOfRisks: null,
    onlineSafetyPlanInPlace: null,
    antibullyingPolicyShared: null,
    restraintPolicyShared: null,
    independentReturnInterviews: null,
    staffSafeguardingTrained: null,
    designatedSafeguardingLead: null,
    localaSafeguardingContactKnown: null,
    childKnowsHowToComplain: null,
    regularSafeguardingAudits: null,
    ...overrides,
  };
}

const flag = (a: ReturnType<typeof analyseSafeguarding>, regulation: string) =>
  a.regulatoryFlags.find(f => f.regulation === regulation);

describe("unrecorded provisions are not evidence of compliance", () => {
  it("does not report Regulation 12 as met when nothing was recorded", () => {
    const reg12 = flag(analyseSafeguarding(unrecorded()), "CHR 2015 Reg 12");
    expect(reg12?.status).toBe("not_evidenced");
    expect(reg12?.detail).toMatch(/not recorded/i);
  });

  it("does not claim the SCCIF safety domain is met on unrecorded training", () => {
    expect(flag(analyseSafeguarding(unrecorded()), "SCCIF")?.status).toBe("not_evidenced");
  });

  it("returns a null compliance score rather than a perfect one", () => {
    expect(analyseSafeguarding(unrecorded()).complianceScore).toBeNull();
  });

  it("names the recording gaps instead of recommending fixes to breaches that were never established", () => {
    const { recommendations } = analyseSafeguarding(unrecorded());
    expect(recommendations.some(r => /currently unrecorded/i.test(r))).toBe(true);
    expect(recommendations).not.toContain("Update risk assessment — currently out of date");
  });

  it("raises the gap as a concern without asserting a breach", () => {
    const { concerns } = analyseSafeguarding(unrecorded());
    expect(concerns.some(c => /not recorded/i.test(c.description))).toBe(true);
    expect(concerns.some(c => c.description === "Risk assessment not current — update required")).toBe(false);
  });

  it("claims no strength it cannot evidence", () => {
    const { strengths } = analyseSafeguarding(unrecorded());
    expect(strengths.some(s => s.category === "compliance")).toBe(false);
    expect(strengths.some(s => s.category === "empowerment")).toBe(false);
  });
});

describe("recorded values still drive the assessment", () => {
  const allRecorded = (v: boolean) => unrecorded({
    riskAssessmentCurrent: v, safeguardingPlanInPlace: v, locationRiskAssessmentDone: v,
    childAwareOfRisks: v, onlineSafetyPlanInPlace: v, antibullyingPolicyShared: v,
    restraintPolicyShared: v, independentReturnInterviews: v, staffSafeguardingTrained: v,
    designatedSafeguardingLead: v, localaSafeguardingContactKnown: v,
    childKnowsHowToComplain: v, regularSafeguardingAudits: v,
  });

  it("still reports Reg 12 met when the provisions are recorded as in place", () => {
    expect(flag(analyseSafeguarding(allRecorded(true)), "CHR 2015 Reg 12")?.status).toBe("met");
    expect(analyseSafeguarding(allRecorded(true)).complianceScore).toBe(100);
  });

  it("still reports a breach when the provisions are recorded as absent", () => {
    const a = analyseSafeguarding(allRecorded(false));
    expect(flag(a, "CHR 2015 Reg 12")?.status).toBe("not_met");
    expect(a.complianceScore).toBe(0);
    expect(a.recommendations).toContain("Update risk assessment — currently out of date");
  });

  it("scores compliance over the provisions actually recorded", () => {
    // Only one provision recorded, and it is met: 100% of what is known.
    const a = analyseSafeguarding(unrecorded({ staffSafeguardingTrained: true }));
    expect(a.complianceScore).toBe(100);
    // A second provision recorded as absent halves the weighted result.
    const b = analyseSafeguarding(unrecorded({ staffSafeguardingTrained: true, designatedSafeguardingLead: false }));
    expect(b.complianceScore).toBe(50);
  });
});

describe("a referral with no recorded outcome stays open", () => {
  const withReferral = (outcome: "unknown" | "resolved") => unrecorded({
    safeguardingReferrals: [{ date: "2026-04-01", type: "cse", outcome, agencyInvolved: null }],
  });

  it("counts an unknown outcome as an active referral", () => {
    expect(analyseSafeguarding(withReferral("unknown")).activeSafeguardingReferrals).toBe(1);
    expect(analyseSafeguarding(withReferral("resolved")).activeSafeguardingReferrals).toBe(0);
  });

  it("says so, rather than letting the referral disappear", () => {
    const { concerns } = analyseSafeguarding(withReferral("unknown"));
    expect(concerns.some(c => /no recorded outcome/i.test(c.description))).toBe(true);
  });
});
