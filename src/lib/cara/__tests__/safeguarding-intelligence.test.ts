// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cara Safeguarding Intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  analyseSafeguarding,
  type SafeguardingInput,
  type MissingEpisode,
  type RestraintIncident,
  type BullyingIncident,
  type SafeguardingReferral,
} from "../safeguarding-intelligence";

const FIXED_NOW = "2026-05-16T12:00:00Z";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
afterEach(() => { vi.useRealTimers(); });

// ── Helpers ────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<SafeguardingInput> = {}): SafeguardingInput {
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
    riskAssessmentCurrent: true,
    safeguardingPlanInPlace: true,
    locationRiskAssessmentDone: true,
    childAwareOfRisks: true,
    onlineSafetyPlanInPlace: true,
    antibullyingPolicyShared: true,
    restraintPolicyShared: true,
    independentReturnInterviews: true,
    staffSafeguardingTrained: true,
    designatedSafeguardingLead: true,
    localaSafeguardingContactKnown: true,
    childKnowsHowToComplain: true,
    regularSafeguardingAudits: true,
    ...overrides,
  };
}

function makeMissing(overrides: Partial<MissingEpisode> = {}): MissingEpisode {
  return {
    date: "2026-04-01",
    durationHours: 4,
    severity: "missing",
    returnInterviewCompleted: true,
    returnInterviewWithin72Hours: true,
    policeInvolved: false,
    triggerIdentified: true,
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<RestraintIncident> = {}): RestraintIncident {
  return {
    date: "2026-04-01",
    type: "physical",
    durationMinutes: 5,
    debrief: true,
    injuryToChild: false,
    injuryToStaff: false,
    ofstedNotified: true,
    ...overrides,
  };
}

function makeBullying(overrides: Partial<BullyingIncident> = {}): BullyingIncident {
  return {
    date: "2026-04-01",
    role: "victim",
    type: "verbal",
    actionTaken: true,
    resolved: true,
    ...overrides,
  };
}

function makeReferral(overrides: Partial<SafeguardingReferral> = {}): SafeguardingReferral {
  return {
    date: "2026-03-01",
    type: "other",
    outcome: "resolved",
    agencyInvolved: "Local Authority",
    ...overrides,
  };
}

// ── Overall Structure ──────────────────────────────────────────────────────

describe("analyseSafeguarding", () => {
  it("returns all required fields", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result).toHaveProperty("childName");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("overallRating");
    expect(result).toHaveProperty("missingScore");
    expect(result).toHaveProperty("restraintScore");
    expect(result).toHaveProperty("protectionScore");
    expect(result).toHaveProperty("complianceScore");
    expect(result).toHaveProperty("missingEpisodeCount");
    expect(result).toHaveProperty("missingAvgDurationHours");
    expect(result).toHaveProperty("returnInterviewRate");
    expect(result).toHaveProperty("restraintCount");
    expect(result).toHaveProperty("restraintDebriefRate");
    expect(result).toHaveProperty("bullyingCount");
    expect(result).toHaveProperty("activeSafeguardingReferrals");
    expect(result).toHaveProperty("highestExploitationRisk");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("regulatoryFlags");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("summary");
  });

  it("uses childName from input", () => {
    const result = analyseSafeguarding(makeInput({ childName: "Sam" }));
    expect(result.childName).toBe("Sam");
  });

  it("scores 0-100", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});

// ── Rating Mapping ─────────────────────────────────────────────────────────

describe("overallRating", () => {
  it("returns excellent for no concerns and full compliance", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.overallRating).toBe("excellent");
  });

  it("returns lower rating with significant issues", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
      ],
      restraintIncidents: [
        makeRestraint({ debrief: false, injuryToChild: true, ofstedNotified: false }),
        makeRestraint({ debrief: false, injuryToChild: true, ofstedNotified: false }),
        makeRestraint({ debrief: false, ofstedNotified: false }),
        makeRestraint({ debrief: false, ofstedNotified: false }),
        makeRestraint({ debrief: false, ofstedNotified: false }),
      ],
      missingTrend: "increasing",
      restraintTrend: "increasing",
      cseRiskLevel: "high",
      riskAssessmentCurrent: false,
      safeguardingPlanInPlace: false,
      staffSafeguardingTrained: false,
      designatedSafeguardingLead: false,
    }));
    expect(["requires_improvement", "inadequate"]).toContain(result.overallRating);
  });
});

// ── Missing Scores ─────────────────────────────────────────────────────────

describe("missingScore", () => {
  it("returns 100 with no missing episodes", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.missingScore).toBe(100);
  });

  it("is lower with missing episodes", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing(), makeMissing()],
    }));
    expect(result.missingScore).toBeLessThan(100);
  });

  it("penalises 5+ missing episodes heavily", () => {
    const few = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing()],
    }));
    const many = analyseSafeguarding(makeInput({
      missingEpisodes: Array.from({ length: 5 }, () => makeMissing()),
    }));
    expect(many.missingScore).toBeLessThan(few.missingScore);
  });

  it("penalises long duration episodes", () => {
    const short = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing({ durationHours: 2 })],
    }));
    const long = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing({ durationHours: 30 })],
    }));
    expect(long.missingScore).toBeLessThan(short.missingScore);
  });

  it("rewards decreasing trend", () => {
    const stable = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing()],
      missingTrend: "stable",
    }));
    const decreasing = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing()],
      missingTrend: "decreasing",
    }));
    expect(decreasing.missingScore).toBeGreaterThan(stable.missingScore);
  });

  it("penalises increasing trend", () => {
    const stable = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing()],
      missingTrend: "stable",
    }));
    const increasing = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing()],
      missingTrend: "increasing",
    }));
    expect(increasing.missingScore).toBeLessThan(stable.missingScore);
  });

  it("rewards completed return interviews", () => {
    const done = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing({ returnInterviewCompleted: true })],
    }));
    const notDone = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing({ returnInterviewCompleted: false })],
    }));
    expect(done.missingScore).toBeGreaterThan(notDone.missingScore);
  });
});

// ── Return Interview Metrics ───────────────────────────────────────────────

describe("returnInterviewRate", () => {
  it("is 1 when no missing episodes", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.returnInterviewRate).toBe(1);
  });

  it("is 1 when all return interviews completed", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [
        makeMissing({ returnInterviewCompleted: true }),
        makeMissing({ returnInterviewCompleted: true }),
      ],
    }));
    expect(result.returnInterviewRate).toBe(1);
  });

  it("is 0.5 when half completed", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [
        makeMissing({ returnInterviewCompleted: true }),
        makeMissing({ returnInterviewCompleted: false }),
      ],
    }));
    expect(result.returnInterviewRate).toBe(0.5);
  });

  it("is 0 when none completed", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
      ],
    }));
    expect(result.returnInterviewRate).toBe(0);
  });
});

// ── Restraint Scores ───────────────────────────────────────────────────────

describe("restraintScore", () => {
  it("returns 100 with no restraint", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.restraintScore).toBe(100);
  });

  it("is lower with restraint incidents", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint()],
    }));
    expect(result.restraintScore).toBeLessThan(100);
  });

  it("penalises child injuries severely", () => {
    const noInjury = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ injuryToChild: false })],
    }));
    const injury = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ injuryToChild: true })],
    }));
    expect(injury.restraintScore).toBeLessThan(noInjury.restraintScore);
  });

  it("rewards full debrief compliance", () => {
    const debriefed = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ debrief: true })],
    }));
    const notDebriefed = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ debrief: false })],
    }));
    expect(debriefed.restraintScore).toBeGreaterThan(notDebriefed.restraintScore);
  });

  it("penalises increasing restraint trend", () => {
    const stable = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint()],
      restraintTrend: "stable",
    }));
    const increasing = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint()],
      restraintTrend: "increasing",
    }));
    expect(increasing.restraintScore).toBeLessThan(stable.restraintScore);
  });

  it("rewards decreasing restraint trend", () => {
    const stable = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint()],
      restraintTrend: "stable",
    }));
    const decreasing = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint()],
      restraintTrend: "decreasing",
    }));
    expect(decreasing.restraintScore).toBeGreaterThan(stable.restraintScore);
  });

  it("penalises missing Ofsted notifications", () => {
    const notified = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ ofstedNotified: true })],
    }));
    const notNotified = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ ofstedNotified: false })],
    }));
    expect(notNotified.restraintScore).toBeLessThan(notified.restraintScore);
  });
});

// ── Restraint Debrief Rate ─────────────────────────────────────────────────

describe("restraintDebriefRate", () => {
  it("is 1 when no restraint", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.restraintDebriefRate).toBe(1);
  });

  it("is 1 when all debriefed", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ debrief: true }), makeRestraint({ debrief: true })],
    }));
    expect(result.restraintDebriefRate).toBe(1);
  });

  it("calculates correctly for partial debrief", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ debrief: true }), makeRestraint({ debrief: false })],
    }));
    expect(result.restraintDebriefRate).toBe(0.5);
  });
});

// ── Protection Score ───────────────────────────────────────────────────────

describe("protectionScore", () => {
  it("is high with no exploitation risk and provisions in place", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.protectionScore).toBeGreaterThanOrEqual(85);
  });

  it("is lower with high exploitation risk", () => {
    const noRisk = analyseSafeguarding(makeInput());
    const highRisk = analyseSafeguarding(makeInput({ cseRiskLevel: "high" }));
    expect(highRisk.protectionScore).toBeLessThan(noRisk.protectionScore);
  });

  it("is lower without risk assessment", () => {
    const withRA = analyseSafeguarding(makeInput());
    const withoutRA = analyseSafeguarding(makeInput({ riskAssessmentCurrent: false }));
    expect(withoutRA.protectionScore).toBeLessThan(withRA.protectionScore);
  });

  it("is lower without safeguarding plan", () => {
    const with_ = analyseSafeguarding(makeInput());
    const without_ = analyseSafeguarding(makeInput({ safeguardingPlanInPlace: false }));
    expect(without_.protectionScore).toBeLessThan(with_.protectionScore);
  });

  it("penalises unresolved bullying", () => {
    const noBullying = analyseSafeguarding(makeInput());
    const unresolvedBullying = analyseSafeguarding(makeInput({
      bullyingIncidents: [makeBullying({ resolved: false }), makeBullying({ resolved: false })],
    }));
    expect(unresolvedBullying.protectionScore).toBeLessThan(noBullying.protectionScore);
  });
});

// ── Compliance Score ───────────────────────────────────────────────────────

describe("complianceScore", () => {
  it("is 100 with all provisions in place", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.complianceScore).toBe(100);
  });

  it("drops when staff not safeguarding trained", () => {
    const trained = analyseSafeguarding(makeInput());
    const untrained = analyseSafeguarding(makeInput({ staffSafeguardingTrained: false }));
    expect(untrained.complianceScore).toBeLessThan(trained.complianceScore);
  });

  it("drops without designated safeguarding lead", () => {
    const with_ = analyseSafeguarding(makeInput());
    const without_ = analyseSafeguarding(makeInput({ designatedSafeguardingLead: false }));
    expect(without_.complianceScore).toBeLessThan(with_.complianceScore);
  });

  it("drops without child knowing how to complain", () => {
    const with_ = analyseSafeguarding(makeInput());
    const without_ = analyseSafeguarding(makeInput({ childKnowsHowToComplain: false }));
    expect(without_.complianceScore).toBeLessThan(with_.complianceScore);
  });

  it("drops without independent return interviews", () => {
    const with_ = analyseSafeguarding(makeInput());
    const without_ = analyseSafeguarding(makeInput({ independentReturnInterviews: false }));
    expect(without_.complianceScore).toBeLessThan(with_.complianceScore);
  });
});

// ── Key Metrics ────────────────────────────────────────────────────────────

describe("key metrics", () => {
  it("counts missing episodes correctly", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing(), makeMissing(), makeMissing()],
    }));
    expect(result.missingEpisodeCount).toBe(3);
  });

  it("calculates avg missing duration", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [
        makeMissing({ durationHours: 4 }),
        makeMissing({ durationHours: 8 }),
      ],
    }));
    expect(result.missingAvgDurationHours).toBe(6);
  });

  it("counts restraints correctly", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint(), makeRestraint()],
    }));
    expect(result.restraintCount).toBe(2);
  });

  it("counts bullying correctly", () => {
    const result = analyseSafeguarding(makeInput({
      bullyingIncidents: [makeBullying(), makeBullying()],
    }));
    expect(result.bullyingCount).toBe(2);
  });

  it("counts active safeguarding referrals", () => {
    const result = analyseSafeguarding(makeInput({
      safeguardingReferrals: [
        makeReferral({ outcome: "ongoing" }),
        makeReferral({ outcome: "resolved" }),
        makeReferral({ outcome: "escalated" }),
      ],
    }));
    expect(result.activeSafeguardingReferrals).toBe(2);
  });

  it("identifies highest exploitation risk", () => {
    const result = analyseSafeguarding(makeInput({
      cseRiskLevel: "low",
      cceRiskLevel: "high",
      radicalisationRiskLevel: "none",
    }));
    expect(result.highestExploitationRisk).toBe("high");
  });

  it("returns none when no exploitation risks", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.highestExploitationRisk).toBe("none");
  });
});

// ── Concerns ───────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("raises critical for 5+ missing episodes", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: Array.from({ length: 5 }, () => makeMissing()),
    }));
    const c = result.concerns.find(c => c.category === "missing");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("raises significant for 3+ missing episodes", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing(), makeMissing(), makeMissing()],
    }));
    const c = result.concerns.find(c => c.category === "missing");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("significant");
  });

  it("raises concern for incomplete return interviews", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
      ],
    }));
    const c = result.concerns.find(c => c.category === "return_interviews");
    expect(c).toBeDefined();
  });

  it("raises critical for 5+ restraints", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: Array.from({ length: 5 }, () => makeRestraint()),
    }));
    const c = result.concerns.find(c => c.category === "restraint");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("raises concern for restraint debriefs not completed", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ debrief: false })],
    }));
    const c = result.concerns.find(c => c.category === "debrief");
    expect(c).toBeDefined();
  });

  it("raises critical for child injury from restraint", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ injuryToChild: true })],
    }));
    const c = result.concerns.find(c => c.category === "restraint_injury");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("raises critical for high exploitation risk", () => {
    const result = analyseSafeguarding(makeInput({ cseRiskLevel: "high" }));
    const c = result.concerns.find(c => c.category === "exploitation");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("raises significant for medium exploitation risk", () => {
    const result = analyseSafeguarding(makeInput({ cceRiskLevel: "medium" }));
    const c = result.concerns.find(c => c.category === "exploitation");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("significant");
  });

  it("raises concern for high online safety risk", () => {
    const result = analyseSafeguarding(makeInput({ onlineSafetyRiskLevel: "high" }));
    const c = result.concerns.find(c => c.category === "online_safety");
    expect(c).toBeDefined();
  });

  it("raises concern for unresolved bullying", () => {
    const result = analyseSafeguarding(makeInput({
      bullyingIncidents: [makeBullying({ resolved: false })],
    }));
    const c = result.concerns.find(c => c.category === "bullying");
    expect(c).toBeDefined();
  });

  it("raises concern for risk assessment not current", () => {
    const result = analyseSafeguarding(makeInput({ riskAssessmentCurrent: false }));
    const c = result.concerns.find(c => c.category === "assessment");
    expect(c).toBeDefined();
  });

  it("raises critical when active referral but no safeguarding plan", () => {
    const result = analyseSafeguarding(makeInput({
      safeguardingReferrals: [makeReferral({ outcome: "ongoing" })],
      safeguardingPlanInPlace: false,
    }));
    const c = result.concerns.find(c => c.category === "planning");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("returns no concerns for clean child", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.concerns).toHaveLength(0);
  });
});

// ── Strengths ──────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("includes no missing for clean record", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.strengths.some(s => s.category === "missing")).toBe(true);
  });

  it("includes no restraint for clean record", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.strengths.some(s => s.category === "restraint")).toBe(true);
  });

  it("includes no bullying for clean record", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.strengths.some(s => s.category === "bullying")).toBe(true);
  });

  it("includes no exploitation risks", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.strengths.some(s => s.category === "exploitation")).toBe(true);
  });

  it("includes staff trained", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.strengths.some(s => s.category === "compliance")).toBe(true);
  });

  it("includes child empowerment", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.strengths.some(s => s.category === "empowerment")).toBe(true);
  });

  it("includes decreasing missing as strength", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing()],
      missingTrend: "decreasing",
    }));
    const s = result.strengths.find(s => s.category === "missing");
    expect(s).toBeDefined();
    expect(s!.description).toContain("decreasing");
  });
});

// ── Regulatory Flags ───────────────────────────────────────────────────────

describe("regulatoryFlags", () => {
  it("Reg 12 met when all in place", () => {
    const result = analyseSafeguarding(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Child Protection");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("Reg 12 not met without risk assessment and plan", () => {
    const result = analyseSafeguarding(makeInput({
      riskAssessmentCurrent: false,
      safeguardingPlanInPlace: false,
      staffSafeguardingTrained: false,
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Child Protection");
    expect(f).toBeDefined();
    expect(f!.status).toBe("not_met");
  });

  it("Reg 35 met with no restraint", () => {
    const result = analyseSafeguarding(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Restraint");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("Reg 35 not met with restraint and no debrief", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ debrief: false })],
      restraintPolicyShared: false,
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Restraint");
    expect(f).toBeDefined();
    expect(f!.status).toBe("not_met");
  });

  it("Missing compliance met when all return interviews done independently", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing({ returnInterviewCompleted: true })],
      independentReturnInterviews: true,
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Return Interviews");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("Missing compliance not met with poor return interview rate", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
        makeMissing({ returnInterviewCompleted: false }),
      ],
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Return Interviews");
    expect(f).toBeDefined();
    expect(f!.status).toBe("not_met");
  });

  it("SCCIF safety met for clean record", () => {
    const result = analyseSafeguarding(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Children Are Safe");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("SCCIF safety not met with many issues", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: Array.from({ length: 5 }, () => makeMissing()),
      restraintIncidents: Array.from({ length: 5 }, () => makeRestraint()),
      cseRiskLevel: "high",
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Children Are Safe");
    expect(f).toBeDefined();
    expect(f!.status).not.toBe("met");
  });

  it("Reg 40 Ofsted notifications met when all reported", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ ofstedNotified: true })],
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Ofsted Notifications");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("Reg 40 not met when restraint not notified", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ ofstedNotified: false })],
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Ofsted Notifications");
    expect(f).toBeDefined();
    expect(f!.status).toBe("not_met");
  });
});

// ── Recommendations ────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("returns empty for clean record", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.recommendations).toHaveLength(0);
  });

  it("recommends multi-agency for repeat missing", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: Array.from({ length: 3 }, () => makeMissing()),
    }));
    expect(result.recommendations.some(r => r.includes("multi-agency"))).toBe(true);
  });

  it("recommends completing return interviews", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing({ returnInterviewCompleted: false })],
    }));
    expect(result.recommendations.some(r => r.toLowerCase().includes("return interview"))).toBe(true);
  });

  it("recommends independent return interviews", () => {
    const result = analyseSafeguarding(makeInput({
      missingEpisodes: [makeMissing()],
      independentReturnInterviews: false,
    }));
    expect(result.recommendations.some(r => r.includes("independent"))).toBe(true);
  });

  it("recommends behaviour review for repeat restraint", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: Array.from({ length: 3 }, () => makeRestraint()),
    }));
    expect(result.recommendations.some(r => r.includes("behaviour support") || r.includes("de-escalation"))).toBe(true);
  });

  it("recommends Ofsted notification", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ ofstedNotified: false })],
    }));
    expect(result.recommendations.some(r => r.includes("Ofsted") || r.includes("Reg 40"))).toBe(true);
  });

  it("URGENT recommendation for child injury", () => {
    const result = analyseSafeguarding(makeInput({
      restraintIncidents: [makeRestraint({ injuryToChild: true })],
    }));
    expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
  });

  it("recommends multi-agency exploitation response for high risk", () => {
    const result = analyseSafeguarding(makeInput({ cceRiskLevel: "high" }));
    expect(result.recommendations.some(r => r.includes("URGENT") && r.includes("exploitation"))).toBe(true);
  });

  it("recommends online safety plan when not in place", () => {
    const result = analyseSafeguarding(makeInput({ onlineSafetyPlanInPlace: false }));
    expect(result.recommendations.some(r => r.toLowerCase().includes("online safety"))).toBe(true);
  });

  it("recommends safeguarding training", () => {
    const result = analyseSafeguarding(makeInput({ staffSafeguardingTrained: false }));
    expect(result.recommendations.some(r => r.includes("safeguarding training"))).toBe(true);
  });

  it("recommends DSL appointment", () => {
    const result = analyseSafeguarding(makeInput({ designatedSafeguardingLead: false }));
    expect(result.recommendations.some(r => r.includes("safeguarding lead"))).toBe(true);
  });
});

// ── Summary ────────────────────────────────────────────────────────────────

describe("summary", () => {
  it("includes child name", () => {
    const result = analyseSafeguarding(makeInput({ childName: "Sam" }));
    expect(result.summary).toContain("Sam");
  });

  it("includes rating", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.summary).toContain("excellent");
  });

  it("mentions no missing when clean", () => {
    const result = analyseSafeguarding(makeInput());
    expect(result.summary).toContain("no missing");
  });

  it("mentions exploitation risk when present", () => {
    const result = analyseSafeguarding(makeInput({ cseRiskLevel: "medium" }));
    expect(result.summary).toContain("exploitation risk");
  });
});
