import { describe, it, expect } from "vitest";
import {
  evaluateContactQuality,
  evaluateContactConsistency,
  evaluateContactPolicy,
  evaluateStaffContactReadiness,
  buildChildContactProfiles,
  generateFamilyContactQualityIntelligence,
  pct,
  getRating,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getContactPersonLabel,
  getRatingLabel,
} from "../family-contact-quality-engine";
import type {
  FamilyContact,
  ContactPolicy,
  StaffContactTraining,
} from "../family-contact-quality-engine";

// ── Factory Functions ────────────────────────────────────────────────────────

function makeContact(overrides: Partial<FamilyContact> = {}): FamilyContact {
  return {
    id: "fc-1",
    childId: "child-alex",
    childName: "Alex",
    contactDate: "2026-03-15",
    contactType: "face_to_face",
    contactPerson: "parent_mother",
    contactOutcome: "positive",
    childPrepared: true,
    childViewsRecorded: true,
    supervisedAppropriately: true,
    recordedInCasefile: true,
    contactPlanFollowed: true,
    childSatisfied: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ContactPolicy> = {}): ContactPolicy {
  return {
    id: "pol-1",
    contactPlanForEachChild: true,
    familyEngagementStrategy: true,
    supervisedContactGuidance: true,
    letterboxProcess: true,
    complaintsMechanism: true,
    culturalConsideration: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffContactTraining> = {}): StaffContactTraining {
  return {
    id: "tr-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    familyEngagement: true,
    contactSupervision: true,
    childPreparation: true,
    conflictManagement: true,
    recordKeeping: true,
    culturalAwareness: true,
    ...overrides,
  };
}

// ── Demo Data ────────────────────────────────────────────────────────────────

const ALEX_MUM: FamilyContact = makeContact({
  id: "fc-a1", childId: "child-alex", childName: "Alex",
  contactType: "face_to_face", contactPerson: "parent_mother",
  contactOutcome: "very_positive",
});

const ALEX_DAD: FamilyContact = makeContact({
  id: "fc-a2", childId: "child-alex", childName: "Alex",
  contactDate: "2026-03-20", contactType: "phone_call",
  contactPerson: "parent_father", contactOutcome: "positive",
});

const ALEX_GRAN: FamilyContact = makeContact({
  id: "fc-a3", childId: "child-alex", childName: "Alex",
  contactDate: "2026-04-01", contactType: "video_call",
  contactPerson: "grandparent", contactOutcome: "positive",
});

const JORDAN_MUM: FamilyContact = makeContact({
  id: "fc-j1", childId: "child-jordan", childName: "Jordan",
  contactDate: "2026-03-10", contactType: "supervised_visit",
  contactPerson: "parent_mother", contactOutcome: "neutral",
  childSatisfied: false,
});

const JORDAN_SIBLING: FamilyContact = makeContact({
  id: "fc-j2", childId: "child-jordan", childName: "Jordan",
  contactDate: "2026-03-25", contactType: "activity_based",
  contactPerson: "sibling", contactOutcome: "very_positive",
});

const MORGAN_DAD: FamilyContact = makeContact({
  id: "fc-m1", childId: "child-morgan", childName: "Morgan",
  contactDate: "2026-03-12", contactType: "letterbox",
  contactPerson: "parent_father", contactOutcome: "positive",
});

const MORGAN_GRAN: FamilyContact = makeContact({
  id: "fc-m2", childId: "child-morgan", childName: "Morgan",
  contactDate: "2026-04-05", contactType: "family_event",
  contactPerson: "grandparent", contactOutcome: "very_positive",
});

const ALL_CONTACTS = [ALEX_MUM, ALEX_DAD, ALEX_GRAN, JORDAN_MUM, JORDAN_SIBLING, MORGAN_DAD, MORGAN_GRAN];

const FULL_POLICY: ContactPolicy = makePolicy();

const TRAINING_DATA: StaffContactTraining[] = [
  makeTraining({ id: "tr-1", staffId: "staff-1", staffName: "Sarah Johnson" }),
  makeTraining({ id: "tr-2", staffId: "staff-2", staffName: "Tom Richards" }),
  makeTraining({ id: "tr-3", staffId: "staff-3", staffName: "Lisa Williams",
    conflictManagement: false, culturalAwareness: false }),
];

// ── pct helper ───────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ── getRating ────────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ── Label Functions ──────────────────────────────────────────────────────────

describe("getContactTypeLabel", () => {
  it("returns Face to Face", () => {
    expect(getContactTypeLabel("face_to_face")).toBe("Face to Face");
  });
  it("returns Phone Call", () => {
    expect(getContactTypeLabel("phone_call")).toBe("Phone Call");
  });
  it("returns Video Call", () => {
    expect(getContactTypeLabel("video_call")).toBe("Video Call");
  });
  it("returns Letterbox", () => {
    expect(getContactTypeLabel("letterbox")).toBe("Letterbox");
  });
  it("returns Supervised Visit", () => {
    expect(getContactTypeLabel("supervised_visit")).toBe("Supervised Visit");
  });
  it("returns Unsupervised Visit", () => {
    expect(getContactTypeLabel("unsupervised_visit")).toBe("Unsupervised Visit");
  });
  it("returns Activity Based", () => {
    expect(getContactTypeLabel("activity_based")).toBe("Activity Based");
  });
  it("returns Family Event", () => {
    expect(getContactTypeLabel("family_event")).toBe("Family Event");
  });
});

describe("getContactOutcomeLabel", () => {
  it("returns Very Positive", () => {
    expect(getContactOutcomeLabel("very_positive")).toBe("Very Positive");
  });
  it("returns Positive", () => {
    expect(getContactOutcomeLabel("positive")).toBe("Positive");
  });
  it("returns Neutral", () => {
    expect(getContactOutcomeLabel("neutral")).toBe("Neutral");
  });
  it("returns Difficult", () => {
    expect(getContactOutcomeLabel("difficult")).toBe("Difficult");
  });
  it("returns Did Not Happen", () => {
    expect(getContactOutcomeLabel("did_not_happen")).toBe("Did Not Happen");
  });
});

describe("getContactPersonLabel", () => {
  it("returns Mother", () => {
    expect(getContactPersonLabel("parent_mother")).toBe("Mother");
  });
  it("returns Father", () => {
    expect(getContactPersonLabel("parent_father")).toBe("Father");
  });
  it("returns Sibling", () => {
    expect(getContactPersonLabel("sibling")).toBe("Sibling");
  });
  it("returns Grandparent", () => {
    expect(getContactPersonLabel("grandparent")).toBe("Grandparent");
  });
  it("returns Extended Family", () => {
    expect(getContactPersonLabel("extended_family")).toBe("Extended Family");
  });
  it("returns Other Significant Person", () => {
    expect(getContactPersonLabel("other_significant")).toBe("Other Significant Person");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateContactQuality ───────────────────────────────────────────────────

describe("evaluateContactQuality", () => {
  it("returns 0 score for empty contacts", () => {
    const r = evaluateContactQuality([]);
    expect(r.score).toBe(0);
    expect(r.positiveOutcomeRate).toBe(0);
    expect(r.childPreparedRate).toBe(0);
    expect(r.childViewsRecordedRate).toBe(0);
    expect(r.satisfactionPlanRate).toBe(0);
  });

  it("scores high for all-positive contacts", () => {
    const r = evaluateContactQuality(ALL_CONTACTS);
    expect(r.score).toBeGreaterThanOrEqual(15);
    expect(r.score).toBeLessThanOrEqual(25);
  });

  it("calculates positive outcome rate correctly", () => {
    // 6/7 are very_positive or positive (Jordan mum is neutral)
    const r = evaluateContactQuality(ALL_CONTACTS);
    expect(r.positiveOutcomeRate).toBe(86);
  });

  it("calculates child prepared rate correctly", () => {
    const r = evaluateContactQuality(ALL_CONTACTS);
    expect(r.childPreparedRate).toBe(100);
  });

  it("calculates child views recorded rate correctly", () => {
    const r = evaluateContactQuality(ALL_CONTACTS);
    expect(r.childViewsRecordedRate).toBe(100);
  });

  it("calculates satisfaction+plan rate correctly", () => {
    // Jordan mum is not satisfied, rest are -> 6/7 = 86%
    const r = evaluateContactQuality(ALL_CONTACTS);
    expect(r.satisfactionPlanRate).toBe(86);
  });

  it("single perfect contact scores high", () => {
    const r = evaluateContactQuality([makeContact({ contactOutcome: "very_positive" })]);
    expect(r.positiveOutcomeRate).toBe(100);
    expect(r.childPreparedRate).toBe(100);
    expect(r.childViewsRecordedRate).toBe(100);
    expect(r.satisfactionPlanRate).toBe(100);
    expect(r.score).toBe(25);
  });

  it("all difficult contacts score low", () => {
    const bad = makeContact({
      contactOutcome: "difficult",
      childPrepared: false,
      childViewsRecorded: false,
      childSatisfied: false,
      contactPlanFollowed: false,
    });
    const r = evaluateContactQuality([bad, { ...bad, id: "fc-2" }]);
    expect(r.positiveOutcomeRate).toBe(0);
    expect(r.score).toBe(0);
  });

  it("mixed outcomes produce mid-range score", () => {
    const good = makeContact({ id: "fc-g", contactOutcome: "very_positive" });
    const bad = makeContact({
      id: "fc-b", contactOutcome: "difficult",
      childPrepared: false, childViewsRecorded: false,
      childSatisfied: false, contactPlanFollowed: false,
    });
    const r = evaluateContactQuality([good, bad]);
    expect(r.positiveOutcomeRate).toBe(50);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThan(25);
  });

  it("score is capped at 25", () => {
    const perfect = makeContact({ contactOutcome: "very_positive" });
    const contacts = Array.from({ length: 20 }, (_, i) => ({ ...perfect, id: `fc-${i}` }));
    const r = evaluateContactQuality(contacts);
    expect(r.score).toBeLessThanOrEqual(25);
  });

  it("did_not_happen counts in totals", () => {
    const dnh = makeContact({ contactOutcome: "did_not_happen", childSatisfied: false });
    const r = evaluateContactQuality([dnh]);
    expect(r.positiveOutcomeRate).toBe(0);
  });

  it("unprepared children reduce prepared rate", () => {
    const unprepared = makeContact({ id: "fc-u", childPrepared: false });
    const prepared = makeContact({ id: "fc-p" });
    const r = evaluateContactQuality([unprepared, prepared]);
    expect(r.childPreparedRate).toBe(50);
  });

  it("unrecorded views reduce views rate", () => {
    const noViews = makeContact({ id: "fc-nv", childViewsRecorded: false });
    const views = makeContact({ id: "fc-v" });
    const r = evaluateContactQuality([noViews, views]);
    expect(r.childViewsRecordedRate).toBe(50);
  });
});

// ── evaluateContactConsistency ───────────────────────────────────────────────

describe("evaluateContactConsistency", () => {
  it("returns 0 for empty contacts", () => {
    const r = evaluateContactConsistency([]);
    expect(r.score).toBe(0);
    expect(r.recordedRate).toBe(0);
    expect(r.planAdherenceRate).toBe(0);
    expect(r.supervisedAppropriatelyRate).toBe(0);
  });

  it("scores high for fully compliant contacts", () => {
    const r = evaluateContactConsistency(ALL_CONTACTS);
    expect(r.score).toBeGreaterThanOrEqual(20);
  });

  it("calculates recorded rate correctly", () => {
    const r = evaluateContactConsistency(ALL_CONTACTS);
    expect(r.recordedRate).toBe(100);
  });

  it("calculates plan adherence rate correctly", () => {
    const r = evaluateContactConsistency(ALL_CONTACTS);
    expect(r.planAdherenceRate).toBe(100);
  });

  it("calculates supervised appropriately rate correctly", () => {
    const r = evaluateContactConsistency(ALL_CONTACTS);
    expect(r.supervisedAppropriatelyRate).toBe(100);
  });

  it("unrecorded contacts reduce recorded rate", () => {
    const unrecorded = makeContact({ id: "fc-ur", recordedInCasefile: false });
    const recorded = makeContact({ id: "fc-r" });
    const r = evaluateContactConsistency([unrecorded, recorded]);
    expect(r.recordedRate).toBe(50);
  });

  it("plan not followed reduces adherence rate", () => {
    const notFollowed = makeContact({ id: "fc-nf", contactPlanFollowed: false });
    const followed = makeContact({ id: "fc-f" });
    const r = evaluateContactConsistency([notFollowed, followed]);
    expect(r.planAdherenceRate).toBe(50);
  });

  it("unsupervised inappropriately reduces rate", () => {
    const bad = makeContact({ id: "fc-us", supervisedAppropriately: false });
    const good = makeContact({ id: "fc-gs" });
    const r = evaluateContactConsistency([bad, good]);
    expect(r.supervisedAppropriatelyRate).toBe(50);
  });

  it("all poor consistency scores very low", () => {
    const bad = makeContact({
      recordedInCasefile: false,
      contactPlanFollowed: false,
      supervisedAppropriately: false,
    });
    const r = evaluateContactConsistency([bad, { ...bad, id: "fc-2" }]);
    expect(r.score).toBe(0);
  });

  it("score capped at 25", () => {
    const perfect = makeContact();
    const contacts = Array.from({ length: 20 }, (_, i) => ({ ...perfect, id: `fc-${i}` }));
    const r = evaluateContactConsistency(contacts);
    expect(r.score).toBeLessThanOrEqual(25);
  });

  it("single perfect contact scores maximum", () => {
    const r = evaluateContactConsistency([makeContact()]);
    expect(r.recordedRate).toBe(100);
    expect(r.planAdherenceRate).toBe(100);
    expect(r.supervisedAppropriatelyRate).toBe(100);
    expect(r.score).toBe(25);
  });
});

// ── evaluateContactPolicy ────────────────────────────────────────────────────

describe("evaluateContactPolicy", () => {
  it("returns 0 for null policy", () => {
    const r = evaluateContactPolicy(null);
    expect(r.score).toBe(0);
    expect(r.contactPlanForEachChild).toBe(false);
    expect(r.familyEngagementStrategy).toBe(false);
    expect(r.supervisedContactGuidance).toBe(false);
    expect(r.letterboxProcess).toBe(false);
    expect(r.complaintsMechanism).toBe(false);
    expect(r.culturalConsideration).toBe(false);
    expect(r.regularReview).toBe(false);
  });

  it("returns 25 for full policy", () => {
    const r = evaluateContactPolicy(FULL_POLICY);
    expect(r.score).toBe(25);
  });

  it("scores contactPlanForEachChild as 4", () => {
    const p = makePolicy({
      contactPlanForEachChild: true,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: false,
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(4);
  });

  it("scores familyEngagementStrategy as 4", () => {
    const p = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: true,
      supervisedContactGuidance: false,
      letterboxProcess: false,
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(4);
  });

  it("scores supervisedContactGuidance as 4", () => {
    const p = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: true,
      letterboxProcess: false,
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(4);
  });

  it("scores letterboxProcess as 4", () => {
    const p = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: true,
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(4);
  });

  it("scores complaintsMechanism as 3", () => {
    const p = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: false,
      complaintsMechanism: true,
      culturalConsideration: false,
      regularReview: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(3);
  });

  it("scores culturalConsideration as 3", () => {
    const p = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: false,
      complaintsMechanism: false,
      culturalConsideration: true,
      regularReview: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(3);
  });

  it("scores regularReview as 3", () => {
    const p = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: false,
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: true,
    });
    expect(evaluateContactPolicy(p).score).toBe(3);
  });

  it("first 4 booleans total 16", () => {
    const p = makePolicy({
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(16);
  });

  it("last 3 booleans total 9", () => {
    const p = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(9);
  });

  it("all false scores 0", () => {
    const p = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: false,
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: false,
    });
    expect(evaluateContactPolicy(p).score).toBe(0);
  });

  it("reflects boolean values in result", () => {
    const p = makePolicy({ culturalConsideration: false });
    const r = evaluateContactPolicy(p);
    expect(r.culturalConsideration).toBe(false);
    expect(r.contactPlanForEachChild).toBe(true);
  });

  it("score capped at 25", () => {
    const r = evaluateContactPolicy(FULL_POLICY);
    expect(r.score).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffContactReadiness ────────────────────────────────────────────

describe("evaluateStaffContactReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffContactReadiness([]);
    expect(r.score).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.familyEngagementRate).toBe(0);
    expect(r.contactSupervisionRate).toBe(0);
    expect(r.childPreparationRate).toBe(0);
    expect(r.conflictManagementRate).toBe(0);
    expect(r.recordKeepingRate).toBe(0);
    expect(r.culturalAwarenessRate).toBe(0);
  });

  it("scores 25 for fully trained single staff", () => {
    const r = evaluateStaffContactReadiness([makeTraining()]);
    expect(r.score).toBe(25);
    expect(r.totalStaff).toBe(1);
  });

  it("scores 25 for all staff fully trained", () => {
    const t1 = makeTraining({ id: "tr-1", staffId: "s1", staffName: "A" });
    const t2 = makeTraining({ id: "tr-2", staffId: "s2", staffName: "B" });
    const r = evaluateStaffContactReadiness([t1, t2]);
    expect(r.score).toBe(25);
  });

  it("calculates per-skill rates correctly", () => {
    const r = evaluateStaffContactReadiness(TRAINING_DATA);
    expect(r.totalStaff).toBe(3);
    expect(r.familyEngagementRate).toBe(100);
    expect(r.contactSupervisionRate).toBe(100);
    expect(r.childPreparationRate).toBe(100);
    expect(r.conflictManagementRate).toBe(67); // 2/3
    expect(r.recordKeepingRate).toBe(100);
    expect(r.culturalAwarenessRate).toBe(67); // 2/3
  });

  it("untrained staff reduces score", () => {
    const untrained = makeTraining({
      familyEngagement: false,
      contactSupervision: false,
      childPreparation: false,
      conflictManagement: false,
      recordKeeping: false,
      culturalAwareness: false,
    });
    const r = evaluateStaffContactReadiness([untrained]);
    expect(r.score).toBe(0);
    expect(r.familyEngagementRate).toBe(0);
  });

  it("familyEngagement has weight 6", () => {
    const t = makeTraining({
      familyEngagement: true,
      contactSupervision: false,
      childPreparation: false,
      conflictManagement: false,
      recordKeeping: false,
      culturalAwareness: false,
    });
    const r = evaluateStaffContactReadiness([t]);
    expect(r.score).toBe(6);
  });

  it("contactSupervision has weight 5", () => {
    const t = makeTraining({
      familyEngagement: false,
      contactSupervision: true,
      childPreparation: false,
      conflictManagement: false,
      recordKeeping: false,
      culturalAwareness: false,
    });
    const r = evaluateStaffContactReadiness([t]);
    expect(r.score).toBe(5);
  });

  it("childPreparation has weight 5", () => {
    const t = makeTraining({
      familyEngagement: false,
      contactSupervision: false,
      childPreparation: true,
      conflictManagement: false,
      recordKeeping: false,
      culturalAwareness: false,
    });
    const r = evaluateStaffContactReadiness([t]);
    expect(r.score).toBe(5);
  });

  it("conflictManagement has weight 4", () => {
    const t = makeTraining({
      familyEngagement: false,
      contactSupervision: false,
      childPreparation: false,
      conflictManagement: true,
      recordKeeping: false,
      culturalAwareness: false,
    });
    const r = evaluateStaffContactReadiness([t]);
    expect(r.score).toBe(4);
  });

  it("recordKeeping has weight 3", () => {
    const t = makeTraining({
      familyEngagement: false,
      contactSupervision: false,
      childPreparation: false,
      conflictManagement: false,
      recordKeeping: true,
      culturalAwareness: false,
    });
    const r = evaluateStaffContactReadiness([t]);
    expect(r.score).toBe(3);
  });

  it("culturalAwareness has weight 2", () => {
    const t = makeTraining({
      familyEngagement: false,
      contactSupervision: false,
      childPreparation: false,
      conflictManagement: false,
      recordKeeping: false,
      culturalAwareness: true,
    });
    const r = evaluateStaffContactReadiness([t]);
    expect(r.score).toBe(2);
  });

  it("all weights sum to 25", () => {
    const r = evaluateStaffContactReadiness([makeTraining()]);
    expect(r.score).toBe(6 + 5 + 5 + 4 + 3 + 2);
  });

  it("score capped at 25", () => {
    const r = evaluateStaffContactReadiness([makeTraining()]);
    expect(r.score).toBeLessThanOrEqual(25);
  });

  it("partial training produces mid-range score", () => {
    const partial = makeTraining({
      familyEngagement: true,
      contactSupervision: true,
      childPreparation: false,
      conflictManagement: false,
      recordKeeping: false,
      culturalAwareness: false,
    });
    const r = evaluateStaffContactReadiness([partial]);
    expect(r.score).toBe(11);
  });

  it("mixed staff produces proportional rates", () => {
    const trained = makeTraining({ id: "t1", staffId: "s1" });
    const untrained = makeTraining({
      id: "t2", staffId: "s2",
      familyEngagement: false, contactSupervision: false,
      childPreparation: false, conflictManagement: false,
      recordKeeping: false, culturalAwareness: false,
    });
    const r = evaluateStaffContactReadiness([trained, untrained]);
    expect(r.familyEngagementRate).toBe(50);
    expect(r.score).toBeCloseTo(12.5, 0);
  });
});

// ── buildChildContactProfiles ────────────────────────────────────────────────

describe("buildChildContactProfiles", () => {
  it("returns empty array for empty contacts", () => {
    const profiles = buildChildContactProfiles([]);
    expect(profiles).toHaveLength(0);
  });

  it("builds profiles for all children", () => {
    const profiles = buildChildContactProfiles(ALL_CONTACTS);
    expect(profiles).toHaveLength(3);
  });

  it("Alex profile has correct data", () => {
    const profiles = buildChildContactProfiles(ALL_CONTACTS);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.childName).toBe("Alex");
    expect(alex!.totalContacts).toBe(3);
    expect(alex!.positiveRate).toBe(100);
    expect(alex!.preparedRate).toBe(100);
    expect(alex!.viewsRecordedRate).toBe(100);
    expect(alex!.satisfiedRate).toBe(100);
    expect(alex!.score).toBe(10);
  });

  it("Jordan profile reflects mixed outcomes", () => {
    const profiles = buildChildContactProfiles(ALL_CONTACTS);
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.totalContacts).toBe(2);
    // 1 very_positive, 1 neutral = 50%
    expect(jordan!.positiveRate).toBe(50);
    // 1 satisfied, 1 not = 50%
    expect(jordan!.satisfiedRate).toBe(50);
  });

  it("Morgan profile has correct contact count", () => {
    const profiles = buildChildContactProfiles(ALL_CONTACTS);
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan).toBeDefined();
    expect(morgan!.totalContacts).toBe(2);
    expect(morgan!.positiveRate).toBe(100);
  });

  it("profile score clamped between 0 and 10", () => {
    const profiles = buildChildContactProfiles(ALL_CONTACTS);
    profiles.forEach((p) => {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(10);
    });
  });

  it("all-bad contacts produce low profile score", () => {
    const bad = makeContact({
      id: "fc-b", contactOutcome: "difficult",
      childPrepared: false, childViewsRecorded: false,
      childSatisfied: false,
    });
    const profiles = buildChildContactProfiles([bad]);
    expect(profiles[0].score).toBe(0);
  });

  it("single child with single perfect contact scores 10", () => {
    const perfect = makeContact({ contactOutcome: "very_positive" });
    const profiles = buildChildContactProfiles([perfect]);
    expect(profiles[0].score).toBe(10);
  });

  it("uses childName from first contact", () => {
    const c1 = makeContact({ id: "fc-1", childId: "child-x", childName: "Xavier" });
    const c2 = makeContact({ id: "fc-2", childId: "child-x", childName: "Xavier Smith" });
    const profiles = buildChildContactProfiles([c1, c2]);
    expect(profiles[0].childName).toBe("Xavier");
  });
});

// ── generateFamilyContactQualityIntelligence ─────────────────────────────────

describe("generateFamilyContactQualityIntelligence", () => {
  it("returns complete structure", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", "2026-01-01");
    expect(result).toHaveProperty("periodEnd", "2026-05-19");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("contactQuality");
    expect(result).toHaveProperty("contactConsistency");
    expect(result).toHaveProperty("contactPolicy");
    expect(result).toHaveProperty("staffContactReadiness");
    expect(result).toHaveProperty("childProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("overall score is sum of 4 components capped at 100", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    const expected =
      result.contactQuality.score +
      result.contactConsistency.score +
      result.contactPolicy.score +
      result.staffContactReadiness.score;
    expect(result.overallScore).toBe(Math.min(expected, 100));
  });

  it("empty data produces inadequate rating", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("demo data produces good or outstanding rating", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(["good", "outstanding"]).toContain(result.rating);
  });

  it("includes 7 regulatory links", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("regulatory links include CHR 2015 Reg 10", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
  });

  it("regulatory links include CHR 2015 Reg 12", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links include Children Act 1989 s34", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989 s34"))).toBe(true);
  });

  it("regulatory links include Care Planning Regulations 2010", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Care Planning Regulations 2010"))).toBe(true);
  });

  it("regulatory links include NMS 9", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 9"))).toBe(true);
  });

  it("regulatory links include UNCRC Article 9", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 9"))).toBe(true);
  });

  it("generates strengths for good practice", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for no contacts", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No family contact records"))).toBe(true);
  });

  it("generates URGENT action when no contacts", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT action when no policy", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, null, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action when no training", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, FULL_POLICY, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("score capped at 100", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("child profiles included in output", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("strengths mention UNCRC for high views rate", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("UNCRC"))).toBe(true);
  });
});

// ── Edge Cases ───────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("all contacts with did_not_happen outcome", () => {
    const dnh = makeContact({
      contactOutcome: "did_not_happen",
      childSatisfied: false,
      childPrepared: false,
      childViewsRecorded: false,
    });
    const r = evaluateContactQuality([dnh, { ...dnh, id: "fc-2" }]);
    expect(r.positiveOutcomeRate).toBe(0);
    expect(r.score).toBe(0);
  });

  it("full intelligence with all poor data", () => {
    const badContact = makeContact({
      contactOutcome: "difficult",
      childPrepared: false,
      childViewsRecorded: false,
      supervisedAppropriately: false,
      recordedInCasefile: false,
      contactPlanFollowed: false,
      childSatisfied: false,
    });
    const emptyPolicy = makePolicy({
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: false,
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: false,
    });
    const untrainedStaff = makeTraining({
      familyEngagement: false,
      contactSupervision: false,
      childPreparation: false,
      conflictManagement: false,
      recordKeeping: false,
      culturalAwareness: false,
    });
    const result = generateFamilyContactQualityIntelligence(
      [badContact], emptyPolicy, [untrainedStaff], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("contacts only — no policy, no training", () => {
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.contactPolicy.score).toBe(0);
    expect(result.staffContactReadiness.score).toBe(0);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("policy only — no contacts, no training", () => {
    const result = generateFamilyContactQualityIntelligence(
      [], FULL_POLICY, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.contactQuality.score).toBe(0);
    expect(result.contactConsistency.score).toBe(0);
    expect(result.contactPolicy.score).toBe(25);
    expect(result.overallScore).toBe(25);
  });

  it("training only — no contacts, no policy", () => {
    const fullTraining = [makeTraining()];
    const result = generateFamilyContactQualityIntelligence(
      [], null, fullTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.staffContactReadiness.score).toBe(25);
    expect(result.overallScore).toBe(25);
  });

  it("large number of contacts does not exceed caps", () => {
    const contacts = Array.from({ length: 100 }, (_, i) =>
      makeContact({ id: `fc-${i}`, contactOutcome: "very_positive" }),
    );
    const result = generateFamilyContactQualityIntelligence(
      contacts, FULL_POLICY, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.contactQuality.score).toBeLessThanOrEqual(25);
    expect(result.contactConsistency.score).toBeLessThanOrEqual(25);
  });

  it("single child with multiple contacts builds one profile", () => {
    const c1 = makeContact({ id: "fc-1", childId: "child-x", childName: "X" });
    const c2 = makeContact({ id: "fc-2", childId: "child-x", childName: "X" });
    const profiles = buildChildContactProfiles([c1, c2]);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].totalContacts).toBe(2);
  });

  it("multiple children each get their own profile", () => {
    const c1 = makeContact({ id: "fc-1", childId: "child-a", childName: "A" });
    const c2 = makeContact({ id: "fc-2", childId: "child-b", childName: "B" });
    const c3 = makeContact({ id: "fc-3", childId: "child-c", childName: "C" });
    const profiles = buildChildContactProfiles([c1, c2, c3]);
    expect(profiles).toHaveLength(3);
  });

  it("area for improvement mentions cultural consideration gap", () => {
    const noCulture = makePolicy({ culturalConsideration: false });
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, noCulture, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("cultural"))).toBe(true);
  });

  it("action for missing cultural consideration in policy", () => {
    const noCulture = makePolicy({ culturalConsideration: false });
    const result = generateFamilyContactQualityIntelligence(
      ALL_CONTACTS, noCulture, TRAINING_DATA, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("cultural") || a.includes("Cultural"))).toBe(true);
  });
});
