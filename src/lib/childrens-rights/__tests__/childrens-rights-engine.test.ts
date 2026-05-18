// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Children's Rights & Advocacy Intelligence Engine Tests
// 100+ tests covering all 8 functions + scoring + labels + edge cases
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateGuideCompliance,
  evaluateAdvocacy,
  evaluateRightsAwareness,
  evaluateParticipation,
  evaluateComplaintAccess,
  evaluateFeedback,
  buildChildRightsProfiles,
  generateChildrensRightsIntelligence,
  getRightsCategoryLabel,
  getAdvocacyTypeLabel,
  getParticipationLevelLabel,
  getFeedbackMechanismLabel,
  getAdvocacyStatusLabel,
} from "../childrens-rights-engine";
import type {
  ChildrensGuide,
  AdvocacyRecord,
  RightsAwarenessAssessment,
  ParticipationRecord,
  ComplaintAccessRecord,
  FeedbackRecord,
} from "../childrens-rights-engine";

// ── Demo Data ────────────────────────────────────────────────────────────────

const CHILD_IDS = ["alex", "jordan", "morgan"];
const CHILD_NAMES: Record<string, string> = {
  alex: "Alex",
  jordan: "Jordan",
  morgan: "Morgan",
};

const demoGuides: ChildrensGuide[] = [
  {
    id: "guide-01", childId: "alex", childName: "Alex",
    providedDate: "2025-01-15", lastUpdatedDate: "2025-04-01",
    status: "current", ageAppropriate: true, accessibleFormat: true,
    coversComplaints: true, coversAdvocacy: true, coversRights: true,
    coversOfstedContact: true, childConfirmedUnderstanding: true,
    reviewDate: "2025-07-01",
  },
  {
    id: "guide-02", childId: "jordan", childName: "Jordan",
    providedDate: "2025-02-01", lastUpdatedDate: "2025-02-01",
    status: "current", ageAppropriate: true, accessibleFormat: true,
    coversComplaints: true, coversAdvocacy: true, coversRights: true,
    coversOfstedContact: true, childConfirmedUnderstanding: true,
    reviewDate: "2025-08-01",
  },
  {
    id: "guide-03", childId: "morgan", childName: "Morgan",
    providedDate: "2024-06-01", lastUpdatedDate: "2024-06-01",
    status: "needs_update", ageAppropriate: false, accessibleFormat: true,
    coversComplaints: true, coversAdvocacy: false, coversRights: true,
    coversOfstedContact: false, childConfirmedUnderstanding: false,
    reviewDate: "2025-01-01",
  },
];

const demoAdvocacy: AdvocacyRecord[] = [
  {
    id: "adv-01", childId: "alex", childName: "Alex",
    advocacyType: "independent_advocate", status: "active",
    offeredDate: "2025-01-20", engagedDate: "2025-02-01",
    reason: "Advocacy for LAC review", childSatisfied: true,
  },
  {
    id: "adv-02", childId: "alex", childName: "Alex",
    advocacyType: "childline", status: "offered_declined",
    offeredDate: "2025-01-20",
    reason: "Childline access provided",
  },
  {
    id: "adv-03", childId: "jordan", childName: "Jordan",
    advocacyType: "independent_advocate", status: "offered_declined",
    offeredDate: "2025-02-15",
    reason: "Offered at admission", childSatisfied: true,
  },
  {
    id: "adv-04", childId: "jordan", childName: "Jordan",
    advocacyType: "nyas", status: "active",
    offeredDate: "2025-03-01", engagedDate: "2025-03-15",
    reason: "Support with education complaints", childSatisfied: true,
  },
  {
    id: "adv-05", childId: "morgan", childName: "Morgan",
    advocacyType: "ofsted_contact", status: "completed",
    offeredDate: "2025-01-10", engagedDate: "2025-01-12",
    completedDate: "2025-02-01",
    reason: "Wanted to contact Ofsted about placement concerns",
    outcome: "Concern addressed", childSatisfied: true,
  },
];

const demoAwareness: RightsAwarenessAssessment[] = [
  {
    id: "aware-01", childId: "alex", childName: "Alex",
    assessmentDate: "2025-03-01", assessedBy: "Tom Richards",
    rightsUnderstood: [
      "know_your_rights", "complaints_process", "advocacy_access",
      "participation_in_decisions", "privacy", "contact_with_family",
      "education", "health", "leisure_and_play", "protection_from_harm",
    ],
    rightsNotUnderstood: ["cultural_identity", "freedom_of_expression"],
    actionsPlanned: ["Discuss cultural identity in key worker sessions"],
    followUpDate: "2025-06-01",
  },
  {
    id: "aware-02", childId: "jordan", childName: "Jordan",
    assessmentDate: "2025-03-15", assessedBy: "Lisa Williams",
    rightsUnderstood: [
      "know_your_rights", "complaints_process", "advocacy_access",
      "participation_in_decisions", "privacy", "education",
      "health", "cultural_identity", "leisure_and_play",
      "freedom_of_expression", "protection_from_harm",
    ],
    rightsNotUnderstood: ["contact_with_family"],
    actionsPlanned: ["Explore contact rights in next session"],
    followUpDate: "2025-06-15",
  },
  {
    id: "aware-03", childId: "morgan", childName: "Morgan",
    assessmentDate: "2025-02-01", assessedBy: "Sarah Johnson",
    rightsUnderstood: [
      "know_your_rights", "complaints_process", "privacy",
      "education", "health", "protection_from_harm",
    ],
    rightsNotUnderstood: [
      "advocacy_access", "participation_in_decisions",
      "contact_with_family", "cultural_identity",
      "leisure_and_play", "freedom_of_expression",
    ],
    actionsPlanned: [
      "Rights awareness sessions",
      "Advocacy introduction session",
    ],
    followUpDate: "2025-05-01",
  },
];

const demoParticipation: ParticipationRecord[] = [
  {
    id: "part-01", childId: "alex", childName: "Alex",
    date: "2025-03-10", decisionArea: "Bedroom decoration",
    participationLevel: "child_led", childViewRecorded: true,
    viewInfluencedOutcome: true, feedbackMechanism: "key_worker_session",
  },
  {
    id: "part-02", childId: "alex", childName: "Alex",
    date: "2025-04-15", decisionArea: "Education placement review",
    participationLevel: "shared_decision", childViewRecorded: true,
    viewInfluencedOutcome: true, feedbackMechanism: "review_meeting",
  },
  {
    id: "part-03", childId: "alex", childName: "Alex",
    date: "2025-05-01", decisionArea: "Menu planning",
    participationLevel: "involved", childViewRecorded: true,
    viewInfluencedOutcome: true, feedbackMechanism: "house_meeting",
  },
  {
    id: "part-04", childId: "jordan", childName: "Jordan",
    date: "2025-03-20", decisionArea: "Activity schedule",
    participationLevel: "shared_decision", childViewRecorded: true,
    viewInfluencedOutcome: true, feedbackMechanism: "house_meeting",
  },
  {
    id: "part-05", childId: "jordan", childName: "Jordan",
    date: "2025-04-20", decisionArea: "Contact arrangements",
    participationLevel: "consulted", childViewRecorded: true,
    viewInfluencedOutcome: false, feedbackMechanism: "review_meeting",
  },
  {
    id: "part-06", childId: "jordan", childName: "Jordan",
    date: "2025-05-10", decisionArea: "Pocket money use",
    participationLevel: "child_led", childViewRecorded: true,
    viewInfluencedOutcome: true, feedbackMechanism: "key_worker_session",
  },
  {
    id: "part-07", childId: "morgan", childName: "Morgan",
    date: "2025-03-25", decisionArea: "Care plan review",
    participationLevel: "informed", childViewRecorded: false,
    viewInfluencedOutcome: false, feedbackMechanism: "review_meeting",
  },
  {
    id: "part-08", childId: "morgan", childName: "Morgan",
    date: "2025-04-25", decisionArea: "Education plan",
    participationLevel: "consulted", childViewRecorded: true,
    viewInfluencedOutcome: false, feedbackMechanism: "review_meeting",
  },
];

const demoComplaintAccess: ComplaintAccessRecord[] = [
  {
    id: "comp-01", childId: "alex", childName: "Alex",
    date: "2025-03-01", knowsHowToComplain: true,
    feelsAbleToComplain: true, complaintsFormAccessible: true,
    advocacyOfferedIfNeeded: true,
    previousComplaintHandledWell: true,
  },
  {
    id: "comp-02", childId: "jordan", childName: "Jordan",
    date: "2025-03-15", knowsHowToComplain: true,
    feelsAbleToComplain: true, complaintsFormAccessible: true,
    advocacyOfferedIfNeeded: true,
  },
  {
    id: "comp-03", childId: "morgan", childName: "Morgan",
    date: "2025-02-01", knowsHowToComplain: true,
    feelsAbleToComplain: false, complaintsFormAccessible: true,
    advocacyOfferedIfNeeded: false,
    barrierIdentified: "Morgan feels complaints won't be taken seriously",
  },
];

const demoFeedback: FeedbackRecord[] = [
  {
    id: "fb-01", childId: "alex", childName: "Alex",
    date: "2025-03-10", mechanism: "house_meeting",
    feedbackGiven: "Wants later bedtime at weekends",
    acknowledged: true, actionTaken: "Weekend bedtime extended by 30 mins",
    outcomeSharedWithChild: true, childSatisfied: true,
  },
  {
    id: "fb-02", childId: "alex", childName: "Alex",
    date: "2025-04-15", mechanism: "suggestion_box",
    feedbackGiven: "Would like more varied activities",
    acknowledged: true, actionTaken: "Activity calendar diversified",
    outcomeSharedWithChild: true, childSatisfied: true,
  },
  {
    id: "fb-03", childId: "jordan", childName: "Jordan",
    date: "2025-03-20", mechanism: "key_worker_session",
    feedbackGiven: "Doesn't like the food on Tuesdays",
    acknowledged: true, actionTaken: "Menu reviewed with Jordan",
    outcomeSharedWithChild: true, childSatisfied: true,
  },
  {
    id: "fb-04", childId: "jordan", childName: "Jordan",
    date: "2025-05-01", mechanism: "house_meeting",
    feedbackGiven: "WiFi too slow for gaming",
    acknowledged: true, outcomeSharedWithChild: false,
    childSatisfied: false,
  },
  {
    id: "fb-05", childId: "morgan", childName: "Morgan",
    date: "2025-04-01", mechanism: "reg44_visit",
    feedbackGiven: "Feels listened to by staff most of the time",
    acknowledged: true, outcomeSharedWithChild: true,
  },
  {
    id: "fb-06", childId: "morgan", childName: "Morgan",
    date: "2025-05-15", mechanism: "key_worker_session",
    feedbackGiven: "Would like to visit a university",
    acknowledged: true, actionTaken: "University visit scheduled",
    outcomeSharedWithChild: true, childSatisfied: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateGuideCompliance", () => {
  it("returns correct total children count", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.totalChildren).toBe(3);
  });

  it("counts guides provided", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.guidesProvided).toBe(3);
  });

  it("counts current guides", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.guidesCurrent).toBe(2); // Alex and Jordan current, Morgan needs_update
  });

  it("calculates age-appropriate rate", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.ageAppropriateRate).toBe(67); // 2 out of 3
  });

  it("calculates accessible format rate", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.accessibleFormatRate).toBe(100); // All 3
  });

  it("calculates covers complaints rate", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.coversComplaintsRate).toBe(100);
  });

  it("calculates covers advocacy rate", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.coversAdvocacyRate).toBe(67); // Morgan's doesn't cover advocacy
  });

  it("calculates child understanding rate", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.childUnderstandingRate).toBe(67); // Morgan hasn't confirmed
  });

  it("identifies children needing update", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.childrenNeedingUpdate).toContain("Morgan");
  });

  it("returns score > 0 for valid data", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.overallComplianceScore).toBeGreaterThan(0);
  });

  it("handles empty guides", () => {
    const result = evaluateGuideCompliance([], CHILD_IDS);
    expect(result.guidesProvided).toBe(0);
    expect(result.overallComplianceScore).toBe(0);
    expect(result.childrenNeedingUpdate).toHaveLength(3);
  });

  it("handles empty child IDs", () => {
    const result = evaluateGuideCompliance(demoGuides, []);
    expect(result.totalChildren).toBe(0);
    expect(result.overallComplianceScore).toBe(0);
  });

  it("picks latest guide per child when multiple exist", () => {
    const guides: ChildrensGuide[] = [
      {
        id: "g1", childId: "alex", childName: "Alex",
        providedDate: "2024-01-01", lastUpdatedDate: "2024-01-01",
        status: "needs_update", ageAppropriate: false, accessibleFormat: false,
        coversComplaints: false, coversAdvocacy: false, coversRights: false,
        coversOfstedContact: false, childConfirmedUnderstanding: false,
        reviewDate: "2024-06-01",
      },
      {
        id: "g2", childId: "alex", childName: "Alex",
        providedDate: "2025-06-01", lastUpdatedDate: "2025-06-01",
        status: "current", ageAppropriate: true, accessibleFormat: true,
        coversComplaints: true, coversAdvocacy: true, coversRights: true,
        coversOfstedContact: true, childConfirmedUnderstanding: true,
        reviewDate: "2025-12-01",
      },
    ];
    const result = evaluateGuideCompliance(guides, ["alex"]);
    expect(result.guidesCurrent).toBe(1);
    expect(result.ageAppropriateRate).toBe(100);
  });

  it("calculates Ofsted contact coverage rate", () => {
    const result = evaluateGuideCompliance(demoGuides, CHILD_IDS);
    expect(result.coversOfstedRate).toBe(67); // Morgan's guide doesn't cover Ofsted
  });

  it("achieves high score with all-current comprehensive guides", () => {
    const perfectGuides: ChildrensGuide[] = CHILD_IDS.map((id, i) => ({
      id: `g-${i}`, childId: id, childName: CHILD_NAMES[id],
      providedDate: "2025-01-01", lastUpdatedDate: "2025-06-01",
      status: "current" as const, ageAppropriate: true, accessibleFormat: true,
      coversComplaints: true, coversAdvocacy: true, coversRights: true,
      coversOfstedContact: true, childConfirmedUnderstanding: true,
      reviewDate: "2025-12-01",
    }));
    const result = evaluateGuideCompliance(perfectGuides, CHILD_IDS);
    expect(result.overallComplianceScore).toBe(100);
  });
});

describe("evaluateAdvocacy", () => {
  it("returns total records count", () => {
    const result = evaluateAdvocacy(demoAdvocacy, CHILD_IDS);
    expect(result.totalRecords).toBe(5);
  });

  it("counts active advocacy", () => {
    const result = evaluateAdvocacy(demoAdvocacy, CHILD_IDS);
    expect(result.activeAdvocacy).toBe(2); // Alex independent + Jordan NYAS
  });

  it("calculates offered rate — all children offered", () => {
    const result = evaluateAdvocacy(demoAdvocacy, CHILD_IDS);
    expect(result.advocacyOfferedRate).toBe(100);
  });

  it("calculates engaged rate", () => {
    const result = evaluateAdvocacy(demoAdvocacy, CHILD_IDS);
    expect(result.advocacyEngagedRate).toBeGreaterThan(0);
  });

  it("provides type breakdown", () => {
    const result = evaluateAdvocacy(demoAdvocacy, CHILD_IDS);
    expect(result.advocacyTypeBreakdown.independent_advocate).toBe(2);
    expect(result.advocacyTypeBreakdown.nyas).toBe(1);
    expect(result.advocacyTypeBreakdown.ofsted_contact).toBe(1);
  });

  it("identifies children without advocacy offer", () => {
    const records = demoAdvocacy.filter((r) => r.childId !== "morgan");
    const noOfferRecords: AdvocacyRecord[] = [
      ...records,
      {
        id: "adv-x", childId: "morgan", childName: "Morgan",
        advocacyType: "independent_advocate", status: "not_offered",
        offeredDate: "2025-01-01", reason: "Not offered",
      },
    ];
    const result = evaluateAdvocacy(noOfferRecords, CHILD_IDS);
    expect(result.childrenWithoutAdvocacyOffer).toContain("morgan");
  });

  it("calculates satisfaction rate from completed records", () => {
    const result = evaluateAdvocacy(demoAdvocacy, CHILD_IDS);
    expect(result.satisfactionRate).toBe(100); // All satisfied who responded
  });

  it("handles empty records", () => {
    const result = evaluateAdvocacy([], CHILD_IDS);
    expect(result.totalRecords).toBe(0);
    expect(result.overallScore).toBe(0);
    expect(result.childrenWithoutAdvocacyOffer).toEqual(CHILD_IDS);
  });

  it("handles empty child IDs", () => {
    const result = evaluateAdvocacy(demoAdvocacy, []);
    expect(result.overallScore).toBe(0);
  });

  it("returns score > 0 for valid data", () => {
    const result = evaluateAdvocacy(demoAdvocacy, CHILD_IDS);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

describe("evaluateRightsAwareness", () => {
  it("counts assessments", () => {
    const result = evaluateRightsAwareness(demoAwareness, CHILD_IDS);
    expect(result.totalAssessments).toBe(3);
  });

  it("counts children assessed", () => {
    const result = evaluateRightsAwareness(demoAwareness, CHILD_IDS);
    expect(result.childrenAssessed).toBe(3);
  });

  it("calculates average rights understood", () => {
    const result = evaluateRightsAwareness(demoAwareness, CHILD_IDS);
    // Alex: 10, Jordan: 11, Morgan: 6 → average 9.0
    expect(result.averageRightsUnderstood).toBe(9);
  });

  it("returns total rights categories", () => {
    const result = evaluateRightsAwareness(demoAwareness, CHILD_IDS);
    expect(result.totalRightsCategories).toBe(12);
  });

  it("calculates per-category understanding rates", () => {
    const result = evaluateRightsAwareness(demoAwareness, CHILD_IDS);
    // "know_your_rights" understood by all 3
    expect(result.categoryUnderstandingRates.know_your_rights).toBe(100);
    // "cultural_identity" understood by Jordan only
    expect(result.categoryUnderstandingRates.cultural_identity).toBe(33);
  });

  it("identifies least understood rights", () => {
    const result = evaluateRightsAwareness(demoAwareness, CHILD_IDS);
    expect(result.leastUnderstoodRights.length).toBeGreaterThan(0);
    // cultural_identity only understood by 1/3 = 33%
    expect(result.leastUnderstoodRights).toContain("cultural_identity");
  });

  it("identifies children with low awareness", () => {
    // Morgan: 6/12 = 50% — exactly at threshold (< 0.5), so NOT flagged
    const result = evaluateRightsAwareness(demoAwareness, CHILD_IDS);
    expect(result.childrenWithLowAwareness).not.toContain("Morgan");
    // A child with fewer than half understood would be flagged
    const lowAwareness: RightsAwarenessAssessment[] = [{
      id: "low", childId: "test_child", childName: "Test",
      assessmentDate: "2025-06-01", assessedBy: "Staff",
      rightsUnderstood: ["know_your_rights", "privacy"],
      rightsNotUnderstood: [
        "complaints_process", "advocacy_access", "participation_in_decisions",
        "contact_with_family", "education", "health",
        "cultural_identity", "leisure_and_play", "freedom_of_expression",
        "protection_from_harm",
      ],
      actionsPlanned: [], followUpDate: "2025-12-01",
    }];
    const lowResult = evaluateRightsAwareness(lowAwareness, ["test_child"]);
    expect(lowResult.childrenWithLowAwareness).toContain("Test");
  });

  it("returns score > 0 for valid data", () => {
    const result = evaluateRightsAwareness(demoAwareness, CHILD_IDS);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("handles empty assessments", () => {
    const result = evaluateRightsAwareness([], CHILD_IDS);
    expect(result.childrenAssessed).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("handles empty child IDs", () => {
    const result = evaluateRightsAwareness(demoAwareness, []);
    expect(result.overallScore).toBe(0);
  });

  it("picks latest assessment per child", () => {
    const assessments: RightsAwarenessAssessment[] = [
      {
        id: "a1", childId: "alex", childName: "Alex",
        assessmentDate: "2024-01-01", assessedBy: "Old",
        rightsUnderstood: ["know_your_rights"],
        rightsNotUnderstood: [
          "complaints_process", "advocacy_access", "participation_in_decisions",
          "privacy", "contact_with_family", "education", "health",
          "cultural_identity", "leisure_and_play", "freedom_of_expression",
          "protection_from_harm",
        ],
        actionsPlanned: [], followUpDate: "2024-06-01",
      },
      {
        id: "a2", childId: "alex", childName: "Alex",
        assessmentDate: "2025-06-01", assessedBy: "New",
        rightsUnderstood: [
          "know_your_rights", "complaints_process", "advocacy_access",
          "participation_in_decisions", "privacy", "contact_with_family",
          "education", "health", "cultural_identity", "leisure_and_play",
          "freedom_of_expression", "protection_from_harm",
        ],
        rightsNotUnderstood: [],
        actionsPlanned: [], followUpDate: "2025-12-01",
      },
    ];
    const result = evaluateRightsAwareness(assessments, ["alex"]);
    expect(result.averageRightsUnderstood).toBe(12);
  });
});

describe("evaluateParticipation", () => {
  it("returns total records", () => {
    const result = evaluateParticipation(demoParticipation, CHILD_IDS);
    expect(result.totalRecords).toBe(8);
  });

  it("calculates level breakdown", () => {
    const result = evaluateParticipation(demoParticipation, CHILD_IDS);
    expect(result.levelBreakdown.child_led).toBe(2);
    expect(result.levelBreakdown.shared_decision).toBe(2);
    expect(result.levelBreakdown.involved).toBe(1);
    expect(result.levelBreakdown.consulted).toBe(2);
    expect(result.levelBreakdown.informed).toBe(1);
  });

  it("calculates child view recorded rate", () => {
    const result = evaluateParticipation(demoParticipation, CHILD_IDS);
    // 7 out of 8 have childViewRecorded = true
    expect(result.childViewRecordedRate).toBe(88);
  });

  it("calculates view influenced outcome rate", () => {
    const result = evaluateParticipation(demoParticipation, CHILD_IDS);
    // 5 out of 8 have viewInfluencedOutcome = true
    expect(result.viewInfluencedOutcomeRate).toBe(63);
  });

  it("calculates mechanism breakdown", () => {
    const result = evaluateParticipation(demoParticipation, CHILD_IDS);
    expect(result.mechanismBreakdown.review_meeting).toBe(4);
    expect(result.mechanismBreakdown.house_meeting).toBe(2);
    expect(result.mechanismBreakdown.key_worker_session).toBe(2);
  });

  it("identifies children with low participation", () => {
    const result = evaluateParticipation(demoParticipation, CHILD_IDS);
    // Morgan: informed(1) + consulted(2) = avg 1.5 < 2 → low
    expect(result.childrenWithLowParticipation).toContain("morgan");
  });

  it("calculates average participation level", () => {
    const result = evaluateParticipation(demoParticipation, CHILD_IDS);
    // Alex: 5+4+3=12/3=4, Jordan: 4+2+5=11/3=3.67, Morgan: 1+2=3/2=1.5
    // Total: (5+4+3+4+2+5+1+2)=26/8=3.25
    expect(result.averageParticipationLevel).toBe(3.3);
  });

  it("returns score > 0", () => {
    const result = evaluateParticipation(demoParticipation, CHILD_IDS);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("handles empty records", () => {
    const result = evaluateParticipation([], CHILD_IDS);
    expect(result.totalRecords).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("handles empty child IDs", () => {
    const result = evaluateParticipation(demoParticipation, []);
    expect(result.overallScore).toBe(0);
  });

  it("flags children with no records at all", () => {
    const records = demoParticipation.filter((p) => p.childId !== "morgan");
    const result = evaluateParticipation(records, CHILD_IDS);
    expect(result.childrenWithLowParticipation).toContain("morgan");
  });
});

describe("evaluateComplaintAccess", () => {
  it("returns total assessments", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, CHILD_IDS);
    expect(result.totalAssessments).toBe(3);
  });

  it("calculates knows how to complain rate", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, CHILD_IDS);
    expect(result.knowsHowToComplainRate).toBe(100); // All 3 know
  });

  it("calculates feels able to complain rate", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, CHILD_IDS);
    expect(result.feelsAbleToComplainRate).toBe(67); // Morgan doesn't feel able
  });

  it("calculates forms accessible rate", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, CHILD_IDS);
    expect(result.formsAccessibleRate).toBe(100);
  });

  it("calculates advocacy offered rate", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, CHILD_IDS);
    expect(result.advocacyOfferedRate).toBe(67); // Morgan not offered
  });

  it("identifies barriers", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, CHILD_IDS);
    expect(result.barriersIdentified.length).toBe(1);
    expect(result.barriersIdentified[0]).toContain("taken seriously");
  });

  it("identifies children with barriers", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, CHILD_IDS);
    expect(result.childrenWithBarriers).toContain("Morgan");
  });

  it("returns score > 0", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, CHILD_IDS);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("handles empty records", () => {
    const result = evaluateComplaintAccess([], CHILD_IDS);
    expect(result.overallScore).toBe(0);
  });

  it("handles empty child IDs", () => {
    const result = evaluateComplaintAccess(demoComplaintAccess, []);
    expect(result.overallScore).toBe(0);
  });

  it("achieves 100 with perfect data", () => {
    const perfect: ComplaintAccessRecord[] = CHILD_IDS.map((id, i) => ({
      id: `c-${i}`, childId: id, childName: CHILD_NAMES[id],
      date: "2025-06-01", knowsHowToComplain: true,
      feelsAbleToComplain: true, complaintsFormAccessible: true,
      advocacyOfferedIfNeeded: true,
    }));
    const result = evaluateComplaintAccess(perfect, CHILD_IDS);
    expect(result.overallScore).toBe(100);
  });

  it("picks latest assessment per child", () => {
    const records: ComplaintAccessRecord[] = [
      {
        id: "c1", childId: "alex", childName: "Alex",
        date: "2024-01-01", knowsHowToComplain: false,
        feelsAbleToComplain: false, complaintsFormAccessible: false,
        advocacyOfferedIfNeeded: false,
      },
      {
        id: "c2", childId: "alex", childName: "Alex",
        date: "2025-06-01", knowsHowToComplain: true,
        feelsAbleToComplain: true, complaintsFormAccessible: true,
        advocacyOfferedIfNeeded: true,
      },
    ];
    const result = evaluateComplaintAccess(records, ["alex"]);
    expect(result.knowsHowToComplainRate).toBe(100);
  });
});

describe("evaluateFeedback", () => {
  it("returns total feedback count", () => {
    const result = evaluateFeedback(demoFeedback);
    expect(result.totalFeedback).toBe(6);
  });

  it("calculates acknowledged rate", () => {
    const result = evaluateFeedback(demoFeedback);
    expect(result.acknowledgedRate).toBe(100); // All acknowledged
  });

  it("calculates action taken rate", () => {
    const result = evaluateFeedback(demoFeedback);
    // fb-01, fb-02, fb-03, fb-06 have actionTaken → 4/6
    expect(result.actionTakenRate).toBe(67);
  });

  it("calculates outcome shared rate", () => {
    const result = evaluateFeedback(demoFeedback);
    // fb-01, fb-02, fb-03, fb-05, fb-06 → 5/6
    expect(result.outcomeSharedRate).toBe(83);
  });

  it("calculates satisfaction rate", () => {
    const result = evaluateFeedback(demoFeedback);
    // fb-01: true, fb-02: true, fb-03: true, fb-04: false, fb-06: true → 4/5
    expect(result.satisfactionRate).toBe(80);
  });

  it("provides mechanism breakdown", () => {
    const result = evaluateFeedback(demoFeedback);
    expect(result.mechanismBreakdown.house_meeting).toBe(2);
    expect(result.mechanismBreakdown.key_worker_session).toBe(2);
    expect(result.mechanismBreakdown.suggestion_box).toBe(1);
    expect(result.mechanismBreakdown.reg44_visit).toBe(1);
  });

  it("returns score > 0", () => {
    const result = evaluateFeedback(demoFeedback);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("handles empty feedback", () => {
    const result = evaluateFeedback([]);
    expect(result.totalFeedback).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("handles all feedback with no satisfaction response", () => {
    const noSat: FeedbackRecord[] = [
      {
        id: "f1", childId: "alex", childName: "Alex",
        date: "2025-01-01", mechanism: "house_meeting",
        feedbackGiven: "Test", acknowledged: true,
        outcomeSharedWithChild: true,
      },
    ];
    const result = evaluateFeedback(noSat);
    expect(result.satisfactionRate).toBe(0);
    // Score should still be > 0 from acknowledged + outcomeShared
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

describe("buildChildRightsProfiles", () => {
  it("returns a profile for each child", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    expect(profiles).toHaveLength(3);
  });

  it("maps correct guide status per child", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    const alex = profiles.find((p) => p.childId === "alex")!;
    expect(alex.guideStatus).toBe("current");
    const morgan = profiles.find((p) => p.childId === "morgan")!;
    expect(morgan.guideStatus).toBe("needs_update");
  });

  it("calculates rights awareness score per child", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    const alex = profiles.find((p) => p.childId === "alex")!;
    // Alex: 10/12 = 83%
    expect(alex.rightsAwarenessScore).toBe(83);
    const jordan = profiles.find((p) => p.childId === "jordan")!;
    // Jordan: 11/12 = 92%
    expect(jordan.rightsAwarenessScore).toBe(92);
  });

  it("assigns participation level label", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    const alex = profiles.find((p) => p.childId === "alex")!;
    // Alex avg: (5+4+3)/3 = 4 → "excellent"
    expect(alex.participationLevel).toBe("excellent");
    const morgan = profiles.find((p) => p.childId === "morgan")!;
    // Morgan avg: (1+2)/2 = 1.5 → "limited"
    expect(morgan.participationLevel).toBe("limited");
  });

  it("maps advocacy status per child", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    const alex = profiles.find((p) => p.childId === "alex")!;
    expect(alex.advocacyStatus).toBe("active");
  });

  it("calculates complaint access score per child", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    const alex = profiles.find((p) => p.childId === "alex")!;
    // All true: 25+30+20+25 = 100
    expect(alex.complaintAccessScore).toBe(100);
    const morgan = profiles.find((p) => p.childId === "morgan")!;
    // knows(25) + !feels(0) + accessible(20) + !advocacy(0) = 45
    expect(morgan.complaintAccessScore).toBe(45);
  });

  it("counts feedback engagement", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    const alex = profiles.find((p) => p.childId === "alex")!;
    expect(alex.feedbackEngagement).toBe(2);
    const jordan = profiles.find((p) => p.childId === "jordan")!;
    expect(jordan.feedbackEngagement).toBe(2);
  });

  it("generates areas for development for children with gaps", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    const morgan = profiles.find((p) => p.childId === "morgan")!;
    expect(morgan.areasForDevelopment.length).toBeGreaterThan(0);
    expect(morgan.areasForDevelopment.some((a) => a.includes("guide"))).toBe(true);
  });

  it("handles child with no data", () => {
    const profiles = buildChildRightsProfiles(
      [], [], [], [], [], [],
      ["new_child"], { new_child: "New Child" },
    );
    expect(profiles).toHaveLength(1);
    expect(profiles[0].guideStatus).toBe("not_found");
    expect(profiles[0].rightsAwarenessScore).toBe(0);
    expect(profiles[0].overallRightsScore).toBe(0);
  });

  it("calculates overall rights score per child", () => {
    const profiles = buildChildRightsProfiles(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
    );
    for (const p of profiles) {
      expect(p.overallRightsScore).toBeGreaterThanOrEqual(0);
      expect(p.overallRightsScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("generateChildrensRightsIntelligence", () => {
  const result = generateChildrensRightsIntelligence(
    demoGuides, demoAdvocacy, demoAwareness,
    demoParticipation, demoComplaintAccess, demoFeedback,
    CHILD_IDS, CHILD_NAMES,
    "oak-house", "2025-01-01", "2025-06-30", "2025-06-15",
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
  });

  it("returns overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("returns guide compliance result", () => {
    expect(result.guideCompliance.totalChildren).toBe(3);
  });

  it("returns advocacy result", () => {
    expect(result.advocacy.totalRecords).toBe(5);
  });

  it("returns rights awareness result", () => {
    expect(result.rightsAwareness.childrenAssessed).toBe(3);
  });

  it("returns participation result", () => {
    expect(result.participation.totalRecords).toBe(8);
  });

  it("returns complaint access result", () => {
    expect(result.complaintAccess.totalAssessments).toBe(3);
  });

  it("returns feedback result", () => {
    expect(result.feedback.totalFeedback).toBe(6);
  });

  it("returns child profiles", () => {
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates strengths", () => {
    expect(result.strengths.length).toBeGreaterThanOrEqual(0);
  });

  it("generates areas for improvement", () => {
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions", () => {
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 7"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("flags Morgan's guide needing update in areas for improvement", () => {
    expect(result.areasForImprovement.some((a) => a.includes("guide"))).toBe(true);
  });

  it("flags rights awareness gaps", () => {
    expect(
      result.areasForImprovement.some((a) => a.includes("awareness") || a.includes("Rights")),
    ).toBe(true);
  });
});

describe("scoring thresholds", () => {
  it("returns outstanding for perfect data", () => {
    const perfectGuides: ChildrensGuide[] = CHILD_IDS.map((id, i) => ({
      id: `g-${i}`, childId: id, childName: CHILD_NAMES[id],
      providedDate: "2025-01-01", lastUpdatedDate: "2025-06-01",
      status: "current" as const, ageAppropriate: true, accessibleFormat: true,
      coversComplaints: true, coversAdvocacy: true, coversRights: true,
      coversOfstedContact: true, childConfirmedUnderstanding: true,
      reviewDate: "2025-12-01",
    }));

    const perfectAdvocacy: AdvocacyRecord[] = CHILD_IDS.flatMap((id, i) => [
      {
        id: `a-${i}-1`, childId: id, childName: CHILD_NAMES[id],
        advocacyType: "independent_advocate" as const, status: "active" as const,
        offeredDate: "2025-01-01", engagedDate: "2025-01-15",
        reason: "Standard provision", childSatisfied: true,
      },
      {
        id: `a-${i}-2`, childId: id, childName: CHILD_NAMES[id],
        advocacyType: "childline" as const, status: "completed" as const,
        offeredDate: "2025-01-01", engagedDate: "2025-01-15",
        completedDate: "2025-03-01",
        reason: "Access provided", childSatisfied: true,
      },
      {
        id: `a-${i}-3`, childId: id, childName: CHILD_NAMES[id],
        advocacyType: "nyas" as const, status: "active" as const,
        offeredDate: "2025-02-01", engagedDate: "2025-02-15",
        reason: "Support", childSatisfied: true,
      },
      {
        id: `a-${i}-4`, childId: id, childName: CHILD_NAMES[id],
        advocacyType: "ofsted_contact" as const, status: "completed" as const,
        offeredDate: "2025-03-01", engagedDate: "2025-03-15",
        completedDate: "2025-04-01",
        reason: "Contact info", childSatisfied: true,
      },
    ]);

    const allRights = [
      "know_your_rights", "complaints_process", "advocacy_access",
      "participation_in_decisions", "privacy", "contact_with_family",
      "education", "health", "cultural_identity", "leisure_and_play",
      "freedom_of_expression", "protection_from_harm",
    ] as const;

    const perfectAwareness: RightsAwarenessAssessment[] = CHILD_IDS.map((id, i) => ({
      id: `aw-${i}`, childId: id, childName: CHILD_NAMES[id],
      assessmentDate: "2025-06-01", assessedBy: "Sarah Johnson",
      rightsUnderstood: [...allRights],
      rightsNotUnderstood: [],
      actionsPlanned: [], followUpDate: "2025-12-01",
    }));

    const perfectParticipation: ParticipationRecord[] = CHILD_IDS.flatMap((id, i) => [
      {
        id: `p-${i}-1`, childId: id, childName: CHILD_NAMES[id],
        date: "2025-03-01", decisionArea: "Care plan",
        participationLevel: "child_led" as const,
        childViewRecorded: true, viewInfluencedOutcome: true,
        feedbackMechanism: "review_meeting" as const,
      },
      {
        id: `p-${i}-2`, childId: id, childName: CHILD_NAMES[id],
        date: "2025-04-01", decisionArea: "Activities",
        participationLevel: "shared_decision" as const,
        childViewRecorded: true, viewInfluencedOutcome: true,
        feedbackMechanism: "house_meeting" as const,
      },
    ]);

    const perfectComplaints: ComplaintAccessRecord[] = CHILD_IDS.map((id, i) => ({
      id: `c-${i}`, childId: id, childName: CHILD_NAMES[id],
      date: "2025-06-01", knowsHowToComplain: true,
      feelsAbleToComplain: true, complaintsFormAccessible: true,
      advocacyOfferedIfNeeded: true,
    }));

    const perfectFeedback: FeedbackRecord[] = CHILD_IDS.flatMap((id, i) => [
      {
        id: `f-${i}-1`, childId: id, childName: CHILD_NAMES[id],
        date: "2025-03-01", mechanism: "house_meeting" as const,
        feedbackGiven: "Good", acknowledged: true,
        actionTaken: "Done", outcomeSharedWithChild: true,
        childSatisfied: true,
      },
      {
        id: `f-${i}-2`, childId: id, childName: CHILD_NAMES[id],
        date: "2025-04-01", mechanism: "key_worker_session" as const,
        feedbackGiven: "Great", acknowledged: true,
        actionTaken: "Done", outcomeSharedWithChild: true,
        childSatisfied: true,
      },
    ]);

    const result = generateChildrensRightsIntelligence(
      perfectGuides, perfectAdvocacy, perfectAwareness,
      perfectParticipation, perfectComplaints, perfectFeedback,
      CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-06-15",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for empty data", () => {
    const result = generateChildrensRightsIntelligence(
      [], [], [], [], [], [],
      CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-06-15",
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("demo data produces a valid rating", () => {
    const result = generateChildrensRightsIntelligence(
      demoGuides, demoAdvocacy, demoAwareness,
      demoParticipation, demoComplaintAccess, demoFeedback,
      CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", "2025-06-15",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.overallScore).toBeGreaterThan(40);
  });
});

describe("label functions", () => {
  it("getRightsCategoryLabel returns correct labels", () => {
    expect(getRightsCategoryLabel("know_your_rights")).toBe("Know Your Rights");
    expect(getRightsCategoryLabel("complaints_process")).toBe("Complaints Process");
    expect(getRightsCategoryLabel("advocacy_access")).toBe("Advocacy Access");
    expect(getRightsCategoryLabel("participation_in_decisions")).toBe("Participation in Decisions");
    expect(getRightsCategoryLabel("privacy")).toBe("Privacy");
    expect(getRightsCategoryLabel("contact_with_family")).toBe("Contact with Family");
    expect(getRightsCategoryLabel("education")).toBe("Education");
    expect(getRightsCategoryLabel("health")).toBe("Health");
    expect(getRightsCategoryLabel("cultural_identity")).toBe("Cultural Identity");
    expect(getRightsCategoryLabel("leisure_and_play")).toBe("Leisure & Play");
    expect(getRightsCategoryLabel("freedom_of_expression")).toBe("Freedom of Expression");
    expect(getRightsCategoryLabel("protection_from_harm")).toBe("Protection from Harm");
  });

  it("getAdvocacyTypeLabel returns correct labels", () => {
    expect(getAdvocacyTypeLabel("independent_advocate")).toBe("Independent Advocate");
    expect(getAdvocacyTypeLabel("childrens_commissioner")).toBe("Children's Commissioner");
    expect(getAdvocacyTypeLabel("ofsted_contact")).toBe("Ofsted Contact");
    expect(getAdvocacyTypeLabel("irp")).toBe("Independent Reviewing Officer");
    expect(getAdvocacyTypeLabel("nyas")).toBe("NYAS");
    expect(getAdvocacyTypeLabel("childline")).toBe("Childline");
    expect(getAdvocacyTypeLabel("reg44_visitor")).toBe("Reg 44 Visitor");
  });

  it("getParticipationLevelLabel returns correct labels", () => {
    expect(getParticipationLevelLabel("informed")).toBe("Informed");
    expect(getParticipationLevelLabel("consulted")).toBe("Consulted");
    expect(getParticipationLevelLabel("involved")).toBe("Involved");
    expect(getParticipationLevelLabel("shared_decision")).toBe("Shared Decision");
    expect(getParticipationLevelLabel("child_led")).toBe("Child-Led");
  });

  it("getFeedbackMechanismLabel returns correct labels", () => {
    expect(getFeedbackMechanismLabel("house_meeting")).toBe("House Meeting");
    expect(getFeedbackMechanismLabel("key_worker_session")).toBe("Key Worker Session");
    expect(getFeedbackMechanismLabel("complaints_form")).toBe("Complaints Form");
    expect(getFeedbackMechanismLabel("suggestion_box")).toBe("Suggestion Box");
    expect(getFeedbackMechanismLabel("reg44_visit")).toBe("Reg 44 Visit");
    expect(getFeedbackMechanismLabel("review_meeting")).toBe("Review Meeting");
    expect(getFeedbackMechanismLabel("exit_interview")).toBe("Exit Interview");
    expect(getFeedbackMechanismLabel("survey")).toBe("Survey");
    expect(getFeedbackMechanismLabel("informal_chat")).toBe("Informal Chat");
  });

  it("getAdvocacyStatusLabel returns correct labels", () => {
    expect(getAdvocacyStatusLabel("active")).toBe("Active");
    expect(getAdvocacyStatusLabel("offered_declined")).toBe("Offered — Declined");
    expect(getAdvocacyStatusLabel("not_offered")).toBe("Not Offered");
    expect(getAdvocacyStatusLabel("completed")).toBe("Completed");
    expect(getAdvocacyStatusLabel("pending")).toBe("Pending");
  });
});
