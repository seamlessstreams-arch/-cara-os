// ══════════════════════════════════════════════════════════════════════════════
// Tests — absence is not assurance, and it is not a risk signal either
//
// Complaints defaulted `acknowledgedWithin24Hours`, `investigatedProperly` and
// `childKeptInformed` to `true`, so a complaint nobody had processed satisfied
// CHR 2015 Reg 39. Placement stability is the same class with a second face:
//
//   if (!input.childWantsToStay) points += 2;   // risk score
//   if (!input.childWantsToStay) score -= 15;   // stability score
//
// A child who has never been asked whether they want to stay is not a child who
// said no. Making the field nullable without fixing these would have converted
// a false green into a false red.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyseComplaints,
  type ComplaintsInput,
  type Complaint,
} from "../complaints-intelligence";
import {
  analysePlacementStability,
  type PlacementStabilityInput,
} from "../placement-stability-intelligence";

function complaint(v: boolean | null, id = "c1"): Complaint {
  return {
    id,
    date: "2026-05-01",
    category: "privacy",
    description: "Concern raised",
    status: "resolved",
    resolvedDate: "2026-05-10",
    resolutionDays: 9,
    acknowledgedWithin24Hours: v,
    investigatedProperly: v,
    childKeptInformed: v,
    escalationLevel: "internal",
    advocateInvolved: false,
    madeBy: "child",
  };
}

function complaintsInput(overrides: Partial<ComplaintsInput> = {}): ComplaintsInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    complaints: [],
    complaintsProcessExplained: null,
    childKnowsHowToComplain: null,
    advocateAvailable: null,
    complaintsDisplayedAccessibly: null,
    independentVisitorAssigned: false,
    regulatoryBodyInfoProvided: null,
    complaintsReviewedByRM: null,
    ...overrides,
  };
}

const reg39 = (a: ReturnType<typeof analyseComplaints>) =>
  a.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 39");

describe("a complaint nobody processed is not a complaint handled well", () => {
  it("does not report Reg 39 as met", () => {
    const a = analyseComplaints(complaintsInput({ complaints: [complaint(null)] }));
    expect(reg39(a)?.status).toBe("not_evidenced");
    expect(reg39(a)?.detail).toMatch(/unrecorded/i);
  });

  it("does not claim every complaint was acknowledged in time", () => {
    const { strengths } = analyseComplaints(complaintsInput({ complaints: [complaint(null)] }));
    expect(strengths.some(s => /acknowledged/i.test(s.description))).toBe(false);
  });

  it("does not count it as a failure to acknowledge either", () => {
    const { concerns } = analyseComplaints(complaintsInput({ complaints: [complaint(null)] }));
    expect(concerns.some(c => /not acknowledged/i.test(c.description))).toBe(false);
  });

  it("still reports met when handling was recorded", () => {
    expect(reg39(analyseComplaints(complaintsInput({ complaints: [complaint(true)] })))?.status).toBe("met");
  });

  it("still penalises a recorded failure", () => {
    const bad = analyseComplaints(complaintsInput({ complaints: [complaint(false)] }));
    const good = analyseComplaints(complaintsInput({ complaints: [complaint(true)] }));
    expect(bad.responsivenessScore!).toBeLessThan(good.responsivenessScore!);
  });
});

function placementInput(overrides: Partial<PlacementStabilityInput> = {}): PlacementStabilityInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    currentPlacementStartDate: "2026-01-01",
    currentPlacementDays: 200,
    placementHistory: [],
    totalPlacementsEver: 1,
    disruptionIndicators: [],
    indicatorTrend: "stable",
    incidentsLast30Days: 0,
    incidentsTrend: "stable",
    missingEpisodesLast30Days: 0,
    childFeelsSettled: null,
    childWantsToStay: null,
    childHasRoomPersonalised: null,
    regularRoutineEstablished: null,
    positiveStaffRelationships: null,
    peerRelationshipsGood: null,
    placementReviewCurrent: null,
    matchingAssessmentDone: null,
    impactRiskAssessmentDone: null,
    contingencyPlanInPlace: null,
    stayingPutOptionExplored: false,
    ...overrides,
  };
}

describe("a child who was never asked is not a child who said no", () => {
  it("adds no disruption risk for an unrecorded wish to stay", () => {
    const unrecorded = analysePlacementStability(placementInput());
    const wantsToStay = analysePlacementStability(placementInput({ childWantsToStay: true }));
    expect(unrecorded.disruptionRiskLevel).toBe(wantsToStay.disruptionRiskLevel);
  });

  it("still adds risk when the child recorded that they want to leave", () => {
    // The deduction lands in the disruption-risk score, not the stability score.
    const saidNo = analysePlacementStability(placementInput({ childWantsToStay: false }));
    const unrecorded = analysePlacementStability(placementInput());
    const wantsToStay = analysePlacementStability(placementInput({ childWantsToStay: true }));
    expect(saidNo.disruptionRiskScore).toBeLessThan(unrecorded.disruptionRiskScore);
    expect(unrecorded.disruptionRiskScore).toBe(wantsToStay.disruptionRiskScore);
  });

  it("does not assert the child wants to leave in the concerns", () => {
    const { concerns } = analysePlacementStability(placementInput());
    expect(concerns.some(c => /want/i.test(c.description) && /leave|stay/i.test(c.description))).toBe(false);
  });

  it("does not report the matching assessment as done or as missing", () => {
    const flag = analysePlacementStability(placementInput())
      .regulatoryFlags.find(f => /matching/i.test(f.area));
    expect(flag?.status).toBe("not_evidenced");
  });

  it("still reports the matching assessment met when it was recorded", () => {
    const flag = analysePlacementStability(placementInput({ matchingAssessmentDone: true }))
      .regulatoryFlags.find(f => /matching/i.test(f.area));
    expect(flag?.status).toBe("met");
  });
});
