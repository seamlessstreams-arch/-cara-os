// ══════════════════════════════════════════════════════════════════════════════
// Tests — an unrecorded education status is neither NEET nor in education
//
// All eight education judgements defaulted to `true` in the read path, so a
// child with no education config row was reported as in education, on track,
// enjoying school, with an engaged Designated Teacher — and CHR 2015 Reg 8 met.
//
// The inverse is just as false: `inEducation` gates four scoring functions with
// `if (!input.inEducation) return 0`, so treating an unrecorded status as NEET
// would zero the child's attendance, progress and PEP scores and assert
// "statutory duty not met" about a child nobody had recorded.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { analyseEducation, type EducationInput } from "../education-intelligence";

function input(overrides: Partial<EducationInput> = {}): EducationInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    yearGroup: 10,
    schoolName: "Oak Academy",
    schoolType: "mainstream",
    inEducation: null,
    attendanceRecords: [],
    attendanceTrend: "stable",
    exclusions: [],
    pepRecords: [],
    pepDue: false,
    onTrackForTargets: null,
    progressRating: "expected",
    sendSupport: false,
    ehcpInPlace: false,
    designatedTeacherEngaged: null,
    virtualSchoolInvolved: null,
    tutoring: false,
    mentoring: false,
    ppPlusEffectivelyUsed: null,
    childEnjoysSChool: null,
    homeworkSupported: null,
    aspirationsDiscussed: null,
    careerGuidanceAccessed: false,
    postSixteenPlanInPlace: false,
    ...overrides,
  };
}

const flag = (a: ReturnType<typeof analyseEducation>, regulation: string) =>
  a.regulatoryFlags.find(f => f.regulation === regulation);

describe("an unrecorded education status", () => {
  it("does not report Reg 8 as met, and does not assert the duty is breached", () => {
    const reg8 = flag(analyseEducation(input()), "CHR 2015 Reg 8");
    expect(reg8?.status).toBe("not_evidenced");
    expect(reg8?.detail).toMatch(/no record/i);
  });

  it("does not claim the child is not in education", () => {
    const { concerns, recommendations } = analyseEducation(input());
    expect(concerns.some(c => c.description.startsWith("Child not in education"))).toBe(false);
    expect(recommendations.some(r => r.startsWith("URGENT: Secure education provision"))).toBe(false);
  });

  it("raises the recording gap instead", () => {
    const { concerns } = analyseEducation(input());
    expect(concerns.some(c => /not recorded/i.test(c.description))).toBe(true);
  });

  it("does not zero the scores that real data still supports", () => {
    // The unrecorded case must not be scored as NEET. A recorded NEET does zero
    // attendance and progress; an unrecorded status leaves them computed.
    const unrecorded = analyseEducation(input());
    const neet = analyseEducation(input({ inEducation: false }));
    expect(neet.attendanceScore).toBe(0);
    expect(unrecorded.attendanceScore).toBeGreaterThan(0);
  });

  it("claims no support strength it cannot evidence", () => {
    const { strengths } = analyseEducation(input());
    expect(strengths.some(s => s.category === "support")).toBe(false);
  });

  it("does not report Virtual School involvement as met", () => {
    expect(flag(analyseEducation(input()), "Children Act 1989 s22(3A)")?.status).toBe("not_evidenced");
  });
});

describe("recorded values still drive the assessment", () => {
  const recorded = (v: boolean) => input({
    inEducation: v, onTrackForTargets: v, designatedTeacherEngaged: v,
    virtualSchoolInvolved: v, ppPlusEffectivelyUsed: v, childEnjoysSChool: v,
    homeworkSupported: v, aspirationsDiscussed: v,
  });

  it("still reports the statutory breach when NEET was recorded", () => {
    const a = analyseEducation(recorded(false));
    expect(flag(a, "CHR 2015 Reg 8")?.status).toBe("not_met");
    expect(a.concerns.some(c => c.description.startsWith("Child not in education"))).toBe(true);
    expect(a.recommendations.some(r => r.startsWith("URGENT: Secure education provision"))).toBe(true);
  });

  it("still credits recorded support provisions", () => {
    expect(analyseEducation(recorded(true)).supportScore)
      .toBeGreaterThan(analyseEducation(input()).supportScore);
  });

  it("still reports Virtual School met when both were recorded", () => {
    expect(flag(analyseEducation(recorded(true)), "Children Act 1989 s22(3A)")?.status).toBe("met");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Activities — the same class on the activities card
// ══════════════════════════════════════════════════════════════════════════════

import { analyseActivities, type ActivityInput, type Activity } from "../activities-intelligence";

function activity(childChose: boolean | null, id = "a1"): Activity {
  return {
    id,
    date: "2026-05-01",
    name: "Football",
    category: "sport",
    duration: 60,
    childChose,
    childEngagement: "high",
    communityBased: true,
    peerInteraction: true,
    recurring: true,
    supervisedOnly: false,
  };
}

function activityInput(overrides: Partial<ActivityInput> = {}): ActivityInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    activities: [activity(null), activity(null, "a2")],
    hobbiesIdentified: null,
    interestsExplored: null,
    activityBudgetAvailable: null,
    memberOfClubOrGroup: true,
    attendsCommunityActivities: true,
    hasAchievementsRecorded: false,
    pocketMoneyForActivities: null,
    restrictedFromActivities: false,
    ...overrides,
  };
}

describe("an activity with no recorded choice is not a child-chosen activity", () => {
  it("does not count toward the child-choice rate", () => {
    expect(analyseActivities(activityInput()).childChoiceRate).toBe(0);
    expect(analyseActivities(activityInput({
      activities: [activity(true), activity(true, "a2")],
    })).childChoiceRate).toBe(1);
  });

  it("does not assert hobbies were never identified when nobody recorded it", () => {
    const { concerns } = analyseActivities(activityInput());
    expect(concerns.some(c => c.description.startsWith("Hobbies and interests not identified"))).toBe(false);
  });

  it("still raises the concern when it was recorded as absent", () => {
    const { concerns } = analyseActivities(activityInput({ hobbiesIdentified: false }));
    expect(concerns.some(c => c.description.startsWith("Hobbies and interests not identified"))).toBe(true);
  });

  it("does not assert there is no activity budget when nobody recorded it", () => {
    const { concerns } = analyseActivities(activityInput());
    expect(concerns.some(c => c.description.startsWith("No dedicated activity budget"))).toBe(false);
    const recorded = analyseActivities(activityInput({ activityBudgetAvailable: false }));
    expect(recorded.concerns.some(c => c.description.startsWith("No dedicated activity budget"))).toBe(true);
  });
});
