// ══════════════════════════════════════════════════════════════════════════════
// Children's Participation & Advocacy Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateChildParticipation,
  calculateHomeParticipationMetrics,
  getDecisionAreaLabel,
  getParticipationMethodLabel,
} from "../participation-engine";
import type { ChildParticipationProfile, HouseMeeting, FeedbackRecord, ParticipationEntry } from "../participation-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeEntries(): ParticipationEntry[] {
  return [
    { id: "pe-1", date: "2026-05-10T10:00:00Z", decisionArea: "care_plan", method: "review_meeting", childViews: "Wants more contact with mum", viewsActedUpon: true, outcome: "Extra weekly call arranged", recordedBy: "staff-rm-01" },
    { id: "pe-2", date: "2026-05-05T14:00:00Z", decisionArea: "activities", method: "verbal", childViews: "Would like to join football club", viewsActedUpon: true, outcome: "Signed up for local team", recordedBy: "staff-sw-01" },
    { id: "pe-3", date: "2026-04-28T10:00:00Z", decisionArea: "food_menu", method: "house_meeting", childViews: "Wants Friday pizza night", viewsActedUpon: true, outcome: "Added to menu rota", recordedBy: "staff-sw-02" },
    { id: "pe-4", date: "2026-04-20T14:00:00Z", decisionArea: "education", method: "keyworker", childViews: "Struggling with maths homework", viewsActedUpon: true, outcome: "Tutor referral made", recordedBy: "staff-sw-01" },
    { id: "pe-5", date: "2026-04-10T10:00:00Z", decisionArea: "daily_routine", method: "informal", childViews: "Wants later bedtime at weekends", viewsActedUpon: false, reasonIfNotActedUpon: "Risk assessment — current routine supports sleep needs", recordedBy: "staff-rm-01" },
  ];
}

function makeProfile(overrides: Partial<ChildParticipationProfile> = {}): ChildParticipationProfile {
  return {
    childId: "child-alex",
    childName: "Alex Turner",
    homeId: "home-oak",
    advocateOffered: true,
    advocateAccepted: true,
    advocateName: "Sue Peters (NYAS)",
    advocateLastVisit: "2026-04-15T10:00:00Z",
    complaintsProcessExplained: true,
    complaintsProcessDate: "2026-01-10T10:00:00Z",
    rightsExplained: true,
    rightsExplainedDate: "2026-01-10T10:00:00Z",
    childrenGuideGiven: true,
    preferredCommunicationMethod: "verbal",
    participationEntries: makeEntries(),
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<HouseMeeting> = {}): HouseMeeting {
  return {
    id: "hm-001",
    homeId: "home-oak",
    date: "2026-05-06T17:00:00Z",
    type: "house_meeting",
    attendees: ["Alex", "Jordan", "Sam", "staff-rm-01", "staff-sw-01"],
    childAttendees: ["Alex", "Jordan", "Sam"],
    totalChildrenInHome: 3,
    agendaItems: ["Weekend activities", "Food preferences", "House rules update"],
    childSuggestedItems: ["Movie night budget", "Garden trampoline"],
    actionsAgreed: [
      { action: "Research trampoline costs", assignedTo: "staff-rm-01", dueDate: "2026-05-13T10:00:00Z", completed: true },
      { action: "Plan movie night for Saturday", assignedTo: "staff-sw-01", dueDate: "2026-05-10T10:00:00Z", completed: true },
    ],
    minutesRecorded: true,
    chairPerson: "staff-rm-01",
    followUpFromPrevious: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Child Participation Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildParticipation", () => {
  it("marks compliant child with good participation", () => {
    const result = evaluateChildParticipation(makeProfile(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.advocacyAccessible).toBe(true);
    expect(result.complaintsAware).toBe(true);
    expect(result.rightsExplained).toBe(true);
    expect(result.participationScore).toBeGreaterThan(70);
  });

  it("flags advocacy not offered", () => {
    const profile = makeProfile({ advocateOffered: false });
    const result = evaluateChildParticipation(profile, NOW);
    expect(result.advocacyAccessible).toBe(false);
    expect(result.issues.some(i => i.includes("advocacy not offered"))).toBe(true);
  });

  it("flags complaints process not explained", () => {
    const profile = makeProfile({ complaintsProcessExplained: false });
    const result = evaluateChildParticipation(profile, NOW);
    expect(result.complaintsAware).toBe(false);
    expect(result.issues.some(i => i.includes("Complaints process"))).toBe(true);
  });

  it("flags rights not explained", () => {
    const profile = makeProfile({ rightsExplained: false });
    const result = evaluateChildParticipation(profile, NOW);
    expect(result.rightsExplained).toBe(false);
    expect(result.issues.some(i => i.includes("rights not explained"))).toBe(true);
  });

  it("flags no participation entries", () => {
    const profile = makeProfile({ participationEntries: [] });
    const result = evaluateChildParticipation(profile, NOW);
    expect(result.issues.some(i => i.includes("No recorded participation"))).toBe(true);
  });

  it("warns when no recent participation", () => {
    const profile = makeProfile({
      participationEntries: [
        { id: "pe-1", date: "2026-03-01T10:00:00Z", decisionArea: "care_plan", method: "verbal", childViews: "Test", viewsActedUpon: true, recordedBy: "staff-01" },
      ],
    });
    const result = evaluateChildParticipation(profile, NOW);
    expect(result.entriesLast30Days).toBe(0);
    expect(result.warnings.some(w => w.includes("No participation recorded in last 30 days"))).toBe(true);
  });

  it("calculates views acted upon rate", () => {
    const result = evaluateChildParticipation(makeProfile(), NOW);
    // 4 of 5 acted upon = 80%
    expect(result.viewsActedUponRate).toBe(80);
  });

  it("warns about low views-acted-upon rate", () => {
    const entries: ParticipationEntry[] = [
      { id: "pe-1", date: "2026-05-01T10:00:00Z", decisionArea: "care_plan", method: "verbal", childViews: "A", viewsActedUpon: false, recordedBy: "staff-01" },
      { id: "pe-2", date: "2026-05-02T10:00:00Z", decisionArea: "education", method: "verbal", childViews: "B", viewsActedUpon: false, recordedBy: "staff-01" },
      { id: "pe-3", date: "2026-05-03T10:00:00Z", decisionArea: "health", method: "verbal", childViews: "C", viewsActedUpon: true, recordedBy: "staff-01" },
    ];
    const profile = makeProfile({ participationEntries: entries });
    const result = evaluateChildParticipation(profile, NOW);
    expect(result.viewsActedUponRate).toBe(33);
    expect(result.warnings.some(w => w.includes("Low views-acted-upon rate"))).toBe(true);
  });

  it("identifies decision areas covered", () => {
    const result = evaluateChildParticipation(makeProfile(), NOW);
    expect(result.decisionsInvolved).toContain("care_plan");
    expect(result.decisionsInvolved).toContain("activities");
    expect(result.decisionsInvolved).toContain("education");
  });

  it("warns about children's guide not given", () => {
    const profile = makeProfile({ childrenGuideGiven: false });
    const result = evaluateChildParticipation(profile, NOW);
    expect(result.warnings.some(w => w.includes("Children's guide"))).toBe(true);
  });

  it("warns about advocate not visiting", () => {
    const profile = makeProfile({ advocateLastVisit: "2026-01-01T10:00:00Z" }); // >90 days
    const result = evaluateChildParticipation(profile, NOW);
    expect(result.warnings.some(w => w.includes("Advocate not visited"))).toBe(true);
  });

  it("calculates participation score correctly", () => {
    // Full score profile
    const result = evaluateChildParticipation(makeProfile(), NOW);
    expect(result.participationScore).toBe(100); // all factors met

    // Minimal profile
    const minimal = makeProfile({
      advocateOffered: false,
      complaintsProcessExplained: false,
      rightsExplained: false,
      childrenGuideGiven: false,
      preferredCommunicationMethod: undefined,
      participationEntries: [],
    });
    const minResult = evaluateChildParticipation(minimal, NOW);
    expect(minResult.participationScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeParticipationMetrics", () => {
  it("calculates metrics for well-performing home", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex" }),
      makeProfile({ childId: "c2", childName: "Jordan" }),
    ];
    const meetings = [
      makeMeeting({ id: "m1", date: "2026-05-06T17:00:00Z" }),
      makeMeeting({ id: "m2", date: "2026-04-22T17:00:00Z" }),
      makeMeeting({ id: "m3", date: "2026-04-08T17:00:00Z" }),
      makeMeeting({ id: "m4", date: "2026-03-25T17:00:00Z" }),
    ];
    const result = calculateHomeParticipationMetrics(profiles, meetings, [], "home-oak", NOW);
    expect(result.childCount).toBe(2);
    expect(result.overallParticipationScore).toBe(100);
    expect(result.advocacyAccessRate).toBe(100);
    expect(result.houseMeetingFrequency).toBeGreaterThan(1);
  });

  it("calculates meeting attendance rate", () => {
    const meetings = [
      makeMeeting({ id: "m1", childAttendees: ["Alex", "Jordan"], totalChildrenInHome: 3 }), // 2/3
      makeMeeting({ id: "m2", childAttendees: ["Alex", "Jordan", "Sam"], totalChildrenInHome: 3 }), // 3/3
    ];
    const result = calculateHomeParticipationMetrics([makeProfile()], meetings, [], "home-oak", NOW);
    expect(result.houseMeetingAttendanceRate).toBe(83); // 5/6
  });

  it("calculates action completion rate", () => {
    const meetings = [
      makeMeeting({
        id: "m1",
        actionsAgreed: [
          { action: "A", assignedTo: "staff", dueDate: "2026-05-10", completed: true },
          { action: "B", assignedTo: "staff", dueDate: "2026-05-10", completed: false },
        ],
      }),
    ];
    const result = calculateHomeParticipationMetrics([makeProfile()], meetings, [], "home-oak", NOW);
    expect(result.actionCompletionRate).toBe(50);
  });

  it("calculates feedback acknowledgement rate", () => {
    const feedback: FeedbackRecord[] = [
      { id: "f1", homeId: "home-oak", childId: "c1", date: "2026-05-10T10:00:00Z", type: "suggestion", content: "More trips", acknowledged: true, anonymous: false },
      { id: "f2", homeId: "home-oak", childId: "c2", date: "2026-05-08T10:00:00Z", type: "concern", content: "WiFi slow", acknowledged: false, anonymous: true },
    ];
    const result = calculateHomeParticipationMetrics([makeProfile()], [], feedback, "home-oak", NOW);
    expect(result.feedbackCount30Days).toBe(2);
    expect(result.feedbackAcknowledgedRate).toBe(50);
  });

  it("identifies children with issues", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex" }),
      makeProfile({ childId: "c2", childName: "Jordan", advocateOffered: false, complaintsProcessExplained: false }),
    ];
    const result = calculateHomeParticipationMetrics(profiles, [], [], "home-oak", NOW);
    expect(result.childrenWithIssues.length).toBe(1);
    expect(result.childrenWithIssues[0].childName).toBe("Jordan");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getDecisionAreaLabel returns readable labels", () => {
    expect(getDecisionAreaLabel("care_plan")).toBe("Care Plan");
    expect(getDecisionAreaLabel("matching_new_child")).toBe("New Admissions");
  });

  it("getParticipationMethodLabel returns readable labels", () => {
    expect(getParticipationMethodLabel("house_meeting")).toBe("House Meeting");
    expect(getParticipationMethodLabel("advocate")).toBe("Via Advocate");
  });
});
