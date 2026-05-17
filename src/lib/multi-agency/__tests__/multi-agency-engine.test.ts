// ══════════════════════════════════════════════════════════════════════════════
// Multi-Agency Working Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMultiAgencyCompliance,
  calculateHomeMultiAgencyMetrics,
  getAgencyTypeLabel,
  getMeetingTypeLabel,
} from "../multi-agency-engine";
import type {
  ChildMultiAgencyProfile,
  ProfessionalContact,
  MultiAgencyMeeting,
  Referral,
} from "../multi-agency-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeProfessional(overrides: Partial<ProfessionalContact> = {}): ProfessionalContact {
  return {
    id: "prof-001",
    childId: "child-alex",
    agencyType: "placing_authority",
    agencyName: "Anyshire County Council",
    professionalName: "Jane Smith",
    role: "Social Worker",
    communicationStatus: "active",
    lastContactDate: "2026-05-10T10:00:00Z",
    lastContactMethod: "Phone call",
    responseTimeDays: 2,
    keyContact: true,
    escalationNeeded: false,
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<MultiAgencyMeeting> = {}): MultiAgencyMeeting {
  return {
    id: "mtg-001",
    childId: "child-alex",
    meetingType: "lac_review",
    date: "2026-04-15T10:00:00Z",
    attendedByHome: true,
    homeRepresentative: "Darren Laville (RM)",
    childAttended: true,
    childViewsSubmitted: true,
    agenciesPresent: ["placing_authority", "education", "iro"],
    agenciesAbsent: [],
    actionsForHome: 3,
    actionsCompleted: 3,
    minutesReceived: true,
    minutesReceivedDate: "2026-04-20T10:00:00Z",
    outcome: "Placement stable, education progress noted",
    ...overrides,
  };
}

function makeReferral(overrides: Partial<Referral> = {}): Referral {
  return {
    id: "ref-001",
    childId: "child-alex",
    agencyType: "camhs",
    referredTo: "Anyshire CAMHS",
    referralDate: "2026-03-01T10:00:00Z",
    status: "active",
    waitingDays: 0,
    urgency: "routine",
    escalated: false,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildMultiAgencyProfile> = {}): ChildMultiAgencyProfile {
  return {
    childId: "child-alex",
    childName: "Alex",
    homeId: "home-oak",
    placingAuthority: "Anyshire County Council",
    professionals: [
      makeProfessional({ id: "p1", agencyType: "placing_authority" }),
      makeProfessional({ id: "p2", agencyType: "education", professionalName: "Mrs Jones", role: "Form Tutor", agencyName: "Oakville Academy" }),
      makeProfessional({ id: "p3", agencyType: "health_gp", professionalName: "Dr Patel", role: "GP", agencyName: "Oakville Surgery" }),
      makeProfessional({ id: "p4", agencyType: "iro", professionalName: "Sarah Green", role: "IRO", agencyName: "Anyshire CC" }),
      makeProfessional({ id: "p5", agencyType: "camhs", professionalName: "Dr Ahmed", role: "Clinical Psychologist", agencyName: "Anyshire CAMHS" }),
    ],
    meetings: [
      makeMeeting({ id: "m1", meetingType: "lac_review", date: "2026-04-15T10:00:00Z" }),
      makeMeeting({ id: "m2", meetingType: "pep_meeting", date: "2026-03-20T10:00:00Z" }),
      makeMeeting({ id: "m3", meetingType: "professionals_meeting", date: "2026-02-10T10:00:00Z" }),
    ],
    referrals: [
      makeReferral({ id: "r1", status: "active" }),
    ],
    lastSWVisitDate: "2026-05-05T10:00:00Z",
    swVisitFrequencyWeeks: 4,
    lastSWPhoneContact: "2026-05-12T10:00:00Z",
    childHasAdvocate: true,
    childViewsRoutinelyShared: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMultiAgencyCompliance", () => {
  it("marks compliant child with good network", () => {
    const result = evaluateMultiAgencyCompliance(makeProfile(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.totalProfessionals).toBe(5);
    expect(result.agencyTypesEngaged).toBe(5);
    expect(result.communicationScore).toBe(100);
    expect(result.swContactCurrent).toBe(true);
  });

  it("flags empty professional network", () => {
    const profile = makeProfile({ professionals: [] });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.issues.some(i => i.includes("No professional network"))).toBe(true);
  });

  it("flags missing placing authority SW", () => {
    const profile = makeProfile({
      professionals: [
        makeProfessional({ id: "p1", agencyType: "education" }),
      ],
    });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.issues.some(i => i.includes("placing authority"))).toBe(true);
  });

  it("warns about unresponsive contacts", () => {
    const profile = makeProfile({
      professionals: [
        makeProfessional({ id: "p1", agencyType: "placing_authority" }),
        makeProfessional({ id: "p2", agencyType: "camhs", communicationStatus: "unresponsive" }),
        makeProfessional({ id: "p3", agencyType: "education", communicationStatus: "escalated" }),
      ],
    });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.unresponsiveContacts).toBe(2);
    expect(result.warnings.some(w => w.includes("unresponsive"))).toBe(true);
  });

  it("flags high average response time", () => {
    const profile = makeProfile({
      professionals: [
        makeProfessional({ id: "p1", responseTimeDays: 20 }),
        makeProfessional({ id: "p2", responseTimeDays: 18, agencyType: "education" }),
      ],
    });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.averageResponseDays).toBe(19);
    expect(result.issues.some(i => i.includes("response time"))).toBe(true);
  });

  it("flags overdue SW visit", () => {
    const profile = makeProfile({ lastSWVisitDate: "2026-03-01T10:00:00Z" });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.swContactCurrent).toBe(false);
    expect(result.daysSinceLastSWVisit).toBeGreaterThan(42);
    expect(result.issues.some(i => i.includes("Social worker visit overdue"))).toBe(true);
  });

  it("flags poor meeting attendance", () => {
    const profile = makeProfile({
      meetings: [
        makeMeeting({ id: "m1", attendedByHome: false, date: "2026-04-15T10:00:00Z" }),
        makeMeeting({ id: "m2", attendedByHome: false, date: "2026-03-20T10:00:00Z" }),
        makeMeeting({ id: "m3", attendedByHome: true, date: "2026-02-10T10:00:00Z" }),
      ],
    });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.meetingsAttendedRate).toBeLessThan(90);
    expect(result.issues.some(i => i.includes("attended only"))).toBe(true);
  });

  it("warns about low child views submission", () => {
    const profile = makeProfile({
      meetings: [
        makeMeeting({ id: "m1", childViewsSubmitted: false, date: "2026-04-15T10:00:00Z" }),
        makeMeeting({ id: "m2", childViewsSubmitted: false, date: "2026-03-20T10:00:00Z" }),
        makeMeeting({ id: "m3", childViewsSubmitted: true, date: "2026-02-10T10:00:00Z" }),
      ],
    });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.childViewsSubmittedRate).toBeLessThan(80);
    expect(result.warnings.some(w => w.includes("views shared"))).toBe(true);
  });

  it("warns about incomplete actions", () => {
    const profile = makeProfile({
      meetings: [
        makeMeeting({ id: "m1", actionsForHome: 5, actionsCompleted: 2, date: "2026-04-15T10:00:00Z" }),
      ],
    });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.actionsCompletionRate).toBe(40);
    expect(result.warnings.some(w => w.includes("actions completed"))).toBe(true);
  });

  it("flags long referral waits", () => {
    const profile = makeProfile({
      referrals: [
        makeReferral({ id: "r1", status: "waiting_list", waitingDays: 70 }),
      ],
    });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.averageWaitDays).toBe(70);
    expect(result.issues.some(i => i.includes("referral wait"))).toBe(true);
  });

  it("warns about no advocate", () => {
    const profile = makeProfile({ childHasAdvocate: false });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.warnings.some(w => w.includes("advocate"))).toBe(true);
  });

  it("warns about child views not shared routinely", () => {
    const profile = makeProfile({ childViewsRoutinelyShared: false });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.warnings.some(w => w.includes("views not routinely"))).toBe(true);
  });

  it("counts escalated referrals", () => {
    const profile = makeProfile({
      referrals: [
        makeReferral({ id: "r1", escalated: true, status: "waiting_list", waitingDays: 60 }),
        makeReferral({ id: "r2", escalated: false, status: "active" }),
      ],
    });
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    expect(result.escalatedReferrals).toBe(1);
    expect(result.activeReferrals).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeMultiAgencyMetrics", () => {
  it("calculates metrics for home", () => {
    const profiles = [
      makeProfile({ childId: "child-alex" }),
      makeProfile({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = calculateHomeMultiAgencyMetrics(profiles, "home-oak", NOW);
    expect(result.totalChildren).toBe(2);
    expect(result.totalProfessionals).toBe(10);
    expect(result.averageCommunicationScore).toBe(100);
    expect(result.swContactCurrentRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(90);
  });

  it("identifies overdue SW visits across home", () => {
    const profiles = [
      makeProfile({ childId: "child-alex" }),
      makeProfile({ childId: "child-jordan", childName: "Jordan", lastSWVisitDate: "2026-03-01T10:00:00Z" }),
    ];
    const result = calculateHomeMultiAgencyMetrics(profiles, "home-oak", NOW);
    expect(result.swContactCurrentRate).toBe(50);
  });

  it("finds longest referral wait", () => {
    const profiles = [
      makeProfile({ childId: "child-alex", referrals: [makeReferral({ status: "waiting_list", waitingDays: 45 })] }),
      makeProfile({ childId: "child-jordan", childName: "Jordan", referrals: [makeReferral({ status: "waiting_list", waitingDays: 80 })] }),
    ];
    const result = calculateHomeMultiAgencyMetrics(profiles, "home-oak", NOW);
    expect(result.longestWaitDays).toBe(80);
    expect(result.totalWaiting).toBe(2);
  });

  it("handles empty profiles", () => {
    const result = calculateHomeMultiAgencyMetrics([], "home-oak", NOW);
    expect(result.totalChildren).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("counts escalations across home", () => {
    const profiles = [
      makeProfile({
        childId: "child-alex",
        professionals: [
          makeProfessional({ id: "p1", escalationNeeded: true }),
          makeProfessional({ id: "p2", agencyType: "education", escalationNeeded: true }),
        ],
      }),
    ];
    const result = calculateHomeMultiAgencyMetrics(profiles, "home-oak", NOW);
    expect(result.totalEscalations).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("Label helpers", () => {
  it("getAgencyTypeLabel returns readable labels", () => {
    expect(getAgencyTypeLabel("placing_authority")).toBe("Placing Authority (SW)");
    expect(getAgencyTypeLabel("camhs")).toBe("CAMHS");
  });

  it("getMeetingTypeLabel returns readable labels", () => {
    expect(getMeetingTypeLabel("lac_review")).toBe("LAC Review");
    expect(getMeetingTypeLabel("pep_meeting")).toBe("PEP Meeting");
  });
});
